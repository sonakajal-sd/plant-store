import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { CartContext } from "@/context/cart/useCart";
import { fetchProducts } from "@/services/productService";
import { syncCartItems } from "@/utils/cartSync";
import { getItemPrice } from "@/utils/pricing";
import type { CartItem } from "@/types/cart";
import type { Product, Size } from "@/types/product";

export function CartProvider({ children }: { children: ReactNode }) {
  // Load the saved cart from the browser (or start empty)
  const [items, setItems] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem("cart");
    return saved ? (JSON.parse(saved) as CartItem[]) : [];
  });

  // Save the cart to the browser every time it changes
  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(items));
  }, [items]);

  function addToCart(product: Product, size: Size, quantity: number) {
    const id = `${product.id}-${size}`;
    const existing = items.find((item) => item.id === id);

    if (existing) {
      // Already in cart → add to the quantity (but not more than stock)
      setItems(
        items.map((item) =>
          item.id === id
            ? { ...item, quantity: Math.min(item.quantity + quantity, product.stock) }
            : item
        )
      );
    } else {
      // New item → add it to the list
      setItems([...items, { id, product, size, quantity }]);
    }
  }

  function increase(id: string) {
    setItems(
      items.map((item) =>
        item.id === id && item.quantity < item.product.stock
          ? { ...item, quantity: item.quantity + 1 }
          : item
      )
    );
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
  }

  // Ask the server for the latest data of every product in the cart,
  // then remove/adjust items and return messages about what changed.
  async function refreshCart(): Promise<string[]> {
    if (items.length === 0) return [];

    const ids = [...new Set(items.map((item) => item.product.id))];
    const latest = await fetchProducts({ ids: ids }); // archived/deleted ones are not returned
    const latestById = new Map(latest.map((p) => [p.id, p]));

    // Use the newest cart (the user may have clicked "+" while we were waiting)
    setItems((current) => syncCartItems(current, latestById).items);
    return syncCartItems(items, latestById).changes;
  }

  // Calculated values
  const totalCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = items.reduce(
    (sum, item) => sum + getItemPrice(item) * item.quantity,
    0
  );

  return (
    <CartContext.Provider
      value={{ items, totalCount, subtotal, addToCart, increase, decrease, removeFromCart, clearCart, refreshCart }}
    >
      {children}
    </CartContext.Provider>
  );
}
