import "dotenv/config";
import express from "express";
import type { Request, Response, NextFunction } from "express";
import cors from "cors";
import { UPLOADS_DIR, ensureUploadFolders } from "./utils/files";
import productRoutes from "./routes/products";
import authRoutes from "./routes/auth";
import orderRoutes from "./routes/orders";
import couponRoutes from "./routes/coupons";
import wishlistRoutes from "./routes/wishlist";
import reviewRoutes from "./routes/reviews";

const app = express();
const PORT = process.env.PORT ?? 4000;

// Only our React app may call this API. The address comes from .env (CLIENT_URL).
app.use(cors({ origin: process.env.CLIENT_URL ?? "http://localhost:5175" }));
app.use(express.json());

// Product photos are public: http://localhost:4000/uploads/products/<file>
// maxAge = the browser may keep them for 7 days (file names are random, so a new photo gets a new name)
app.use("/uploads", express.static(UPLOADS_DIR, { maxAge: "7d" }));

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", message: "Plant store API is running 🌿" });
});

// Reviews first: "/api/products/3/reviews" must not be caught by the products router
app.use("/api/products/:id/reviews", reviewRoutes);
app.use("/api/products", productRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/coupons", couponRoutes);
app.use("/api/wishlist", wishlistRoutes);

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err);
  res.status(500).json({ error: "Something went wrong on the server" });
});

// Make sure server/uploads/products exists before we accept uploads
await ensureUploadFolders();

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});