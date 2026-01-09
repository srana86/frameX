/**
 * Tenant Resolver - Server-side tenant resolution
 * Relies on headers passed from the proxy/ingress
 */

import { headers } from "next/headers";

/**
 * Resolve tenant from request context
 * Priority: x-merchant-id ONLY (set by proxy or middleware)
 */
export async function resolveTenant(): Promise<{
    tenantId: string;
    tenant?: any;
} | null> {
    const headersList = await headers();

    // Priority 1: Direct merchant ID (from env or cache hit in proxy)
    const merchantId = headersList.get("x-merchant-id");
    if (merchantId) {
        return { tenantId: merchantId };
    }

    // In VPS setup, x-merchant-id should always be present via Nginx mapping
    console.warn("[TenantResolver] Missing x-merchant-id header in request");

    // Fallback for local dev if needed, or return null
    if (process.env.DEFAULT_MERCHANT_ID) {
        return { tenantId: process.env.DEFAULT_MERCHANT_ID };
    }

    return null;
}

/**
 * Invalidate tenant cache (No-op in header-based auth)
 */
export async function invalidateTenantCache(
    subdomain?: string,
    customDomain?: string
): Promise<void> {
    // No-op
}
