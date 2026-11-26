export type Product = {
  id: number;
  name: string;
  category: string;
  price: number;
  care: string;
  tag: string;
  stock: number; // how many we have. 0 = out of stock
};

export type Size = "Small" | "Medium" | "Large";

// The data we send to create/update a product: everything except the id
export type ProductInput = Omit<Product, "id">;