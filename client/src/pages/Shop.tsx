import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { products, categories } from "../data/products";
import ProductCard from "../components/ProductCard/ProductCard";
import styles from "./Shop.module.css";

type ShopProps = {
  onAddToCart: () => void;
};

// The only 3 values sort can have
type SortOption = "popular" | "price-low" | "price-high";

function Shop({ onAddToCart }: ShopProps) {
  // Read the category from the URL, e.g. /shop?category=Indoor
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedCategory = searchParams.get("category") ?? "All";

  const [sort, setSort] = useState<SortOption>("popular");

  // Step 1: filter by category
  const filtered =
    selectedCategory === "All"
      ? products
      : products.filter((p) => p.category === selectedCategory);

  // Step 2: sort by price (copy the array first with [...] so we don't change the original)
  const sorted = [...filtered];
  if (sort === "price-low") {
    sorted.sort((a, b) => a.price - b.price);
  } else if (sort === "price-high") {
    sorted.sort((a, b) => b.price - a.price);
  }

  // When a category button is clicked, update the URL
  function handleCategoryClick(category: string) {
    if (category === "All") {
      setSearchParams({});
    } else {
      setSearchParams({ category: category });
    }
  }

  return (
    <div className={styles.page}>
      {/* Title row */}
      <div className={styles.topRow}>
        <div>
          <h1 className={styles.title}>
            {selectedCategory === "All" ? "All plants" : selectedCategory}
          </h1>
          <p className={styles.count}>Showing {sorted.length} products</p>
        </div>

        <label className={styles.sortLabel}>
          Sort by
          <select
            className={styles.select}
            value={sort}
            onChange={(e) => setSort(e.target.value as SortOption)}
          >
            <option value="popular">Popular</option>
            <option value="price-low">Price: low to high</option>
            <option value="price-high">Price: high to low</option>
          </select>
        </label>
      </div>

      <div className={styles.layout}>
        {/* Left: category filter */}
        <aside className={styles.sidebar}>
          <h2 className={styles.sidebarTitle}>Category</h2>
          {["All", ...categories].map((category) => (
            <button
              key={category}
              onClick={() => handleCategoryClick(category)}
              className={
                category === selectedCategory
                  ? styles.categoryActive
                  : styles.categoryButton
              }
            >
              {category}
            </button>
          ))}
        </aside>

        {/* Right: product grid */}
        <div className={styles.grid}>
          {sorted.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onAddToCart={onAddToCart}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default Shop;