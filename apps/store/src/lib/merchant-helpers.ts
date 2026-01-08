// Server-only merchant helper functions
import { getCollection } from "./mongodb";
import { getMerchantDeploymentFromSuperAdmin } from "./super-admin-client";
import type { Merchant, MerchantDeployment, MerchantDatabase } from "./merchant-types";

/**
 * Get merchant by ID
 */
export async function getMerchant(merchantId: string): Promise<Merchant | null> {
  try {
    const col = await getCollection<Merchant>("merchants");
    const merchant = await col.findOne({ id: merchantId });

    if (merchant) {
      const { _id, ...merchantData } = merchant as any;
      return merchantData as Merchant;
    }

    return null;
  } catch (error) {
    console.error("Error fetching merchant:", error);
    return null;
  }
}

/**
 * Get merchant by email
 */
export async function getMerchantByEmail(email: string): Promise<Merchant | null> {
  try {
    const col = await getCollection<Merchant>("merchants");
    const merchant = await col.findOne({ email: email.toLowerCase() });

    if (merchant) {
      const { _id, ...merchantData } = merchant as any;
      return merchantData as Merchant;
    }

    return null;
  } catch (error) {
    console.error("Error fetching merchant by email:", error);
    return null;
  }
}

/**
 * Get merchant by custom domain
 */
export async function getMerchantByDomain(domain: string): Promise<Merchant | null> {
  try {
    const col = await getCollection<Merchant>("merchants");
    const merchant = await col.findOne({
      $or: [{ customDomain: domain }, { deploymentUrl: domain }],
    });

    if (merchant) {
      const { _id, ...merchantData } = merchant as any;
      return merchantData as Merchant;
    }

    return null;
  } catch (error) {
    console.error("Error fetching merchant by domain:", error);
    return null;
  }
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
        deploymentProvider: deployment.deploymentProvider as "vercel" | "netlify" | "custom" | undefined,
        projectId: deployment.projectId,
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
    const col = await getCollection<MerchantDatabase>("merchant_databases");
    const dbConfig = await col.findOne({ merchantId, status: "active" });

    if (dbConfig) {
      const { _id, ...dbData } = dbConfig as any;
      return dbData as MerchantDatabase;
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
  try {
    const col = await getCollection<Merchant>("merchants");
    const merchants = await col.find({ status: { $ne: "inactive" } }).toArray();

    return merchants.map((merchant) => {
      const { _id, ...merchantData } = merchant as any;
      return merchantData as Merchant;
    });
  } catch (error) {
    console.error("Error fetching all merchants:", error);
    return [];
  }
}

/**
 * Create new merchant
 */
export async function createMerchant(merchantData: Omit<Merchant, "id" | "createdAt" | "updatedAt"> & { id?: string }): Promise<Merchant> {
  try {
    const col = await getCollection<Merchant>("merchants");

    const newMerchant: Merchant = {
      ...merchantData,
      id: merchantData.id || `merchant_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Remove id from merchantData if it was provided (it's now in newMerchant)
    const { id, ...dataToInsert } = newMerchant;

    await col.insertOne(newMerchant as any);
    return newMerchant;
  } catch (error) {
    console.error("Error creating merchant:", error);
    throw error;
  }
}

/**
 * Update merchant
 */
export async function updateMerchant(merchantId: string, updates: Partial<Merchant>): Promise<Merchant | null> {
  try {
    const col = await getCollection<Merchant>("merchants");

    await col.updateOne(
      { id: merchantId },
      {
        $set: {
          ...updates,
          updatedAt: new Date().toISOString(),
        },
      }
    );

    return await getMerchant(merchantId);
  } catch (error) {
    console.error("Error updating merchant:", error);
    return null;
  }
}
