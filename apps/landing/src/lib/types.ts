// Shared types for super admin

export type TenantStatus = "active" | "suspended" | "trial" | "inactive";
export type DeploymentStatus = "pending" | "active" | "failed" | "inactive";

export interface Tenant {
  id: string;
  name: string;
  email: string;
  phone?: string;
  status: TenantStatus;
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

export interface TenantDeployment {
  id: string;
  tenantId: string;
  deploymentType: "subdomain" | "custom_domain";
  deploymentStatus: DeploymentStatus;
  deploymentUrl: string;
  deploymentProvider?: string;
  createdAt?: string;
}

export interface HeroSlide {
  id?: string;
  image: string;
  mobileImage?: string;
  title?: string;
  subtitle?: string;
  description?: string;
  buttonText?: string;
  buttonLink?: string;
  textPosition?: "left" | "center" | "right";
  textColor?: string;
  overlay?: boolean;
  overlayOpacity?: number;
  order?: number;
  enabled?: boolean;
}

