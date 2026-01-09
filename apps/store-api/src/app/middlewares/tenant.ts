import { Request, Response, NextFunction } from "express";
import { prisma, getTenantByDomain } from "@framex/database";

// Extend Express Request type
declare global {
    namespace Express {
        interface Request {
            tenantId: string;
            tenant?: {
                id: string;
                name: string;
                status: string;
            };
        }
    }
}

/**
 * Tenant middleware - extracts and validates tenant from request
 * Checks: x-merchant-id header, x-subdomain header, or domain lookup
 */
export const tenantMiddleware = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        // Priority 1: Direct merchant ID header (from proxy)
        let tenantId = req.headers["x-merchant-id"] as string;

        // Priority 2: Subdomain header (from proxy)
        if (!tenantId) {
            const subdomain = req.headers["x-subdomain"] as string;
            if (subdomain) {
                const tenantDomain = await getTenantByDomain(`${subdomain}.framextech.com`);
                if (tenantDomain) {
                    tenantId = tenantDomain.tenantId;
                    req.tenant = {
                        id: tenantDomain.tenant.id,
                        name: tenantDomain.tenant.name,
                        status: tenantDomain.tenant.status,
                    };
                }
            }
        }

        // Priority 3: Look up tenant from host header
        if (!tenantId) {
            const host = req.headers["host"];
            if (host) {
                const domain = host.split(":")[0];
                const tenantDomain = await getTenantByDomain(domain);
                if (tenantDomain) {
                    tenantId = tenantDomain.tenantId;
                    req.tenant = {
                        id: tenantDomain.tenant.id,
                        name: tenantDomain.tenant.name,
                        status: tenantDomain.tenant.status,
                    };
                }
            }
        }

        if (!tenantId) {
            return res.status(400).json({
                success: false,
                message: "Tenant identification required",
            });
        }

        // Validate tenant exists and is active
        if (!req.tenant) {
            const tenant = await prisma.tenant.findUnique({
                where: { id: tenantId },
            });

            if (!tenant) {
                return res.status(404).json({
                    success: false,
                    message: "Tenant not found",
                });
            }

            if (tenant.status !== "ACTIVE" && tenant.status !== "TRIAL") {
                return res.status(403).json({
                    success: false,
                    message: "Tenant account is suspended",
                });
            }

            req.tenant = {
                id: tenant.id,
                name: tenant.name,
                status: tenant.status,
            };
        }

        req.tenantId = tenantId;
        next();
    } catch (error) {
        console.error("Tenant middleware error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to resolve tenant",
        });
    }
};

/**
 * Optional tenant middleware - allows unauthenticated tenant access
 * Used for public routes that may or may not have tenant context
 */
export const optionalTenantMiddleware = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const tenantId = req.headers["x-merchant-id"] as string;

        if (tenantId) {
            req.tenantId = tenantId;
            const tenant = await prisma.tenant.findUnique({
                where: { id: tenantId },
            });
            if (tenant) {
                req.tenant = {
                    id: tenant.id,
                    name: tenant.name,
                    status: tenant.status,
                };
            }
        }

        next();
    } catch (error) {
        // Continue without tenant context
        next();
    }
};

/**
 * Super admin bypass - allows super admins to access any tenant
 */
export const superAdminTenantOverride = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    // If user is super admin and specifies a tenant, use that
    if ((req as any).user?.role === "SUPER_ADMIN") {
        const overrideTenantId = req.query.tenantId as string;
        if (overrideTenantId) {
            req.tenantId = overrideTenantId;
        }
    }
    next();
};
