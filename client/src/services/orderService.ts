import { API_URL, handleResponse, getAuthHeaders } from "@/services/apiClient";
import type { Paged } from "@/types/api";
import type { CartItem } from "@/types/cart";
import type { CustomerDetails, Order, OrderStatus } from "@/types/order";

// POST a new order (must be logged in)
export async function placeOrder(
  customer: CustomerDetails,
  cartItems: CartItem[],
  couponCode: string | null
): Promise<Order> {
  // Send ONLY what was chosen. The server works out every price itself.
  const items = cartItems.map((item) => ({
    productId: item.product.id,
    size: item.size,
    quantity: item.quantity,
  }));

  const res = await fetch(`${API_URL}/orders`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...getAuthHeaders() },
    // The server checks the coupon again and works out the discount itself
    body: JSON.stringify({ customer, items, couponCode }),
  });
  return handleResponse<Order>(res);
}

// GET one page of my own orders (newest first)
export async function fetchMyOrders(page: number, pageSize = 10): Promise<Paged<Order>> {
  const res = await fetch(`${API_URL}/orders/my?page=${page}&pageSize=${pageSize}`, {
    headers: getAuthHeaders(),
  });
  return handleResponse<Paged<Order>>(res);
}

// GET one page of all orders (admin only)
export async function fetchAllOrders(page: number, pageSize = 20): Promise<Paged<Order>> {
  const res = await fetch(`${API_URL}/orders?page=${page}&pageSize=${pageSize}`, {
    headers: getAuthHeaders(),
  });
  return handleResponse<Paged<Order>>(res);
}

// Numbers for the admin's top cards
export type OrderStats = { toShip: number; onTheWay: number; all: number };

export async function fetchOrderStats(): Promise<OrderStats> {
  const res = await fetch(`${API_URL}/orders/stats`, { headers: getAuthHeaders() });
  return handleResponse<OrderStats>(res);
}

// PATCH an order's status (admin only). "Cancelled" also puts the stock back.
export async function updateOrderStatus(id: number, status: OrderStatus): Promise<Order> {
  const res = await fetch(`${API_URL}/orders/${id}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...getAuthHeaders() },
    body: JSON.stringify({ status }),
  });
  return handleResponse<Order>(res);
}

// PATCH: the customer cancels their own order (only while it is "Placed")
export async function cancelMyOrder(id: number): Promise<Order> {
  const res = await fetch(`${API_URL}/orders/${id}/cancel`, {
    method: "PATCH",
    headers: getAuthHeaders(),
  });
  return handleResponse<Order>(res);
}
