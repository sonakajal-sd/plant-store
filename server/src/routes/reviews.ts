import { Router } from "express";
import { prisma } from "../lib/prisma";
import { optionalAuth, requireAuth } from "../middleware/auth";

// mergeParams: lets this router read ":id" from "/api/products/:id/reviews"
const router = Router({ mergeParams: true });

// Has this user received this product in a Delivered order?
async function hasReceived(userId: number, productId: number): Promise<boolean> {
  const count = await prisma.orderItem.count({
    where: { productId: productId, order: { userId: userId, status: "Delivered" } },
  });
  return count > 0;
}

// Reads the product id from the URL, or null if it's not a number
function readProductId(params: Record<string, unknown>): number | null {
  const id = Number(params.id);
  return Number.isInteger(id) ? id : null;
}

// GET /api/products/3/reviews
// → { average, count, reviews, canReview, myReview }
router.get("/", optionalAuth, async (req, res) => {
  const productId = readProductId(req.params);
  if (productId === null) {
    res.status(400).json({ error: "Invalid product id" });
    return;
  }

  const reviews = await prisma.review.findMany({
    where: { productId: productId },
    include: { user: { select: { name: true } } }, // only the name, never the email
    orderBy: { updatedAt: "desc" },
  });

  const count = reviews.length;
  const average = count === 0 ? null : Math.round((reviews.reduce((sum, r) => sum + r.rating, 0) / count) * 10) / 10;

  // Only for logged-in customers: can they write a review, and what did they write?
  const userId: number | undefined = res.locals.user?.userId;
  const myReview = userId ? reviews.find((r) => r.userId === userId) ?? null : null;
  const canReview = userId ? await hasReceived(userId, productId) : false;

  res.json({
    average: average,
    count: count,
    reviews: reviews.map((r) => ({
      id: r.id,
      rating: r.rating,
      comment: r.comment,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
      userName: r.user.name,
      isMine: r.userId === userId,
    })),
    canReview: canReview,
    myReview: myReview ? { rating: myReview.rating, comment: myReview.comment } : null,
  });
});

// POST /api/products/3/reviews  { rating, comment }  → creates OR updates MY review
router.post("/", requireAuth, async (req, res) => {
  const productId = readProductId(req.params);
  if (productId === null) {
    res.status(400).json({ error: "Invalid product id" });
    return;
  }

  const { rating, comment } = req.body ?? {};
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    res.status(400).json({ error: "Please choose 1 to 5 stars" });
    return;
  }
  if (typeof comment !== "string" || comment.trim().length < 3) {
    res.status(400).json({ error: "Please write a few words (at least 3 characters)" });
    return;
  }
  if (comment.trim().length > 1000) {
    res.status(400).json({ error: "Your review can be at most 1000 characters" });
    return;
  }

  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) {
    res.status(404).json({ error: "Product not found" });
    return;
  }

  // Only real buyers can review
  const userId: number = res.locals.user.userId;
  if (!(await hasReceived(userId, productId))) {
    res.status(403).json({ error: "You can review a plant after it has been delivered to you" });
    return;
  }

  // One review per customer per product: update it if it already exists
  const review = await prisma.review.upsert({
    where: { userId_productId: { userId: userId, productId: productId } },
    update: { rating: rating, comment: comment.trim() },
    create: { userId: userId, productId: productId, rating: rating, comment: comment.trim() },
  });
  res.status(201).json(review);
});

export default router;
