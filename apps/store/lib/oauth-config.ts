// Server-only OAuth configuration functions
import type { OAuthConfig } from "./oauth-config-types";
import { defaultOAuthConfig } from "./oauth-config-types";

// Re-export types for server-side use
export type { OAuthConfig } from "./oauth-config-types";
export { defaultOAuthConfig } from "./oauth-config-types";

/**
 * Get OAuth configuration from database
 * Server-only function - do not import in client components
 */
export async function getOAuthConfig(): Promise<OAuthConfig> {
  try {
    const { getCollection } = await import("./mongodb");
    const col = await getCollection<OAuthConfig>("oauth_config");
    const doc = await col.findOne({ id: "oauth_config_v1" });

    if (doc) {
      const { _id, ...config } = doc;
      return config as OAuthConfig;
    }
  } catch (error) {
    console.error("Error fetching OAuth config:", error);
  }
  return defaultOAuthConfig;
}
