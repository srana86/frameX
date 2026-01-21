/**
 * Tenant Data Loader
 * Automatically loads tenant-specific data based on request context
 */

import { headers } from "next/headers";
import { getTenant, getTenantByDomain, getTenantDeployment } from "./tenant-helpers";
import type { Tenant, TenantDatabase, TenantDeployment } from "./tenant-types";

export interface TenantContext {
    tenant: Tenant;
    database: TenantDatabase | null;
    deployment: TenantDeployment | null;
    connectionString: string | null;
    dbName: string;
}

// For backward compatibility
export type MerchantContext = TenantContext;

/**
 * Get tenant ID from various sources
 */
// Simple cache for tenant ID from request
let cachedRequestTenantId: string | null | undefined = undefined;
let requestCacheTimestamp: number = 0;
const REQUEST_CACHE_TTL = 60000; // 1 minute

export async function getTenantIdFromRequest(): Promise<string | null> {
    // Check cache first
    const now = Date.now();
    if (cachedRequestTenantId !== undefined && now - requestCacheTimestamp < REQUEST_CACHE_TTL) {
        return cachedRequestTenantId ?? null;
    }

    // Priority 1: Check environment variable (for deployed tenant instances)
    if (process.env.TENANT_ID || process.env.MERCHANT_ID) {
        cachedRequestTenantId = process.env.TENANT_ID || process.env.MERCHANT_ID || null;
        requestCacheTimestamp = now;
        return cachedRequestTenantId;
    }

    // Priority 2: Check headers (x-tenant-id or x-merchant-id for backward compat)
    try {
        const headersList = await headers();
        const tenantIdHeader = headersList.get("x-tenant-id") || headersList.get("x-merchant-id");
        if (tenantIdHeader) {
            cachedRequestTenantId = tenantIdHeader;
            requestCacheTimestamp = now;
            return tenantIdHeader;
        }
    } catch (error) {
        // Headers() can only be called in Server Components
    }

    // Priority 3: Check domain/subdomain
    try {
        const headersList = await headers();
        const host = headersList.get("host") || "";
        const domain = host.split(":")[0]; // Remove port if present

        // Try to find tenant by domain using API helper
        const tenant = await getTenantByDomain(domain);
        if (tenant) {
            cachedRequestTenantId = tenant.id;
            requestCacheTimestamp = now;
            return tenant.id;
        }
    } catch (error) {
        // Headers() can only be called in Server Components
    }

    // Cache null result to prevent repeated queries
    cachedRequestTenantId = null;
    requestCacheTimestamp = now;
    return null;
}

// Backward compatibility alias
export const getMerchantIdFromRequest = getTenantIdFromRequest;

/**
 * Load complete tenant context
 */
export async function loadTenantData(tenantId?: string): Promise<TenantContext | null> {
    try {
        // Get tenant ID if not provided
        if (!tenantId) {
            const idFromRequest = await getTenantIdFromRequest();
            tenantId = idFromRequest || undefined;
        }

        if (!tenantId) {
            return null;
        }

        // Load tenant data - try local first, then super-admin
        let tenant = await getTenant(tenantId);

        if (!tenant) {
            // Skip super-admin fetch during build time
            if (process.env.NEXT_PHASE === "phase-production-build") {
                return null;
            }

            // Try to get tenant from super-admin
            try {
                const { getTenantFullDataFromSuperAdmin } = await import("./super-admin-client");
                const superAdminData = await getTenantFullDataFromSuperAdmin(tenantId);

                if (!superAdminData || !superAdminData.merchant) {
                    return null;
                }

                // Map merchant data to tenant (same structure, different naming)
                tenant = superAdminData.merchant as Tenant;
            } catch (error: any) {
                // Only log errors during runtime, not during build
                if (process.env.NEXT_PHASE !== "phase-production-build") {
                    console.error(`❌ [Tenant Loader] Failed to get tenant from super-admin:`, error.message);
                }
                return null;
            }
        }

        if (!tenant) {
            return null;
        }

        // Load tenant deployment configuration
        const deployment = await getTenantDeployment(tenantId);

        // DB info is no longer relevant in frontend app, return mock/null
        const database: TenantDatabase | null = null;
        const connectionString: string | null = null;
        const dbName = "shoestore_main";

        return {
            tenant,
            database,
            deployment,
            connectionString,
            dbName,
        };
    } catch (error) {
        console.error("❌ [Tenant Loader] Error loading tenant data:", error);
        return null;
    }
}

// Backward compatibility alias
export const loadMerchantData = loadTenantData;

/**
 * Get tenant ID from current context
 */
export async function getCurrentTenantId(): Promise<string | null> {
    return await getTenantIdFromRequest();
}

// Backward compatibility alias
export const getCurrentMerchantId = getCurrentTenantId;

/**
 * Check if tenant data is loaded
 */
export async function isTenantLoaded(tenantId?: string): Promise<boolean> {
    const context = await loadTenantData(tenantId);
    return context !== null;
}

// Backward compatibility alias
export const isMerchantLoaded = isTenantLoaded;

/**
 * Get tenant-specific database name
 */
export async function getTenantDatabaseName(tenantId?: string): Promise<string> {
    return "shoestore_main";
}

// Backward compatibility alias
export const getMerchantDatabaseName = getTenantDatabaseName;
