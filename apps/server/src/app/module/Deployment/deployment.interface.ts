export type DeploymentType = "subdomain" | "custom_domain" | "local";
export type DeploymentStatus = "pending" | "active" | "failed" | "inactive";
export type DeploymentProvider = "vercel" | "local" | "other";

export interface IDeployment {
  id: string;
  merchantId: string;
  deploymentType: DeploymentType;
  subdomain?: string;
  deploymentStatus: DeploymentStatus;
  deploymentUrl: string;
  deploymentProvider?: DeploymentProvider;
  projectId?: string; // Vercel project ID
  deploymentId?: string; // Vercel deployment ID
  environmentVariables?: Record<string, string>;
  lastDeployedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}
