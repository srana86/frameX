export interface Tenant {
  id: string;
  name: string;
  email: string;
  status: "ACTIVE" | "INACTIVE" | "TRIAL" | "SUSPENDED";
  createdAt: string;
  updatedAt: string;
}

export interface TenantDeployment {
  id: string;
  tenantId: string;
  deploymentType: "subdomain" | "custom" | "local";
  subdomain?: string;
  customDomain?: string;
  deploymentStatus: "active" | "pending" | "failed" | "inactive";
  deploymentUrl: string;
  deploymentProvider: "vercel" | "local" | "other";
  projectId?: string;
  deploymentId: string;
  environmentVariables: Record<string, string>;
  lastDeployedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface TenantDatabase {
  id: string;
  tenantId: string;
  databaseName: string;
  connectionString?: string;
  useSharedDatabase: boolean;
  status: "active" | "pending" | "failed";
  createdAt: string;
  updatedAt: string;
}

export interface TenantSubscription {
  id: string;
  tenantId: string;
  planId: string;
  status: "ACTIVE" | "TRIAL" | "EXPIRED" | "CANCELLED" | "GRACE_PERIOD";
  currentPeriodStart: string;
  currentPeriodEnd: string;
  trialEndsAt?: string;
  cancelAtPeriodEnd: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TenantFullData {
  tenant: Tenant;
  subscription: TenantSubscription | null;
  deployment: TenantDeployment | null;
  database: TenantDatabase | null;
}


