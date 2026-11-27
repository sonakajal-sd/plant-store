import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useWishlist } from "@/context/wishlist/useWishlist";
import { fetchWishlist } from "@/services/wishlistService";
import type { WishlistItem } from "@/services/wishlistService";
import ProductCard from "@/components/ProductCard/ProductCard";
import styles from "./Wishlist.module.css";

function Wishlist() {
  const { isInWishlist } = useWishlist();
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Load the full list (with products) once. RequireAuth makes sure someone is logged in.
  useEffect(() => {
    fetchWishlist()
      .then((data) => setItems(data))
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  // When a heart is clicked on this page, the card disappears straight away
  const shown = items.filter((item) => isInWishlist(item.productId));

  if (loading) {
    return <div className={styles.page}><p>Loading your wishlist… 🌱</p></div>;
  }
  if (error) {
    return <div className={styles.page}><p className={styles.error}>{error}</p></div>;
  }

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>My wishlist</h1>

      {shown.length === 0 ? (
        <div className={styles.empty}>
          <span className={styles.emptyIcon}>♡</span>
          <p>Nothing saved yet. Tap the heart on any plant to save it here.</p>
          <Link to="/shop" className={styles.primaryButton}>Browse plants</Link>
        </div>
      ) : (
        <div className={styles.grid}>
          {shown.map((item) =>
            item.product.isActive ? (
              <ProductCard key={item.id} product={item.product} />
            ) : (
              // An archived plant can't be bought any more
              <div key={item.id} className={styles.unavailable}>
                <strong>{item.product.name}</strong>
                <p>This plant is no longer available.</p>
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}

export default Wishlist;
