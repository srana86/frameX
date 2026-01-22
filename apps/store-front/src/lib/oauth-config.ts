// Server-only OAuth configuration functions
import type { OAuthConfig } from "./oauth-config-types";
import { defaultOAuthConfig } from "./oauth-config-types";
import { getPublicServerClient } from "./server-utils";

// Re-export types for server-side use
export type { OAuthConfig } from "./oauth-config-types";
export { defaultOAuthConfig } from "./oauth-config-types";

/**
 * Get OAuth configuration from backend
 * Server-only function - do not import in client components
 */
export async function getOAuthConfig(): Promise<OAuthConfig> {
  try {
    const client = await getPublicServerClient();
    const response = await client.get("/oauth-config");

    // Response structure: { success, message, data: OAuthConfig }
    const config = response.data?.data || response.data;

    if (config) {
      return config;
    }
  } catch (error) {
    // OAuth config might not exist, that's okay - just use defaults
    console.error("Error fetching OAuth config:", error);
  }
  return defaultOAuthConfig;
}
