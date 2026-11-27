// The address of our backend
export const API_URL = "http://localhost:4000/api";

// The name of the signal we send when the login has expired (AuthProvider listens for it)
export const AUTH_EXPIRED_EVENT = "auth:expired";

// An error that also remembers the HTTP status (e.g. 404), so pages can react to it
export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

// Reads the server's answer. If it's an error, throw it with the server's message
export async function handleResponse<T>(res: Response): Promise<T> {
  // Some answers might not be JSON (e.g. the server crashed) → use an empty object
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    // 401 while we HAVE a token = the token is expired or invalid → log out everywhere.
    // (Without a token, a 401 is just "wrong email or password" on the login page.)
    if (res.status === 401 && localStorage.getItem("token")) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.dispatchEvent(new Event(AUTH_EXPIRED_EVENT));
    }
    throw new ApiError(data.error ?? "Something went wrong", res.status);
  }
  return data as T;
}

// The login token as a header, so the server knows who is asking.
// Gives {} when nobody is logged in.
export function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}
