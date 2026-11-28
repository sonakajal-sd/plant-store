import { Router } from "express";
import type { Response } from "express";
import { prisma } from "../lib/prisma";
import { requireAuth, requireAdmin, optionalAuth } from "../middleware/auth";
import { LIGHT_OPTIONS } from "../utils/pricing";
import { readPage } from "../utils/pagination";
import { uploadImage } from "../middleware/upload";
import { detectImageType, saveProductImage, deleteProductImage } from "../utils/files";
import type { Prisma } from "../generated/prisma/client";

const router = Router();

// The data the admin sends to create or update a product
type ProductInput = {
  name: string;
  category: string;
  price: number;
  stock: number;
  light: string;
  water: string;
  description?: string;
  tag?: string;
  petSafe?: boolean;
  isActive?: boolean;
};

// Sensible upper limits, so a typo (an extra 0) can't create silly data
const MAX_PRICE = 1_000_000;
const MAX_STOCK = 100_000;

// true only for real text that isn't just spaces
function isFilled(value: unknown): value is string {
  return typeof value === "string" && value.trim() !== "";
}

// Checks the data. Returns an error message, or null if everything is OK
function validateProduct(body: Partial<ProductInput> | undefined): string | null {
  if (!body) return "Product details are missing";
  if (!isFilled(body.name)) return "Name is required";
  if (!isFilled(body.category)) return "Category is required";
  if (!Number.isInteger(body.price) || (body.price as number) < 1 || (body.price as number) > MAX_PRICE) {
    return "Price must be a whole number from 1 to 10,00,000";
  }
  if (!Number.isInteger(body.stock) || (body.stock as number) < 0 || (body.stock as number) > MAX_STOCK) {
    return "Stock must be a whole number from 0 to 1,00,000";
  }
  if (typeof body.light !== "string" || !LIGHT_OPTIONS.includes(body.light)) {
    return "Light must be one of: " + LIGHT_OPTIONS.join(", ");
  }
  if (!isFilled(body.water)) return "Watering is required (e.g. Water weekly)";

  // These are optional, but if they are sent they must be the right type
  if (body.description !== undefined && typeof body.description !== "string") {
    return "Description must be text";
  }
  if (body.tag !== undefined && typeof body.tag !== "string") return "Tag must be text";
  if (body.petSafe !== undefined && typeof body.petSafe !== "boolean") {
    return "Pet safe must be true or false";
  }
  if (body.isActive !== undefined && typeof body.isActive !== "boolean") {
    return "Active must be true or false";
  }
  return null;
}

// Is the person asking the admin? (needs optionalAuth or requireAuth first)
function isAdminRequest(res: Response): boolean {
  return res.locals.user?.role === "ADMIN";
}

const SORTS = ["popular", "newest", "price-asc", "price-desc"];

// How each sort option orders the products (id last, so the order is always the same)
const SORT_ORDER: Record<string, Prisma.ProductOrderByWithRelationInput[]> = {
  popular: [{ orderItems: { _count: "desc" } }, { id: "asc" }], // most often ordered first
  newest: [{ createdAt: "desc" }, { id: "desc" }],
  "price-asc": [{ price: "asc" }, { id: "asc" }],
  "price-desc": [{ price: "desc" }, { id: "asc" }],
};

// Adds the star rating to each product: ratingAverage (e.g. 4.3, or null) and ratingCount
async function withRatings<T extends { id: number }>(products: T[]) {
  const groups = await prisma.review.groupBy({
    by: ["productId"],
    where: { productId: { in: products.map((p) => p.id) } },
    _avg: { rating: true },
    _count: { rating: true },
  });
  const byProduct = new Map(groups.map((g) => [g.productId, g]));

  return products.map((p) => {
    const group = byProduct.get(p.id);
    const average = group?._avg.rating ?? null;
    return {
      ...p,
      ratingAverage: average === null ? null : Math.round(average * 10) / 10, // one decimal
      ratingCount: group?._count.rating ?? 0,
    };
  });
}

// Reads a price filter from the URL. undefined = not given, null = not a valid number.
function readPrice(value: unknown): number | null | undefined {
  if (value === undefined || value === "") return undefined;
  const price = Number(value);
  return Number.isInteger(price) && price >= 0 ? price : null;
}

// GET /api/products — every filter is optional:
//   ?search=fern              name, category or description contains "fern"
//   ?category=Indoor
//   ?minPrice=200&maxPrice=800
//   ?light=Full sun
//   ?petSafe=true             only pet-safe plants
//   ?inStock=true             hide sold-out plants
//   ?sort=popular|newest|price-asc|price-desc
//   ?page=2&pageSize=12
//   ?ids=3,7,12               only these products (used to refresh the cart)
//   ?archived=true            ONLY archived products (admin only)
// Answer: { items, total, page, pageSize }
router.get("/", optionalAuth, async (req, res) => {
  const q = req.query;
  const where: Prisma.ProductWhereInput = {};

  // Customers only ever see active products
  where.isActive = !(q.archived === "true" && isAdminRequest(res));

  if (typeof q.search === "string" && q.search.trim() !== "") {
    const text = q.search.trim();
    where.OR = [
      { name: { contains: text, mode: "insensitive" } }, // "insensitive" = ignore upper/lower case
      { category: { contains: text, mode: "insensitive" } },
      { description: { contains: text, mode: "insensitive" } },
    ];
  }

  if (typeof q.category === "string" && q.category !== "") {
    where.category = q.category;
  }

  if (typeof q.light === "string" && q.light !== "") {
    if (!LIGHT_OPTIONS.includes(q.light)) {
      res.status(400).json({ error: "light must be one of: " + LIGHT_OPTIONS.join(", ") });
      return;
    }
    where.light = q.light;
  }

  if (q.petSafe === "true") where.petSafe = true;
  if (q.inStock === "true") where.stock = { gt: 0 };

  const minPrice = readPrice(q.minPrice);
  const maxPrice = readPrice(q.maxPrice);
  if (minPrice === null || maxPrice === null) {
    res.status(400).json({ error: "Prices must be whole numbers, 0 or more" });
    return;
  }
  if (minPrice !== undefined && maxPrice !== undefined && minPrice > maxPrice) {
    res.status(400).json({ error: "The minimum price can't be more than the maximum" });
    return;
  }
  if (minPrice !== undefined || maxPrice !== undefined) {
    where.price = { gte: minPrice, lte: maxPrice }; // undefined parts are ignored
  }

  if (typeof q.ids === "string" && q.ids !== "") {
    const idList = q.ids.split(",").map(Number);
    if (!idList.every(Number.isInteger)) {
      res.status(400).json({ error: "ids must be a list of numbers, e.g. 1,2,3" });
      return;
    }
    where.id = { in: idList };
  }

  const sort = typeof q.sort === "string" && q.sort !== "" ? q.sort : "popular";
  if (!SORTS.includes(sort)) {
    res.status(400).json({ error: "sort must be one of: " + SORTS.join(", ") });
    return;
  }

  const { page, pageSize, skip } = readPage(q, 12);

  // Ask for this page AND the total count at the same time
  const [products, total] = await Promise.all([
    prisma.product.findMany({ where: where, orderBy: SORT_ORDER[sort], skip: skip, take: pageSize }),
    prisma.product.count({ where: where }),
  ]);

  res.json({ items: await withRatings(products), total: total, page: page, pageSize: pageSize });
});

// GET /api/products/stats  (numbers for the admin's top cards)
// (Must come BEFORE "/:id", otherwise "stats" would be read as an id.)
router.get("/stats", requireAuth, requireAdmin, async (_req, res) => {
  const [active, outOfStock, archived] = await Promise.all([
    prisma.product.count({ where: { isActive: true } }),
    prisma.product.count({ where: { isActive: true, stock: 0 } }),
    prisma.product.count({ where: { isActive: false } }),
  ]);
  res.json({ active, outOfStock, archived });
});

// GET /api/products/3
router.get("/:id", optionalAuth, async (req, res) => {
  const id = Number(req.params.id);

  if (!Number.isInteger(id)) {
    res.status(400).json({ error: "Invalid product id" });
    return;
  }

  const product = await prisma.product.findUnique({ where: { id: id } });

  // An archived product is "not found" for customers (the admin can still open it)
  if (!product || (!product.isActive && !isAdminRequest(res))) {
    res.status(404).json({ error: "Product not found" });
    return;
  }

  const [withRating] = await withRatings([product]);
  res.json(withRating);
});

// POST /api/products  (add a new product)
router.post("/", requireAuth, requireAdmin, async (req, res) => {
  const error = validateProduct(req.body);
  if (error) {
    res.status(400).json({ error: error });
    return;
  }

  const body: ProductInput = req.body;

  const product = await prisma.product.create({
    data: {
      name: body.name.trim(),
      category: body.category,
      price: body.price,
      stock: body.stock,
      light: body.light,
      water: body.water.trim(),
      description: body.description?.trim() ?? "",
      tag: body.tag?.trim() || "New",
      petSafe: body.petSafe ?? false,
      isActive: body.isActive ?? true,
    },
  });

  res.status(201).json(product); // 201 = "Created"
});

// PUT /api/products/3  (update a product)
router.put("/:id", requireAuth, requireAdmin, async (req, res) => {
  const id = Number(req.params.id);

  if (!Number.isInteger(id)) {
    res.status(400).json({ error: "Invalid product id" });
    return;
  }

  const existing = await prisma.product.findUnique({ where: { id: id } });
  if (!existing) {
    res.status(404).json({ error: "Product not found" });
    return;
  }

  const error = validateProduct(req.body);
  if (error) {
    res.status(400).json({ error: error });
    return;
  }

  const body: ProductInput = req.body;

  const product = await prisma.product.update({
    where: { id: id },
    data: {
      name: body.name.trim(),
      category: body.category,
      price: body.price,
      stock: body.stock,
      light: body.light,
      water: body.water.trim(),
      // Optional fields: keep the old value if they weren't sent
      description: body.description?.trim() ?? existing.description,
      tag: body.tag?.trim() || existing.tag,
      petSafe: body.petSafe ?? existing.petSafe,
      isActive: body.isActive ?? existing.isActive,
    },
  });

  res.json(product);
});

// DELETE /api/products/3
router.delete("/:id", requireAuth, requireAdmin, async (req, res) => {
  const id = Number(req.params.id);

  if (!Number.isInteger(id)) {
    res.status(400).json({ error: "Invalid product id" });
    return;
  }

  const existing = await prisma.product.findUnique({ where: { id: id } });
  if (!existing) {
    res.status(404).json({ error: "Product not found" });
    return;
  }

  // A product that is inside old orders can't be deleted
  // (those orders still need to know what was bought), so we ARCHIVE it instead
  const usedInOrders = await prisma.orderItem.count({ where: { productId: id } });
  if (usedInOrders > 0) {
    const product = await prisma.product.update({
      where: { id: id },
      data: { isActive: false },
    });
    res.json({
      archived: true,
      product: product,
      message: `${product.name} is in past orders, so it was archived instead of deleted. You can restore it from the Archived list.`,
    });
    return;
  }

  await prisma.product.delete({ where: { id: id } });
  // The product is gone for good, so its photo file can go too
  await deleteProductImage(existing.imageUrl);
  res.json({ archived: false, message: `${existing.name} was deleted.` });
});


// POST /api/products/3/image  (upload or REPLACE the photo — admin only)
// The browser sends multipart/form-data with the file in the field "image".
// Order matters: check the login FIRST, so strangers can't even send us files.
router.post("/:id/image", requireAuth, requireAdmin, uploadImage, async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    res.status(400).json({ error: "Invalid product id" });
    return;
  }

  // No file, or the browser said it isn't JPG/PNG/WEBP (multer skipped it)
  if (!req.file) {
    res.status(400).json({ error: "Please choose a JPG, PNG or WEBP photo" });
    return;
  }

  // Look at the file's FIRST BYTES to see what it really is
  const type = detectImageType(req.file.buffer);
  if (!type) {
    res.status(400).json({ error: "This file isn't a real JPG, PNG or WEBP photo" });
    return;
  }

  const existing = await prisma.product.findUnique({ where: { id: id } });
  if (!existing) {
    res.status(404).json({ error: "Product not found" });
    return;
  }

  // 1. Save the new photo file
  const newImageUrl = await saveProductImage(req.file.buffer, type.ext);

  // 2. Save its address in the database
  let product;
  try {
    product = await prisma.product.update({
      where: { id: id },
      data: { imageUrl: newImageUrl },
    });
  } catch (err) {
    // The database failed → delete the new file, so no "orphan" file is left behind
    await deleteProductImage(newImageUrl);
    throw err;
  }

  // 3. Only now delete the OLD photo (if there was one)
  await deleteProductImage(existing.imageUrl);

  res.json(product);
});

// DELETE /api/products/3/image  (remove the photo — admin only)
router.delete("/:id/image", requireAuth, requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    res.status(400).json({ error: "Invalid product id" });
    return;
  }

  const existing = await prisma.product.findUnique({ where: { id: id } });
  if (!existing) {
    res.status(404).json({ error: "Product not found" });
    return;
  }

  const product = await prisma.product.update({
    where: { id: id },
    data: { imageUrl: null }, // null = no photo → the website shows 🪴
  });
  await deleteProductImage(existing.imageUrl);

  res.json(product);
});

export default router;