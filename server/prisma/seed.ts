// SAFE seed — fine to run on the live database, any number of times.
// It never deletes anything:
//   1. creates (or updates) the admin user
//   2. adds the starter products ONLY if there are no products yet
// Run with:  npm run seed   (or  npx prisma db seed)
import "dotenv/config";
import bcrypt from "bcryptjs";
import { prisma } from "../src/lib/prisma";
import { starterProducts } from "./starterProducts";

const ADMIN_EMAIL = "admin@leafandclay.com";

async function main() {
  // 1. Admin user. The password must come from .env (never hard-code it).
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword || adminPassword.length < 8) {
    throw new Error("Set ADMIN_PASSWORD in server/.env (at least 8 characters) before seeding.");
  }
  const hashedPassword = await bcrypt.hash(adminPassword, 10);

  // upsert = update it if it exists, otherwise create it
  await prisma.user.upsert({
    where: { email: ADMIN_EMAIL },
    update: { password: hashedPassword, role: "ADMIN" },
    create: { name: "Store Admin", email: ADMIN_EMAIL, password: hashedPassword, role: "ADMIN" },
  });
  console.log(`Admin user ready: ${ADMIN_EMAIL} 🔐`);

  // 2. Starter products, only for an empty shop (so we never create duplicates)
  const productCount = await prisma.product.count();
  if (productCount === 0) {
    await prisma.product.createMany({ data: starterProducts });
    console.log(`Added ${starterProducts.length} starter products 🌱`);
  } else {
    console.log(`Shop already has ${productCount} products, so none were added.`);
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
