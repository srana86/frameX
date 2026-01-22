import { getTenantIdForAPI } from "./api-helpers";

/**
 * Helper to get the tenant ID for API calls
 */
export async function getTenantId(): Promise<string | null> {
    return await getTenantIdForAPI();
}

/**
 * Helper to check if a tenant is active
 */
export async function isTenantActive(): Promise<boolean> {
    const tenantId = await getTenantId();
    return !!tenantId;
}
