import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { CartContext } from "@/context/cart/useCart";
import { MAX_QUANTITY_PER_ITEM } from "@/data/products";
import { ApiError } from "@/services/apiClient";
import { validateCoupon } from "@/services/couponService";
import { fetchProducts } from "@/services/productService";
import { syncCartItems } from "@/utils/cartSync";
import { calculateDiscount, getItemPrice } from "@/utils/pricing";
import { isObject, loadSaved } from "@/utils/storage";
import type { CartItem } from "@/types/cart";
import type { AppliedCoupon } from "@/types/coupon";
import type { Product, Size } from "@/types/product";

export function CartProvider({ children }: { children: ReactNode }) {
  // Load the saved cart from the browser (or start empty)
  // (loadSaved throws away broken data instead of crashing)
  const [items, setItems] = useState<CartItem[]>(() =>
    loadSaved<CartItem[]>(
      "cart",
      (v) =>
        Array.isArray(v) &&
        v.every(
          (item) =>
            isObject(item) &&
            typeof item.id === "string" &&
            typeof item.quantity === "number" &&
            isObject(item.product) &&
            typeof item.product.id === "number"
        ),
      []
    )
  );

  // The coupon is saved too, so it is still there on the checkout page
  const [coupon, setCoupon] = useState<AppliedCoupon | null>(() =>
    loadSaved<AppliedCoupon | null>(
      "coupon",
      (v) => isObject(v) && typeof v.code === "string" && typeof v.value === "number",
      null
    )
  );

  // Save the cart to the browser every time it changes
  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(items));
  }, [items]);

  useEffect(() => {
    if (coupon) {
      localStorage.setItem("coupon", JSON.stringify(coupon));
    } else {
      localStorage.removeItem("coupon");
    }
  }, [coupon]);

  // How many MORE of this plant can go into this cart line?
  // ALL sizes of one plant share its stock (Small + Large both come from the same shelf),
  // and one line can have at most 20.
  function roomFor(product: Product, lineId: string): number {
    const allSizesInCart = items
      .filter((item) => item.product.id === product.id)
      .reduce((sum, item) => sum + item.quantity, 0);
    const thisLine = items.find((item) => item.id === lineId)?.quantity ?? 0;

    const leftInStock = product.stock - allSizesInCart;
    const leftForLine = MAX_QUANTITY_PER_ITEM - thisLine;
    return Math.max(0, Math.min(leftInStock, leftForLine));
  }

  function addToCart(product: Product, size: Size, quantity: number): number {
    const id = `${product.id}-${size}`;
    const added = Math.min(quantity, roomFor(product, id));
    if (added <= 0) return 0; // nothing fits → tell the page

    const existing = items.find((item) => item.id === id);
    if (existing) {
      // Already in cart → add to the quantity (with the newest product data)
      setItems(
        items.map((item) =>
          item.id === id ? { ...item, product: product, quantity: item.quantity + added } : item
        )
      );
    } else {
      // New item → add it to the list
      setItems([...items, { id, product, size, quantity: added }]);
    }
    return added;
  }

  function increase(id: string) {
    const line = items.find((item) => item.id === id);
    if (!line || roomFor(line.product, id) === 0) return;
    setItems(items.map((item) => (item.id === id ? { ...item, quantity: item.quantity + 1 } : item)));
  }

  function decrease(id: string) {
    setItems(
      items.map((item) =>
        item.id === id && item.quantity > 1
          ? { ...item, quantity: item.quantity - 1 }
          : item
      )
    );
  }

  function removeFromCart(id: string) {
    setItems(items.filter((item) => item.id !== id));
  }

  function clearCart() {
    setItems([]);
    setCoupon(null); // a used coupon shouldn't stay for the next order
  }

  function applyCoupon(newCoupon: AppliedCoupon) {
    setCoupon(newCoupon);
  }

  function removeCoupon() {
    setCoupon(null);
  }

  // Ask the server for the latest data of every product in the cart,
  // then remove/adjust items and return messages about what changed.
  async function refreshCart(): Promise<string[]> {
    if (items.length === 0) return [];

    const ids = [...new Set(items.map((item) => item.product.id))];
    // Archived/deleted ones are not returned. pageSize = all of them on one page.
    const latest = await fetchProducts({ ids: ids, pageSize: ids.length });
    const latestById = new Map(latest.items.map((p) => [p.id, p]));

    // Use the newest cart (the user may have clicked "+" while we were waiting)
    setItems((current) => syncCartItems(current, latestById).items);
    const synced = syncCartItems(items, latestById);
    const changes = [...synced.changes];

    // Is the applied coupon still OK? (expired, switched off, used up, used by me before?)
    if (coupon) {
      const newSubtotal = synced.items.reduce((sum, item) => sum + getItemPrice(item) * item.quantity, 0);
      try {
        // Below the minimum is only a warning in the cart, so we ask with at least the minimum
        const check = await validateCoupon(coupon.code, Math.max(newSubtotal, coupon.minOrder));
        // Keep it, with the latest rules (the admin may have changed the value)
        setCoupon({
          code: check.code,
          type: check.type,
          value: check.value,
          maxDiscount: check.maxDiscount,
          minOrder: check.minOrder,
        });
      } catch (err) {
        // 400 = the server says this coupon can't be used any more → remove it.
        // Anything else (e.g. server down) → keep it; the order will check it again anyway.
        if (err instanceof ApiError && err.status === 400) {
          setCoupon(null);
          changes.push(`Coupon ${coupon.code} was removed: ${err.message}`);
        }
      }
    }

    return changes;
  }

  // Calculated values
  const totalCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = items.reduce(
    (sum, item) => sum + getItemPrice(item) * item.quantity,
    0
  );

  // The coupon only counts once the subtotal reaches its minimum
  let couponProblem = "";
  if (coupon && subtotal < coupon.minOrder) {
    couponProblem = `Add ₹ ${coupon.minOrder - subtotal} more to use ${coupon.code}`;
  }
  const discount = coupon && couponProblem === "" ? calculateDiscount(coupon, subtotal) : 0;

  return (
    <CartContext.Provider
      value={{
        items, totalCount, subtotal, addToCart, increase, decrease, removeFromCart, clearCart, refreshCart,
        coupon, discount, couponProblem, applyCoupon, removeCoupon,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}
