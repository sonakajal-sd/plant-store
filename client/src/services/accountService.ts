import { API_URL, handleResponse, getAuthHeaders } from "@/services/apiClient";
import type { User } from "@/types/user";

// PUT: change my name
export async function updateMyName(name: string): Promise<User> {
  const res = await fetch(`${API_URL}/auth/me`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...getAuthHeaders() },
    body: JSON.stringify({ name }),
  });
  return handleResponse<User>(res);
}

// POST: change my password (needs the current one).
// The server logs out every OLD token and sends a NEW one for this browser.
export async function changePassword(currentPassword: string, newPassword: string): Promise<string> {
  const res = await fetch(`${API_URL}/auth/change-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...getAuthHeaders() },
    body: JSON.stringify({ currentPassword, newPassword }),
  });
  const data = await handleResponse<{ message: string; token: string }>(res);
  return data.token;
}
