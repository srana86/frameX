import jwt, { type JwtPayload } from "jsonwebtoken";

/**
 * JWT Payload structure from backend
 * Note: The frontend should NOT sign JWTs - that's the backend's responsibility.
 * This file only provides utilities for decoding (not verifying) tokens on the client.
 */
export interface JWTPayload extends JwtPayload {
  userId: string;
  role: "customer" | "merchant" | "admin";
  tenantId: string;
}

/**
 * Decode a JWT token WITHOUT verification.
 * Use this only for reading non-sensitive data from the token (like role for UI purposes).
 * The backend always validates the token for actual security decisions.
 *
 * @param token - The JWT token to decode
 * @returns The decoded payload or null if invalid
 */
export function decodeToken(token: string): JWTPayload | null {
  try {
    // Decode without verification - just to read payload for UI purposes
    const decoded = jwt.decode(token);

    if (typeof decoded === "string" || !decoded) {
      return null;
    }

    const payload = decoded as JWTPayload;

    // Validate required fields
    if (!payload.userId || !payload.role || !payload.tenantId) {
      return null;
    }

    return payload;
  } catch (error) {
    return null;
  }
}

/**
 * Check if a token is expired (without verification)
 * @param token - The JWT token to check
 * @returns true if expired, false if valid, null if invalid token
 */
export function isTokenExpired(token: string): boolean | null {
  try {
    const decoded = jwt.decode(token) as JWTPayload;

    if (!decoded || !decoded.exp) {
      return null;
    }

    // exp is in seconds, Date.now() is in milliseconds
    const expiryTime = decoded.exp * 1000;
    return Date.now() >= expiryTime;
  } catch (error) {
    return null;
  }
}

/**
 * Check if a token will expire soon (within the given threshold)
 * @param token - The JWT token to check
 * @param thresholdMs - Threshold in milliseconds (default: 5 minutes)
 * @returns true if expiring soon, false if not, null if invalid token
 */
export function isTokenExpiringSoon(
  token: string,
  thresholdMs: number = 5 * 60 * 1000
): boolean | null {
  try {
    const decoded = jwt.decode(token) as JWTPayload;

    if (!decoded || !decoded.exp) {
      return null;
    }

    const expiryTime = decoded.exp * 1000;
    const timeUntilExpiry = expiryTime - Date.now();

    return timeUntilExpiry <= thresholdMs;
  } catch (error) {
    return null;
  }
}

/**
 * Extract token from cookie header string
 * @param cookieHeader - The cookie header string
 * @returns The token value or null
 */
export function getTokenFromCookie(cookieHeader: string | null): string | null {
  if (!cookieHeader) return null;

  const cookies = cookieHeader.split(";");
  const tokenCookie = cookies.find((cookie) =>
    cookie.trim().startsWith("auth_token=")
  );

  if (!tokenCookie) return null;

  return tokenCookie.split("=")[1]?.trim() || null;
}

/**
 * Get user role from token (for UI purposes only)
 * @param token - The JWT token
 * @returns The user role or null
 */
export function getRoleFromToken(token: string): string | null {
  const decoded = decodeToken(token);
  return decoded?.role || null;
}
