import { API_URL, handleResponse, getAuthHeaders } from "@/services/apiClient";
import type { CartItem } from "@/types/cart";
import type { CustomerDetails, Order, OrderStatus } from "@/types/order";

// POST a new order (must be logged in)
export async function placeOrder(customer: CustomerDetails, cartItems: CartItem[]): Promise<Order> {
  // Send ONLY what was chosen. The server works out every price itself.
  const items = cartItems.map((item) => ({
    productId: item.product.id,
    size: item.size,
    quantity: item.quantity,
  }));

  const res = await fetch(`${API_URL}/orders`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...getAuthHeaders() },
    body: JSON.stringify({ customer, items }),
  });
  return handleResponse<Order>(res);
}

// GET my own orders (newest first)
export async function fetchMyOrders(): Promise<Order[]> {
  const res = await fetch(`${API_URL}/orders/my`, { headers: getAuthHeaders() });
  return handleResponse<Order[]>(res);
}

// GET all orders (admin only)
export async function fetchAllOrders(): Promise<Order[]> {
  const res = await fetch(`${API_URL}/orders`, { headers: getAuthHeaders() });
  return handleResponse<Order[]>(res);
}

// PATCH an order's status (admin only).
// The server sends back the order WITHOUT its items and user.
export async function updateOrderStatus(
  id: number,
  status: OrderStatus
): Promise<Omit<Order, "items" | "user">> {
  const res = await fetch(`${API_URL}/orders/${id}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...getAuthHeaders() },
    body: JSON.stringify({ status }),
  });
  return handleResponse<Omit<Order, "items" | "user">>(res);
}
