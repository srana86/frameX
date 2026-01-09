/**
 * Merchant Data Loader
 * Automatically loads merchant-specific data based on request context
 */

import { headers } from "next/headers";
import { getMerchant, getMerchantByDomain, getMerchantDeployment } from "./merchant-helpers";
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
  // Check cache first
  const now = Date.now();
  if (cachedRequestMerchantId !== undefined && now - requestCacheTimestamp < REQUEST_CACHE_TTL) {
    return cachedRequestMerchantId ?? null;
  }

  // Priority 1: Check environment variable (for deployed merchant instances)
  if (process.env.MERCHANT_ID) {
    cachedRequestMerchantId = process.env.MERCHANT_ID;
    requestCacheTimestamp = now;
    return process.env.MERCHANT_ID;
  }

  // Priority 2: Check headers (x-merchant-id)
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

  // Priority 3: Check domain/subdomain
  try {
    const headersList = await headers();
    const host = headersList.get("host") || "";
    const domain = host.split(":")[0]; // Remove port if present

    // Try to find merchant by domain using API helper (mocked or refactored)
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
  cachedRequestMerchantId = null;
  requestCacheTimestamp = now;
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

    // Load merchant deployment configuration (only log if needed for debugging)
    const deployment = await getMerchantDeployment(merchantId);

    // DB info is no longer relevant in frontend app, return mock/null
    const database: MerchantDatabase | null = null;
    const connectionString: string | null = null;
    const dbName = "shoestore_main";

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
  // const context = await loadMerchantData(merchantId);
  // return context?.dbName || "shoestore_main";
  return "shoestore_main";
}
