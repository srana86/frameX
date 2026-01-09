// Multi-tenant merchant types

export type MerchantStatus = "active" | "suspended" | "trial" | "inactive";

export type DeploymentType = "subdomain" | "custom_domain";

export type DeploymentStatus = "pending" | "active" | "failed" | "inactive";

/**
 * Merchant Account
 */
export interface Merchant {
  id: string;
  name: string;
  email: string;
  phone?: string;
  status: MerchantStatus;
  customDomain?: string;
  deploymentUrl?: string; // e.g., "merchant1.shoestore.com" or "shop.example.com"
  subscriptionId?: string;
  settings: {
    brandName: string;
    logo?: string;
    theme?: {
      primaryColor?: string;
    };
    currency?: string;
    timezone?: string;
  };
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Merchant Deployment Configuration
 */
export interface MerchantDeployment {
  id: string;
  merchantId: string;
  deploymentType: DeploymentType;
  subdomain?: string; // e.g., "merchant1"
  customDomain?: string; // e.g., "shop.example.com"
  deploymentStatus: DeploymentStatus;
  deploymentUrl: string; // Full URL
  deploymentProvider?: "custom";

  deploymentId?: string; // Provider's deployment ID (dpl_xxx)
  environmentVariables: Record<string, string>;
  lastDeployedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Merchant Database Configuration
 */
export interface MerchantDatabase {
  id: string;
  merchantId: string;
  databaseName: string; // e.g., "merchant1_db" or use shared DB
  connectionString?: string; // Encrypted, if separate DB
  useSharedDatabase: boolean; // true = shared DB with merchantId, false = separate DB
  status: "active" | "inactive";
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Default merchant settings
 */
export const defaultMerchantSettings = {
  brandName: "My Store",
  currency: "USD",
  timezone: "UTC",
};
