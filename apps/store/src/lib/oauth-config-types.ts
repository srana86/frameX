// Client-safe types and defaults for OAuth configuration
// This file can be imported in client components

export interface OAuthConfig {
  id: string;
  google: {
    clientId?: string;
    clientSecret?: string; // Note: In production, this should be encrypted
    enabled: boolean;
  };
  updatedAt?: string;
  createdAt?: string;
}

export const defaultOAuthConfig: OAuthConfig = {
  id: "oauth_config_v1",
  google: {
    clientId: "",
    clientSecret: "",
    enabled: false,
  },
};

