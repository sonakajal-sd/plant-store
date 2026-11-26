import type { Size } from "@/types/product";

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