import { useEffect, useState } from "react";
import { useCart } from "@/context/cart/useCart";

// Checks the cart against the latest products ONCE, when a page opens.
export function useCartRefresh() {
  const { refreshCart } = useCart();
  const [checking, setChecking] = useState(true);
  const [changes, setChanges] = useState<string[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    refreshCart()
      .then((messages) => setChanges(messages))
      .catch(() => setError("We couldn't check the latest prices. Please try again in a moment."))
      .finally(() => setChecking(false));
    // We want this to run only once when the page opens. refreshCart is a new
    // function on every render, so listing it here would run it again and again.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { checking, changes, error };
}
