// Tenant/Merchant Types for Super Admin

export interface TenantDeployment {
  id: string;
  tenantId: string;
  deploymentType: "subdomain" | "custom" | "local";
  subdomain?: string;
  deploymentStatus: "active" | "pending" | "failed" | "inactive";
  deploymentUrl: string;
  deploymentProvider: "vercel" | "local" | "other";
  projectId?: string; // Vercel project ID - used for domain configuration
  deploymentId: string;
  environmentVariables: Record<string, string>;
  lastDeployedAt: string;
  createdAt: string;
  updatedAt: string;
}

// Backward compatibility alias
export type MerchantDeployment = TenantDeployment;
