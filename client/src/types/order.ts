import type { CartItem } from "@/types/cart";

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
