// Server-only SSLCommerz configuration functions
import type { SSLCommerzConfig } from "./sslcommerz-config-types";
import { defaultSSLCommerzConfig } from "./sslcommerz-config-types";

// Re-export types for server-side use
export type { SSLCommerzConfig } from "./sslcommerz-config-types";
export { defaultSSLCommerzConfig } from "./sslcommerz-config-types";

/**
 * Get SSLCommerz configuration from database
 * Server-only function - do not import in client components
 */
export async function getSSLCommerzConfig(): Promise<SSLCommerzConfig> {
  try {
    const { getCollection } = await import("./mongodb");
    const col = await getCollection<SSLCommerzConfig>("sslcommerz_config");
    const doc = await col.findOne({ id: "sslcommerz_config_v1" });

    if (doc) {
      const { _id, ...config } = doc;
      return config as SSLCommerzConfig;
    }
  } catch (error) {
    console.error("Error fetching SSLCommerz config:", error);
  }
  return defaultSSLCommerzConfig;
}

