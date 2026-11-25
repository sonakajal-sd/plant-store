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
