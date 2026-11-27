import { Router } from "express";
import type { Response } from "express";
import { prisma } from "../lib/prisma";
import { requireAuth, requireAdmin, optionalAuth } from "../middleware/auth";
import { LIGHT_OPTIONS } from "../utils/pricing";

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

// true only for real text that isn't just spaces
function isFilled(value: unknown): value is string {
  return typeof value === "string" && value.trim() !== "";
}

// Checks the data. Returns an error message, or null if everything is OK
function validateProduct(body: Partial<ProductInput> | undefined): string | null {
  if (!body) return "Product details are missing";
  if (!isFilled(body.name)) return "Name is required";
  if (!isFilled(body.category)) return "Category is required";
  if (!Number.isInteger(body.price) || (body.price as number) <= 0) {
    return "Price must be a whole number above 0";
  }
  if (!Number.isInteger(body.stock) || (body.stock as number) < 0) {
    return "Stock must be a whole number, 0 or more";
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

// GET /api/products
//   ?category=Indoor          → only that category
//   ?ids=3,7,12               → only these products (used to refresh the cart)
//   ?includeArchived=true     → also archived products (admin only)
router.get("/", optionalAuth, async (req, res) => {
  const { category, ids, includeArchived } = req.query;

  // Build the filter step by step
  const where: { category?: string; id?: { in: number[] }; isActive?: boolean } = {};

  if (typeof category === "string" && category !== "") {
    where.category = category;
  }

  if (typeof ids === "string" && ids !== "") {
    const idList = ids.split(",").map(Number);
    if (!idList.every(Number.isInteger)) {
      res.status(400).json({ error: "ids must be a list of numbers, e.g. 1,2,3" });
      return;
    }
    where.id = { in: idList };
  }

  // Everyone sees only active products, except the admin when they ask for archived ones too
  const showArchived = includeArchived === "true" && isAdminRequest(res);
  if (!showArchived) {
    where.isActive = true;
  }

  const products = await prisma.product.findMany({ where: where, orderBy: { id: "asc" } });
  res.json(products);
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

  res.json(product);
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
  res.json({ archived: false, message: `${existing.name} was deleted.` });
});

export default router;