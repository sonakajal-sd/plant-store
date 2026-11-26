import "dotenv/config";
import express from "express";
import cors from "cors";
import { prisma } from "./lib/prisma";

const app = express();
const PORT = process.env.PORT ?? 4000;

// Allow our React app to call this server
app.use(cors({ origin: "http://localhost:5173" }));

// Read JSON from request bodies
app.use(express.json());

// A simple test route
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", message: "Plant store API is running 🌿" });
});


// Get all products from the database
app.get("/api/products", async (_req, res) => {
  const products = await prisma.product.findMany({ orderBy: { id: "asc" } });
  res.json(products);
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});