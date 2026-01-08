import jwt, { type JwtPayload, type SignOptions } from "jsonwebtoken";

const JWT_SECRET: string = process.env.JWT_SECRET || "your-secret-key-change-in-production";
const JWT_EXPIRES_IN: string = process.env.JWT_EXPIRES_IN || "7d";

export interface JWTPayload extends JwtPayload {
  userId: string;
  email?: string;
  phone?: string;
  fullName: string;
  role?: "customer" | "merchant" | "admin";
}

export interface TokenPayload {
  userId: string;
  email?: string;
  phone?: string;
  fullName: string;
  role?: "customer" | "merchant" | "admin";
}

export function generateToken(payload: TokenPayload): string {
  return jwt.sign(payload as object, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  } as SignOptions);
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    if (typeof decoded === "string" || !decoded) {
      return null;
    }

    const payload = decoded as JWTPayload;

    // Validate required fields
    if (!payload.userId || !payload.fullName) {
      return null;
    }

    return payload;
  } catch (error) {
    return null;
  }
}

export function getTokenFromCookie(cookieHeader: string | null): string | null {
  if (!cookieHeader) return null;

  const cookies = cookieHeader.split(";");
  const tokenCookie = cookies.find((cookie) => cookie.trim().startsWith("auth_token="));

  if (!tokenCookie) return null;

  return tokenCookie.split("=")[1]?.trim() || null;
}
