import { useState } from "react";
import { useAuth } from "@/context/auth/useAuth";
import { useWishlist } from "@/context/wishlist/useWishlist";
import styles from "./HeartButton.module.css";

type HeartButtonProps = {
  productId: number;
  className?: string; // so a card can position it
};

// ♥ / ♡ button that adds or removes a product from the wishlist (logged-in users only)
function HeartButton({ productId, className }: HeartButtonProps) {
  const { user } = useAuth();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const [saving, setSaving] = useState(false);

  if (!user) return null; // guests don't have a wishlist

  const saved = isInWishlist(productId);

  async function handleClick() {
    setSaving(true);
    try {
      await toggleWishlist(productId);
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <button
      type="button"
      className={`${styles.heart} ${saved ? styles.saved : ""} ${className ?? ""}`}
      onClick={handleClick}
      disabled={saving}
      aria-label={saved ? "Remove from wishlist" : "Add to wishlist"}
      aria-pressed={saved}
    >
      {saved ? "♥" : "♡"}
    </button>
  );
}

export default HeartButton;
