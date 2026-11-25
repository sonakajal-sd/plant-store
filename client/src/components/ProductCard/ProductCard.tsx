import type { Product } from "../../data/products";
import styles from "./ProductCard.module.css";

type ProductCardProps = {
  product: Product;
  onAddToCart: () => void; // a function that returns nothing
};

function ProductCard({ product, onAddToCart }: ProductCardProps) {
  return (
    <article className={styles.card}>
      <div className={styles.image}>
        <span className={styles.plant}>🪴</span>
        <span className={styles.tag}>{product.tag}</span>
      </div>

      <div className={styles.info}>
        <h3 className={styles.name}>{product.name}</h3>
        <p className={styles.care}>{product.care}</p>
      </div>

      <div className={styles.bottom}>
        <span className={styles.price}>₹ {product.price}</span>
        <button className={styles.button} onClick={onAddToCart}>
          Add to cart
        </button>
      </div>
    </article>
  );
}

export default ProductCard;