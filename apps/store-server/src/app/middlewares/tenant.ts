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
 * Priority: 1. x-domain header, 2. Origin header, 3. x-tenant-id header
 */
export const tenantMiddleware = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        let tenantId: string | undefined;
        let domainAttempted: string | undefined; // Track if a domain resolution was attempted

        // Helper to resolve tenant from a domain string
        const resolveTenantFromDomain = async (domain: string) => {
            if (!domain || domain === "localhost") return null;
            return getTenantByDomain(domain);
        };

        // Priority 1: x-domain header (frontend sends current domain)
        const xDomain = req.headers["x-domain"] as string;
        if (xDomain && xDomain !== "localhost") {
            domainAttempted = xDomain;
            const tenantDomain = await resolveTenantFromDomain(xDomain);
            if (tenantDomain) {
                tenantId = tenantDomain.tenantId;
                req.tenant = {
                    id: tenantDomain.tenant.id,
                    name: tenantDomain.tenant.name,
                    status: tenantDomain.tenant.status,
                };
            }
        }

        // Priority 2: x-forwarded-domain header (for proxied requests)
        if (!tenantId) {
            const xForwardedDomain = req.headers["x-forwarded-domain"] as string;
            if (xForwardedDomain && xForwardedDomain !== "localhost") {
                domainAttempted = domainAttempted || xForwardedDomain;
                const tenantDomain = await resolveTenantFromDomain(xForwardedDomain);
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

        // Priority 3: Origin header (for cross-origin API calls)
        if (!tenantId) {
            const origin = req.headers["origin"] as string;
            if (origin) {
                try {
                    const originUrl = new URL(origin);
                    if (originUrl.hostname !== "localhost") {
                        domainAttempted = domainAttempted || originUrl.hostname;
                        const tenantDomain = await resolveTenantFromDomain(originUrl.hostname);
                        if (tenantDomain) {
                            tenantId = tenantDomain.tenantId;
                            req.tenant = {
                                id: tenantDomain.tenant.id,
                                name: tenantDomain.tenant.name,
                                status: tenantDomain.tenant.status,
                            };
                        }
                    }
                } catch (e) {
                    // Invalid origin URL, continue
                }
            }
        }

        // Priority 4: Host header (req.hostname) - Useful for local dev / direct access
        if (!tenantId) {
            // req.hostname doesn't include port, which is good for getTenantByDomain
            const hostname = req.hostname;
            if (hostname && hostname !== "localhost") {
                domainAttempted = domainAttempted || hostname;
                const tenantDomain = await resolveTenantFromDomain(hostname);
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

        // Priority 5: x-tenant-id header (direct fallback)
        if (!tenantId) {
            tenantId = req.headers["x-tenant-id"] as string;
        }

        console.log(`[TenantMiddleware] Resolved tenantId: ${tenantId} for URL: ${req.url}, domainAttempted: ${domainAttempted}`);

        // If no tenant found, determine the appropriate error
        if (!tenantId) {
            if (domainAttempted) {
                // A domain was provided but no tenant exists for it
                console.log(`[TenantMiddleware] Store not found for domain: ${domainAttempted}`);
                return res.status(404).json({
                    success: false,
                    error: "STORE_NOT_FOUND",
                    message: `No store found for domain: ${domainAttempted}`,
                    domain: domainAttempted,
                });
            } else {
                // No identification method was provided at all
                console.log("[TenantMiddleware] No tenant ID found in headers or domain");
                return res.status(400).json({
                    success: false,
                    error: "TENANT_REQUIRED",
                    message: "Tenant identification required. Send x-domain or x-tenant-id header.",
                });
            }
        }

        // Validate tenant exists and is active
        if (!req.tenant) {
            console.log(`[TenantMiddleware] Validating tenant ID from DB: ${tenantId}`);
            const tenant = await prisma.tenant.findUnique({
                where: { id: tenantId },
            });

            if (!tenant) {
                console.log(`[TenantMiddleware] Tenant not found in DB for ID: ${tenantId}`);
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
        const tenantId = req.headers["x-tenant-id"] as string;

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
