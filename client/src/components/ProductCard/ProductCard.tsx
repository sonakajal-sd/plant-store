import type { Product } from "../../data/products";
import styles from "./ProductCard.module.css";
import { Link } from "react-router-dom";

type ProductCardProps = {
  product: Product;
  onAddToCart: () => void;
};

function ProductCard({ product, onAddToCart }: ProductCardProps) {
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
  <p className={styles.care}>{product.care}</p>
</div>
      <div className={styles.bottom}>
        <span className={styles.price}>₹ {product.price}</span>
        <button
          className={styles.button}
          onClick={()=>onAddToCart()}
          disabled={isOutOfStock}
        >
          {isOutOfStock ? "Sold out" : "Add to cart"}
        </button>
      </div>
    </article>
  );
}

export default ProductCard;