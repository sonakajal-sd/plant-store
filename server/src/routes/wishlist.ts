import { Router } from "express";
import { prisma } from "../lib/prisma";
import { requireAuth } from "../middleware/auth";

const router = Router();

// Every wishlist route needs a logged-in user
router.use(requireAuth);

// GET /api/wishlist  (my wishlist, newest first, with the products)
router.get("/", async (_req, res) => {
  const items = await prisma.wishlistItem.findMany({
    where: { userId: res.locals.user.userId },
    include: { product: true },
    orderBy: { createdAt: "desc" },
  });
  res.json(items);
});

// POST /api/wishlist  { productId }
router.post("/", async (req, res) => {
  const { productId } = req.body ?? {};
  if (!Number.isInteger(productId)) {
    res.status(400).json({ error: "Invalid product" });
    return;
  }

  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product || !product.isActive) {
    res.status(404).json({ error: "Product not found" });
    return;
  }

  // upsert: adding the same plant twice does nothing (no error)
  const userId: number = res.locals.user.userId;
  const item = await prisma.wishlistItem.upsert({
    where: { userId_productId: { userId: userId, productId: productId } },
    update: {},
    create: { userId: userId, productId: productId },
    include: { product: true },
  });
  res.status(201).json(item);
});

// DELETE /api/wishlist/3  (3 = the PRODUCT id)
router.delete("/:productId", async (req, res) => {
  const productId = Number(req.params.productId);
  if (!Number.isInteger(productId)) {
    res.status(400).json({ error: "Invalid product" });
    return;
  }

  // deleteMany doesn't fail when it's not there, so removing twice is fine
  await prisma.wishlistItem.deleteMany({
    where: { userId: res.locals.user.userId, productId: productId },
  });
  res.json({ message: "Removed from your wishlist" });
});

export default router;
