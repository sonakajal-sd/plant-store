// The only light values a product can have (same list as the server)
export type LightLevel = "Low light" | "Indirect light" | "Bright light" | "Full sun";

export type Product = {
  id: number;
  name: string;
  category: string;
  price: number;
  light: LightLevel;
  water: string; // e.g. "Water weekly"
  description: string;
  tag: string;
  stock: number; // how many we have. 0 = out of stock
  petSafe: boolean;
  imageUrl: string | null; // null = no photo yet (we show 🪴)
  isActive: boolean; // false = archived (hidden from the shop)
};

export type Size = "Small" | "Medium" | "Large";

// The data we send to create/update a product.
// The id is chosen by the database, and photos are uploaded separately.
export type ProductInput = Omit<Product, "id" | "imageUrl">;
