export type SizeName = "Small" | "Medium" | "Large";

export const SIZES: SizeName[] = ["Small", "Medium", "Large"];

// Extra price for each size (same as the frontend)
export const sizeExtraPrice: Record<SizeName, number> = {
  Small: 0,
  Medium: 100,
  Large: 200,
};

// Free delivery from ₹999, otherwise ₹60
export const FREE_DELIVERY_FROM = 999;
const DELIVERY_FEE = 60;

export function getDeliveryFee(subtotal: number): number {
  return subtotal >= FREE_DELIVERY_FROM ? 0 : DELIVERY_FEE;
}

// ---------- Plant care ----------

// The only light values a product can have
export const LIGHT_OPTIONS = ["Low light", "Indirect light", "Bright light", "Full sun"];

// ---------- Coupons ----------

// Just the parts of a coupon we need to work out the discount
export type CouponRule = {
  type: "PERCENT" | "FLAT";
  value: number;
  maxDiscount: number | null;
};

// How many rupees a coupon takes off this subtotal.
// (Checking expiry, minimum order and usage limit is done by the caller.)
export function calculateDiscount(coupon: CouponRule, subtotal: number): number {
  let discount = 0;

  if (coupon.type === "PERCENT") {
    // Round down, so we never give away more than the percent
    discount = Math.floor((subtotal * coupon.value) / 100);
    if (coupon.maxDiscount !== null && discount > coupon.maxDiscount) {
      discount = coupon.maxDiscount;
    }
  } else {
    discount = coupon.value;
  }

  // A discount can never be more than the subtotal
  return Math.min(discount, subtotal);
}
