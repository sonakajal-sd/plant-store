import { useEffect, useState } from "react";
import { ApiError } from "@/services/apiClient";
import { fetchProduct, fetchProducts } from "@/services/productService";
import type { Product } from "@/types/product";

// Loads ONE product from the server, plus up to 4 related products (same category)
export function useProduct(id: number) {
  const [product, setProduct] = useState<Product | null>(null);
  const [related, setRelated] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchProduct(id)
      .then((data) => {
        setProduct(data);

        // Related products are a bonus: if they fail, the page still works
        fetchProducts({ category: data.category })
          .then((list) => setRelated(list.filter((p) => p.id !== data.id).slice(0, 4)))
          .catch(() => setRelated([]));
      })
      .catch((err: Error) => {
        // 404 = no such plant (or archived), 400 = the id in the URL isn't a number
        if (err instanceof ApiError && (err.status === 404 || err.status === 400)) {
          setNotFound(true);
        } else {
          setError("Could not load this plant. Is the server running?");
        }
      })
      .finally(() => setLoading(false));
  }, [id]);

  return { product, related, loading, notFound, error };
}
