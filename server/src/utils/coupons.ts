import type { Coupon, Prisma } from "../generated/prisma/client";

// Checks if a coupon can be used for this subtotal.
// Returns a message for the customer, or null if the coupon is OK.
// (Used by POST /api/coupons/validate AND when placing an order, so the rules are the same.)
export function checkCoupon(coupon: Coupon | null, subtotal: number): string | null {
  if (!coupon) return "This coupon code doesn't exist";
  if (!coupon.isActive) return "This coupon is no longer active";
  if (coupon.expiresAt && coupon.expiresAt < new Date()) return "This coupon has expired";
  if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) {
    return "This coupon has reached its usage limit";
  }
  if (subtotal < coupon.minOrder) {
    return `Add ₹${coupon.minOrder - subtotal} more to use this coupon (minimum order ₹${coupon.minOrder})`;
  }
  return null;
}

// Coupon codes are always stored in UPPERCASE without spaces
export function normaliseCode(code: string): string {
  return code.trim().toUpperCase();
}

// Has this customer already used the coupon as often as allowed?
// Counts their orders with this code, except cancelled ones (cancelling gives the use back).
// Returns a message for the customer, or null if they may use it.
// "db" is prisma itself, or "tx" inside a transaction.
export async function checkPerUserLimit(
  db: Prisma.TransactionClient,
  coupon: Coupon,
  userId: number
): Promise<string | null> {
  if (coupon.perUserLimit === null) return null; // no limit per customer

  const uses = await db.order.count({
    where: { userId: userId, couponCode: coupon.code, status: { not: "Cancelled" } },
  });
  if (uses < coupon.perUserLimit) return null;

  if (coupon.perUserLimit === 1) {
    return `You have already used ${coupon.code}. It can be used once per customer.`;
  }
  return `You have already used ${coupon.code} ${uses} times (the limit is ${coupon.perUserLimit} per customer).`;
}

