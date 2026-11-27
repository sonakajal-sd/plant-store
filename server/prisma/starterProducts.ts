import type { Prisma } from "../src/generated/prisma/client";

// The basic product list. Used by seed.ts (only when the shop is empty)
// and as the first part of the mock data in seed-dev.ts.
export const starterProducts: Prisma.ProductCreateManyInput[] = [
  { name: "Snake Plant", category: "Indoor", price: 349, light: "Low light", water: "Water every 2 weeks", tag: "Beginner friendly", stock: 24, petSafe: false, description: "Tall, stiff leaves that cope with low light and forgetful watering. One of the toughest plants you can buy." },
  { name: "Money Plant", category: "Indoor", price: 199, light: "Indirect light", water: "Water weekly", tag: "Best seller", stock: 40, petSafe: false, description: "A fast-growing trailing pothos with heart-shaped leaves. Lovely on a shelf or climbing a moss stick." },
  { name: "Peace Lily", category: "Flowering", price: 449, light: "Low light", water: "Keep soil moist", tag: "Flowering", stock: 6, petSafe: false, description: "Glossy dark leaves and white flowers. It droops when thirsty and perks up again after a drink." },
  { name: "Aloe Vera", category: "Succulents", price: 249, light: "Bright light", water: "Water rarely", tag: "Low water", stock: 18, petSafe: false, description: "A sunny-window succulent with soothing gel inside its thick leaves. Let the soil dry out fully between waterings." },
  { name: "Hibiscus", category: "Outdoor", price: 299, light: "Full sun", water: "Water daily", tag: "Outdoor", stock: 0, petSafe: true, description: "Big, bright flowers all summer long. Needs lots of sun and regular watering on a balcony or in the garden." },
  { name: "Jade Plant", category: "Succulents", price: 279, light: "Bright light", water: "Water rarely", tag: "Lucky plant", stock: 12, petSafe: false, description: "A small tree-like succulent with round, fleshy leaves. Said to bring good luck to the home." },
  { name: "Areca Palm", category: "Indoor", price: 649, light: "Indirect light", water: "Water twice a week", tag: "Air purifier", stock: 8, petSafe: true, description: "Soft, feathery fronds that make any room feel tropical. Safe around cats and dogs." },
  { name: "Tulsi", category: "Outdoor", price: 149, light: "Full sun", water: "Water daily", tag: "Outdoor", stock: 30, petSafe: true, description: "Holy basil with fragrant leaves, perfect for a sunny balcony. Pinch the tips to keep it bushy." },
  { name: "Terracotta Pot", category: "Pots & Planters", price: 179, light: "Indirect light", water: "No watering needed", tag: "Handmade", stock: 32, petSafe: true, description: "An 8-inch handmade clay pot with a drainage hole. Clay breathes, so roots stay healthy." },
];
