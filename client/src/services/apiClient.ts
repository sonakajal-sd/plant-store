// The address of our backend
export const API_URL = "http://localhost:4000/api";

// Reads the server's answer. If it's an error, throw it with the server's message
export async function handleResponse<T>(res: Response): Promise<T> {
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error ?? "Something went wrong");
  }
  return data as T;
}

// The login token as a header, so the server knows who is asking.
// Gives {} when nobody is logged in.
export function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}
