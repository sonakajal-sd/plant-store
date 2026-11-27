import { Router } from "express";
import { prisma } from "../lib/prisma";
import type { OrderStatus } from "../generated/prisma/client";
import { requireAuth, requireAdmin } from "../middleware/auth";
import { SIZES, sizeExtraPrice, getDeliveryFee } from "../utils/pricing";
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

    return tx.order.findUniqueOrThrow({ where: { id: orderId }, include: withItemsAndUser });
  });
}

// ---------- Routes ----------

// POST /api/orders  (place an order — must be logged in)
router.post("/", requireAuth, async (req, res) => {
  const { customer, items } = req.body ?? {}; // body is undefined if no JSON was sent

  const error = validateCustomer(customer) ?? validateItems(items);
  if (error) {
    res.status(400).json({ error: error });
    return;
  }

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

      const deliveryFee = getDeliveryFee(subtotal);
      const total = subtotal + deliveryFee;

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
router.get("/my", requireAuth, async (_req, res) => {
  const orders = await prisma.order.findMany({
    where: { userId: res.locals.user.userId },
    include: withItems,
    orderBy: { createdAt: "desc" },
  });
  res.json(orders);
});

// GET /api/orders  (ALL orders — admin only)
router.get("/", requireAuth, requireAdmin, async (_req, res) => {
  const orders = await prisma.order.findMany({
    include: withItemsAndUser,
    orderBy: { createdAt: "desc" },
  });
  res.json(orders);
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

  // Re-opening a cancelled order would need its stock taken out again, so it's final
  if (existing.status === "Cancelled") {
    res.status(400).json({ error: "A cancelled order can't be changed" });
    return;
  }

  // Cancelling puts the stock back. A delivered order can't be cancelled.
  if (status === "Cancelled") {
    if (existing.status === "Delivered") {
      res.status(400).json({ error: "A delivered order can't be cancelled" });
      return;
    }
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

  const order = await prisma.order.update({
    where: { id: id },
    data: { status: status },
    include: withItemsAndUser,
  });
  res.json(order);
});

export default router;