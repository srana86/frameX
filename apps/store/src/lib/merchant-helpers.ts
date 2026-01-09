// Server-only merchant helper functions
// import { getCollection } from "./mongodb"; // REMOVED - Using SuperAdmin API as source of truth
import { getMerchantFullDataFromSuperAdmin, getMerchantDeploymentFromSuperAdmin } from "./super-admin-client";
// Placeholder for Merchant type definition if not imported from mongo types
// We need to define or import these types correctly now that mongo is gone
import { Merchant, MerchantDeployment, MerchantDatabase } from "./merchant-types";

/**
 * Get merchant by ID
 */
export async function getMerchant(merchantId: string): Promise<Merchant | null> {
  try {
    const fullData = await getMerchantFullDataFromSuperAdmin(merchantId);
    return fullData?.merchant || null;
  } catch (error) {
    console.error("Error fetching merchant:", error);
    return null;
  }
}

/**
 * Get merchant by email
 */
export async function getMerchantByEmail(email: string): Promise<Merchant | null> {
  // Use generic fetch since SuperAdminClient doesn't have a specific getByEmail method yet
  // Or return null as this might be less critical for the store app itself
  console.warn("getMerchantByEmail not implemented via API yet");
  return null;
}

/**
 * Get merchant by custom domain
 */
export async function getMerchantByDomain(domain: string): Promise<Merchant | null> {
  // This logic is typically handled by middleware rewriting to merchantId
  // If needed, we'd need an API endpoint for unrelated domain lookups
  console.warn("getMerchantByDomain not implemented via API yet");
  return null;
}

/**
 * Get merchant deployment configuration
 * Fetches from super-admin API since merchant_deployments is stored in super-admin database
 */
export async function getMerchantDeployment(merchantId: string): Promise<MerchantDeployment | null> {
  try {
    // Fetch from super-admin API since merchant_deployments collection is in super-admin DB
    const deployment = await getMerchantDeploymentFromSuperAdmin(merchantId);

    if (deployment) {
      // Map SuperAdminMerchantDeployment to MerchantDeployment type
      return {
        id: deployment.id,
        merchantId: deployment.merchantId,
        deploymentType: deployment.deploymentType as "subdomain" | "custom_domain",
        subdomain: deployment.subdomain,
        customDomain: deployment.customDomain,
        deploymentStatus: deployment.deploymentStatus as "pending" | "active" | "failed" | "inactive",
        deploymentUrl: deployment.deploymentUrl,
        deploymentProvider: deployment.deploymentProvider as "custom" | undefined,
        deploymentId: deployment.deploymentId,
        environmentVariables: deployment.environmentVariables,
        lastDeployedAt: deployment.lastDeployedAt,
        createdAt: deployment.createdAt,
        updatedAt: deployment.updatedAt,
      };
    }

    return null;
  } catch (error) {
    console.error("Error fetching merchant deployment from super-admin:", error);
    return null;
  }
}

/**
 * Get merchant database configuration
 */
export async function getMerchantDatabase(merchantId: string): Promise<MerchantDatabase | null> {
  try {
    const fullData = await getMerchantFullDataFromSuperAdmin(merchantId);
    if (fullData?.database) {
      // Map SuperAdminMerchantDatabase to MerchantDatabase
      // Assuming types are compatible-ish or mapping is simple
      const saDb = fullData.database;
      return {
        id: saDb.id,
        merchantId: saDb.merchantId,
        databaseName: saDb.databaseName,
        status: saDb.status as 'active' | 'inactive', // Cast or map status
        useSharedDatabase: saDb.useSharedDatabase,
        // Add other missing fields if any, or mock them
        createdAt: saDb.createdAt,
        updatedAt: saDb.updatedAt
      } as unknown as MerchantDatabase;
    }
    return null;
  } catch (error) {
    console.error("Error fetching merchant database:", error);
    return null;
  }
}

/**
 * Get database name for merchant
 * Returns merchant-specific DB name or shared DB name
 */
export async function getMerchantDbName(merchantId: string): Promise<string> {
  const dbConfig = await getMerchantDatabase(merchantId);

  if (dbConfig && !dbConfig.useSharedDatabase) {
    return dbConfig.databaseName;
  }

  // Use shared database
  return process.env.MONGODB_DB || "shoestore";
}

/**
 * Get all active merchants
 */
export async function getAllMerchants(): Promise<Merchant[]> {
  // Not supported via simple API call without pagination/auth usually
  return [];
}

/**
 * Create new merchant
 */
export async function createMerchant(merchantData: Omit<Merchant, "id" | "createdAt" | "updatedAt"> & { id?: string }): Promise<Merchant> {
  throw new Error("Create merchant not supported via Store App");
}

/**
 * Update merchant
 */
export async function updateMerchant(merchantId: string, updates: Partial<Merchant>): Promise<Merchant | null> {
  throw new Error("Update merchant not supported via Store App");
}
