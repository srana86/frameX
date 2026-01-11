import { NextFunction, Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { verifyToken } from "../utils/tokenGenerateFunction";
import config from "../../config";
import catchAsync from "../utils/catchAsync";
import AppError from "../errors/AppError";
import { TJwtPayload } from "../module/Auth/auth.interface";
import { prisma } from "@framex/database";

/**
 * Authentication middleware
 * Validates JWT token and optionally checks user roles
 * Also validates that the user belongs to the current tenant
 */
const auth = (...requiredRoles: string[]) => {
  return catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    // Get token from cookie or Authorization header
    const token =
      req.cookies?.auth_token ||
      req.headers.authorization?.replace("Bearer ", "");

    // Check if token exists
    if (!token) {
      throw new AppError(StatusCodes.UNAUTHORIZED, "You are not authorized!");
    }

    // Verify token
    let decoded: TJwtPayload;
    try {
      decoded = verifyToken(
        token,
        config.jwt_access_secret as string
      ) as TJwtPayload;
    } catch (error: any) {
      // Check if token is expired
      if (error.name === "TokenExpiredError") {
        throw new AppError(
          StatusCodes.UNAUTHORIZED,
          "Token has expired. Please refresh your token."
        );
      }
      throw new AppError(StatusCodes.UNAUTHORIZED, "Invalid token");
    }

    // Validate required fields in token
    if (!decoded.userId || !decoded.role || !decoded.tenantId) {
      throw new AppError(StatusCodes.UNAUTHORIZED, "Invalid token payload");
    }

    // Validate tenantId matches the request's tenant
    // This prevents cross-tenant access attacks
    if (req.tenantId && decoded.tenantId !== req.tenantId) {
      throw new AppError(
        StatusCodes.FORBIDDEN,
        "Token does not belong to this tenant"
      );
    }

    // Verify user still exists and is active
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
        passwordChangedAt: true,
      },
    });

    if (!user) {
      throw new AppError(StatusCodes.UNAUTHORIZED, "User no longer exists");
    }

    // Check if user is blocked
    if (user.status === "BLOCKED") {
      throw new AppError(
        StatusCodes.FORBIDDEN,
        "Your account has been blocked"
      );
    }

    // Check if password was changed after token was issued
    if (user.passwordChangedAt && decoded.iat) {
      const passwordChangedTimestamp = Math.floor(
        user.passwordChangedAt.getTime() / 1000
      );
      if (passwordChangedTimestamp > decoded.iat) {
        throw new AppError(
          StatusCodes.UNAUTHORIZED,
          "Password was recently changed. Please login again."
        );
      }
    }

    // Check if required roles are specified
    if (requiredRoles.length > 0) {
      const userRole = decoded.role.toLowerCase();
      const allowedRoles = requiredRoles.map((role) => role.toLowerCase());

      if (!allowedRoles.includes(userRole)) {
        throw new AppError(
          StatusCodes.FORBIDDEN,
          "You are not authorized to access this resource!"
        );
      }
    }

    // Attach user to request
    req.user = decoded;

    next();
  });
};

/**
 * Optional authentication middleware
 * Attempts to authenticate but allows unauthenticated requests to pass
 * Useful for routes that have different behavior for authenticated vs anonymous users
 */
export const optionalAuth = () => {
  return catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const token =
      req.cookies?.auth_token ||
      req.headers.authorization?.replace("Bearer ", "");

    if (!token) {
      // No token provided, continue without user
      return next();
    }

    try {
      const decoded = verifyToken(
        token,
        config.jwt_access_secret as string
      ) as TJwtPayload;

      // Validate tenantId matches if present
      if (
        req.tenantId &&
        decoded.tenantId &&
        decoded.tenantId !== req.tenantId
      ) {
        // Token from different tenant, treat as anonymous
        return next();
      }

      req.user = decoded;
    } catch (error) {
      // Invalid token, continue without user
    }

    next();
  });
};

export default auth;
