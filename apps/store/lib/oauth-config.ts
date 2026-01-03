// Server-only OAuth configuration functions
import type { OAuthConfig } from "./oauth-config-types";
import { defaultOAuthConfig } from "./oauth-config-types";

// Re-export types for server-side use
export type { OAuthConfig } from "./oauth-config-types";
export { defaultOAuthConfig } from "./oauth-config-types";

import { apiRequest } from "./api-client";

/**
 * Get OAuth configuration from backend
 * Server-only function - do not import in client components
 */
export async function getOAuthConfig(): Promise<OAuthConfig> {
  try {
    const config = await apiRequest<OAuthConfig>("GET", "/configs/oauth");

    if (config) {
      return config;
    }
  } catch (error) {
    console.error("Error fetching OAuth config:", error);
  }
  return defaultOAuthConfig;
}
