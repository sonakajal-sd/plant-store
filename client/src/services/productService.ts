import { defaultProducts } from "@/data/products";
import type { Product } from "@/types/product";

// Read products: saved list if the admin changed something, else the default list
export function getProducts(): Product[] {
  const saved = localStorage.getItem("products");
  return saved ? (JSON.parse(saved) as Product[]) : defaultProducts;
}

// Save the whole product list
export function saveProducts(list: Product[]) {
  localStorage.setItem("products", JSON.stringify(list));
}
