import { Router } from "express";
import { prisma } from "../lib/prisma";
import { requireAuth, requireAdmin, optionalAuth } from "../middleware/auth";
import { calculateDiscount } from "../utils/pricing";
import { checkCoupon, checkPerUserLimit, normaliseCode } from "../utils/coupons";

const router = Router();

// What the admin sends to create or update a coupon
type CouponInput = {
  code: string;
  type: "PERCENT" | "FLAT";
  value: number;
  minOrder: number;
  maxDiscount: number | null; // only for PERCENT coupons
  expiresAt: string | null; // a date, e.g. "2026-12-31"
  isActive: boolean;
  usageLimit: number | null;
  perUserLimit: number | null; // uses per customer (null = no limit)
};

function isWholeNumber(value: unknown, min: number): boolean {
  return Number.isInteger(value) && (value as number) >= min;
}

// Checks the admin's coupon data. Returns an error message, or null if it's OK.
function validateCoupon(body: Partial<CouponInput> | undefined): string | null {
  if (!body) return "Coupon details are missing";
  if (typeof body.code !== "string" || !/^[A-Z0-9]{3,20}$/.test(normaliseCode(body.code))) {
    return "Code must be 3–20 letters or numbers, e.g. WELCOME10";
  }
  if (body.type !== "PERCENT" && body.type !== "FLAT") return "Type must be PERCENT or FLAT";
  if (!isWholeNumber(body.value, 1)) return "Value must be a whole number above 0";
  if (body.type === "PERCENT" && (body.value as number) > 90) return "A percent coupon can be at most 90%";
  if (!isWholeNumber(body.minOrder, 0)) return "Minimum order must be a whole number, 0 or more";
  if (body.maxDiscount !== null && !isWholeNumber(body.maxDiscount, 1)) {
    return "Max discount must be empty or a whole number above 0";
  }
  if (body.usageLimit !== null && !isWholeNumber(body.usageLimit, 1)) {
    return "Usage limit must be empty or a whole number above 0";
  }
  // (left out = no limit, like null)
  if (body.perUserLimit !== undefined && body.perUserLimit !== null && !isWholeNumber(body.perUserLimit, 1)) {
    return "Limit per customer must be empty or a whole number above 0";
  }
  if (body.expiresAt !== null && (typeof body.expiresAt !== "string" || Number.isNaN(Date.parse(body.expiresAt)))) {
    return "Expiry must be empty or a valid date";
  }
  if (typeof body.isActive !== "boolean") return "Active must be true or false";
  return null;
}

// Turns the checked input into database fields
function toData(body: CouponInput) {
  return {
    code: normaliseCode(body.code),
    type: body.type,
    value: body.value,
    minOrder: body.minOrder,
    // A max discount only makes sense for percent coupons
    maxDiscount: body.type === "PERCENT" ? body.maxDiscount : null,
    expiresAt: body.expiresAt ? new Date(body.expiresAt) : null,
    isActive: body.isActive,
    usageLimit: body.usageLimit,
    perUserLimit: body.perUserLimit ?? null,
  };
}

// POST /api/coupons/validate  { code, subtotal }  → { code, type, value, maxDiscount, minOrder, discount }
// Anyone can check a code. The real check happens again when the order is placed.
// optionalAuth: when a customer is logged in, we also check their own uses
router.post("/validate", optionalAuth, async (req, res) => {
  const { code, subtotal } = req.body ?? {};

  if (typeof code !== "string" || code.trim() === "") {
    res.status(400).json({ error: "Please enter a coupon code" });
    return;
  }
  if (!isWholeNumber(subtotal, 0)) {
    res.status(400).json({ error: "Subtotal must be a whole number" });
    return;
  }

  const coupon = await prisma.coupon.findUnique({ where: { code: normaliseCode(code) } });
  const error = checkCoupon(coupon, subtotal);
  if (error || !coupon) {
    res.status(400).json({ error: error ?? "This coupon code doesn't exist" });
    return;
  }

  if (res.locals.user) {
    const perUserError = await checkPerUserLimit(prisma, coupon, res.locals.user.userId);
    if (perUserError) {
      res.status(400).json({ error: perUserError });
      return;
    }
  }

  res.json({
    code: coupon.code,
    type: coupon.type,
    value: coupon.value,
    maxDiscount: coupon.maxDiscount,
    minOrder: coupon.minOrder,
    discount: calculateDiscount(coupon, subtotal),
  });
});

// GET /api/coupons  (admin: all coupons, newest first)
router.get("/", requireAuth, requireAdmin, async (_req, res) => {
  const coupons = await prisma.coupon.findMany({ orderBy: { id: "desc" } });
  res.json(coupons);
});

// POST /api/coupons  (admin: create)
router.post("/", requireAuth, requireAdmin, async (req, res) => {
  const error = validateCoupon(req.body);
  if (error) {
    res.status(400).json({ error: error });
    return;
  }
  const data = toData(req.body);

  const existing = await prisma.coupon.findUnique({ where: { code: data.code } });
  if (existing) {
    res.status(409).json({ error: `A coupon called ${data.code} already exists` });
    return;
  }

  const coupon = await prisma.coupon.create({ data: data });
  res.status(201).json(coupon);
});

// PUT /api/coupons/3  (admin: edit, including turning it on/off)
router.put("/:id", requireAuth, requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    res.status(400).json({ error: "Invalid coupon id" });
    return;
  }

  const existing = await prisma.coupon.findUnique({ where: { id: id } });
  if (!existing) {
    res.status(404).json({ error: "Coupon not found" });
    return;
  }

  const error = validateCoupon(req.body);
  if (error) {
    res.status(400).json({ error: error });
    return;
  }
  const data = toData(req.body);

  // Another coupon may already use the new code
  const sameCode = await prisma.coupon.findUnique({ where: { code: data.code } });
  if (sameCode && sameCode.id !== id) {
    res.status(409).json({ error: `A coupon called ${data.code} already exists` });
    return;
  }

  const coupon = await prisma.coupon.update({ where: { id: id }, data: data });
  res.json(coupon);
});

export default router;
