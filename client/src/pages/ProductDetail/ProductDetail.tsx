import { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { useCart } from "@/context/cart/useCart";
import { sizes, sizeExtraPrice } from "@/data/products";
import { useProducts } from "@/hooks/useProducts";
import type { Size } from "@/types/product";
import ProductCard from "@/components/ProductCard/ProductCard";
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
    const { products, loading } = useProducts();

  // 2. Find the product with that id
  const product = products.find((p) => p.id === Number(id));

  const [size, setSize] = useState<Size>("Small");
  const [quantity, setQuantity] = useState(1);

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
  // 3. If no product has this id, show a message
  if (!product) {
    return (
      <div className={styles.page}>
        <h1>Plant not found 🥀</h1>
        <Link to="/shop" className={styles.backLink}>← Back to shop</Link>
      </div>
    );
  }

  const isOutOfStock = product.stock === 0;
  const price = product.price + sizeExtraPrice[size];

  // "Low light · Water weekly" → ["Low light", "Water weekly"]
  const [light, water] = product.care.split(" · ");

  // Other plants in the same category (not this one), max 4
  const related = products
    .filter((p) => p.category === product.category && p.id !== product.id)
    .slice(0, 4);

  function increase() {
    if (quantity < product!.stock) {
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

          <h1 className={styles.title}>{product.name}</h1>
          <p className={styles.price}>₹ {price}</p>

          <div className={styles.careGrid}>
            <div className={styles.careBox}>☀️ {light}</div>
            <div className={styles.careBox}>💧 {water}</div>
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
             onClick={() => addToCart(product, size, quantity)}
              disabled={isOutOfStock}
            >
              {isOutOfStock ? "Sold out" : "Add to cart"}
            </button>
          </div>

          <p className={styles.note}>
            Free delivery above ₹ 999 · Cash on delivery available
          </p>
        </div>
      </div>

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