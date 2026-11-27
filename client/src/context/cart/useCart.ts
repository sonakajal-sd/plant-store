import { createContext, useContext } from "react";
import type { CartItem } from "@/types/cart";
import type { AppliedCoupon } from "@/types/coupon";
import type { Product, Size } from "@/types/product";

// Everything the cart box gives to components
export type CartContextType = {
  items: CartItem[];
  totalCount: number;
  subtotal: number;
  // Returns how many were REALLY added (less if there isn't enough stock left)
  addToCart: (product: Product, size: Size, quantity: number) => number;
  increase: (id: string) => void;
  decrease: (id: string) => void;
  removeFromCart: (id: string) => void;
  clearCart: () => void;
  // Gets the latest prices/stock from the server. Returns messages about what changed.
  refreshCart: () => Promise<string[]>;

  // Coupon
  coupon: AppliedCoupon | null;
  discount: number; // 0 if there's no coupon, or the subtotal is below its minimum
  couponProblem: string; // e.g. "Add ₹99 more to use WELCOME10" ("" = no problem)
  applyCoupon: (coupon: AppliedCoupon) => void;
  removeCoupon: () => void;
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
