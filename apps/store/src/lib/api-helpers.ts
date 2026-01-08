/**
 * API Helper Functions
 * Provides merchant-aware collection access for API routes
 */

import { getMerchantContext } from "./merchant-context";
import { getMerchantDb } from "./mongodb-tenant";
import { getMerchantDbName, getMerchantId } from "./env-utils";
import type { Document } from "mongodb";

/**
 * Get collection for current merchant (for API routes)
 * Automatically routes to merchant's database from .env (lines 11-15) or merchant context
 * Priority: MERCHANT_DB_NAME from .env > Merchant Context > Default database
 */
export async function getMerchantCollectionForAPI<T extends Document = Document>(collectionName: string) {
  // First, try to get merchant database from .env file (lines 11-15)
  const merchantDbNameFromEnv = getMerchantDbName();
  const merchantIdFromEnv = getMerchantId();

  // If MERCHANT_DB_NAME is set in .env, use it directly
  if (merchantDbNameFromEnv) {
    // getMerchantDb will prioritize MERCHANT_DB_NAME from .env
    // Pass undefined to use .env configuration
    const db = await getMerchantDb(undefined);
    return db.collection<T>(collectionName);
  }

  // Try merchant context from database
  const merchantContext = await getMerchantContext(merchantIdFromEnv || undefined);
  const merchantId = merchantContext?.merchant.id || merchantIdFromEnv;

  if (merchantId) {
    // Use merchant-specific database from context
    const db = await getMerchantDb(merchantId);
    return db.collection<T>(collectionName);
  }

  // Final fallback to default collection
  const { getCollection } = await import("./mongodb");
  return await getCollection<T>(collectionName);
}

// Simple in-memory cache for merchant ID (per request lifecycle)
let cachedMerchantId: string | null | undefined = undefined;
let cacheTimestamp: number = 0;
const CACHE_TTL = 60000; // 1 minute cache

/**
 * Get merchant ID from context (for API routes)
 * Prioritizes brand config (most reliable), then .env file, then merchant context
 * Uses in-memory caching to prevent repeated database queries
 */
export async function getMerchantIdForAPI(): Promise<string | null> {
  // Check cache first
  const now = Date.now();
  if (cachedMerchantId !== undefined && now - cacheTimestamp < CACHE_TTL) {
    return cachedMerchantId === undefined ? null : cachedMerchantId;
  }

  // Priority 1: Check brand config (most reliable - connects to super-admin)
  try {
    const col = await getMerchantCollectionForAPI("brand_config");
    const query = await buildMerchantQuery({ id: "brand_config_v1" });
    const brandConfig = await col.findOne(query);

    if (brandConfig && (brandConfig as any).merchantId) {
      const merchantId = (brandConfig as any).merchantId;
      cachedMerchantId = merchantId;
      cacheTimestamp = now;
      return merchantId;
    }
  } catch (error: any) {
    // Silently fail and try next source
  }

  // Priority 2: Check .env file
  const merchantIdFromEnv = getMerchantId();
  if (merchantIdFromEnv) {
    cachedMerchantId = merchantIdFromEnv;
    cacheTimestamp = now;
    return merchantIdFromEnv;
  }

  // Priority 3: Check merchant context
  try {
    const merchantContext = await getMerchantContext();
    if (merchantContext?.merchant.id) {
      cachedMerchantId = merchantContext.merchant.id;
      cacheTimestamp = now;
      return merchantContext.merchant.id;
    }
  } catch (error: any) {
    // Silently fail
  }

  // Cache null result to prevent repeated queries
  cachedMerchantId = null;
  cacheTimestamp = now;
  return null;
}

/**
 * Clear merchant ID cache (useful after updates)
 */
export function clearMerchantIdCache(): void {
  cachedMerchantId = undefined;
  cacheTimestamp = 0;
}

/**
 * Check if using shared database (for filtering)
 */
export async function isUsingSharedDatabase(): Promise<boolean> {
  const merchantContext = await getMerchantContext();
  return merchantContext?.database?.useSharedDatabase || false;
}

/**
 * Build query with merchant filter if using shared database
 * Uses MERCHANT_ID from .env file (lines 11-15) if available
 */
export async function buildMerchantQuery(baseQuery: any = {}): Promise<any> {
  // Get merchant ID from .env first
  const merchantIdFromEnv = getMerchantId();

  const merchantContext = await getMerchantContext(merchantIdFromEnv || undefined);
  const merchantId = merchantContext?.merchant.id || merchantIdFromEnv;
  const useShared = merchantContext?.database?.useSharedDatabase;

  if (merchantId && useShared) {
    return { ...baseQuery, merchantId };
  }

  return baseQuery;
}
