// Brand Config
export interface TBrandConfig {
  id: string;
  name: string;
  logo?: string;
  favicon?: string;
  primaryColor?: string;
  secondaryColor?: string;
  currency: {
    iso: string;
    symbol: string;
  };
  [key: string]: any;
}

// Delivery Config
export interface TDeliveryServiceConfig {
  id: string;
  defaultDeliveryCharge: number;
  enableCODForDefault: boolean;
  deliveryChargeNotRefundable: boolean;
  weightBasedCharges: Array<{
    weight: number;
    extraCharge: number;
  }>;
  deliveryOption: "zones" | "districts" | "upazila";
  specificDeliveryCharges: Array<{
    location: string;
    charge: number;
  }>;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface TCourierServicesConfig {
  id: string;
  services: Array<{
    id: string;
    name: string;
    enabled: boolean;
    logo?: string;
    credentials?: Record<string, any>;
  }>;
  createdAt?: Date;
  updatedAt?: Date;
}

// SSLCommerz Config
export interface TSSLCommerzConfig {
  id: string;
  enabled: boolean;
  storeId?: string;
  storePassword?: string;
  isLive?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

// OAuth Config
export interface TOAuthConfig {
  id: string;
  google?: {
    enabled: boolean;
    clientId?: string;
    clientSecret?: string;
  };
  [key: string]: any;
}

// Ads Config
export interface TAdsConfig {
  id: string;
  metaPixel?: {
    enabled: boolean;
    pixelId?: string;
    serverSideTracking?: {
      enabled: boolean;
      accessToken?: string;
      testEventCode?: string;
    };
  };
  googleTagManager?: {
    enabled: boolean;
    containerId?: string;
  };
  createdAt?: Date;
  updatedAt?: Date;
  [key: string]: any;
}
