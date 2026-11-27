import type { LightLevel, Size } from "@/types/product";

export const categories: string[] = [
  "Indoor",
  "Outdoor",
  "Succulents",
  "Flowering",
  "Pots & Planters",
];

export const lightOptions: LightLevel[] = ["Low light", "Indirect light", "Bright light", "Full sun"];

// The most of one plant (in one size) per order — same as the server
export const MAX_QUANTITY_PER_ITEM = 20;

export const sizes: Size[] = ["Small", "Medium", "Large"];

export const sizeExtraPrice: Record<Size, number> = {
  Small: 0,
  Medium: 100,
  Large: 200,
};