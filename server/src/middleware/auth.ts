import type { Request, Response, NextFunction } from "express";
import { prisma } from "../lib/prisma";
import { verifyToken } from "../utils/token";

// What routes find in res.locals.user
export type AuthUser = { userId: number; role: "USER" | "ADMIN" };

// Reads "Authorization: Bearer <token>" and returns the token, or null
function readToken(req: Request): string | null {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) return null;
  return header.slice(7); // remove "Bearer " (7 characters)
}

// Checks the token AND the database. Returns the user, or null if the token is no good:
// - fake or expired token
// - the user was deleted
// - the password was changed since (tokenVersion went up)
// The role comes from the DATABASE, so a role change works immediately.
async function findTokenUser(token: string): Promise<AuthUser | null> {
  let payload;
  try {
    payload = verifyToken(token);
  } catch {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: { id: true, role: true, tokenVersion: true },
  });

  // Tokens made before tokenVersion existed count as version 0
  if (!user || user.tokenVersion !== (payload.tokenVersion ?? 0)) {
    return null;
  }
  return { userId: user.id, role: user.role };
}

// Guard 1: you must be logged in
export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = readToken(req);
  if (!token) {
    res.status(401).json({ error: "Please log in first" });
    return;
  }

  const user = await findTokenUser(token);
  if (!user) {
    res.status(401).json({ error: "Your session has expired. Please log in again." });
    return;
  }

  res.locals.user = user; // routes use res.locals.user.userId and .role
  next(); // ✅ let them in
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
// Public routes use it to know who is asking (e.g. the admin, or a customer's coupon uses).
export async function optionalAuth(req: Request, res: Response, next: NextFunction) {
  const token = readToken(req);
  if (token) {
    const user = await findTokenUser(token);
    // A bad or old token on a public page → just treat them as a guest
    if (user) res.locals.user = user;
  }
  next();
}
