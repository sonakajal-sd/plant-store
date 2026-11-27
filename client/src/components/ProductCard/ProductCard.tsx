import { Link } from "react-router-dom";
import { useCart } from "@/context/cart/useCart";
import HeartButton from "@/components/HeartButton/HeartButton";
import Stars from "@/components/Stars/Stars";
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
      <div className={styles.imageWrap}>
        <Link to={`/product/${product.id}`} className={styles.image}>
          <span className={styles.plant}>🪴</span>
          <span className={styles.tag}>
            {isOutOfStock ? "Out of stock" : product.tag}
          </span>
        </Link>
        {/* The heart sits on top of the picture, but is NOT part of the link */}
        <HeartButton productId={product.id} className={styles.heart} />
      </div>

      <div className={styles.info}>
        <Link to={`/product/${product.id}`}>
          <h3 className={styles.name}>{product.name}</h3>
        </Link>
        <p className={styles.care}>
          ☀️ {product.light} · 💧 {product.water}
        </p>
        <div className={styles.rating}>
          <Stars rating={product.ratingAverage} count={product.ratingCount} />
        </div>
      </div>

      <div className={styles.bottom}>
        <span className={styles.price}>₹ {product.price}</span>
        <button
          className={styles.button}
          onClick={() => {
            // 0 = all of this plant's stock is already in the cart
            if (addToCart(product, "Small", 1) === 0) {
              alert(`All ${product.stock} ${product.name} in stock are already in your cart.`);
            }
          }}
          disabled={isOutOfStock}
        >
          {isOutOfStock ? "Sold out" : "Add to cart"}
        </button>
      </div>
    </article>
  );
}

export default ProductCard;
