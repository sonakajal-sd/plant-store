import { createContext, useContext } from "react";
import type { CartItem } from "@/types/cart";
import type { Product, Size } from "@/types/product";

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
  // Gets the latest prices/stock from the server. Returns messages about what changed.
  refreshCart: () => Promise<string[]>;
};

export const CartContext = createContext<CartContextType | null>(null);

// Our own hook: any component can call useCart() to open the box
export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used inside CartProvider");
  }
  return context;
}
