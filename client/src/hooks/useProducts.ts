import { useEffect, useState } from "react";
import { fetchProducts } from "@/services/productService";
import type { Paged } from "@/types/api";
import type { Product, ProductQuery } from "@/types/product";

// Loads one page of products for a query, e.g. { category: "Indoor", page: 2 }.
// Loads again whenever the query changes.
export function useProducts(query: ProductQuery) {
  const [result, setResult] = useState<Paged<Product> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // A text version of the query: React compares it easily, so we only reload when it really changes
  const queryKey = JSON.stringify(query);

  useEffect(() => {
    let ignore = false; // if the query changes again before we get an answer, ignore the old answer

    fetchProducts(JSON.parse(queryKey) as ProductQuery)
      .then((data) => {
        if (!ignore) {
          setResult(data);
          setError("");
        }
      })
      .catch((err: Error) => {
        if (!ignore) setError(err.message || "Could not load plants. Is the server running?");
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [queryKey]);

  return {
    products: result?.items ?? [],
    total: result?.total ?? 0,
    page: result?.page ?? 1,
    pageSize: result?.pageSize ?? query.pageSize ?? 12,
    loading,
    error,
  };
}
