import { sizeExtraPrice } from "@/data/products";
import type { CartItem } from "@/types/cart";

// Price of one item (base price + size extra)
export function getItemPrice(item: CartItem) {
  return item.product.price + sizeExtraPrice[item.size];
}

// Delivery is free from this subtotal upwards
export const FREE_DELIVERY_FROM = 999;
const DELIVERY_FEE = 60;

export function getDeliveryFee(subtotal: number) {
  return subtotal >= FREE_DELIVERY_FROM ? 0 : DELIVERY_FEE;
}

// ---------- Coupons (same rules as server/src/utils/pricing.ts) ----------

// Just the parts of a coupon we need to work out the discount
export type CouponRule = {
  type: "PERCENT" | "FLAT";
  value: number;
  maxDiscount: number | null;
};

// How many rupees a coupon takes off this subtotal
export function calculateDiscount(coupon: CouponRule, subtotal: number): number {
  let discount: number;

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

// ---------- Order totals (same as the server) ----------

// Delivery is worked out on the subtotal AFTER the discount.
export function getOrderTotals(subtotal: number, discount: number) {
  const afterDiscount = subtotal - discount;
  const deliveryFee = getDeliveryFee(afterDiscount);
  return { deliveryFee: deliveryFee, total: afterDiscount + deliveryFee };
}
