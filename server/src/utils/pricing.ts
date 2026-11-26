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