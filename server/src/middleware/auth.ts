import type { Request, Response, NextFunction } from "express";
import { verifyToken } from "../utils/token";

// Guard 1: you must be logged in
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  // The frontend sends:  Authorization: Bearer <token>
  const header = req.headers.authorization;

  if (!header || !header.startsWith("Bearer ")) {
    res.status(401).json({ error: "Please log in first" });
    return;
  }

  const token = header.slice(7); // remove "Bearer " (7 characters)

  try {
    // Save who this user is, so the route can use it
    res.locals.user = verifyToken(token);
    next(); // ✅ let them in
  } catch {
    res.status(401).json({ error: "Your session has expired. Please log in again." });
  }
}

// Guard 2: you must be the admin (always use AFTER requireAuth)
export function requireAdmin(_req: Request, res: Response, next: NextFunction) {
  if (res.locals.user?.role !== "ADMIN") {
    res.status(403).json({ error: "Admins only" });
    return;
  }
  next();
}
// Guard 3 (not really a guard): read the token IF there is one, but never block.
// Public routes use it to know when the admin is asking (e.g. to show archived products).
export function optionalAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (header && header.startsWith("Bearer ")) {
    try {
      res.locals.user = verifyToken(header.slice(7));
    } catch {
      // A bad or expired token on a public page → just treat them as a guest
    }
  }
  next();
}
