import { ExtendedError } from "socket.io/dist/namespace";
import { fromNodeHeaders } from "better-auth/node";
import { auth } from "../../lib/auth";
import { AuthenticatedSocket } from "../interface/socket.types";
import { getTenantByDomain } from "@framex/database";

/**
 * Socket authentication middleware
 * Authenticates socket connections using BetterAuth session
 * Validates tenant context and user existence
 */
export const socketAuthMiddleware = async (
  socket: AuthenticatedSocket,
  next: (err?: ExtendedError) => void
) => {
  try {
    // Get session using BetterAuth (validates cookie/header)
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(socket.handshake.headers),
    });

    if (!session || !session.user) {
      return next(new Error("Authentication failed: No active session"));
    }

    const { user } = session;
    const userRole = (user.role as string) || "customer";
    const userTenantId = user.tenantId as string | undefined;

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
        // Skip for localhost/IPs usually, or handle demo/localhost logic
        const tenantDomain = await getTenantByDomain(originUrl.hostname);
        if (tenantDomain) {
          resolvedTenantId = tenantDomain.tenantId;
        }
      } catch (e) {
        // Invalid origin, continue
      }
    }

    // Validate tenant context if tenantId is available on user
    // If user is global admin (no tenantId) they might access any tenant?
    // Assuming multi-tenant strictness:
    const expectedTenantId = handshakeTenantId || resolvedTenantId;

    if (userTenantId && expectedTenantId && userTenantId !== expectedTenantId) {
      return next(new Error("Session does not belong to this tenant"));
    }

    // Attach user info to socket
    socket.userId = user.id;
    socket.userRole = userRole;
    socket.tenantId = userTenantId || expectedTenantId || undefined;

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
