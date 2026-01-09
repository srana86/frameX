// Server-only Ads configuration functions
import type { AdsConfig } from "./ads-config-types";
import { defaultAdsConfig } from "./ads-config-types";

// Re-export types for server-side use
export type { AdsConfig } from "./ads-config-types";
export { defaultAdsConfig } from "./ads-config-types";

/**
 * Get Ads configuration from database
 * Server-only function - do not import in client components
 */
export async function getAdsConfig(): Promise<AdsConfig> {
  try {
    const { getMerchantCollectionForAPI } = await import("./api-helpers");
    const col = await getMerchantCollectionForAPI<AdsConfig>("ads_config");
    const doc = await col.findOne({ id: "ads_config_v1" });

    if (doc) {
      const { _id, ...config } = doc as any;
      return config as AdsConfig;
    }
  } catch (error) {
    console.error("Error fetching Ads config:", error);
  }
  return defaultAdsConfig;
}
