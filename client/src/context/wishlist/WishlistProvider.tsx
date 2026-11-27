import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { useAuth } from "@/context/auth/useAuth";
import { WishlistContext } from "@/context/wishlist/useWishlist";
import { addToWishlist, fetchWishlist, removeFromWishlist } from "@/services/wishlistService";

// The wishlist product ids we loaded, and FOR WHICH user (so we never show the last user's hearts)
type Loaded = { userId: number; ids: Set<number> };

// Remembers which products are in the logged-in user's wishlist,
// so every heart button knows if it should be filled.
export function WishlistProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [loaded, setLoaded] = useState<Loaded | null>(null);

  // Load the ids when someone logs in (or a different user logs in)
  useEffect(() => {
    if (!user) return;
    let ignore = false;
    fetchWishlist()
      .then((items) => {
        if (!ignore) setLoaded({ userId: user.id, ids: new Set(items.map((i) => i.productId)) });
      })
      .catch(() => {
        // Not important enough to show an error: the hearts just start empty
      });
    return () => {
      ignore = true;
    };
  }, [user]);

  // Only use the ids if they belong to the user who is logged in NOW
  const ids = user && loaded?.userId === user.id ? loaded.ids : new Set<number>();

  function isInWishlist(productId: number) {
    return ids.has(productId);
  }

  async function toggleWishlist(productId: number) {
    if (!user) return;
    const wasIn = ids.has(productId);

    // Change the heart straight away (feels fast), then tell the server
    const newIds = new Set(ids);
    if (wasIn) newIds.delete(productId);
    else newIds.add(productId);
    setLoaded({ userId: user.id, ids: newIds });

    try {
      if (wasIn) await removeFromWishlist(productId);
      else await addToWishlist(productId);
    } catch (err) {
      // The server said no → put the heart back the way it was
      setLoaded({ userId: user.id, ids: ids });
      throw err;
    }
  }

  return (
    <WishlistContext.Provider value={{ isInWishlist, toggleWishlist }}>
      {children}
    </WishlistContext.Provider>
  );
}
