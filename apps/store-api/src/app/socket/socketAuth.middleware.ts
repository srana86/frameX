import { ExtendedError } from "socket.io/dist/namespace";
import { verifyToken } from "../utils/tokenGenerateFunction";
import config from "../../config";
import { AuthenticatedSocket } from "../types";
import { TJwtPayload } from "../module/Auth/auth.interface";
import { prisma, getTenantByDomain } from "@framex/database";

/**
 * Socket authentication middleware
 * Authenticates socket connections using JWT token from handshake
 * Validates tenant context and user existence
 * Rejects unauthorized connections early to prevent resource waste
 */
export const socketAuthMiddleware = async (
  socket: AuthenticatedSocket,
  next: (err?: ExtendedError) => void
) => {
  try {
    // Extract token from handshake auth or query or cookie
    const token =
      socket.handshake.auth?.token ||
      socket.handshake.query?.token ||
      socket.handshake.headers?.authorization?.replace("Bearer ", "") ||
      extractCookieValue(
        socket.handshake.headers?.cookie as string,
        "auth_token"
      );

    if (!token) {
      return next(new Error("Authentication token required"));
    }

    // Verify JWT token
    let decoded: TJwtPayload;
    try {
      decoded = verifyToken(
        token as string,
        config.jwt_access_secret as string
      ) as TJwtPayload;
    } catch (error: any) {
      if (error.name === "TokenExpiredError") {
        return next(new Error("Token expired. Please refresh your token."));
      }
      return next(new Error("Invalid token"));
    }

    if (!decoded.userId || !decoded.role || !decoded.tenantId) {
      return next(new Error("Invalid token payload"));
    }

    // Extract tenant from handshake for validation
    const handshakeTenantId =
      socket.handshake.auth?.tenantId ||
      (socket.handshake.query?.tenantId as string);

    // Also try to resolve tenant from origin/domain
    let resolvedTenantId: string | null = null;
    const origin = socket.handshake.headers?.origin;
    if (origin) {
      try {
        const originUrl = new URL(origin);
        const tenantDomain = await getTenantByDomain(originUrl.hostname);
        if (tenantDomain) {
          resolvedTenantId = tenantDomain.tenantId;
        }
      } catch (e) {
        // Invalid origin, continue
      }
    }

    // Validate tenant context
    const expectedTenantId = handshakeTenantId || resolvedTenantId;
    if (expectedTenantId && decoded.tenantId !== expectedTenantId) {
      return next(new Error("Token does not belong to this tenant"));
    }

    // Verify user still exists and is active in the database
    const user = await prisma.storeUser.findUnique({
      where: {
        id: decoded.userId,
        tenantId: decoded.tenantId,
        isDeleted: false,
      },
      select: {
        id: true,
        role: true,
        status: true,
        tenantId: true,
      },
    });

    if (!user) {
      return next(new Error("User not found"));
    }

    if (user.status === "BLOCKED") {
      return next(new Error("Account is blocked"));
    }

    // Attach user info to socket for later use
    socket.userId = decoded.userId;
    socket.userRole = decoded.role;
    socket.tenantId = decoded.tenantId;
    // merchantId is actually tenantId for merchants
    socket.merchantId = decoded.tenantId;

    next();
  } catch (error: any) {
    next(new Error(`Authentication failed: ${error.message}`));
  }
};

/**
 * Role-based authorization for socket events
 * Use this as a wrapper for event handlers that require specific roles
 */
export const requireSocketRole = (...allowedRoles: string[]) => {
  return (socket: AuthenticatedSocket, next: (err?: ExtendedError) => void) => {
    if (!socket.userRole) {
      return next(new Error("User role not found"));
    }

    const userRole = socket.userRole.toLowerCase();
    const normalizedAllowedRoles = allowedRoles.map((r) => r.toLowerCase());

    if (!normalizedAllowedRoles.includes(userRole)) {
      return next(new Error("Insufficient permissions"));
    }

    next();
  };
};

/**
 * Require tenant context for socket operations
 */
export const requireSocketTenant = () => {
  return (socket: AuthenticatedSocket, next: (err?: ExtendedError) => void) => {
    if (!socket.tenantId) {
      return next(new Error("Tenant context required"));
    }
    next();
  };
};

/**
 * Helper to extract cookie value from cookie header string
 */
function extractCookieValue(
  cookieHeader: string | undefined,
  name: string
): string | null {
  if (!cookieHeader) return null;

  const cookies = cookieHeader.split(";");
  const cookie = cookies.find((c) => c.trim().startsWith(`${name}=`));

  if (!cookie) return null;

  return cookie.split("=")[1]?.trim() || null;
}
