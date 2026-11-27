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
  ratingAverage: number | null; // e.g. 4.3 (null = no reviews yet)
  ratingCount: number;
};

export type Size = "Small" | "Medium" | "Large";

// The data we send to create/update a product.
// The id is chosen by the database, photos are uploaded separately,
// and the rating comes from reviews.
export type ProductInput = Omit<Product, "id" | "imageUrl" | "ratingAverage" | "ratingCount">;

export type SortOption = "popular" | "newest" | "price-asc" | "price-desc";

// The filters the product list understands (all optional)
export type ProductQuery = {
  search?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  light?: LightLevel;
  petSafe?: boolean;
  inStock?: boolean;
  sort?: SortOption;
  page?: number;
  pageSize?: number;
  ids?: number[]; // only these products (used to refresh the cart)
  archived?: boolean; // admin only: ONLY archived products
};

// Numbers for the admin's top cards
export type ProductStats = { active: number; outOfStock: number; archived: number };
