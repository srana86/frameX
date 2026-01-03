/**
 * Merchant Context Provider
 * Provides merchant data throughout the application
 */

import { cache } from "react";
import { loadMerchantData, getCurrentMerchantId, type MerchantContext } from "./merchant-loader";

/**
 * Cached merchant context loader
 * Uses React cache to ensure same merchant data is used across the request
 */
export const getMerchantContext = cache(async (merchantId?: string): Promise<MerchantContext | null> => {
  return await loadMerchantData(merchantId);
});

/**
 * Get current merchant
 */
export const getCurrentMerchant = cache(async () => {
  const merchantId = await getCurrentMerchantId();
  if (!merchantId) return null;
  
  const context = await getMerchantContext(merchantId);
  return context?.merchant || null;
});

/**
 * Get merchant database configuration
 */
export const getMerchantDbConfig = cache(async (merchantId?: string) => {
  const context = await getMerchantContext(merchantId);
  return context?.database || null;
});

/**
 * Get merchant deployment configuration
 */
export const getMerchantDeploymentConfig = cache(async (merchantId?: string) => {
  const context = await getMerchantContext(merchantId);
  return context?.deployment || null;
});

/**
 * Get merchant database name
 */
export const getMerchantDbName = cache(async (merchantId?: string) => {
  const context = await getMerchantContext(merchantId);
  return context?.dbName || process.env.MONGODB_DB || "shoestore_main";
});

