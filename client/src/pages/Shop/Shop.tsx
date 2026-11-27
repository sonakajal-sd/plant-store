import { useState } from "react";
import type { FormEvent } from "react";
import { useSearchParams } from "react-router-dom";
import { categories, lightOptions } from "@/data/products";
import { useProducts } from "@/hooks/useProducts";
import ProductCard from "@/components/ProductCard/ProductCard";
import Pagination from "@/components/Pagination/Pagination";
import type { LightLevel, ProductQuery, SortOption } from "@/types/product";
import styles from "./Shop.module.css";

const PAGE_SIZE = 12;

const sortOptions: { value: SortOption; label: string }[] = [
  { value: "popular", label: "Popular" },
  { value: "newest", label: "Newest" },
  { value: "price-asc", label: "Price: low to high" },
  { value: "price-desc", label: "Price: high to low" },
];

// Reads a whole number from the URL, or undefined if it's missing or not a number
function readNumber(value: string | null): number | undefined {
  if (value === null || value === "") return undefined;
  const n = Number(value);
  return Number.isInteger(n) && n >= 0 ? n : undefined;
}

// Turns the URL (?category=Indoor&page=2) into a query for the server.
// Anything we don't understand is simply ignored.
function readQuery(params: URLSearchParams): ProductQuery {
  const light = params.get("light");
  const sort = params.get("sort");
  return {
    search: params.get("search") ?? undefined,
    category: params.get("category") ?? undefined,
    minPrice: readNumber(params.get("minPrice")),
    maxPrice: readNumber(params.get("maxPrice")),
    light: lightOptions.includes(light as LightLevel) ? (light as LightLevel) : undefined,
    petSafe: params.get("petSafe") === "true",
    inStock: params.get("inStock") === "true",
    sort: sortOptions.some((o) => o.value === sort) ? (sort as SortOption) : "popular",
    page: readNumber(params.get("page")) ?? 1,
    pageSize: PAGE_SIZE,
  };
}

function Shop() {
  // The URL is the "single source of truth" for every filter
  const [searchParams, setSearchParams] = useSearchParams();
  const query = readQuery(searchParams);
  const { products, total, page, pageSize, loading, error } = useProducts(query);

  // Change one filter in the URL. Any filter change goes back to page 1.
  function setFilter(name: string, value: string | null) {
    const next = new URLSearchParams(searchParams);
    if (value === null || value === "") {
      next.delete(name);
    } else {
      next.set(name, value);
    }
    if (name !== "page") next.delete("page");
    setSearchParams(next);
  }

  function goToPage(newPage: number) {
    setFilter("page", String(newPage));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function clearFilters() {
    setSearchParams({});
  }

  const hasFilters = [...searchParams.keys()].some((key) => key !== "page" && key !== "sort");

  let title = "All plants";
  if (query.search) title = `Results for "${query.search}"`;
  else if (query.category) title = query.category;

  return (
    <div className={styles.page}>
      {/* Title row */}
      <div className={styles.topRow}>
        <div>
          <h1 className={styles.title}>{title}</h1>
          <p className={styles.count}>
            {loading ? "Loading…" : `${total} ${total === 1 ? "plant" : "plants"}`}
          </p>
        </div>

        <label className={styles.sortLabel}>
          Sort by
          <select
            className={styles.select}
            value={query.sort}
            onChange={(e) => setFilter("sort", e.target.value)}
          >
            {sortOptions.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </label>
      </div>

      <div className={styles.layout}>
        {/* Left: filters */}
        <aside className={styles.sidebar}>
          <h2 className={styles.sidebarTitle}>Category</h2>
          {["All", ...categories].map((category) => {
            const active = (query.category ?? "All") === category;
            return (
              <button
                key={category}
                onClick={() => setFilter("category", category === "All" ? null : category)}
                className={active ? styles.categoryActive : styles.categoryButton}
              >
                {category}
              </button>
            );
          })}

          <h2 className={styles.sidebarTitle}>Price (₹)</h2>
          {/* "key" resets the boxes when the URL changes (e.g. after "Clear filters") */}
          <PriceFilter
            key={`${query.minPrice}-${query.maxPrice}`}
            min={query.minPrice}
            max={query.maxPrice}
            onApply={(min, max) => {
              const next = new URLSearchParams(searchParams);
              if (min === "") next.delete("minPrice"); else next.set("minPrice", min);
              if (max === "") next.delete("maxPrice"); else next.set("maxPrice", max);
              next.delete("page");
              setSearchParams(next);
            }}
          />

          <h2 className={styles.sidebarTitle}>Light</h2>
          <select
            className={styles.select}
            value={query.light ?? ""}
            onChange={(e) => setFilter("light", e.target.value)}
          >
            <option value="">Any light</option>
            {lightOptions.map((l) => (
              <option key={l} value={l}>{l}</option>
            ))}
          </select>

          <label className={styles.checkbox}>
            <input
              type="checkbox"
              checked={query.petSafe}
              onChange={(e) => setFilter("petSafe", e.target.checked ? "true" : null)}
            />
            Pet-safe only 🐾
          </label>
          <label className={styles.checkbox}>
            <input
              type="checkbox"
              checked={query.inStock}
              onChange={(e) => setFilter("inStock", e.target.checked ? "true" : null)}
            />
            In stock only
          </label>

          {hasFilters && (
            <button className={styles.clearButton} onClick={clearFilters}>
              Clear filters
            </button>
          )}
        </aside>

        {/* Right: results */}
        <div className={styles.results}>
          {error && <p className={styles.error}>{error}</p>}

          {!error && !loading && products.length === 0 && (
            <div className={styles.empty}>
              <p>No plants match these filters. 🌵</p>
              <button className={styles.clearButton} onClick={clearFilters}>
                Clear filters
              </button>
            </div>
          )}

          {/* While a new page loads, keep showing the old cards (a bit faded) */}
          <div className={loading ? `${styles.grid} ${styles.loading}` : styles.grid}>
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>

          {loading && products.length === 0 && <p>Loading plants… 🌱</p>}

          <Pagination page={page} pageSize={pageSize} total={total} onPageChange={goToPage} />
        </div>
      </div>
    </div>
  );
}

// ---- Min / max price boxes with an "Apply" button ----

type PriceFilterProps = {
  min: number | undefined;
  max: number | undefined;
  onApply: (min: string, max: string) => void;
};

function PriceFilter({ min, max, onApply }: PriceFilterProps) {
  const [minText, setMinText] = useState(min === undefined ? "" : String(min));
  const [maxText, setMaxText] = useState(max === undefined ? "" : String(max));
  const [error, setError] = useState("");

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const isNumberOrEmpty = (text: string) => text === "" || /^\d+$/.test(text);
    if (!isNumberOrEmpty(minText) || !isNumberOrEmpty(maxText)) {
      setError("Use whole numbers");
      return;
    }
    if (minText !== "" && maxText !== "" && Number(minText) > Number(maxText)) {
      setError("Min can't be more than max");
      return;
    }
    setError("");
    onApply(minText, maxText);
  }

  return (
    <form className={styles.priceForm} onSubmit={handleSubmit}>
      <div className={styles.priceRow}>
        <input
          inputMode="numeric"
          placeholder="Min"
          aria-label="Minimum price"
          value={minText}
          onChange={(e) => setMinText(e.target.value.trim())}
        />
        <span>–</span>
        <input
          inputMode="numeric"
          placeholder="Max"
          aria-label="Maximum price"
          value={maxText}
          onChange={(e) => setMaxText(e.target.value.trim())}
        />
      </div>
      {error && <span className={styles.priceError}>{error}</span>}
      <button type="submit" className={styles.applyButton}>Apply</button>
    </form>
  );
}

export default Shop;
