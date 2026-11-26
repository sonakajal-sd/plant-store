import { API_URL, handleResponse } from "@/services/apiClient";
import type { AuthResponse } from "@/types/user";

// POST /api/auth/login
export async function loginRequest(email: string, password: string): Promise<AuthResponse> {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  return handleResponse<AuthResponse>(res);
}

// POST /api/auth/register
export async function registerRequest(
  name: string,
  email: string,
  password: string
): Promise<AuthResponse> {
  const res = await fetch(`${API_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, password }),
  });
  return handleResponse<AuthResponse>(res);
}