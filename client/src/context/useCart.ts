import { createContext, useContext } from "react";
import { sizeExtraPrice } from "../data/products";
import type { Product, Size } from "../data/products";

// One line in the cart
export type CartItem = {
  id: string; // e.g. "1-Medium" (product id + size)
  product: Product;
  size: Size;
  quantity: number;
};

// Everything the cart box gives to components
export type CartContextType = {
  items: CartItem[];
  totalCount: number;
  subtotal: number;
  addToCart: (product: Product, size: Size, quantity: number) => void;
  increase: (id: string) => void;
  decrease: (id: string) => void;
  removeFromCart: (id: string) => void;
  clearCart: () => void;
};

export const CartContext = createContext<CartContextType | null>(null);

// Price of one item (base price + size extra)
export function getItemPrice(item: CartItem) {
  return item.product.price + sizeExtraPrice[item.size];
}

// Our own hook: any component can call useCart() to open the box
export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used inside CartProvider");
  }
  return context;
}
