import type { Product, Size } from "@/types/product";

// One line in the cart
export type CartItem = {
  id: string; // e.g. "1-Medium" (product id + size)
  product: Product;
  size: Size;
  quantity: number;
};
