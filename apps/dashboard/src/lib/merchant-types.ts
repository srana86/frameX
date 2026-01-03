// Merchant Types for Super Admin

export interface MerchantDeployment {
  id: string;
  merchantId: string;
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
