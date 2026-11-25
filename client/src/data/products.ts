// The shape of one product
export type Product = {
  id: number;
  name: string;
  category: string;
  price: number;
  care: string;
  tag: string;
};

// Sample products (later these will come from our database)
export const products: Product[] = [
  { id: 1, name: "Snake Plant", category: "Indoor", price: 349, care: "Low light · Water every 2 weeks", tag: "Beginner friendly" },
  { id: 2, name: "Money Plant", category: "Indoor", price: 199, care: "Indirect light · Water weekly", tag: "Best seller" },
  { id: 3, name: "Peace Lily", category: "Flowering", price: 449, care: "Shade · Keep soil moist", tag: "Flowering" },
  { id: 4, name: "Aloe Vera", category: "Succulents", price: 249, care: "Bright light · Water rarely", tag: "Low water" },
];

export const categories: string[] = [
  "Indoor",
  "Outdoor",
  "Succulents",
  "Flowering",
  "Pots & Planters",
];