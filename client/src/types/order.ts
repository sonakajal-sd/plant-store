import type { Product, Size } from "@/types/product";

export type OrderStatus = "Placed" | "Shipped" | "Delivered" | "Cancelled";

export type PaymentMethod = "COD" | "ONLINE";

export type PaymentStatus = "PENDING" | "PAID" | "FAILED" | "REFUNDED";

// What the customer types in the checkout form
export type CustomerDetails = {
  name: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
};

// One line of an order, as the server sends it
export type OrderItem = {
  id: number;
  productId: number;
  size: Size;
  quantity: number;
  price: number; // price of ONE item at the time of ordering
  product: Product;
};

// An order, as the server sends it
export type Order = {
  id: number;
  userId: number;
  customerName: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  // Money in rupees: total = subtotal - discount + deliveryFee
  subtotal: number;
  discount: number;
  deliveryFee: number;
  total: number;
  couponCode: string | null;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  createdAt: string; // a date as text, e.g. "2026-11-26T10:30:00.000Z"
  items: OrderItem[];
  user?: { name: string; email: string }; // only in the admin list
};
