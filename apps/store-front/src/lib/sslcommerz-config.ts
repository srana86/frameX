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
// export async function getSSLCommerzConfig(): Promise<SSLCommerzConfig> {
//   // TODO: Fetch from API if dynamic config is needed
//   return defaultSSLCommerzConfig;
// }
export const getSSLCommerzConfig = async () => defaultSSLCommerzConfig;

