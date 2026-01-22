import { NextFunction, Request, Response } from 'express';
import httpStatus from 'http-status';
import { auth as betterAuth } from '../../lib/auth';
import { fromNodeHeaders } from "better-auth/node";
import AppError from '../errors/AppError';
import catchAsync from '../utils/catchAsync';

// Extended role type that includes all possible roles from both platform and store
export type TUserRole = 
  | "SUPER_ADMIN" | "super_admin"
  | "ADMIN" | "admin"
  | "STAFF" | "staff"
  | "OWNER" | "owner"
  | "TENANT" | "tenant"
  | "CUSTOMER" | "customer";

/**
 * Normalize role to uppercase for comparison
 */
function normalizeRole(role: string): string {
  return role.toUpperCase();
}

/**
 * Auth middleware - verifies BetterAuth session and checks required roles
 * 
 * Accepts both uppercase (ADMIN) and lowercase (admin) role names.
 */
const auth = (...requiredRoles: TUserRole[]) => {
    return catchAsync(async (req: Request, res: Response, next: NextFunction) => {
        // BetterAuth Session Check
        const session = await betterAuth.api.getSession({
            headers: fromNodeHeaders(req.headers),
        });

        if (!session || !session.user) {
            throw new AppError(httpStatus.UNAUTHORIZED, 'You are not authorized!');
        }

        const user = session.user;
        const userRole = normalizeRole(user.role as string || 'CUSTOMER');

        // Check required roles if specified
        if (requiredRoles.length > 0) {
            const normalizedRequiredRoles = requiredRoles.map(normalizeRole);
            
            if (!normalizedRequiredRoles.includes(userRole)) {
                throw new AppError(
                    httpStatus.FORBIDDEN,
                    'You are not authorized to access this resource!',
                );
            }
        }

        // Attach user to request for use in controllers
        // Extend with tenantId from request if available
        req.user = {
            ...user,
            userId: user.id,
            role: userRole,
            tenantId: (user as any).tenantId || req.headers['x-tenant-id'] || req.tenantId,
        } as any;

        next();
    });
};

export default auth;
