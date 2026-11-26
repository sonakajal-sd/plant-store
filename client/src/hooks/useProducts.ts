import { useEffect, useState } from "react";
import { fetchProducts } from "@/services/productService";
import type { Product } from "@/types/product";

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Runs once when the page opens
  useEffect(() => {
    fetchProducts()
      .then((data) => setProducts(data))
      .catch(() => setError("Could not load plants. Is the server running?"))
      .finally(() => setLoading(false));
  }, []);

  return { products, setProducts, loading, error };
}