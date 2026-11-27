import { Router } from "express";
import { prisma } from "../lib/prisma";
import type { OrderStatus } from "../generated/prisma/client";
import { requireAuth, requireAdmin } from "../middleware/auth";
import { SIZES, sizeExtraPrice, calculateDiscount, getOrderTotals } from "../utils/pricing";
import { checkCoupon, checkPerUserLimit, normaliseCode } from "../utils/coupons";
import { readPage } from "../utils/pagination";
import type { SizeName } from "../utils/pricing";

const router = Router();

// ---------- Types ----------

type CustomerInput = {
  name: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
};

// The browser sends ONLY these 3 things per item (no prices!)
type OrderItemInput = {
  productId: number;
  size: SizeName;
  quantity: number;
};

const STATUSES = ["Placed", "Shipped", "Delivered", "Cancelled"];

// Where an order may go next. Orders only move FORWARD, and Delivered/Cancelled are final.
const NEXT_STATUSES: Record<OrderStatus, OrderStatus[]> = {
  Placed: ["Shipped", "Cancelled"],
  Shipped: ["Delivered", "Cancelled"],
  Delivered: [],
  Cancelled: [],
};

// The most of one plant (in one size) a customer can order at once
const MAX_QUANTITY = 20;

// What we send back with every order: its items with their product
const withItems = { items: { include: { product: true } } };

// The admin list also shows who ordered (name + email only, never the password!)
const withItemsAndUser = { ...withItems, user: { select: { name: true, email: true } } };

// Our own error type, for problems we want to show to the customer
class OrderError extends Error {}

// ---------- Validation ----------

// true only for real text that isn't just spaces
function isFilled(value: unknown): boolean {
  return typeof value === "string" && value.trim() !== "";
}

// true only for text made of exactly `length` digits, e.g. "560001"
function isDigits(value: unknown, length: number): boolean {
  return typeof value === "string" && value.length === length && /^\d+$/.test(value);
}

function validateCustomer(c: Partial<CustomerInput> | undefined): string | null {
  if (!c) return "Delivery details are missing";
  if (!isFilled(c.name)) return "Please enter your name";
  if (!isDigits(c.phone, 10)) return "Enter a 10-digit mobile number";
  if (!isFilled(c.address)) return "Please enter your address";
  if (!isFilled(c.city)) return "Please enter your city";
  if (!isFilled(c.state)) return "Please enter your state";
  if (!isDigits(c.pincode, 6)) return "Enter a 6-digit PIN code";
  return null;
}

function validateItems(items: unknown): string | null {
  if (!Array.isArray(items) || items.length === 0) return "Your cart is empty";

  for (const item of items as Partial<OrderItemInput>[]) {
    if (!Number.isInteger(item.productId)) return "Invalid product in cart";
    if (!item.size || !SIZES.includes(item.size)) return "Invalid size in cart";
    if (!Number.isInteger(item.quantity) || (item.quantity as number) < 1) {
      return "Invalid quantity in cart";
    }
    if ((item.quantity as number) > MAX_QUANTITY) {
      return `You can order at most ${MAX_QUANTITY} of one plant in one size`;
    }
  }
  return null;
}

// ---------- Cancelling ----------

// Cancels an order AND puts its stock back — all or nothing.
// It only cancels if the order is still in one of `allowedStatuses`
// (checked inside the transaction, so two clicks can't add the stock back twice).
async function cancelAndRestock(orderId: number, allowedStatuses: OrderStatus[]) {
  return prisma.$transaction(async (tx) => {
    const changed = await tx.order.updateMany({
      where: { id: orderId, status: { in: allowedStatuses } },
      data: { status: "Cancelled" },
    });
    if (changed.count === 0) {
      throw new OrderError("This order can't be cancelled any more");
    }

    // Put every item back on the shelf
    const items = await tx.orderItem.findMany({ where: { orderId: orderId } });
    for (const item of items) {
      await tx.product.update({
        where: { id: item.productId },
        data: { stock: { increment: item.quantity } },
      });
    }

    const order = await tx.order.findUniqueOrThrow({ where: { id: orderId }, include: withItemsAndUser });

    // Give the coupon use back, so the customer (or someone else) can use it again
    if (order.couponCode) {
      await tx.coupon.updateMany({
        where: { code: order.couponCode, usedCount: { gt: 0 } },
        data: { usedCount: { decrement: 1 } },
      });
    }

    return order;
  });
}

// ---------- Routes ----------

// POST /api/orders  (place an order — must be logged in)
router.post("/", requireAuth, async (req, res) => {
  const { customer, items, couponCode } = req.body ?? {}; // body is undefined if no JSON was sent

  const error = validateCustomer(customer) ?? validateItems(items);
  if (error) {
    res.status(400).json({ error: error });
    return;
  }
  // The coupon is optional, but if it's sent it must be text
  if (couponCode !== undefined && couponCode !== null && typeof couponCode !== "string") {
    res.status(400).json({ error: "Invalid coupon code" });
    return;
  }
  const code = typeof couponCode === "string" && couponCode.trim() !== "" ? normaliseCode(couponCode) : null;

  const cartItems: OrderItemInput[] = items;
  const userId: number = res.locals.user.userId;

  try {
    // Transaction = all or nothing. If anything throws, every change is undone.
    const order = await prisma.$transaction(async (tx) => {
      let subtotal = 0;
      const orderItems: { productId: number; size: SizeName; quantity: number; price: number }[] = [];

      for (const item of cartItems) {
        const product = await tx.product.findUnique({ where: { id: item.productId } });
        if (!product) {
          throw new OrderError("A plant in your cart no longer exists");
        }
        // Archived products can't be ordered any more
        if (!product.isActive) {
          throw new OrderError(`${product.name} is no longer available. Please remove it from your cart.`);
        }

        // Reduce stock ONLY if there is enough
        // (safe even if two people order the last plant at the same time)
        const updated = await tx.product.updateMany({
          where: { id: product.id, stock: { gte: item.quantity } },
          data: { stock: { decrement: item.quantity } },
        });
        if (updated.count === 0) {
          throw new OrderError(`Sorry, only ${product.stock} ${product.name} left in stock`);
        }

        // The SERVER decides the price
        const price = product.price + sizeExtraPrice[item.size];
        subtotal += price * item.quantity;

        orderItems.push({
          productId: product.id,
          size: item.size,
          quantity: item.quantity,
          price: price,
        });
      }

      // Coupon: the SERVER checks it again and works out the discount itself
      let discount = 0;
      if (code) {
        const coupon = await tx.coupon.findUnique({ where: { code: code } });
        const couponError = checkCoupon(coupon, subtotal);
        if (couponError || !coupon) {
          throw new OrderError(couponError ?? "This coupon code doesn't exist");
        }
        discount = calculateDiscount(coupon, subtotal);

        // Count this use — but only if the limit isn't reached yet.
        // (Checked by the database at the moment of the update, so two orders can't both
        //  take the last use. "fields.usageLimit" compares two columns of the same row.)
        const used = await tx.coupon.updateMany({
          where: {
            id: coupon.id,
            OR: [{ usageLimit: null }, { usedCount: { lt: tx.coupon.fields.usageLimit } }],
          },
          data: { usedCount: { increment: 1 } },
        });
        if (used.count === 0) {
          throw new OrderError("This coupon has reached its usage limit");
        }

        // Per customer: checked AFTER the update above on purpose. That update locks
        // the coupon's row until this order is saved, so a second order with the same
        // coupon at the same moment has to wait — and then it counts this order too.
        const perUserError = await checkPerUserLimit(tx, coupon, userId);
        if (perUserError) {
          throw new OrderError(perUserError);
        }
      }

      // Delivery is worked out on the subtotal AFTER the discount
      const { deliveryFee, total } = getOrderTotals(subtotal, discount);

      // Create the order AND its items in one go
      return tx.order.create({
        data: {
          userId: userId,
          customerName: customer.name.trim(),
          phone: customer.phone,
          address: customer.address.trim(),
          city: customer.city.trim(),
          state: customer.state.trim(),
          pincode: customer.pincode,
          subtotal: subtotal,
          discount: discount,
          couponCode: code, // null when no coupon was used
          deliveryFee: deliveryFee,
          total: total,
          items: { create: orderItems },
        },
        include: withItems,
      });
    });

    res.status(201).json(order);
  } catch (err) {
    // Our own errors → show the message. Anything else → the 500 error handler.
    if (err instanceof OrderError) {
      res.status(400).json({ error: err.message });
      return;
    }
    throw err;
  }
});

// GET /api/orders/my  (my own orders, newest first)
// Answer: { items, total, page, pageSize }  (10 per page)
router.get("/my", requireAuth, async (req, res) => {
  const where = { userId: res.locals.user.userId as number };
  const { page, pageSize, skip } = readPage(req.query, 10);
  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where: where,
      include: withItems,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      skip: skip,
      take: pageSize,
    }),
    prisma.order.count({ where: where }),
  ]);
  res.json({ items: orders, total: total, page: page, pageSize: pageSize });
});

// GET /api/orders?page=1&pageSize=20  (ALL orders — admin only)
// Answer: { items, total, page, pageSize }
router.get("/", requireAuth, requireAdmin, async (req, res) => {
  const { page, pageSize, skip } = readPage(req.query, 20);
  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      include: withItemsAndUser,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      skip: skip,
      take: pageSize,
    }),
    prisma.order.count(),
  ]);
  res.json({ items: orders, total: total, page: page, pageSize: pageSize });
});

// GET /api/orders/stats  (numbers for the admin's top cards)
router.get("/stats", requireAuth, requireAdmin, async (_req, res) => {
  const [toShip, onTheWay, all] = await Promise.all([
    prisma.order.count({ where: { status: "Placed" } }),
    prisma.order.count({ where: { status: "Shipped" } }),
    prisma.order.count(),
  ]);
  res.json({ toShip, onTheWay, all });
});

// PATCH /api/orders/5/cancel  (a customer cancels their OWN order, only while it's Placed)
router.patch("/:id/cancel", requireAuth, async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    res.status(400).json({ error: "Invalid order id" });
    return;
  }

  const existing = await prisma.order.findUnique({ where: { id: id } });
  // Someone else's order → say "not found" (don't reveal that it exists)
  if (!existing || existing.userId !== res.locals.user.userId) {
    res.status(404).json({ error: "Order not found" });
    return;
  }
  if (existing.status !== "Placed") {
    res.status(400).json({ error: `This order is ${existing.status}, so it can't be cancelled` });
    return;
  }

  try {
    const order = await cancelAndRestock(id, ["Placed"]);
    res.json(order);
  } catch (err) {
    if (err instanceof OrderError) {
      res.status(400).json({ error: err.message });
      return;
    }
    throw err;
  }
});

// PATCH /api/orders/5/status  (change status — admin only)
router.patch("/:id/status", requireAuth, requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  const { status } = req.body ?? {};

  if (!Number.isInteger(id)) {
    res.status(400).json({ error: "Invalid order id" });
    return;
  }

  if (!STATUSES.includes(status)) {
    res.status(400).json({ error: "Status must be Placed, Shipped, Delivered or Cancelled" });
    return;
  }

  const existing = await prisma.order.findUnique({ where: { id: id } });
  if (!existing) {
    res.status(404).json({ error: "Order not found" });
    return;
  }

  // Only forward steps: Placed → Shipped → Delivered, or Placed/Shipped → Cancelled
  const allowed = NEXT_STATUSES[existing.status];
  if (!allowed.includes(status)) {
    let message = `A ${existing.status} order can't be changed to ${status}`;
    if (existing.status === "Cancelled") message = "A cancelled order can't be changed";
    else if (existing.status === "Delivered") message = "A delivered order can't be changed";
    else if (status === existing.status) message = `This order is already ${status}`;
    res.status(400).json({ error: message });
    return;
  }

  // Cancelling puts the stock back
  if (status === "Cancelled") {
    try {
      const order = await cancelAndRestock(id, ["Placed", "Shipped"]);
      res.json(order);
    } catch (err) {
      if (err instanceof OrderError) {
        res.status(400).json({ error: err.message });
        return;
      }
      throw err;
    }
    return;
  }

  // Change it ONLY if the status is still what we just read. If someone cancelled it
  // in the meantime, nothing is changed (instead of overwriting the cancel).
  const changed = await prisma.order.updateMany({
    where: { id: id, status: existing.status },
    data: { status: status },
  });
  if (changed.count === 0) {
    res.status(409).json({ error: "This order was just changed by someone else. Please refresh." });
    return;
  }

  const order = await prisma.order.findUniqueOrThrow({ where: { id: id }, include: withItemsAndUser });
  res.json(order);
});

export default router;