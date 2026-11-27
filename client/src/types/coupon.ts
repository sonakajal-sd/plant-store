export type CouponType = "PERCENT" | "FLAT";

// A coupon that passed the check in the cart (enough to work out the discount again)
export type AppliedCoupon = {
  code: string;
  type: CouponType;
  value: number;
  maxDiscount: number | null;
  minOrder: number;
};

// The server's answer to "is this code OK?"
export type CouponCheck = AppliedCoupon & { discount: number };

// A full coupon, as the admin sees it
export type Coupon = AppliedCoupon & {
  id: number;
  expiresAt: string | null;
  isActive: boolean;
  usageLimit: number | null;
  perUserLimit: number | null; // uses per customer (null = no limit)
  usedCount: number;
};

// What the admin sends to create or edit a coupon
export type CouponInput = Omit<Coupon, "id" | "usedCount">;
