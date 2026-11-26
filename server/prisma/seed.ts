import "dotenv/config";
import bcrypt from "bcryptjs";
import { prisma } from "../src/lib/prisma";

const products = [
  { name: "Snake Plant", category: "Indoor", price: 349, care: "Low light · Water every 2 weeks", tag: "Beginner friendly", stock: 24 },
  { name: "Money Plant", category: "Indoor", price: 199, care: "Indirect light · Water weekly", tag: "Best seller", stock: 40 },
  { name: "Peace Lily", category: "Flowering", price: 449, care: "Shade · Keep soil moist", tag: "Flowering", stock: 6 },
  { name: "Aloe Vera", category: "Succulents", price: 249, care: "Bright light · Water rarely", tag: "Low water", stock: 18 },
  { name: "Hibiscus", category: "Outdoor", price: 299, care: "Full sun · Water daily", tag: "Outdoor", stock: 0 },
  { name: "Jade Plant", category: "Succulents", price: 279, care: "Bright light · Water rarely", tag: "Lucky plant", stock: 12 },
  { name: "Areca Palm", category: "Indoor", price: 649, care: "Indirect light · Water twice a week", tag: "Air purifier", stock: 8 },
  { name: "Tulsi", category: "Outdoor", price: 149, care: "Full sun · Water daily", tag: "Outdoor", stock: 30 },
  { name: "Terracotta Pot", category: "Pots & Planters", price: 179, care: "8 inch · Handmade clay", tag: "Handmade", stock: 32 },
];

async function main() {
  // Start clean: delete old products, then add the list again
  await prisma.product.deleteMany();
  await prisma.product.createMany({ data: products });
    console.log(`Seeded ${products.length} products 🌱`);

  // Create the admin user (or update it if it already exists)
  const adminPassword = process.env.ADMIN_PASSWORD ?? "admin1234";
  const hashedPassword = await bcrypt.hash(adminPassword, 10);

  await prisma.user.upsert({
    where: { email: "admin@leafandclay.com" },
    update: { password: hashedPassword, role: "ADMIN" },
    create: {
      name: "Store Admin",
      email: "admin@leafandclay.com",
      password: hashedPassword,
      role: "ADMIN",
    },
  });
  console.log("Admin user ready 🔐");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });