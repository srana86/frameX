import { getTenantIdForAPI } from "./api-helpers";

export interface TenantContext {
    tenantId: string;
}

/**
 * Get the current tenant context
 */
export async function getTenantContext(): Promise<TenantContext | null> {
    const tenantId = await getTenantIdForAPI();
    if (!tenantId) return null;
    return { tenantId };
}
