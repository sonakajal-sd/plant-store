// MOCK DATA seed — for DEVELOPMENT ONLY.
// ⚠️ It DELETES everything in the database and fills it with test data.
// Run with:  npm run seed:dev
import "dotenv/config";
import bcrypt from "bcryptjs";
import { prisma } from "../src/lib/prisma";
import type { Prisma } from "../src/generated/prisma/client";
import { sizeExtraPrice, getOrderTotals, calculateDiscount } from "../src/utils/pricing";
import type { SizeName } from "../src/utils/pricing";
import { starterProducts } from "./starterProducts";

// ---------- Safety checks (before touching anything) ----------

function checkItIsSafeToWipe() {
  if (process.env.NODE_ENV === "production") {
    throw new Error("seed-dev wipes the database, so it never runs when NODE_ENV is production.");
  }

  // Extra safety: only wipe a database on THIS computer, never a live one
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set.");
  const host = new URL(url).hostname;
  if (host !== "localhost" && host !== "127.0.0.1") {
    throw new Error(`seed-dev only runs on a local database, but DATABASE_URL points to "${host}".`);
  }

  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword || adminPassword.length < 8) {
    throw new Error("Set ADMIN_PASSWORD in server/.env (at least 8 characters) before seeding.");
  }
  return adminPassword;
}

// ---------- Products: 9 starter products + 25 more ----------

const moreProducts: Prisma.ProductCreateManyInput[] = [
  // Indoor
  { name: "Monstera Deliciosa", category: "Indoor", price: 899, light: "Indirect light", water: "Water weekly", tag: "Statement plant", stock: 2, petSafe: false, description: "The famous split-leaf plant. Grows big and bold, so give it a corner with bright, indirect light." },
  { name: "Fiddle Leaf Fig", category: "Indoor", price: 1299, light: "Bright light", water: "Water weekly", tag: "Designer favourite", stock: 0, petSafe: false, description: "Large, violin-shaped leaves on a tall stem. Loves a bright spot and hates being moved around." },
  { name: "ZZ Plant", category: "Indoor", price: 499, light: "Low light", water: "Water every 2–3 weeks", tag: "Hard to kill", stock: 20, petSafe: false, description: "Shiny, waxy leaves that stay green even in dim offices. Stores water in its roots, so water rarely." },
  { name: "Spider Plant", category: "Indoor", price: 229, light: "Indirect light", water: "Water weekly", tag: "Pet friendly", stock: 35, petSafe: true, description: "Arching striped leaves and little baby plants you can pot up and share. Safe for cats and dogs." },
  { name: "Rubber Plant", category: "Indoor", price: 549, light: "Indirect light", water: "Water weekly", tag: "Air purifier", stock: 14, petSafe: false, description: "Thick, glossy burgundy leaves. Wipe them with a damp cloth now and then to keep them shining." },
  { name: "Calathea Orbifolia", category: "Indoor", price: 599, light: "Indirect light", water: "Keep soil moist", tag: "Pet friendly", stock: 9, petSafe: true, description: "Huge round leaves with silver stripes. Likes humidity — a bathroom with a window is perfect." },
  { name: "Boston Fern", category: "Indoor", price: 349, light: "Indirect light", water: "Keep soil moist", tag: "Pet friendly", stock: 11, petSafe: true, description: "Soft, lacy fronds that look great in a hanging basket. Mist it often in dry weather." },
  { name: "Bonsai Ficus", category: "Indoor", price: 1999, light: "Bright light", water: "Water every 2 days", tag: "Premium", stock: 3, petSafe: false, description: "A 6-year-old ficus bonsai in a ceramic tray. A calm, living sculpture for your desk." },
  // Outdoor
  { name: "Bougainvillea", category: "Outdoor", price: 399, light: "Full sun", water: "Water twice a week", tag: "Colourful", stock: 0, petSafe: false, description: "Papery pink flowers that cover walls and gates. The more sun it gets, the more it flowers." },
  { name: "Curry Leaf Plant", category: "Outdoor", price: 199, light: "Full sun", water: "Water every 2 days", tag: "Kitchen garden", stock: 25, petSafe: true, description: "Fresh kadi patta for your tadka, straight from the balcony. Pick leaves often to keep it bushy." },
  { name: "Jasmine (Mogra)", category: "Outdoor", price: 279, light: "Full sun", water: "Water daily", tag: "Fragrant", stock: 16, petSafe: true, description: "Small white flowers with a sweet evening scent. Flowers best in hot, sunny summers." },
  { name: "Desi Rose", category: "Outdoor", price: 249, light: "Full sun", water: "Water daily", tag: "Fragrant", stock: 22, petSafe: true, description: "A hardy Indian rose with deep pink, scented blooms. Needs at least 6 hours of sun." },
  { name: "Bird of Paradise", category: "Outdoor", price: 1499, light: "Full sun", water: "Water twice a week", tag: "Premium", stock: 1, petSafe: false, description: "Large paddle leaves and orange flowers shaped like a bird's head. A real showpiece." },
  // Succulents
  { name: "Mini Cactus", category: "Succulents", price: 99, light: "Full sun", water: "Water every 3 weeks", tag: "Gift idea", stock: 50, petSafe: false, description: "A tiny round cactus in a 3-inch pot. Perfect for a sunny windowsill or a small gift." },
  { name: "Echeveria", category: "Succulents", price: 179, light: "Bright light", water: "Water rarely", tag: "Low water", stock: 28, petSafe: true, description: "A rosette of blue-green leaves shaped like a flower. Water only when the soil is completely dry." },
  { name: "Haworthia Zebra", category: "Succulents", price: 199, light: "Bright light", water: "Water rarely", tag: "Low water", stock: 15, petSafe: true, description: "Small, spiky leaves with white zebra stripes. Happy on a desk with some bright light." },
  { name: "Christmas Cactus", category: "Succulents", price: 329, light: "Indirect light", water: "Water weekly", tag: "Seasonal", stock: 5, petSafe: true, isActive: false, description: "Pink flowers in winter. Archived: only sold in the festive season." },
  // Flowering
  { name: "Orchid (Phalaenopsis)", category: "Flowering", price: 1199, light: "Indirect light", water: "Water weekly", tag: "Premium", stock: 0, petSafe: true, description: "Elegant flowers that can last for months. Water by soaking the bark, then let it drain." },
  { name: "Anthurium", category: "Flowering", price: 749, light: "Indirect light", water: "Water twice a week", tag: "Long-lasting flowers", stock: 7, petSafe: false, description: "Shiny red heart-shaped flowers almost all year round. Keep it away from cold draughts." },
  { name: "Kalanchoe", category: "Flowering", price: 229, light: "Bright light", water: "Water rarely", tag: "Low water", stock: 19, petSafe: false, description: "A succulent that bursts into clusters of tiny orange flowers. Easy care for beginners." },
  { name: "African Violet", category: "Flowering", price: 299, light: "Indirect light", water: "Keep soil moist", tag: "Compact", stock: 12, petSafe: true, description: "Velvety leaves and purple flowers on a small plant. Water from below to keep the leaves dry." },
  // Pots & Planters
  { name: "Hand-painted Ceramic Planter", category: "Pots & Planters", price: 899, light: "Indirect light", water: "No watering needed", tag: "Handmade", stock: 2, petSafe: true, description: "A 7-inch ceramic pot painted by hand in Jaipur blue. Each one is slightly different." },
  { name: "Hanging Macrame Planter", category: "Pots & Planters", price: 349, light: "Indirect light", water: "No watering needed", tag: "Handmade", stock: 15, petSafe: true, description: "A cotton macrame hanger for pots up to 6 inches. Great for ferns and trailing plants." },
  { name: "Self-watering Pot", category: "Pots & Planters", price: 449, light: "Indirect light", water: "No watering needed", tag: "Smart pot", stock: 21, petSafe: true, description: "A water tank at the bottom keeps the soil moist for up to 10 days. Ideal for holidays." },
  { name: "Old Plastic Pot", category: "Pots & Planters", price: 99, light: "Indirect light", water: "No watering needed", tag: "Discontinued", stock: 10, petSafe: true, isActive: false, description: "Archived: replaced by our clay and ceramic range." },
];

// ---------- Customers (development only!) ----------

const CUSTOMER_PASSWORD = "Test@1234";

type Address = { phone: string; address: string; city: string; state: string; pincode: string };

const customers: { name: string; email: string; home: Address }[] = [
  { name: "Asha Rao", email: "asha@test.com", home: { phone: "9000000001", address: "14, 2nd Cross, Koramangala 4th Block", city: "Bengaluru", state: "Karnataka", pincode: "560034" } },
  { name: "Ravi Kumar", email: "ravi@test.com", home: { phone: "9000000002", address: "7, Thirumalai Road, T. Nagar", city: "Chennai", state: "Tamil Nadu", pincode: "600017" } },
  { name: "Priya Sharma", email: "priya@test.com", home: { phone: "9000000003", address: "B-302, Green Park, Baner Road", city: "Pune", state: "Maharashtra", pincode: "411045" } },
  { name: "Karthik Reddy", email: "karthik@test.com", home: { phone: "9000000004", address: "Flat 12, Cyber Towers Lane, Madhapur", city: "Hyderabad", state: "Telangana", pincode: "500081" } },
  { name: "Meena Nair", email: "meena@test.com", home: { phone: "9000000005", address: "Rose Villa, Panampilly Nagar", city: "Kochi", state: "Kerala", pincode: "682036" } },
];

// ---------- Coupons ----------

const DAY = 24 * 60 * 60 * 1000;

function daysAgo(days: number): Date {
  return new Date(Date.now() - days * DAY);
}

const coupons: Prisma.CouponCreateManyInput[] = [
  { code: "WELCOME10", type: "PERCENT", value: 10, minOrder: 499, maxDiscount: 200, perUserLimit: 1 },
  { code: "FLAT100", type: "FLAT", value: 100, minOrder: 999 },
  { code: "PLANT50", type: "FLAT", value: 50, minOrder: 0, usageLimit: 3 },
  { code: "EXPIRED20", type: "PERCENT", value: 20, minOrder: 0, expiresAt: daysAgo(1) },
  { code: "OLDCODE", type: "FLAT", value: 75, minOrder: 0, isActive: false },
];

// ---------- Orders ----------
// Each order lists: who, how many days ago, status, coupon, and [product name, size, quantity]

type OrderPlan = {
  email: string;
  daysAgo: number;
  status: "Placed" | "Shipped" | "Delivered" | "Cancelled";
  coupon?: string;
  items: [string, SizeName, number][];
};

const orderPlans: OrderPlan[] = [
  // Delivered (these customers are allowed to review these products)
  { email: "asha@test.com", daysAgo: 58, status: "Delivered", coupon: "WELCOME10", items: [["Snake Plant", "Small", 1], ["Money Plant", "Medium", 2], ["Peace Lily", "Small", 1]] },
  { email: "asha@test.com", daysAgo: 40, status: "Delivered", items: [["Aloe Vera", "Small", 1], ["Areca Palm", "Large", 1], ["Rubber Plant", "Small", 1]] },
  { email: "ravi@test.com", daysAgo: 55, status: "Delivered", coupon: "FLAT100", items: [["Snake Plant", "Medium", 1], ["Money Plant", "Small", 1], ["ZZ Plant", "Small", 1], ["Christmas Cactus", "Small", 1]] },
  { email: "ravi@test.com", daysAgo: 45, status: "Delivered", items: [["Spider Plant", "Small", 1], ["Calathea Orbifolia", "Small", 1]] },
  { email: "priya@test.com", daysAgo: 50, status: "Delivered", items: [["Snake Plant", "Small", 1], ["Peace Lily", "Medium", 1], ["Aloe Vera", "Small", 2], ["Jade Plant", "Small", 1]] },
  { email: "karthik@test.com", daysAgo: 52, status: "Delivered", coupon: "WELCOME10", items: [["Money Plant", "Small", 1], ["Areca Palm", "Small", 1], ["ZZ Plant", "Medium", 1], ["Tulsi", "Small", 3]] },
  { email: "meena@test.com", daysAgo: 48, status: "Delivered", items: [["Snake Plant", "Large", 1], ["Peace Lily", "Small", 1], ["Spider Plant", "Medium", 1], ["Calathea Orbifolia", "Small", 1]] },
  { email: "meena@test.com", daysAgo: 38, status: "Delivered", coupon: "PLANT50", items: [["Jade Plant", "Small", 1], ["Tulsi", "Small", 2]] },
  // Shipped
  { email: "asha@test.com", daysAgo: 6, status: "Shipped", items: [["Monstera Deliciosa", "Small", 1]] },
  { email: "priya@test.com", daysAgo: 9, status: "Shipped", coupon: "PLANT50", items: [["Echeveria", "Small", 2], ["Haworthia Zebra", "Small", 1]] },
  { email: "karthik@test.com", daysAgo: 12, status: "Shipped", coupon: "FLAT100", items: [["Anthurium", "Medium", 1], ["Self-watering Pot", "Small", 1]] },
  { email: "meena@test.com", daysAgo: 15, status: "Shipped", items: [["Jasmine (Mogra)", "Small", 2], ["Desi Rose", "Small", 2]] },
  // Placed (newest)
  { email: "asha@test.com", daysAgo: 1, status: "Placed", items: [["ZZ Plant", "Small", 1], ["Hanging Macrame Planter", "Small", 1]] },
  { email: "ravi@test.com", daysAgo: 2, status: "Placed", coupon: "WELCOME10", items: [["Bonsai Ficus", "Small", 1]] },
  { email: "karthik@test.com", daysAgo: 3, status: "Placed", items: [["Mini Cactus", "Small", 3]] },
  { email: "meena@test.com", daysAgo: 4, status: "Placed", items: [["Areca Palm", "Medium", 1], ["Hand-painted Ceramic Planter", "Small", 1]] },
  // Cancelled
  { email: "ravi@test.com", daysAgo: 20, status: "Cancelled", items: [["Fiddle Leaf Fig", "Small", 1]] },
  { email: "priya@test.com", daysAgo: 25, status: "Cancelled", items: [["Kalanchoe", "Small", 2]] },
  { email: "karthik@test.com", daysAgo: 28, status: "Cancelled", items: [["Orchid (Phalaenopsis)", "Large", 1]] },
  { email: "meena@test.com", daysAgo: 30, status: "Cancelled", items: [["Curry Leaf Plant", "Small", 1], ["Bougainvillea", "Small", 1]] },
];

// ---------- Reviews and wishlists ----------

// Only these products get reviews (from customers with a Delivered order containing them).
// "Rubber Plant" is left out on purpose: Asha can test writing the FIRST review.
const reviewedProducts = [
  "Snake Plant", "Money Plant", "Peace Lily", "Aloe Vera", "Areca Palm",
  "ZZ Plant", "Spider Plant", "Jade Plant", "Tulsi", "Calathea Orbifolia",
];

const reviewTexts: [number, string][] = [
  [5, "Arrived healthy and well packed. Already putting out a new leaf!"],
  [4, "Lovely plant, slightly smaller than I expected but growing well."],
  [5, "Exactly like the photos. The care tips were really helpful."],
  [3, "A couple of leaves were damaged in delivery, but it recovered in a week."],
  [4, "Good value for money. Would buy from Leaf & Clay again."],
];

const wishlists: Record<string, string[]> = {
  "asha@test.com": ["Monstera Deliciosa", "Orchid (Phalaenopsis)", "Bonsai Ficus"],
  "ravi@test.com": ["Fiddle Leaf Fig", "Bird of Paradise"],
  "priya@test.com": ["Calathea Orbifolia", "Anthurium", "Hand-painted Ceramic Planter", "Hibiscus"],
  "karthik@test.com": ["Boston Fern", "Jasmine (Mogra)"],
  "meena@test.com": ["Bougainvillea", "African Violet", "Echeveria"],
};

// ---------- The seed ----------

async function wipeDatabase() {
  // Children first, parents last (an order item needs its order and product to exist)
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.review.deleteMany();
  await prisma.wishlistItem.deleteMany();
  await prisma.passwordResetToken.deleteMany();
  await prisma.coupon.deleteMany();
  await prisma.product.deleteMany();
  await prisma.user.deleteMany();

  // Start the id counters from 1 again, so product ids are the same after every run
  const tables = ["OrderItem", "Order", "Review", "WishlistItem", "PasswordResetToken", "Coupon", "Product", "User"];
  for (const table of tables) {
    await prisma.$executeRawUnsafe(`ALTER SEQUENCE "${table}_id_seq" RESTART WITH 1`);
  }
}

async function main() {
  const adminPassword = checkItIsSafeToWipe();

  console.log("Wiping the development database…");
  await wipeDatabase();

  // Products
  await prisma.product.createMany({ data: [...starterProducts, ...moreProducts] });
  const products = await prisma.product.findMany();
  const productByName = new Map(products.map((p) => [p.name, p]));

  // Users (hash each password once — hashing is slow on purpose)
  const adminHash = await bcrypt.hash(adminPassword, 10);
  const customerHash = await bcrypt.hash(CUSTOMER_PASSWORD, 10);
  await prisma.user.create({
    data: { name: "Store Admin", email: "admin@leafandclay.com", password: adminHash, role: "ADMIN" },
  });
  const userByEmail = new Map<string, { id: number; name: string }>();
  for (const c of customers) {
    const user = await prisma.user.create({ data: { name: c.name, email: c.email, password: customerHash } });
    userByEmail.set(c.email, user);
  }

  // Coupons
  await prisma.coupon.createMany({ data: coupons });
  const couponByCode = new Map(coupons.map((c) => [c.code, c]));
  const couponUses: Record<string, number> = {};

  // Orders, priced with the SAME rules as the server
  const deliveredPairs = new Map<string, Date>(); // "userId-productId" → delivery date
  let ordersCreated = 0;

  for (const plan of orderPlans) {
    const user = userByEmail.get(plan.email)!;
    const customer = customers.find((c) => c.email === plan.email)!;

    let subtotal = 0;
    const items = plan.items.map(([name, size, quantity]) => {
      const product = productByName.get(name);
      if (!product) throw new Error(`Order plan uses an unknown product: ${name}`);
      const price = product.price + sizeExtraPrice[size];
      subtotal += price * quantity;
      return { productId: product.id, size: size, quantity: quantity, price: price };
    });

    let discount = 0;
    if (plan.coupon) {
      const coupon = couponByCode.get(plan.coupon)!;
      if (subtotal < (coupon.minOrder ?? 0)) {
        throw new Error(`Order for ${plan.email} is below the minimum for ${plan.coupon}`);
      }
      discount = calculateDiscount(
        { type: coupon.type, value: coupon.value, maxDiscount: coupon.maxDiscount ?? null },
        subtotal
      );
      // Cancelled orders don't count as a use of the coupon
      if (plan.status !== "Cancelled") {
        couponUses[plan.coupon] = (couponUses[plan.coupon] ?? 0) + 1;
      }
    }

    // Delivery is based on the subtotal AFTER the discount (same helper as the server)
    const { deliveryFee, total } = getOrderTotals(subtotal, discount);
    const createdAt = daysAgo(plan.daysAgo);

    await prisma.order.create({
      data: {
        userId: user.id,
        customerName: customer.name,
        ...customer.home,
        subtotal: subtotal,
        discount: discount,
        deliveryFee: deliveryFee,
        total: total,
        couponCode: plan.coupon ?? null,
        status: plan.status,
        paymentMethod: "COD",
        // Cash on delivery: paid once it's delivered
        paymentStatus: plan.status === "Delivered" ? "PAID" : "PENDING",
        createdAt: createdAt,
        items: { create: items },
      },
    });
    ordersCreated++;

    if (plan.status === "Delivered") {
      for (const item of items) {
        deliveredPairs.set(`${user.id}-${item.productId}`, createdAt);
      }
    }
  }

  // How many times each coupon has been used
  for (const [code, uses] of Object.entries(couponUses)) {
    const coupon = couponByCode.get(code)!;
    if (coupon.usageLimit && uses > coupon.usageLimit) {
      throw new Error(`${code} is used more times than its usage limit`);
    }
    await prisma.coupon.update({ where: { code: code }, data: { usedCount: uses } });
  }

  // Reviews: ONLY from customers who have a Delivered order with that product
  let reviewsCreated = 0;
  for (const name of reviewedProducts) {
    const product = productByName.get(name)!;
    let reviewNumber = 0;
    for (const c of customers) {
      const user = userByEmail.get(c.email)!;
      const deliveredOn = deliveredPairs.get(`${user.id}-${product.id}`);
      if (!deliveredOn) continue; // never received it → can't review it

      const [rating, comment] = reviewTexts[(product.id + reviewNumber) % reviewTexts.length];
      await prisma.review.create({
        data: {
          userId: user.id,
          productId: product.id,
          rating: rating,
          comment: comment,
          createdAt: new Date(deliveredOn.getTime() + 5 * DAY), // a few days after delivery
        },
      });
      reviewNumber++;
      reviewsCreated++;
    }
    if (reviewNumber < 2) throw new Error(`${name} should get at least 2 reviews`);
  }

  // Wishlists
  let wishlistCreated = 0;
  for (const [email, names] of Object.entries(wishlists)) {
    const user = userByEmail.get(email)!;
    for (const name of names) {
      await prisma.wishlistItem.create({ data: { userId: user.id, productId: productByName.get(name)!.id } });
      wishlistCreated++;
    }
  }

  // ---------- Summary ----------
  const soldOut = products.filter((p) => p.stock === 0).length;
  const lowStock = products.filter((p) => p.stock >= 1 && p.stock <= 3).length;
  const archived = products.filter((p) => !p.isActive).length;

  console.log("\n🌿 Development data ready\n");
  console.table({
    Products: products.length,
    "  sold out (stock 0)": soldOut,
    "  low stock (1–3)": lowStock,
    "  archived (inactive)": archived,
    Customers: customers.length,
    Orders: ordersCreated,
    Coupons: coupons.length,
    Reviews: reviewsCreated,
    "Wishlist items": wishlistCreated,
  });
  console.log("Test logins:");
  console.log("  admin@leafandclay.com  (password = ADMIN_PASSWORD from server/.env)");
  for (const c of customers) {
    console.log(`  ${c.email.padEnd(22)} password: ${CUSTOMER_PASSWORD}`);
  }
  console.log("\nCoupons: " + coupons.map((c) => c.code).join(", "));
  console.log("See TESTING.md for what each test case is for.");
}

main()
  .catch((error) => {
    console.error("❌ " + (error as Error).message);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
