// Client-safe types and defaults for Ads & Tracking configuration
// This file can be imported in client components

export interface AdsConfig {
  id: string;

  // Meta Pixel (Facebook Pixel)
  metaPixel: {
    enabled: boolean;
    pixelId?: string;
    // Server-side tracking (Conversions API)
    serverSideTracking?: {
      enabled: boolean;
      accessToken?: string; // Access token for Conversions API
      testEventCode?: string; // Optional: for testing server-side events
    };
  };

  // Google Tag Manager
  googleTagManager: {
    enabled: boolean;
    containerId?: string; // GTM-XXXXXXX format
  };

  updatedAt?: string;
  createdAt?: string;
}

export const defaultAdsConfig: AdsConfig = {
  id: "ads_config_v1",
  metaPixel: {
    enabled: false,
    pixelId: "",
    serverSideTracking: {
      enabled: false,
      accessToken: "",
      testEventCode: "",
    },
  },
  googleTagManager: {
    enabled: false,
    containerId: "",
  },
};
