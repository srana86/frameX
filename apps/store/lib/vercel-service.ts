// Vercel Deployment Management Service
// Handles automatic deployment of merchant instances to Vercel
// Uses official @vercel/sdk for better reliability and type safety

import { Vercel } from "@vercel/sdk";

// Load environment variables from .env file
import { getGitHubRepo } from "./env-utils";

const VERCEL_TOKEN = process.env.VERCEL_TOKEN || "";
const VERCEL_TEAM_ID = process.env.VERCEL_TEAM_ID || "";
const GITHUB_REPO = getGitHubRepo() || process.env.GITHUB_REPO || ""; // e.g., "username/shoestore"

// Initialize Vercel SDK
const vercel = new Vercel({
  bearerToken: VERCEL_TOKEN,
});

export interface VercelProject {
  id: string;
  name: string;
  accountId: string;
  updatedAt: number;
}

export interface VercelDeployment {
  id: string;
  url: string;
  name: string;
  state: "BUILDING" | "READY" | "ERROR" | "CANCELED" | "INITIALIZING";
  createdAt: number;
}

export interface VercelDomain {
  name: string;
  verified: boolean;
  verification: {
    type: string;
    domain: string;
    value: string;
  }[];
}

/**
 * Create a new Vercel project for merchant
 */
export async function createVercelProject(merchantId: string, merchantName: string): Promise<VercelProject> {
  try {
    if (!VERCEL_TOKEN) {
      throw new Error("VERCEL_TOKEN is not configured");
    }

    const projectName = `merchant-${merchantId}`.toLowerCase().replace(/[^a-z0-9-]/g, "-");

    // Use SDK to create project
    const projectBody: any = {
      name: projectName,
      framework: "nextjs",
    };

    // Add git repository if available
    if (GITHUB_REPO) {
      const repoParts = GITHUB_REPO.split("/");
      if (repoParts.length === 2) {
        const [org, repo] = repoParts;
        projectBody.gitRepository = {
          type: "github",
          repo: repo,
        };
      } else {
        console.warn(`[Vercel] Invalid GITHUB_REPO format: ${GITHUB_REPO}. Expected: org/repo`);
      }
    }

    const project = await vercel.projects.createProject({
      requestBody: projectBody,
      teamId: VERCEL_TEAM_ID || undefined,
    });

    // Set initial environment variables
    if (project.id) {
      await vercel.projects.createProjectEnv({
        idOrName: project.id,
        upsert: "true",
        requestBody: [
          {
            key: "MERCHANT_ID",
            value: merchantId,
            target: ["production", "preview", "development"],
            type: "encrypted",
          },
        ],
        teamId: VERCEL_TEAM_ID || undefined,
      });
    }

    return {
      id: project.id,
      name: project.name,
      accountId: project.accountId || "",
      updatedAt: project.updatedAt || Date.now(),
    };
  } catch (error: any) {
    console.error("Error creating Vercel project:", error);
    throw new Error(`Failed to create Vercel project: ${error.message}`);
  }
}

/**
 * Deploy merchant instance to Vercel
 */
export async function deployToVercel(
  projectId: string,
  merchantId: string,
  databaseName: string,
  connectionString: string
): Promise<VercelDeployment> {
  try {
    if (!VERCEL_TOKEN) {
      throw new Error("VERCEL_TOKEN is not configured");
    }

    // Set environment variables first
    // MONGODB_DB is set to same value as MERCHANT_DB_NAME to ensure consistency
    const envVars: Record<string, string> = {
      MERCHANT_ID: merchantId,
      MERCHANT_DB_NAME: databaseName,
      MONGODB_DB: databaseName, // Same as MERCHANT_DB_NAME
      MONGODB_URI: connectionString,
      NEXT_PUBLIC_MERCHANT_ID: merchantId,
    };

    // Add SUPER_ADMIN_URL (hardcoded for Vercel deployments)
    const superAdminUrl = "https://framextech.com";
    envVars.NEXT_PUBLIC_SUPER_ADMIN_URL = superAdminUrl;
    envVars.SUPER_ADMIN_URL = superAdminUrl; // Also set non-prefixed version for compatibility

    await setVercelEnvironmentVariables(projectId, envVars);

    // Create deployment using SDK
    const deploymentBody: any = {
      name: projectId,
      project: projectId,
      target: "production",
    };

    // Add git source if GitHub repo is configured
    if (GITHUB_REPO) {
      const repoParts = GITHUB_REPO.split("/");
      if (repoParts.length === 2) {
        const [org, repo] = repoParts;
        deploymentBody.gitSource = {
          type: "github",
          repo: repo,
          ref: "main",
          org: org,
        };
      } else {
        console.warn(`[Vercel] Invalid GITHUB_REPO format: ${GITHUB_REPO}. Expected: org/repo`);
      }
    }

    // If no git source, provide empty files array (Vercel requires either gitSource or files)
    if (!deploymentBody.gitSource) {
      deploymentBody.files = [];
      console.warn(
        "[Vercel] No gitSource configured. Using empty files array. Project should be connected to GitHub for automatic deployments."
      );
    }

    const deployment = await vercel.deployments.createDeployment({
      requestBody: deploymentBody,
      teamId: VERCEL_TEAM_ID || undefined,
    });

    return {
      id: deployment.id,
      url: deployment.url || `${projectId}.vercel.app`,
      name: deployment.name || projectId,
      state: (deployment.readyState as any) || "BUILDING",
      createdAt: deployment.createdAt || Date.now(),
    };
  } catch (error: any) {
    console.error("Error deploying to Vercel:", error);
    throw new Error(`Failed to deploy: ${error.message}`);
  }
}

/**
 * Deploy and wait for completion
 */
export async function deployAndWait(
  projectId: string,
  merchantId: string,
  databaseName: string,
  connectionString: string
): Promise<VercelDeployment> {
  try {
    // Create deployment
    const deployment = await deployToVercel(projectId, merchantId, databaseName, connectionString);
    const deploymentId = deployment.id;

    // Wait for deployment to complete
    let deploymentStatus = deployment.state;
    let deploymentURL = deployment.url;

    while (deploymentStatus === "BUILDING" || deploymentStatus === "INITIALIZING") {
      await new Promise((resolve) => setTimeout(resolve, 5000)); // Wait 5 seconds

      const statusResponse = await vercel.deployments.getDeployment({
        idOrUrl: deploymentId,
        withGitRepoInfo: "true",
        teamId: VERCEL_TEAM_ID || undefined,
      });

      deploymentStatus = (statusResponse.readyState as any) || "BUILDING";
      deploymentURL = statusResponse.url || deploymentURL;

      console.log(`Deployment status: ${deploymentStatus}`);
    }

    if (deploymentStatus === "READY") {
      console.log(`Deployment successful. URL: ${deploymentURL}`);
      return {
        ...deployment,
        state: "READY",
        url: deploymentURL,
      };
    } else {
      throw new Error(`Deployment failed with status: ${deploymentStatus}`);
    }
  } catch (error: any) {
    console.error("Error in deployAndWait:", error);
    throw error;
  }
}

/**
 * Set environment variables for Vercel project
 */
export async function setVercelEnvironmentVariables(projectId: string, variables: Record<string, string>): Promise<void> {
  try {
    if (!VERCEL_TOKEN) {
      throw new Error("VERCEL_TOKEN is not configured");
    }

    // Set environment variables one by one (SDK requires individual calls or array format)
    const envVars = Object.entries(variables).map(([key, value]) => ({
      key,
      value,
      type: "encrypted" as const,
      target: ["production", "preview", "development"],
    }));

    // Use SDK to set environment variables (upsert mode)
    await vercel.projects.createProjectEnv({
      idOrName: projectId,
      upsert: "true",
      requestBody: envVars as any, // SDK type is complex, using any for now
      teamId: VERCEL_TEAM_ID || undefined,
    });

    console.log(`✅ Set ${envVars.length} environment variables for project ${projectId}`);
  } catch (error: any) {
    console.error("Error setting environment variables:", error);
    throw error;
  }
}

/**
 * Configure custom domain for Vercel project
 * Handles the case where domain is already in use by another project
 */
export async function configureVercelDomain(
  projectId: string,
  domain: string,
  redirect?: string,
  redirectStatusCode?: 301 | 302
): Promise<VercelDomain> {
  try {
    if (!VERCEL_TOKEN) {
      throw new Error("VERCEL_TOKEN is not configured");
    }

    // Add domain using SDK
    const domainResponse = await vercel.projects.addProjectDomain({
      idOrName: projectId,
      requestBody: {
        name: domain,
        ...(redirect && { redirect, redirectStatusCode: redirectStatusCode || 301 }),
      },
      teamId: VERCEL_TEAM_ID || undefined,
    });

    return {
      name: domainResponse.name,
      verified: domainResponse.verified || false,
      verification: domainResponse.verification || [],
    };
  } catch (error: any) {
    console.error("Error configuring domain:", error);
    
    // Handle domain_already_in_use error (409)
    if (error.message?.includes("domain_already_in_use") || error.status === 409) {
      // Try to parse the error to get the old project ID
      let oldProjectId: string | null = null;
      try {
        // Error body might contain the projectId
        const errorBody = JSON.parse(error.body || "{}");
        oldProjectId = errorBody?.error?.projectId || errorBody?.error?.domain?.projectId;
      } catch {
        // Try to extract from error message
        const match = error.message?.match(/prj_[a-zA-Z0-9]+/);
        if (match) {
          oldProjectId = match[0];
        }
      }

      // If domain is already on the same project, just return success
      if (oldProjectId === projectId) {
        console.log(`Domain ${domain} is already configured on this project`);
        // Get existing domain info
        const domains = await getProjectDomains(projectId);
        const existingDomain = domains.find(d => d.name === domain);
        if (existingDomain) {
          return existingDomain;
        }
      }

      // If we found the old project, remove domain from it first
      if (oldProjectId && oldProjectId !== projectId) {
        console.log(`Removing domain ${domain} from old project ${oldProjectId}...`);
        const removed = await removeVercelDomain(oldProjectId, domain);
        
        if (removed) {
          console.log(`Successfully removed domain from old project. Adding to new project...`);
          // Wait a moment for Vercel to process the removal
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Try adding domain again
          const retryResponse = await vercel.projects.addProjectDomain({
            idOrName: projectId,
            requestBody: {
              name: domain,
              ...(redirect && { redirect, redirectStatusCode: redirectStatusCode || 301 }),
            },
            teamId: VERCEL_TEAM_ID || undefined,
          });

          return {
            name: retryResponse.name,
            verified: retryResponse.verified || false,
            verification: retryResponse.verification || [],
          };
        }
      }
    }
    
    throw new Error(`Failed to configure domain: ${error.message}`);
  }
}

/**
 * Get domain configuration from Vercel
 */
export async function getVercelDomainConfig(domain: string): Promise<{
  verified: boolean;
  misconfigured: boolean;
  verification?: any[];
} | null> {
  try {
    if (!VERCEL_TOKEN) {
      throw new Error("VERCEL_TOKEN is not configured");
    }

    const domainConfig = await vercel.domains.getDomainConfig({
      domain,
    });

    // Vercel SDK response structure may vary, use type assertion
    const config = domainConfig as any;

    return {
      verified: config.verified === true || false,
      misconfigured: config.misconfigured === true || false,
      verification: config.verification || [],
    };
  } catch (error: any) {
    console.error("Error getting domain config:", error);
    return null;
  }
}

/**
 * Configure domain with redirect
 */
export async function configureDomainWithRedirect(
  projectId: string,
  mainDomain: string,
  subDomain?: string
): Promise<{ main: VercelDomain; sub?: VercelDomain }> {
  try {
    // Add main domain
    const mainDomainResponse = await vercel.projects.addProjectDomain({
      idOrName: projectId,
      requestBody: {
        name: mainDomain,
      },
      teamId: VERCEL_TEAM_ID || undefined,
    });

    const main: VercelDomain = {
      name: mainDomainResponse.name,
      verified: mainDomainResponse.verified || false,
      verification: mainDomainResponse.verification || [],
    };

    // Check domain configuration
    const domainConfig = await vercel.domains.getDomainConfig({
      domain: mainDomain,
    });

    let sub: VercelDomain | undefined;

    // If main domain is verified and subdomain is provided, add redirect
    if (main.verified && !domainConfig.misconfigured && subDomain) {
      const subDomainResponse = await vercel.projects.addProjectDomain({
        idOrName: projectId,
        requestBody: {
          name: subDomain,
          redirect: `https://${mainDomain}`,
          redirectStatusCode: 301,
        },
        teamId: VERCEL_TEAM_ID || undefined,
      });

      sub = {
        name: subDomainResponse.name,
        verified: subDomainResponse.verified || false,
        verification: subDomainResponse.verification || [],
      };
    }

    return { main, sub };
  } catch (error: any) {
    console.error("Error configuring domain with redirect:", error);
    throw error;
  }
}

/**
 * Get deployment status
 */
export async function getDeploymentStatus(deploymentId: string): Promise<VercelDeployment> {
  try {
    if (!VERCEL_TOKEN) {
      throw new Error("VERCEL_TOKEN is not configured");
    }

    const deployment = await vercel.deployments.getDeployment({
      idOrUrl: deploymentId,
      withGitRepoInfo: "true",
      teamId: VERCEL_TEAM_ID || undefined,
    });

    return {
      id: deployment.id,
      url: deployment.url || "",
      name: deployment.name || "",
      state: (deployment.readyState as any) || "BUILDING",
      createdAt: deployment.createdAt || Date.now(),
    };
  } catch (error: any) {
    console.error("Error getting deployment status:", error);
    throw error;
  }
}

/**
 * Get project domains
 */
export async function getProjectDomains(projectId: string): Promise<VercelDomain[]> {
  try {
    if (!VERCEL_TOKEN) {
      throw new Error("VERCEL_TOKEN is not configured");
    }

    const domains = await vercel.projects.getProjectDomains({
      idOrName: projectId,
      teamId: VERCEL_TEAM_ID || undefined,
    });

    // Handle both array and object response types
    const domainsArray = Array.isArray(domains) ? domains : (domains as any).domains || [];

    return domainsArray.map((domain: any) => ({
      name: domain.name,
      verified: domain.verified || false,
      verification: domain.verification || [],
    }));
  } catch (error: any) {
    console.error("Error getting project domains:", error);
    return [];
  }
}

/**
 * Remove domain from project
 */
export async function removeVercelDomain(projectId: string, domain: string): Promise<boolean> {
  try {
    if (!VERCEL_TOKEN) {
      throw new Error("VERCEL_TOKEN is not configured");
    }

    await vercel.projects.removeProjectDomain({
      idOrName: projectId,
      domain,
      teamId: VERCEL_TEAM_ID || undefined,
    });

    return true;
  } catch (error) {
    console.error("Error removing domain:", error);
    return false;
  }
}

/**
 * Create deployment alias
 */
export async function createDeploymentAlias(deploymentId: string, alias: string): Promise<string> {
  try {
    if (!VERCEL_TOKEN) {
      throw new Error("VERCEL_TOKEN is not configured");
    }

    const aliasResponse = await vercel.aliases.assignAlias({
      id: deploymentId,
      requestBody: {
        alias,
        redirect: null,
      },
      teamId: VERCEL_TEAM_ID || undefined,
    });

    return aliasResponse.alias || alias;
  } catch (error: any) {
    console.error("Error creating deployment alias:", error);
    throw error;
  }
}

/**
 * List account integrations (GitHub, etc.)
 */
export async function listAccountIntegrations(): Promise<any[]> {
  try {
    if (!VERCEL_TOKEN) {
      throw new Error("VERCEL_TOKEN is not configured");
    }

    const integrations = await vercel.integrations.getConfigurations({
      view: "account",
      teamId: VERCEL_TEAM_ID || undefined,
    });

    return integrations;
  } catch (error: any) {
    console.error("Error listing integrations:", error);
    return [];
  }
}
