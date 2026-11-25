import type { Product, Size } from "@/types/product";

export const defaultProducts: Product[] = [
  { id: 1, name: "Snake Plant", category: "Indoor", price: 349, care: "Low light · Water every 2 weeks", tag: "Beginner friendly", stock: 24 },
  { id: 2, name: "Money Plant", category: "Indoor", price: 199, care: "Indirect light · Water weekly", tag: "Best seller", stock: 40 },
  { id: 3, name: "Peace Lily", category: "Flowering", price: 449, care: "Shade · Keep soil moist", tag: "Flowering", stock: 6 },
  { id: 4, name: "Aloe Vera", category: "Succulents", price: 249, care: "Bright light · Water rarely", tag: "Low water", stock: 18 },
  { id: 5, name: "Hibiscus", category: "Outdoor", price: 299, care: "Full sun · Water daily", tag: "Outdoor", stock: 0 },
  { id: 6, name: "Jade Plant", category: "Succulents", price: 279, care: "Bright light · Water rarely", tag: "Lucky plant", stock: 12 },
  { id: 7, name: "Areca Palm", category: "Indoor", price: 649, care: "Indirect light · Water twice a week", tag: "Air purifier", stock: 8 },
  { id: 8, name: "Tulsi", category: "Outdoor", price: 149, care: "Full sun · Water daily", tag: "Outdoor", stock: 30 },
  { id: 9, name: "Terracotta Pot", category: "Pots & Planters", price: 179, care: "8 inch · Handmade clay", tag: "Handmade", stock: 32 },
];

export const categories: string[] = [
  "Indoor",
  "Outdoor",
  "Succulents",
  "Flowering",
  "Pots & Planters",
];

export const sizes: Size[] = ["Small", "Medium", "Large"];

export const sizeExtraPrice: Record<Size, number> = {
  Small: 0,
  Medium: 100,
  Large: 200,
};
