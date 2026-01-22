import { prisma } from "./client";
import type { Tenant, TenantDomain } from "@prisma/client";

/**
 * Get tenant by ID
 */
export async function getTenantById(tenantId: string): Promise<Tenant | null> {
  return prisma.tenant.findUnique({
    where: { id: tenantId },
  });
}

/**
 * Get tenant by domain (subdomain or custom domain)
 */
export async function getTenantByDomain(
  domain: string
): Promise<(TenantDomain & { tenant: Tenant }) | null> {
  // Extract hostname (strip port if present)
  const hostname = domain.split(":")[0];

  // Check if it's a system subdomain (e.g., "demo" from demo.localhost OR demo.framextech.com)
  const subdomainMatch = hostname.match(/^([^.]+)\.(localhost|framextech\.com)$/);
  const subdomain = subdomainMatch ? subdomainMatch[1] : null;

  return prisma.tenantDomain.findFirst({
    where: {
      OR: [
        { hostname: hostname },
        { primaryDomain: hostname },
        { subdomain: subdomain || undefined },
        { customDomain: hostname },
      ],
      // Ensure the domain is active/verified
      status: "ACTIVE",
    },
    include: {
      tenant: true,
    },
  });
}

/**
 * Helper to wrap queries with tenant context
 * Ensures all queries are scoped to a specific tenant
 */
export function withTenant<T extends { tenantId?: string }>(
  tenantId: string,
  data: Omit<T, "tenantId">
): T {
  return {
    ...data,
    tenantId,
  } as T;
}

/**
 * Validate that a resource belongs to a tenant
 */
export function validateTenantAccess(
  resourceTenantId: string,
  requestTenantId: string
): boolean {
  return resourceTenantId === requestTenantId;
}
