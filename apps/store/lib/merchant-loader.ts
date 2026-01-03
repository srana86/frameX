/**
 * Merchant Data Loader
 * Automatically loads merchant-specific data based on request context
 */

import { headers } from "next/headers";
import { getMerchant, getMerchantByDomain, getMerchantDatabase, getMerchantDeployment } from "./merchant-helpers";
import { getMerchantConnectionString } from "./database-service";
import type { Merchant, MerchantDatabase, MerchantDeployment } from "./merchant-types";

export interface MerchantContext {
  merchant: Merchant;
  database: MerchantDatabase | null;
  deployment: MerchantDeployment | null;
  connectionString: string | null;
  dbName: string;
}

/**
 * Get merchant ID from various sources
 */
// Simple cache for merchant ID from request
let cachedRequestMerchantId: string | null | undefined = undefined;
let requestCacheTimestamp: number = 0;
const REQUEST_CACHE_TTL = 60000; // 1 minute

export async function getMerchantIdFromRequest(): Promise<string | null> {
  console.log("[MerchantLoader] Checking for merchant ID...");
  // Check cache first
  const now = Date.now();
  if (cachedRequestMerchantId !== undefined && now - requestCacheTimestamp < REQUEST_CACHE_TTL) {
    return cachedRequestMerchantId ?? null;
  }

  // Priority 1: Get merchant ID from brand config (most reliable - connects to super-admin)
  try {
    const { getMerchantCollectionForAPI, buildMerchantQuery } = await import("./api-helpers");
    const col = await getMerchantCollectionForAPI("brand_config");
    const query = await buildMerchantQuery({ id: "brand_config_v1" });
    const brandConfig = await col.findOne(query);

    if (brandConfig && (brandConfig as any).merchantId) {
      const merchantId = (brandConfig as any).merchantId;
      cachedRequestMerchantId = merchantId;
      requestCacheTimestamp = now;
      return merchantId;
    }
  } catch (error: any) {
    // Silently fail and try next source
  }

  // Priority 2: Check environment variable (for deployed merchant instances)
  if (process.env.MERCHANT_ID) {
    console.log("[MerchantLoader] Found MERCHANT_ID in env:", process.env.MERCHANT_ID);
    cachedRequestMerchantId = process.env.MERCHANT_ID;
    requestCacheTimestamp = now;
    return process.env.MERCHANT_ID;
  }

  // 2. Check headers (for API requests)
  try {
    const headersList = await headers();
    const merchantIdHeader = headersList.get("x-merchant-id");
    if (merchantIdHeader) {
      cachedRequestMerchantId = merchantIdHeader;
      requestCacheTimestamp = now;
      return merchantIdHeader;
    }
  } catch (error) {
    // Headers() can only be called in Server Components
  }

  // 3. Check domain/subdomain
  try {
    const headersList = await headers();
    const host = headersList.get("host") || "";
    const domain = host.split(":")[0]; // Remove port if present

    // Try to find merchant by domain
    const merchant = await getMerchantByDomain(domain);
    if (merchant) {
      cachedRequestMerchantId = merchant.id;
      requestCacheTimestamp = now;
      return merchant.id;
    }
  } catch (error) {
    // Headers() can only be called in Server Components
  }

  // Cache null result to prevent repeated queries
  // Cache null result to prevent repeated queries
  cachedRequestMerchantId = null;
  requestCacheTimestamp = now;
  console.warn("[MerchantLoader] No merchant ID found in any source.");
  return null;
}

/**
 * Load complete merchant context
 */
export async function loadMerchantData(merchantId?: string): Promise<MerchantContext | null> {
  try {
    // Get merchant ID if not provided
    if (!merchantId) {
      const idFromRequest = await getMerchantIdFromRequest();
      merchantId = idFromRequest || undefined;
    }

    if (!merchantId) {
      console.warn("⚠️ [Merchant Loader] No merchant ID found in request context");
      return null;
    }

    // Load merchant data - try local first, then super-admin
    let merchant = await getMerchant(merchantId);

    if (!merchant) {
      // Skip super-admin fetch during build time
      if (process.env.NEXT_PHASE === "phase-production-build") {
        return null;
      }

      // Try to get merchant from super-admin
      try {
        const { getMerchantFullDataFromSuperAdmin } = await import("./super-admin-client");
        const superAdminData = await getMerchantFullDataFromSuperAdmin(merchantId);

        if (!superAdminData || !superAdminData.merchant) {
          return null;
        }

        merchant = superAdminData.merchant;
      } catch (error: any) {
        // Only log errors during runtime, not during build
        if (process.env.NEXT_PHASE !== "phase-production-build") {
          console.error(`❌ [Merchant Loader] Failed to get merchant from super-admin:`, error.message);
        }
        return null;
      }
    }

    if (!merchant) {
      return null;
    }

    // Load merchant database configuration
    const database = await getMerchantDatabase(merchantId);

    // Load merchant deployment configuration (only log if needed for debugging)
    const deployment = await getMerchantDeployment(merchantId);
    // Only log deployment info in development or if explicitly needed
    if (process.env.NODE_ENV === "development" && process.env.DEBUG_MERCHANT_LOADER === "true") {
      if (deployment) {
        console.log(`✅ [Merchant Loader] Deployment config found: ${deployment.deploymentStatus} - ${deployment.deploymentUrl}`);
      } else {
        console.log(`⚠️ [Merchant Loader] No deployment config found for merchantId: ${merchantId}`);
      }
    }

    // Get connection string
    let connectionString: string | null = null;
    let dbName = process.env.MONGODB_DB || "shoestore_main";

    if (database) {
      if (!database.useSharedDatabase) {
        connectionString = await getMerchantConnectionString(merchantId);
        dbName = database.databaseName;
      } else {
        // Use shared database
        dbName = process.env.MONGODB_DB || "shoestore_main";
      }
    }

    return {
      merchant,
      database,
      deployment,
      connectionString,
      dbName,
    };
  } catch (error) {
    console.error("❌ [Merchant Loader] Error loading merchant data:", error);
    return null;
  }
}

/**
 * Get merchant ID from current context
 */
export async function getCurrentMerchantId(): Promise<string | null> {
  return await getMerchantIdFromRequest();
}

/**
 * Check if merchant data is loaded
 */
export async function isMerchantLoaded(merchantId?: string): Promise<boolean> {
  const context = await loadMerchantData(merchantId);
  return context !== null;
}

/**
 * Get merchant-specific database name
 */
export async function getMerchantDatabaseName(merchantId?: string): Promise<string> {
  const context = await loadMerchantData(merchantId);
  return context?.dbName || process.env.MONGODB_DB || "shoestore_main";
}
