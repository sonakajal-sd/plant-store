import type { CartItem } from "../context/useCart";

export type CustomerDetails = {
  name: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
};

export type OrderStatus = "Placed" | "Shipped" | "Delivered";

export type Order = {
  id: string;
  date: string;
  customer: CustomerDetails;
  items: CartItem[];
  total: number;
  status: OrderStatus;
};

// Read all saved orders
export function getOrders(): Order[] {
  const saved = localStorage.getItem("orders");
  return saved ? (JSON.parse(saved) as Order[]) : [];
}

// Add one new order (newest first)
export function saveOrder(order: Order) {
  const orders = getOrders();
  localStorage.setItem("orders", JSON.stringify([order, ...orders]));
}

// Save the whole order list (used by the admin to change status)
export function saveOrders(orders: Order[]) {
  localStorage.setItem("orders", JSON.stringify(orders));
}