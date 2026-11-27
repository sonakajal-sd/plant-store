import { API_URL, handleResponse, getAuthHeaders } from "@/services/apiClient";
import type { ReviewSummary } from "@/types/review";

// GET the reviews of a product (with the token, so we learn if I can review it)
export async function fetchReviews(productId: number): Promise<ReviewSummary> {
  const res = await fetch(`${API_URL}/products/${productId}/reviews`, { headers: getAuthHeaders() });
  return handleResponse<ReviewSummary>(res);
}

// POST: write or update MY review
export async function saveReview(productId: number, rating: number, comment: string): Promise<void> {
  const res = await fetch(`${API_URL}/products/${productId}/reviews`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...getAuthHeaders() },
    body: JSON.stringify({ rating, comment }),
  });
  await handleResponse(res);
}
