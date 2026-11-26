import { API_URL, handleResponse } from "@/services/apiClient";
import type { Product, ProductInput } from "@/types/product";

// GET all products
export async function fetchProducts(): Promise<Product[]> {
  const res = await fetch(`${API_URL}/products`);
  return handleResponse<Product[]>(res);
}

// POST a new product
export async function createProduct(input: ProductInput): Promise<Product> {
  const res = await fetch(`${API_URL}/products`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return handleResponse<Product>(res);
}

// PUT (update) a product
export async function updateProduct(id: number, input: ProductInput): Promise<Product> {
  const res = await fetch(`${API_URL}/products/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return handleResponse<Product>(res);
}

// DELETE a product
export async function removeProduct(id: number): Promise<void> {
  const res = await fetch(`${API_URL}/products/${id}`, { method: "DELETE" });
  await handleResponse(res);
}