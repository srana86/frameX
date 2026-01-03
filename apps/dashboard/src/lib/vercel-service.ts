// Vercel Deployment Management Service for Super Admin
// Handles automatic deployment of merchant instances to Vercel

import { Vercel } from "@vercel/sdk";

const VERCEL_TOKEN = process.env.VERCEL_TOKEN || "";
const VERCEL_TEAM_ID = process.env.VERCEL_TEAM_ID || "";
const GITHUB_REPO = process.env.GITHUB_REPO || "";
const BASE_DOMAIN = process.env.BASE_DOMAIN || "framextech.com";

// Super Admin URL for merchant apps to call central APIs
const SUPER_ADMIN_URL = process.env.NEXT_PUBLIC_SUPER_ADMIN_URL || process.env.SUPER_ADMIN_URL || "";

// Cloudinary credentials (shared with merchant apps via SUPER_ADMIN_URL)
const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME || "";

// JWT Secret for auth
const JWT_SECRET = process.env.JWT_SECRET || "";

// Encryption key for sensitive data
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || "";

// FraudShield API
const FRAUDSHIELD_API_KEY = process.env.FRAUDSHIELD_API_KEY || "";
const FRAUDSHIELD_API_BASE_URL = process.env.FRAUDSHIELD_API_BASE_URL || "https://fraudshieldbd.site";

// Courier credentials for fraud check
const PATHAO_USER = process.env.PATHAO_USER || "";
const PATHAO_PASSWORD = process.env.PATHAO_PASSWORD || "";
const REDX_PHONE = process.env.REDX_PHONE || "";
const REDX_PASSWORD = process.env.REDX_PASSWORD || "";
const STEADFAST_USER = process.env.STEADFAST_USER || "";
const STEADFAST_PASSWORD = process.env.STEADFAST_PASSWORD || "";

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

/**
 * Build environment variables array for merchant deployment
 * Includes all necessary configs from super-admin
 */
function buildMerchantEnvVars(merchantId: string, databaseName: string, connectionString: string) {
  const envVars: Array<{ key: string; value: string }> = [
    // Core merchant identification
    { key: "MERCHANT_ID", value: merchantId },
    { key: "NEXT_PUBLIC_MERCHANT_ID", value: merchantId },
    { key: "SUPER_ADMIN_URL", value: "https://framextech.com" },
    // Database configuration
    { key: "MERCHANT_DB_NAME", value: databaseName },
    { key: "MONGODB_DB", value: databaseName },
    { key: "MONGODB_URI", value: connectionString },
  ];

  return envVars;
}

/**
 * Generate a subdomain for a merchant
 * Format: {subdomain}.framextech.com
 */
export function generateSubdomain(merchantId: string, subdomainPrefix?: string): string {
  const prefix = subdomainPrefix || `merchant-${merchantId}`.toLowerCase().replace(/[^a-z0-9-]/g, "-");
  return `${prefix}.${BASE_DOMAIN}`;
}

export async function createVercelProject(merchantId: string, merchantName: string): Promise<VercelProject> {
  if (!VERCEL_TOKEN) {
    throw new Error("VERCEL_TOKEN is not configured");
  }

  const projectName = `merchant-${merchantId}`.toLowerCase().replace(/[^a-z0-9-]/g, "-");
  const projectBody: any = {
    name: projectName,
    framework: "nextjs",
  };

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

  return {
    id: project.id,
    name: project.name,
    accountId: project.accountId || "",
    updatedAt: project.updatedAt || Date.now(),
  };
}

export async function deployToVercel(
  projectId: string,
  merchantId: string,
  databaseName: string,
  connectionString: string
): Promise<VercelDeployment> {
  if (!VERCEL_TOKEN) {
    throw new Error("VERCEL_TOKEN is not configured");
  }

  // Build environment variables array with all necessary configs
  const envVars = buildMerchantEnvVars(merchantId, databaseName, connectionString);

  console.log(`[Vercel] Setting ${envVars.length} environment variables for project ${projectId}`);

  await vercel.projects.createProjectEnv({
    idOrName: projectId,
    upsert: "true",
    requestBody: envVars.map(({ key, value }) => ({
      key,
      value,
      type: "encrypted" as const,
      target: ["production", "preview", "development"],
    })) as any,
    teamId: VERCEL_TEAM_ID || undefined,
  });

  // Create deployment
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
    state: (deployment.readyState as any) || "QUEUED",
    createdAt: deployment.createdAt || Date.now(),
  };
}

export async function deployAndWait(
  projectId: string,
  merchantId: string,
  databaseName: string,
  connectionString: string
): Promise<VercelDeployment> {
  if (!VERCEL_TOKEN) {
    throw new Error("VERCEL_TOKEN is not configured");
  }

  // Build environment variables array with all necessary configs
  const envVars = buildMerchantEnvVars(merchantId, databaseName, connectionString);

  console.log(`[Vercel] Setting ${envVars.length} environment variables for project ${projectId}`);

  await vercel.projects.createProjectEnv({
    idOrName: projectId,
    upsert: "true",
    requestBody: envVars.map(({ key, value }) => ({
      key,
      value,
      type: "encrypted" as const,
      target: ["production", "preview", "development"],
    })) as any,
    teamId: VERCEL_TEAM_ID || undefined,
  });

  // Create deployment
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
      // If format is incorrect, log warning but continue
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

  // Wait for deployment (handle QUEUED, INITIALIZING, BUILDING, etc.)
  let status = (deployment.readyState as any) || "QUEUED";
  let url = deployment.url || "";
  let attempts = 0;
  const maxAttempts = 120; // 10 minutes max (120 * 5 seconds)

  while (status === "QUEUED" || status === "BUILDING" || status === "INITIALIZING" || status === "PENDING") {
    attempts++;
    if (attempts > maxAttempts) {
      throw new Error(`Deployment timeout after ${maxAttempts * 5} seconds. Last status: ${status}`);
    }

    await new Promise((resolve) => setTimeout(resolve, 5000)); // Wait 5 seconds

    const statusResponse = await vercel.deployments.getDeployment({
      idOrUrl: deployment.id,
      withGitRepoInfo: "true",
      teamId: VERCEL_TEAM_ID || undefined,
    });
    status = (statusResponse.readyState as any) || status;
    url = statusResponse.url || url;

    console.log(`[Vercel] Deployment status: ${status} (attempt ${attempts})`);
  }

  if (status !== "READY") {
    throw new Error(`Deployment failed with status: ${status}`);
  }

  return {
    id: deployment.id,
    url: url || `${projectId}.vercel.app`,
    name: deployment.name || projectId,
    state: "READY",
    createdAt: deployment.createdAt || Date.now(),
  };
}

export async function getDeploymentStatus(deploymentId: string): Promise<VercelDeployment> {
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
}

export interface VercelDomain {
  name: string;
  verified: boolean;
  verification?: any[];
}

/**
 * Add a custom subdomain to a Vercel project
 * Example: merchant1.framextech.com
 */
export interface VercelDomainWithConfig extends VercelDomain {
  cnameValue?: string;
  dnsRecords?: Array<{
    type: string;
    name: string;
    value: string;
  }>;
  usingVercelDNS?: boolean;
  dnsAutoConfigured?: boolean;
}

/**
 * Check if a domain is using Vercel DNS
 * Returns true if the domain's nameservers point to Vercel
 * When using Vercel DNS, adding a domain to a project automatically configures DNS
 */
export async function isUsingVercelDNS(domain: string): Promise<boolean> {
  if (!VERCEL_TOKEN) {
    return false;
  }

  try {
    // Get root domain (e.g., "framextech.com" from "merchant1.framextech.com")
    const domainParts = domain.split(".");
    const rootDomain = domainParts.slice(-2).join("."); // Get last two parts

    // Get domain configuration to check nameservers
    try {
      const domainConfig = await vercel.domains.getDomainConfig({
        domain: rootDomain,
      });

      const configAny = domainConfig as any;

      // Check if nameservers are set to Vercel
      // Vercel DNS uses nameservers like ns1.vercel-dns.com, ns2.vercel-dns.com
      if (configAny.nameservers && Array.isArray(configAny.nameservers)) {
        const vercelNameservers = configAny.nameservers.some((ns: string) => ns.includes("vercel-dns.com"));
        if (vercelNameservers) {
          console.log(`[Vercel] Domain ${rootDomain} is using Vercel DNS`);
          return true;
        }
      }

      // Also check if domain is verified and misconfigured is false
      // This often indicates Vercel DNS is being used
      if (configAny.verified && !configAny.misconfigured) {
        console.log(`[Vercel] Domain ${rootDomain} appears to be using Vercel DNS (verified and not misconfigured)`);
        return true;
      }
    } catch (configError: any) {
      // If we can't get config for root domain, try the subdomain itself
      try {
        const subdomainConfig = await vercel.domains.getDomainConfig({
          domain: domain,
        });
        const subConfigAny = subdomainConfig as any;
        if (subConfigAny.verified && !subConfigAny.misconfigured) {
          console.log(`[Vercel] Subdomain ${domain} appears to be using Vercel DNS`);
          return true;
        }
      } catch (subError) {
        console.log(`[Vercel] Could not check DNS configuration for ${domain}`);
      }
    }

    return false;
  } catch (error: any) {
    console.warn(`[Vercel] Error checking Vercel DNS status: ${error.message}`);
    return false;
  }
}

export async function addVercelSubdomain(projectId: string, subdomain: string): Promise<VercelDomainWithConfig> {
  if (!VERCEL_TOKEN) {
    throw new Error("VERCEL_TOKEN is not configured");
  }

  try {
    // Validate subdomain format
    const subdomainRegex = /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(\.[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)*\.[a-z]{2,}$/i;
    if (!subdomainRegex.test(subdomain)) {
      throw new Error(`Invalid subdomain format: ${subdomain}`);
    }

    console.log(`[Vercel] Adding subdomain ${subdomain} to project ${projectId}`);

    // Check if domain is using Vercel DNS
    const usingVercelDNS = await isUsingVercelDNS(subdomain);
    console.log(`[Vercel] Domain ${subdomain} using Vercel DNS: ${usingVercelDNS}`);

    // Add domain to project
    const domainResponse = await vercel.projects.addProjectDomain({
      idOrName: projectId,
      requestBody: {
        name: subdomain,
      },
      teamId: VERCEL_TEAM_ID || undefined,
    });

    console.log(`[Vercel] Domain added: ${domainResponse.name}, Verified: ${domainResponse.verified}`);

    // If using Vercel DNS, DNS is automatically configured
    let dnsAutoConfigured = false;
    if (usingVercelDNS) {
      dnsAutoConfigured = true;
      console.log(`[Vercel] ✅ DNS automatically configured (using Vercel DNS)`);
    }

    // Get domain configuration to retrieve DNS records
    let cnameValue = "cname.vercel-dns.com"; // Default fallback
    let dnsRecords: Array<{ type: string; name: string; value: string }> = [];

    try {
      const domainConfig = await vercel.domains.getDomainConfig({
        domain: subdomain,
      });

      console.log(`[Vercel] Domain config retrieved:`, JSON.stringify(domainConfig, null, 2));

      // Extract CNAME value from verification records or domain config
      // Vercel typically provides verification records with the CNAME value
      if (domainResponse.verification && Array.isArray(domainResponse.verification)) {
        const cnameRecord = domainResponse.verification.find((record: any) => record.type === "cname" || record.type === "CNAME");
        if (cnameRecord && cnameRecord.value) {
          cnameValue = cnameRecord.value;
          console.log(`[Vercel] Found CNAME value from verification: ${cnameValue}`);
        }
      }

      // Check domain config for DNS records
      const configAny = domainConfig as any;

      // Vercel's domain config may contain records array or verification array
      if (configAny.records && Array.isArray(configAny.records)) {
        // Use records from domain config
        dnsRecords = configAny.records
          .filter((record: any) => record.type === "CNAME" || record.type === "cname")
          .map((record: any) => ({
            type: "CNAME",
            name: record.name || subdomain.split(".")[0],
            value: record.value || cnameValue,
          }));

        // Update cnameValue if found in records
        if (dnsRecords.length > 0 && dnsRecords[0].value) {
          cnameValue = dnsRecords[0].value;
        }
      } else if (configAny.verification && Array.isArray(configAny.verification)) {
        // Extract from verification array in domain config
        const verificationRecord = configAny.verification.find((record: any) => record.type === "cname" || record.type === "CNAME");
        if (verificationRecord && verificationRecord.value) {
          cnameValue = verificationRecord.value;
          console.log(`[Vercel] Found CNAME value from domain config verification: ${cnameValue}`);
        }
      }

      // Generate CNAME record if not found in config
      if (dnsRecords.length === 0) {
        const subdomainName = subdomain.split(".")[0];
        dnsRecords = [
          {
            type: "CNAME",
            name: subdomainName,
            value: cnameValue,
          },
        ];
        console.log(`[Vercel] Generated default CNAME record: ${subdomainName} -> ${cnameValue}`);
      }

      console.log(`[Vercel] DNS records:`, dnsRecords);
    } catch (configError: any) {
      console.warn(`[Vercel] Could not get domain config: ${configError.message}`);
      // Use default CNAME record
      const subdomainName = subdomain.split(".")[0];
      dnsRecords = [
        {
          type: "CNAME",
          name: subdomainName,
          value: cnameValue,
        },
      ];
    }

    return {
      name: domainResponse.name,
      verified: domainResponse.verified || false,
      verification: domainResponse.verification || [],
      cnameValue: cnameValue,
      dnsRecords: dnsRecords,
      usingVercelDNS: usingVercelDNS,
      dnsAutoConfigured: dnsAutoConfigured,
    };
  } catch (error: any) {
    console.error(`[Vercel] Error adding subdomain ${subdomain}:`, error);
    throw new Error(`Failed to add subdomain: ${error.message}`);
  }
}

/**
 * Get all domains configured for a project
 */
export async function getProjectDomains(projectId: string): Promise<VercelDomain[]> {
  if (!VERCEL_TOKEN) {
    throw new Error("VERCEL_TOKEN is not configured");
  }

  try {
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
    console.error(`[Vercel] Error getting project domains:`, error);
    throw new Error(`Failed to get project domains: ${error.message}`);
  }
}

export interface DNSInstructions {
  type: "CNAME" | "A";
  name: string;
  value: string;
  ttl?: number;
}

/**
 * Get DNS configuration instructions for a domain
 * Uses Vercel's domain config API to get accurate DNS records
 */
export async function getDomainDNSInstructions(domain: string): Promise<DNSInstructions[]> {
  if (!VERCEL_TOKEN) {
    throw new Error("VERCEL_TOKEN is not configured");
  }

  try {
    // Get domain configuration from Vercel
    const domainConfig = await vercel.domains.getDomainConfig({
      domain: domain,
    });

    console.log(`[Vercel] Domain config for ${domain}:`, JSON.stringify(domainConfig, null, 2));

    const dnsRecords: DNSInstructions[] = [];

    // Extract subdomain name (e.g., "merchant1" from "merchant1.framextech.com")
    const subdomainParts = domain.split(".");
    const subdomainName = subdomainParts[0];

    // Get CNAME value from domain config or verification records
    let cnameValue = "cname.vercel-dns.com"; // Default fallback

    // Check if domain config has records
    // Vercel's getDomainConfig response structure may vary
    const configAny = domainConfig as any;
    if (configAny.records && Array.isArray(configAny.records)) {
      // Use records from Vercel's response
      configAny.records.forEach((record: any) => {
        if (record.type === "CNAME" || record.type === "cname") {
          dnsRecords.push({
            type: "CNAME",
            name: record.name || subdomainName,
            value: record.value || cnameValue,
            ttl: record.ttl || 3600,
          });
          cnameValue = record.value || cnameValue;
        }
      });
    }

    // If no records found, create default CNAME record
    if (dnsRecords.length === 0) {
      // Try to get from verification if available
      // This would require getting the domain from project first
      dnsRecords.push({
        type: "CNAME",
        name: subdomainName,
        value: cnameValue,
        ttl: 3600,
      });
    }

    console.log(`[Vercel] DNS instructions for ${domain}:`, dnsRecords);
    return dnsRecords;
  } catch (error: any) {
    console.error(`[Vercel] Error getting DNS instructions for ${domain}:`, error);
    // Return default CNAME record if API call fails
    const subdomainParts = domain.split(".");
    if (subdomainParts.length >= 2) {
      return [
        {
          type: "CNAME",
          name: subdomainParts[0],
          value: "cname.vercel-dns.com",
          ttl: 3600,
        },
      ];
    }
    throw new Error(`Failed to get DNS instructions: ${error.message}`);
  }
}

/**
 * Configure custom domain for a Vercel project
 * Handles domain_already_in_use by removing from old project first
 */
export async function configureVercelDomain(
  projectId: string,
  domain: string,
  redirect?: string,
  redirectStatusCode?: 301 | 302
): Promise<VercelDomainWithConfig> {
  if (!VERCEL_TOKEN) {
    throw new Error("VERCEL_TOKEN is not configured");
  }

  try {
    console.log(`[Vercel] Configuring domain ${domain} for project ${projectId}`);

    // Add domain using SDK
    const domainResponse = await vercel.projects.addProjectDomain({
      idOrName: projectId,
      requestBody: {
        name: domain,
        ...(redirect && { redirect, redirectStatusCode: redirectStatusCode || 301 }),
      },
      teamId: VERCEL_TEAM_ID || undefined,
    });

    console.log(`[Vercel] Domain configured: ${domainResponse.name}, Verified: ${domainResponse.verified}`);

    // Get DNS records
    let dnsRecords: Array<{ type: string; name: string; value: string }> = [];
    const domainParts = domain.split(".");
    const isApex = domainParts.length === 2; // e.g., example.com (no subdomain)

    if (isApex) {
      // For apex domains, use A record pointing to Vercel's IP
      dnsRecords = [{ type: "A", name: "@", value: "216.150.1.1" }];
    } else {
      // For subdomains, use CNAME
      dnsRecords = [{ type: "CNAME", name: domainParts[0], value: "cname.vercel-dns.com" }];
    }

    return {
      name: domainResponse.name,
      verified: domainResponse.verified || false,
      verification: domainResponse.verification || [],
      dnsRecords,
    };
  } catch (error: any) {
    console.error(`[Vercel] Error configuring domain:`, error);

    // Handle domain_already_in_use error (409)
    if (error.message?.includes("domain_already_in_use") || error.status === 409) {
      let oldProjectId: string | null = null;

      // Try to parse the error to get the old project ID
      try {
        const errorBody = JSON.parse(error.body || "{}");
        oldProjectId = errorBody?.error?.projectId || errorBody?.error?.domain?.projectId;
      } catch {
        const match = error.message?.match(/prj_[a-zA-Z0-9]+/);
        if (match) {
          oldProjectId = match[0];
        }
      }

      // If domain is already on the same project, return success
      if (oldProjectId === projectId) {
        console.log(`[Vercel] Domain ${domain} is already on this project`);
        const domains = await getProjectDomains(projectId);
        const existingDomain = domains.find((d) => d.name === domain);
        if (existingDomain) {
          const domainParts = domain.split(".");
          const isApex = domainParts.length === 2;
          return {
            ...existingDomain,
            dnsRecords: isApex
              ? [{ type: "A", name: "@", value: "216.150.1.1" }]
              : [{ type: "CNAME", name: domainParts[0], value: "cname.vercel-dns.com" }],
          };
        }
      }

      // Remove domain from old project and retry
      if (oldProjectId && oldProjectId !== projectId) {
        console.log(`[Vercel] Removing domain ${domain} from old project ${oldProjectId}...`);
        await removeVercelDomain(oldProjectId, domain);
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // Retry adding domain
        const retryResponse = await vercel.projects.addProjectDomain({
          idOrName: projectId,
          requestBody: {
            name: domain,
            ...(redirect && { redirect, redirectStatusCode: redirectStatusCode || 301 }),
          },
          teamId: VERCEL_TEAM_ID || undefined,
        });

        const domainParts = domain.split(".");
        const isApex = domainParts.length === 2;

        return {
          name: retryResponse.name,
          verified: retryResponse.verified || false,
          verification: retryResponse.verification || [],
          dnsRecords: isApex
            ? [{ type: "A", name: "@", value: "216.150.1.1" }]
            : [{ type: "CNAME", name: domainParts[0], value: "cname.vercel-dns.com" }],
        };
      }
    }

    throw new Error(`Failed to configure domain: ${error.message}`);
  }
}

/**
 * Remove domain from a Vercel project
 */
export async function removeVercelDomain(projectId: string, domain: string): Promise<boolean> {
  if (!VERCEL_TOKEN) {
    throw new Error("VERCEL_TOKEN is not configured");
  }

  try {
    console.log(`[Vercel] Removing domain ${domain} from project ${projectId}`);

    await vercel.projects.removeProjectDomain({
      idOrName: projectId,
      domain,
      teamId: VERCEL_TEAM_ID || undefined,
    });

    console.log(`[Vercel] Domain ${domain} removed successfully`);
    return true;
  } catch (error: any) {
    console.error(`[Vercel] Error removing domain:`, error);
    return false;
  }
}

/**
 * Get domain verification status from Vercel
 */
export async function getVercelDomainStatus(domain: string): Promise<{
  verified: boolean;
  misconfigured: boolean;
  verification?: any[];
} | null> {
  if (!VERCEL_TOKEN) {
    throw new Error("VERCEL_TOKEN is not configured");
  }

  try {
    const domainConfig = await vercel.domains.getDomainConfig({
      domain,
    });

    const config = domainConfig as any;

    return {
      verified: config.verified === true,
      misconfigured: config.misconfigured === true,
      verification: config.verification || [],
    };
  } catch (error: any) {
    console.error(`[Vercel] Error getting domain status:`, error);
    return null;
  }
}
