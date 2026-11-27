import { Link } from "react-router-dom";
import { useCart } from "@/context/cart/useCart";
import type { Product } from "@/types/product";
import styles from "./ProductCard.module.css";

type ProductCardProps = {
  product: Product;
};

function ProductCard({ product }: ProductCardProps) {
  const { addToCart } = useCart();
  const isOutOfStock = product.stock === 0;

  return (
    <article className={styles.card}>
      <Link to={`/product/${product.id}`} className={styles.image}>
  <span className={styles.plant}>🪴</span>
  <span className={styles.tag}>
    {isOutOfStock ? "Out of stock" : product.tag}
  </span>
</Link>

<div className={styles.info}>
  <Link to={`/product/${product.id}`}>
    <h3 className={styles.name}>{product.name}</h3>
  </Link>
  <p className={styles.care}>
    ☀️ {product.light} · 💧 {product.water}
  </p>
</div>
      <div className={styles.bottom}>
        <span className={styles.price}>₹ {product.price}</span>
        <button
          className={styles.button}
          onClick={() => addToCart(product, "Small", 1)}
          disabled={isOutOfStock}
        >
          {isOutOfStock ? "Sold out" : "Add to cart"}
        </button>
      </div>
    </article>
  );
}

export default ProductCard;