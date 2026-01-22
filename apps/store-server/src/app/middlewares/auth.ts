import { NextFunction, Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { fromNodeHeaders } from "better-auth/node";
import catchAsync from "../utils/catchAsync";
import AppError from "../errors/AppError";
import { auth } from "../../lib/auth";

/**
 * BetterAuth Session Middleware
 * 
 * Validates session from Redis (fast) with database fallback.
 * Replaces the previous JWT-based authentication.
 */
const authMiddleware = (...requiredRoles: string[]) => {
  return catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    // Get session from BetterAuth (checks Redis first, then DB)
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });

    if (!session || !session.user) {
      throw new AppError(StatusCodes.UNAUTHORIZED, "You are not authorized!");
    }

    // Get custom fields from user
    const userTenantId = session.user.tenantId as string | undefined;
    const userRole = (session.user.role as string) || "customer";

    // Validate tenant match for multi-tenant isolation
    if (req.tenantId && userTenantId && userTenantId !== req.tenantId) {
      throw new AppError(
        StatusCodes.FORBIDDEN,
        "Session does not belong to this tenant"
      );
    }

    // Check required roles if specified
    if (requiredRoles.length > 0) {
      const normalizedUserRole = userRole.toLowerCase();
      const allowedRoles = requiredRoles.map((r) => r.toLowerCase());

      if (!allowedRoles.includes(normalizedUserRole)) {
        throw new AppError(
          StatusCodes.FORBIDDEN,
          "You are not authorized to access this resource!"
        );
      }
    }

    // Attach user to request (compatible with existing code)
    req.user = {
      userId: session.user.id,
      role: userRole,
      tenantId: userTenantId || req.tenantId,
    };

    next();
  });
};

/**
 * Optional Authentication Middleware
 * 
 * Attempts to authenticate but allows unauthenticated requests to pass.
 * Useful for routes that behave differently for authenticated vs anonymous users.
 */
export const optionalAuth = () => {
  return catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    try {
      const session = await auth.api.getSession({
        headers: fromNodeHeaders(req.headers),
      });

      if (session?.user) {
        const userTenantId = session.user.tenantId as string | undefined;
        const userRole = (session.user.role as string) || "customer";

        // Skip if tenant mismatch
        if (req.tenantId && userTenantId && userTenantId !== req.tenantId) {
          return next();
        }

        req.user = {
          userId: session.user.id,
          role: userRole,
          tenantId: userTenantId || req.tenantId,
        };
      }
    } catch (error) {
      // Ignore errors - user is anonymous
      console.log("[Auth] Optional auth failed, continuing as anonymous");
    }

    next();
  });
};

export default authMiddleware;
