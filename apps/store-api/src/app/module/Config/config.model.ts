import { Schema, model } from "mongoose";
import {
  TBrandConfig,
  TDeliveryServiceConfig,
  TCourierServicesConfig,
  TSSLCommerzConfig,
  TOAuthConfig,
  TAdsConfig,
} from "./config.interface";

const brandConfigSchema = new Schema<TBrandConfig>(
  {
    id: {
      type: String,
      required: true,
      unique: true,
      default: "brand_config_v1",
    },
    name: {
      type: String,
      required: true,
    },
    logo: String,
    favicon: String,
    primaryColor: String,
    secondaryColor: String,
    currency: {
      iso: { type: String, default: "BDT" },
      symbol: { type: String, default: "৳" },
    },
  },
  {
    timestamps: true,
    collection: "brand_config",
  }
);

const deliveryServiceConfigSchema = new Schema<TDeliveryServiceConfig>(
  {
    id: {
      type: String,
      required: true,
      unique: true,
      default: "delivery_service_config_v1",
    },
    defaultDeliveryCharge: {
      type: Number,
      required: true,
    },
    enableCODForDefault: {
      type: Boolean,
      default: true,
    },
    deliveryChargeNotRefundable: {
      type: Boolean,
      default: false,
    },
    weightBasedCharges: [
      {
        weight: Number,
        extraCharge: Number,
      },
    ],
    deliveryOption: {
      type: String,
      enum: ["zones", "districts", "upazila"],
      default: "districts",
    },
    specificDeliveryCharges: [
      {
        location: String,
        charge: Number,
      },
    ],
  },
  {
    timestamps: true,
    collection: "delivery_service_config",
  }
);

const courierServicesConfigSchema = new Schema<TCourierServicesConfig>(
  {
    id: {
      type: String,
      required: true,
      unique: true,
      default: "courier_services_config_v1",
    },
    services: [
      {
        id: String,
        name: String,
        enabled: Boolean,
        logo: String,
        credentials: Schema.Types.Mixed,
      },
    ],
  },
  {
    timestamps: true,
    collection: "courier_services_config",
  }
);

const sslcommerzConfigSchema = new Schema<TSSLCommerzConfig>(
  {
    id: {
      type: String,
      required: true,
      unique: true,
      default: "sslcommerz_config_v1",
    },
    enabled: {
      type: Boolean,
      default: false,
    },
    storeId: String,
    storePassword: String,
    isLive: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    collection: "sslcommerz_config",
  }
);

const oauthConfigSchema = new Schema<TOAuthConfig>(
  {
    id: {
      type: String,
      required: true,
      unique: true,
      default: "oauth_config_v1",
    },
    google: {
      enabled: Boolean,
      clientId: String,
      clientSecret: String,
    },
  },
  {
    timestamps: true,
    collection: "oauth_config",
  }
);

const adsConfigSchema = new Schema<TAdsConfig>(
  {
    id: {
      type: String,
      required: true,
      unique: true,
      default: "ads_config_v1",
    },
    metaPixel: {
      enabled: { type: Boolean, default: false },
      pixelId: String,
      serverSideTracking: {
        enabled: { type: Boolean, default: false },
        accessToken: String,
        testEventCode: String,
      },
    },
    googleTagManager: {
      enabled: { type: Boolean, default: false },
      containerId: String,
    },
  },
  {
    timestamps: true,
    collection: "ads_config",
  }
);

export const BrandConfig = model<TBrandConfig>(
  "BrandConfig",
  brandConfigSchema
);
export const DeliveryServiceConfig = model<TDeliveryServiceConfig>(
  "DeliveryServiceConfig",
  deliveryServiceConfigSchema
);
export const CourierServicesConfig = model<TCourierServicesConfig>(
  "CourierServicesConfig",
  courierServicesConfigSchema
);
export const SSLCommerzConfig = model<TSSLCommerzConfig>(
  "SSLCommerzConfig",
  sslcommerzConfigSchema
);
export const OAuthConfig = model<TOAuthConfig>(
  "OAuthConfig",
  oauthConfigSchema
);
export const AdsConfig = model<TAdsConfig>("AdsConfig", adsConfigSchema);
