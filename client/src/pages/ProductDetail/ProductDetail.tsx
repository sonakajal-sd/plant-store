import { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { useCart } from "@/context/cart/useCart";
import { MAX_QUANTITY_PER_ITEM, sizes, sizeExtraPrice } from "@/data/products";
import { useProduct } from "@/hooks/useProduct";
import type { Size } from "@/types/product";
import ProductCard from "@/components/ProductCard/ProductCard";
import HeartButton from "@/components/HeartButton/HeartButton";
import Stars from "@/components/Stars/Stars";
import ReviewsSection from "./ReviewsSection";
import styles from "./ProductDetail.module.css";

function ProductDetail() {
  // 1. Get the id from the URL (it is always a string)
  const { id } = useParams();

  // Using the id as a key gives each plant a fresh component,
  // so size and quantity reset when we open a different plant
  return <ProductDetailContent key={id} id={id} />;
}

function ProductDetailContent({ id }: { id: string | undefined }) {
  const { addToCart } = useCart();

  // 2. Ask the server for this ONE product (and a few related ones)
  const { product, related, loading, notFound, error } = useProduct(Number(id));

  const [size, setSize] = useState<Size>("Small");
  const [quantity, setQuantity] = useState(1);
  const [cartMessage, setCartMessage] = useState(""); // e.g. "Added 2 to your cart"

  // When we open a different plant: go to top
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

  // While loading, don't say "not found" yet
  if (loading) {
    return (
      <div className={styles.page}>
        <p>Loading plant… 🌱</p>
      </div>
    );
  }
  // 3. Something went wrong (e.g. the server is down)
  if (error) {
    return (
      <div className={styles.page}>
        <h1>Something went wrong 🥀</h1>
        <p>{error}</p>
        <Link to="/shop" className={styles.backLink}>← Back to shop</Link>
      </div>
    );
  }

  // 4. No product with this id (or it was archived)
  if (notFound || !product) {
    return (
      <div className={styles.page}>
        <h1>Plant not found 🥀</h1>
        <Link to="/shop" className={styles.backLink}>← Back to shop</Link>
      </div>
    );
  }

  const isOutOfStock = product.stock === 0;
  const price = product.price + sizeExtraPrice[size];

  function increase() {
    // Not more than in stock, and not more than 20 per order line
    if (quantity < product!.stock && quantity < MAX_QUANTITY_PER_ITEM) {
      setQuantity(quantity + 1);
    }
  }

  function decrease() {
    if (quantity > 1) {
      setQuantity(quantity - 1);
    }
  }

  return (
    <div className={styles.page}>
      <p className={styles.breadcrumb}>
        <Link to="/">Home</Link> /{" "}
        <Link to={`/shop?category=${encodeURIComponent(product.category)}`}>
          {product.category}
        </Link>{" "}
        / {product.name}
      </p>

      <div className={styles.layout}>
        {/* Left: image */}
        <div className={styles.image}>🪴</div>

        {/* Right: info */}
        <div className={styles.info}>
          <span className={styles.badge}>
            {isOutOfStock ? "Out of stock" : `${product.tag} · In stock`}
          </span>

          <div className={styles.titleRow}>
            <h1 className={styles.title}>{product.name}</h1>
            <HeartButton productId={product.id} />
          </div>
          <Stars rating={product.ratingAverage} count={product.ratingCount} />
          <p className={styles.price}>₹ {price}</p>

          {product.description && (
            <p className={styles.description}>{product.description}</p>
          )}

          <div className={styles.careGrid}>
            <div className={styles.careBox}>☀️ {product.light}</div>
            <div className={styles.careBox}>💧 {product.water}</div>
            {product.petSafe && (
              <div className={styles.careBox}>🐾 Safe for cats and dogs</div>
            )}
          </div>

          {/* Size buttons */}
          <div>
            <p className={styles.label}>Size</p>
            <div className={styles.sizes}>
              {sizes.map((s) => (
                <button
                  key={s}
                  onClick={() => setSize(s)}
                  className={s === size ? styles.sizeActive : styles.sizeButton}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Quantity + Add to cart */}
          <div className={styles.buyRow}>
            <div className={styles.quantity}>
              <button onClick={decrease}>−</button>
              <span>{quantity}</span>
              <button onClick={increase}>+</button>
            </div>

            <button
              className={styles.addButton}
              onClick={() => {
                const added = addToCart(product, size, quantity);
                if (added === quantity) {
                  setCartMessage(`Added ${added} to your cart ✓`);
                } else if (added > 0) {
                  setCartMessage(`Only ${added} more could be added — the rest of the stock is already in your cart.`);
                } else {
                  setCartMessage(`All ${product.stock} in stock are already in your cart.`);
                }
              }}
              disabled={isOutOfStock}
            >
              {isOutOfStock ? "Sold out" : "Add to cart"}
            </button>
          </div>

          {cartMessage && <p className={styles.cartMessage}>{cartMessage}</p>}

          <p className={styles.note}>
            Free delivery above ₹ 999 · Cash on delivery available
          </p>
        </div>
      </div>

      <ReviewsSection productId={product.id} />

      {/* Related products */}
      {related.length > 0 && (
        <section>
          <h2 className={styles.sectionTitle}>You may also like</h2>
          <div className={styles.relatedGrid}>
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

export default ProductDetail;