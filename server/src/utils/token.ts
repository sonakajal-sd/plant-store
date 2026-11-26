import jwt from "jsonwebtoken";

// What we store inside the token
export type TokenPayload = {
  userId: number;
  role: "USER" | "ADMIN";
};

function getSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is missing in .env");
  }
  return secret;
}

// Make a token that is valid for 7 days
export function createToken(payload: TokenPayload): string {
  return jwt.sign(payload, getSecret(), { expiresIn: "7d" });
}

// Check a token. Throws an error if it's fake or expired
export function verifyToken(token: string): TokenPayload {
  return jwt.verify(token, getSecret()) as TokenPayload;
}