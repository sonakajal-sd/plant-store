import { Link } from "react-router-dom";
import { products, categories } from "../data/products";
import ProductCard from "../components/ProductCard/ProductCard";
import styles from "./Home.module.css";

type HomeProps = {
  onAddToCart: () => void;
};

function Home({ onAddToCart }: HomeProps) {
  return (
    <div className={styles.page}>
      {/* 1. Hero section */}
      <section className={styles.hero}>
        <div className={styles.heroText}>
          <span className={styles.badge}>Grown with care · Delivered fresh</span>
          <h1 className={styles.title}>Bring a little nature home.</h1>
          <p className={styles.subtitle}>
            Healthy indoor and outdoor plants, handmade clay pots and simple
            care guides — delivered to your door.
          </p>
          <div className={styles.heroButtons}>
            <Link to="/shop" className={styles.primaryButton}>Shop plants</Link>
            <Link to="/shop" className={styles.secondaryButton}>Find your plant</Link>
          </div>
        </div>
        <div className={styles.heroImage}>🪴</div>
      </section>

      {/* 2. Categories */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Shop by category</h2>
        <div className={styles.categoryGrid}>
          {categories.map((category) => (
            <Link
  to={`/shop?category=${encodeURIComponent(category)}`}
  key={category}
  className={styles.categoryCard}
>
              <span className={styles.categoryIcon}>🌱</span>
              <span className={styles.categoryName}>{category}</span>
              <span className={styles.explore}>Explore →</span>
            </Link>
          ))}
        </div>
      </section>

      {/* 3. Best sellers */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Best sellers</h2>
        <div className={styles.productGrid}>
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onAddToCart={onAddToCart}
            />
          ))}
        </div>
      </section>

      {/* 4. Why shop with us */}
      <section className={styles.section}>
        <div className={styles.features}>
          <div>
            <h3>🚚 Safe delivery</h3>
            <p>Every plant is packed carefully so it reaches you healthy.</p>
          </div>
          <div>
            <h3>💧 Easy care guides</h3>
            <p>Simple light and watering tips for beginners.</p>
          </div>
          <div>
            <h3>💵 Cash on delivery</h3>
            <p>Pay when your plants arrive.</p>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Home;