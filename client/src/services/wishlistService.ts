import { API_URL, handleResponse, getAuthHeaders } from "@/services/apiClient";
import type { Product } from "@/types/product";

export type WishlistItem = {
  id: number;
  productId: number;
  createdAt: string;
  product: Product;
};

// GET my wishlist (newest first)
export async function fetchWishlist(): Promise<WishlistItem[]> {
  const res = await fetch(`${API_URL}/wishlist`, { headers: getAuthHeaders() });
  return handleResponse<WishlistItem[]>(res);
}

// POST: add a product
export async function addToWishlist(productId: number): Promise<void> {
  const res = await fetch(`${API_URL}/wishlist`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...getAuthHeaders() },
    body: JSON.stringify({ productId }),
  });
  await handleResponse(res);
}

// DELETE: remove a product
export async function removeFromWishlist(productId: number): Promise<void> {
  const res = await fetch(`${API_URL}/wishlist/${productId}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });
  await handleResponse(res);
}
