// Client-safe types and defaults for SSLCommerz configuration
// This file can be imported in client components

export interface SSLCommerzConfig {
  id: string;
  storeId?: string;
  storePassword?: string; // Note: In production, this should be encrypted
  isLive: boolean; // true for live, false for sandbox
  enabled: boolean;
  updatedAt?: string;
  createdAt?: string;
}

export const defaultSSLCommerzConfig: SSLCommerzConfig = {
  id: "sslcommerz_config_v1",
  storeId: "",
  storePassword: "",
  isLive: false,
  enabled: false,
};

