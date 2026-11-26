import { Router } from "express";
import { prisma } from "../lib/prisma";

const router = Router();

// The data the admin sends to create or update a product
type ProductInput = {
  name: string;
  category: string;
  price: number;
  stock: number;
  care?: string;
  tag?: string;
};

// Checks the data. Returns an error message, or null if everything is OK
function validateProduct(body: Partial<ProductInput>): string | null {
  if (!body.name || body.name.trim() === "") return "Name is required";
  if (!body.category || body.category.trim() === "") return "Category is required";
  if (typeof body.price !== "number" || body.price <= 0) return "Price must be a number above 0";
  if (typeof body.stock !== "number" || body.stock < 0) return "Stock must be 0 or more";
  return null;
}

// GET /api/products  or  /api/products?category=Indoor
router.get("/", async (req, res) => {
  const category = req.query.category;

  const products = await prisma.product.findMany({
    where: typeof category === "string" ? { category: category } : {},
    orderBy: { id: "asc" },
  });

  res.json(products);
});

// GET /api/products/3
router.get("/:id", async (req, res) => {
  const id = Number(req.params.id);

  if (Number.isNaN(id)) {
    res.status(400).json({ error: "Invalid product id" });
    return;
  }

  const product = await prisma.product.findUnique({ where: { id: id } });

  if (!product) {
    res.status(404).json({ error: "Product not found" });
    return;
  }

  res.json(product);
});

// POST /api/products  (add a new product)
router.post("/", async (req, res) => {
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
      care: body.care?.trim() || "Bright light · Water weekly",
      tag: body.tag?.trim() || "New",
    },
  });

  res.status(201).json(product); // 201 = "Created"
});

// PUT /api/products/3  (update a product)
router.put("/:id", async (req, res) => {
  const id = Number(req.params.id);

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
      care: body.care ?? existing.care,
      tag: body.tag ?? existing.tag,
    },
  });

  res.json(product);
});

// DELETE /api/products/3
router.delete("/:id", async (req, res) => {
  const id = Number(req.params.id);

  const existing = await prisma.product.findUnique({ where: { id: id } });
  if (!existing) {
    res.status(404).json({ error: "Product not found" });
    return;
  }

  // A product that is inside old orders can't be deleted
  // (those orders still need to know what was bought)
  const usedInOrders = await prisma.orderItem.count({ where: { productId: id } });
  if (usedInOrders > 0) {
    res.status(409).json({
      error: "This product is in past orders. Set its stock to 0 instead of deleting it.",
    });
    return;
  }

  await prisma.product.delete({ where: { id: id } });
  res.json({ message: "Product deleted" });
});

export default router;