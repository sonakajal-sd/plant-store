import { API_URL, handleResponse, getAuthHeaders } from "@/services/apiClient";
import type { Coupon, CouponCheck, CouponInput } from "@/types/coupon";

// POST: is this code OK for this subtotal? (anyone can ask)
export async function validateCoupon(code: string, subtotal: number): Promise<CouponCheck> {
  const res = await fetch(`${API_URL}/coupons/validate`, {
    method: "POST",
    // With the token (if logged in), so the server can check "once per customer" coupons
    headers: { "Content-Type": "application/json", ...getAuthHeaders() },
    body: JSON.stringify({ code, subtotal }),
  });
  return handleResponse<CouponCheck>(res);
}

// ---------- Admin ----------

export async function fetchCoupons(): Promise<Coupon[]> {
  const res = await fetch(`${API_URL}/coupons`, { headers: getAuthHeaders() });
  return handleResponse<Coupon[]>(res);
}

export async function createCoupon(input: CouponInput): Promise<Coupon> {
  const res = await fetch(`${API_URL}/coupons`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...getAuthHeaders() },
    body: JSON.stringify(input),
  });
  return handleResponse<Coupon>(res);
}

export async function updateCoupon(id: number, input: CouponInput): Promise<Coupon> {
  const res = await fetch(`${API_URL}/coupons/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...getAuthHeaders() },
    body: JSON.stringify(input),
  });
  return handleResponse<Coupon>(res);
}
