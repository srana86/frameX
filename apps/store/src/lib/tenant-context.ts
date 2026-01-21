/**
 * Tenant Context Provider
 * Provides tenant data throughout the application
 */

import { cache } from "react";
import { loadTenantData, getCurrentTenantId, type TenantContext } from "./tenant-loader";

// Backward compatibility export
export type MerchantContext = TenantContext;

/**
 * Cached tenant context loader
 * Uses React cache to ensure same tenant data is used across the request
 */
export const getTenantContext = cache(async (tenantId?: string): Promise<TenantContext | null> => {
    return await loadTenantData(tenantId);
});

// Backward compatibility alias
export const getMerchantContext = getTenantContext;

/**
 * Get current tenant
 */
export const getCurrentTenant = cache(async () => {
    const tenantId = await getCurrentTenantId();
    if (!tenantId) return null;

    const context = await getTenantContext(tenantId);
    return context?.tenant || null;
});

// Backward compatibility alias
export const getCurrentMerchant = getCurrentTenant;

/**
 * Get tenant database configuration
 */
export const getTenantDbConfig = cache(async (tenantId?: string) => {
    const context = await getTenantContext(tenantId);
    return context?.database || null;
});

// Backward compatibility alias
export const getMerchantDbConfig = getTenantDbConfig;

/**
 * Get tenant deployment configuration
 */
export const getTenantDeploymentConfig = cache(async (tenantId?: string) => {
    const context = await getTenantContext(tenantId);
    return context?.deployment || null;
});

// Backward compatibility alias
export const getMerchantDeploymentConfig = getTenantDeploymentConfig;

/**
 * Get tenant database name
 */
export const getTenantDbName = cache(async (tenantId?: string) => {
    const context = await getTenantContext(tenantId);
    return context?.dbName || process.env.MONGODB_DB || "shoestore_main";
});

// Backward compatibility alias
export const getMerchantDbName = getTenantDbName;
