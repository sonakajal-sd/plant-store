import { API_URL, handleResponse, getAuthHeaders } from "@/services/apiClient";
import type { Paged } from "@/types/api";
import type { Product, ProductInput, ProductQuery, ProductStats } from "@/types/product";

// Turns a query object into "?search=fern&page=2". Empty values are left out.
function toSearchParams(query: ProductQuery): string {
  const params = new URLSearchParams();
  if (query.search) params.set("search", query.search);
  if (query.category) params.set("category", query.category);
  if (query.minPrice !== undefined) params.set("minPrice", String(query.minPrice));
  if (query.maxPrice !== undefined) params.set("maxPrice", String(query.maxPrice));
  if (query.light) params.set("light", query.light);
  if (query.petSafe) params.set("petSafe", "true");
  if (query.inStock) params.set("inStock", "true");
  if (query.sort) params.set("sort", query.sort);
  if (query.page) params.set("page", String(query.page));
  if (query.pageSize) params.set("pageSize", String(query.pageSize));
  if (query.ids) params.set("ids", query.ids.join(","));
  if (query.archived) params.set("archived", "true");
  return params.toString();
}

// GET one page of products (only active ones, unless the admin asks for archived)
export async function fetchProducts(query: ProductQuery = {}): Promise<Paged<Product>> {
  // Send the token too, so the server knows when the admin is asking
  const res = await fetch(`${API_URL}/products?${toSearchParams(query)}`, {
    headers: getAuthHeaders(),
  });
  return handleResponse<Paged<Product>>(res);
}

// GET the numbers for the admin's top cards
export async function fetchProductStats(): Promise<ProductStats> {
  const res = await fetch(`${API_URL}/products/stats`, { headers: getAuthHeaders() });
  return handleResponse<ProductStats>(res);
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
