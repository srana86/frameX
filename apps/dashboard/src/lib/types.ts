// Shared types for super admin

export type MerchantStatus = "active" | "suspended" | "trial" | "inactive";
export type DeploymentStatus = "pending" | "active" | "failed" | "inactive";

export interface Merchant {
  id: string;
  name: string;
  email: string;
  phone?: string;
  status: MerchantStatus;
  customDomain?: string;
  deploymentUrl?: string;
  subscriptionId?: string;
  settings?: {
    brandName?: string;
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

export interface MerchantDeployment {
  id: string;
  merchantId: string;
  deploymentType: "subdomain" | "custom_domain";
  deploymentStatus: DeploymentStatus;
  deploymentUrl: string;
  deploymentProvider?: string;
  createdAt?: string;
}

