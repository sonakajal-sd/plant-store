import { API_URL, handleResponse, getAuthHeaders } from "@/services/apiClient";
import type { Product, ProductInput } from "@/types/product";

// Optional filters for the product list
type ProductListOptions = {
  category?: string;
  ids?: number[]; // only these products (used to refresh the cart)
  includeArchived?: boolean; // admin only: also show archived products
};

// GET products (only active ones, unless the admin asks for archived too)
export async function fetchProducts(options: ProductListOptions = {}): Promise<Product[]> {
  // Turn the options into "?category=Indoor&ids=1,2"
  const params = new URLSearchParams();
  if (options.category) params.set("category", options.category);
  if (options.ids) params.set("ids", options.ids.join(","));
  if (options.includeArchived) params.set("includeArchived", "true");

  // Send the token too, so the server knows when the admin is asking
  const res = await fetch(`${API_URL}/products?${params.toString()}`, {
    headers: getAuthHeaders(),
  });
  return handleResponse<Product[]>(res);
}

// GET one product (404 if it doesn't exist or is archived)
export async function fetchProduct(id: number): Promise<Product> {
  const res = await fetch(`${API_URL}/products/${id}`, { headers: getAuthHeaders() });
  return handleResponse<Product>(res);
}

// POST a new product
export async function createProduct(input: ProductInput): Promise<Product> {
  const res = await fetch(`${API_URL}/products`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...getAuthHeaders() },
    body: JSON.stringify(input),
  });
  return handleResponse<Product>(res);
}

// PUT (update) a product
export async function updateProduct(id: number, input: ProductInput): Promise<Product> {
  const res = await fetch(`${API_URL}/products/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...getAuthHeaders() },
    body: JSON.stringify(input),
  });
  return handleResponse<Product>(res);
}

// What the server answers after "delete"
export type RemoveProductResult = {
  archived: boolean; // true = it was in past orders, so it was archived instead
  message: string;
  product?: Product; // the archived product (only when archived is true)
};

// DELETE a product (or archive it, if it is in past orders)
export async function removeProduct(id: number): Promise<RemoveProductResult> {
  const res = await fetch(`${API_URL}/products/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });
  return handleResponse<RemoveProductResult>(res);
}
