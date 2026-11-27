import { Router } from "express";
import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma";
import type { User } from "../generated/prisma/client";
import { createToken } from "../utils/token";
import { requireAuth } from "../middleware/auth";

const router = Router();

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// What we send back about a user. NEVER send the password!
function publicUser(user: User) {
  return { id: user.id, name: user.name, email: user.email, role: user.role };
}

// POST /api/auth/register  (create a new account)
router.post("/register", async (req, res) => {
  const { name, email, password } = req.body ?? {}; // body is undefined if no JSON was sent

  if (typeof name !== "string" || name.trim() === "") {
    res.status(400).json({ error: "Please enter your name" });
    return;
  }
  if (name.trim().length > 60) {
    res.status(400).json({ error: "Name can be at most 60 characters" });
    return;
  }
  if (typeof email !== "string" || !EMAIL_REGEX.test(email)) {
    res.status(400).json({ error: "Please enter a valid email" });
    return;
  }
  if (typeof password !== "string" || password.length < 8 || password.length > 72) {
    // bcrypt only looks at the first 72 bytes, so longer passwords aren't safer
    res.status(400).json({ error: "Password must be 8 to 72 characters" });
    return;
  }

  const cleanEmail = email.trim().toLowerCase();

  // Is this email already used?
  const existing = await prisma.user.findUnique({ where: { email: cleanEmail } });
  if (existing) {
    res.status(409).json({ error: "An account with this email already exists" });
    return;
  }

  // Hash the password (10 = how strong the scrambling is)
  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: { name: name.trim(), email: cleanEmail, password: hashedPassword },
  });

  const token = createToken({ userId: user.id, role: user.role, tokenVersion: user.tokenVersion });
  res.status(201).json({ token: token, user: publicUser(user) });
});

// POST /api/auth/login
router.post("/login", async (req, res) => {
  const { email, password } = req.body ?? {};

  if (typeof email !== "string" || typeof password !== "string") {
    res.status(400).json({ error: "Email and password are required" });
    return;
  }

  const user = await prisma.user.findUnique({
    where: { email: email.trim().toLowerCase() },
  });

  // Compare the typed password with the hashed one in the database
  const passwordOk = user ? await bcrypt.compare(password, user.password) : false;

  // Same message for "no user" and "wrong password" (safer: hackers can't tell which)
  if (!user || !passwordOk) {
    res.status(401).json({ error: "Wrong email or password" });
    return;
  }

  const token = createToken({ userId: user.id, role: user.role, tokenVersion: user.tokenVersion });
  res.json({ token: token, user: publicUser(user) });
});

// GET /api/auth/me  (who am I? needs a token)
router.get("/me", requireAuth, async (_req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: res.locals.user.userId },
  });

  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  res.json(publicUser(user));
});

// PUT /api/auth/me  (change my name)
router.put("/me", requireAuth, async (req, res) => {
  const { name } = req.body ?? {};
  if (typeof name !== "string" || name.trim() === "") {
    res.status(400).json({ error: "Please enter your name" });
    return;
  }
  if (name.trim().length > 60) {
    res.status(400).json({ error: "Name can be at most 60 characters" });
    return;
  }

  const user = await prisma.user.update({
    where: { id: res.locals.user.userId },
    data: { name: name.trim() },
  });
  res.json(publicUser(user));
});

// POST /api/auth/change-password  (needs the CURRENT password, so a stolen
// logged-in laptop can't simply lock the real owner out)
router.post("/change-password", requireAuth, async (req, res) => {
  const { currentPassword, newPassword } = req.body ?? {};

  if (typeof currentPassword !== "string" || currentPassword === "") {
    res.status(400).json({ error: "Please enter your current password" });
    return;
  }
  if (typeof newPassword !== "string" || newPassword.length < 8 || newPassword.length > 72) {
    res.status(400).json({ error: "The new password must be 8 to 72 characters" });
    return;
  }

  const user = await prisma.user.findUnique({ where: { id: res.locals.user.userId } });
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  const correct = await bcrypt.compare(currentPassword, user.password);
  if (!correct) {
    // 400, not 401: a 401 would log the user out in the app
    res.status(400).json({ error: "Your current password is wrong" });
    return;
  }

  // tokenVersion + 1 → every OLD token (e.g. on another laptop) stops working
  const updated = await prisma.user.update({
    where: { id: user.id },
    data: { password: await bcrypt.hash(newPassword, 10), tokenVersion: { increment: 1 } },
  });

  // A NEW token, so the person who changed the password stays logged in here
  const token = createToken({ userId: updated.id, role: updated.role, tokenVersion: updated.tokenVersion });
  res.json({ message: "Your password was changed", token: token });
});

export default router;
