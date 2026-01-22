// Domain Management Service
// Handles custom domain configuration and verification
// Now uses super-admin as the source of truth for domain configurations

import { getDomainConfigFromSuperAdmin } from "./super-admin-client";

export interface DomainConfiguration {
  id: string;
  tenantId: string;
  domain: string;
  domainType: "custom" | "subdomain";
  dnsRecords: DNSRecord[];
  sslStatus: "pending" | "active" | "failed";
  verified: boolean;
  verifiedAt?: string;
  redirect?: string;
  redirectStatusCode?: 301 | 302;
  misconfigured?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DNSRecord {
  type: "A" | "CNAME" | "TXT";
  name: string;
  value: string;
  ttl?: number;
}

/**
 * Generate DNS records for domain configuration
 */
export function generateDNSRecords(domain: string): DNSRecord[] {
  const domainParts = domain.split(".");
  const isApex = domainParts.length === 2; // e.g., example.com (no subdomain)

  if (isApex) {
    // For apex/root domains, use A record (VPS IP)
    return [
      {
        type: "A",
        name: "@",
        value: process.env.VPS_IP || "127.0.0.1",
        ttl: 3600,
      },
    ];
  } else {
    // For subdomains, use CNAME
    return [
      {
        type: "CNAME",
        name: domainParts[0],
        value: process.env.VPS_DOMAIN || "framextech.com",
        ttl: 3600,
      },
    ];
  }
}

/**
 * Get domain configuration for tenant from super-admin
 */
export async function getDomainConfiguration(tenantId: string): Promise<DomainConfiguration | null> {
  try {
    console.log(`[domain-service] Fetching domain config for tenantId: ${tenantId}`);
    const result = await getDomainConfigFromSuperAdmin(tenantId);

    console.log(`[domain-service] Result from super-admin:`, result ? JSON.stringify(result).slice(0, 200) : "null");

    if (!result?.domain) {
      console.log(`[domain-service] No domain found for tenantId: ${tenantId}`);
      return null;
    }

    const superAdminDomain = result.domain;

    // Transform super-admin domain config to local format
    // Map DNS records with proper types
    const dnsRecords: DNSRecord[] =
      superAdminDomain.dnsRecords?.length > 0
        ? superAdminDomain.dnsRecords.map((r) => ({
          type: r.type as "A" | "CNAME" | "TXT",
          name: r.name,
          value: r.value,
        }))
        : generateDNSRecords(superAdminDomain.domain);

    const domainConfig: DomainConfiguration = {
      id: superAdminDomain.id,
      tenantId: superAdminDomain.tenantId,
      domain: superAdminDomain.domain,
      domainType: "custom",
      dnsRecords,
      sslStatus: superAdminDomain.verified ? "active" : "pending",
      verified: superAdminDomain.verified || false,
      redirect: superAdminDomain.redirect || undefined,
      redirectStatusCode: (superAdminDomain.redirectStatusCode as 301 | 302) || undefined,
      misconfigured: false,
      createdAt: superAdminDomain.createdAt,
      updatedAt: superAdminDomain.updatedAt,
    };

    return domainConfig;
  } catch (error) {
    console.error("Error fetching domain configuration from super-admin:", error);
    return null;
  }
}

// Note: Domain management (create, update, remove) now goes through super-admin
// Use the functions in super-admin-client.ts:
// - configureDomainViaSuperAdmin()
// - removeDomainViaSuperAdmin()
// - getDomainConfigFromSuperAdmin()
