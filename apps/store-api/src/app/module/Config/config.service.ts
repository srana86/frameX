/* eslint-disable @typescript-eslint/no-explicit-any */
import AppError from "../../errors/AppError";
import { StatusCodes } from "http-status-codes";
import {
  BrandConfig,
  DeliveryServiceConfig,
  CourierServicesConfig,
  SSLCommerzConfig,
  OAuthConfig,
  AdsConfig,
} from "./config.model";
import {
  TBrandConfig,
  TDeliveryServiceConfig,
  TCourierServicesConfig,
  TSSLCommerzConfig,
  TOAuthConfig,
  TAdsConfig,
} from "./config.interface";

// Brand Config
const getBrandConfigFromDB = async () => {
  let config = await BrandConfig.findOne({ id: "brand_config_v1" });
  if (!config) {
    config = await BrandConfig.create({
      id: "brand_config_v1",
      name: "My Store",
      currency: { iso: "BDT", symbol: "৳" },
    });
  }
  return config;
};

const updateBrandConfigIntoDB = async (payload: Partial<TBrandConfig>) => {
  const result = await BrandConfig.findOneAndUpdate(
    { id: "brand_config_v1" },
    payload,
    { new: true, upsert: true, runValidators: true }
  );
  return result;
};

// Delivery Config
const getDeliveryConfigFromDB = async (type?: string) => {
  if (type === "courier") {
    let config = await CourierServicesConfig.findOne({
      id: "courier_services_config_v1",
    });
    if (!config) {
      config = await CourierServicesConfig.create({
        id: "courier_services_config_v1",
        services: [],
      });
    }
    return config;
  }

  let config = await DeliveryServiceConfig.findOne({
    id: "delivery_service_config_v1",
  });
  if (!config) {
    config = await DeliveryServiceConfig.create({
      id: "delivery_service_config_v1",
      defaultDeliveryCharge: 100,
      enableCODForDefault: true,
      deliveryChargeNotRefundable: false,
      weightBasedCharges: [],
      deliveryOption: "districts",
      specificDeliveryCharges: [],
    });
  }
  return config;
};

const updateDeliveryConfigIntoDB = async (
  payload: Partial<TDeliveryServiceConfig | TCourierServicesConfig>,
  type?: string
) => {
  if (type === "courier") {
    const result = await CourierServicesConfig.findOneAndUpdate(
      { id: "courier_services_config_v1" },
      payload,
      { new: true, upsert: true, runValidators: true }
    );
    return result;
  }

  const result = await DeliveryServiceConfig.findOneAndUpdate(
    { id: "delivery_service_config_v1" },
    payload,
    { new: true, upsert: true, runValidators: true }
  );
  return result;
};

// SSLCommerz Config
const getSSLCommerzConfigFromDB = async () => {
  let config = await SSLCommerzConfig.findOne({ id: "sslcommerz_config_v1" });
  if (!config) {
    config = await SSLCommerzConfig.create({
      id: "sslcommerz_config_v1",
      enabled: false,
      isLive: false,
    });
  }
  return config;
};

const updateSSLCommerzConfigIntoDB = async (
  payload: Partial<TSSLCommerzConfig>
) => {
  const result = await SSLCommerzConfig.findOneAndUpdate(
    { id: "sslcommerz_config_v1" },
    payload,
    { new: true, upsert: true, runValidators: true }
  );
  return result;
};

// OAuth Config
const getOAuthConfigFromDB = async () => {
  let config = await OAuthConfig.findOne({ id: "oauth_config_v1" });
  if (!config) {
    config = await OAuthConfig.create({
      id: "oauth_config_v1",
      google: { enabled: false },
    });
  }
  return config;
};

const updateOAuthConfigIntoDB = async (payload: Partial<TOAuthConfig>) => {
  const result = await OAuthConfig.findOneAndUpdate(
    { id: "oauth_config_v1" },
    payload,
    { new: true, upsert: true, runValidators: true }
  );
  return result;
};

// Ads Config
const getAdsConfigFromDB = async () => {
  let config = await AdsConfig.findOne({ id: "ads_config_v1" });
  if (!config) {
    config = await AdsConfig.create({
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
    });
  }
  return config;
};

const updateAdsConfigIntoDB = async (payload: Partial<TAdsConfig>) => {
  const result = await AdsConfig.findOneAndUpdate(
    { id: "ads_config_v1" },
    payload,
    { new: true, upsert: true, runValidators: true }
  );
  return result;
};

export const ConfigServices = {
  getBrandConfigFromDB,
  updateBrandConfigIntoDB,
  getDeliveryConfigFromDB,
  updateDeliveryConfigIntoDB,
  getSSLCommerzConfigFromDB,
  updateSSLCommerzConfigIntoDB,
  getOAuthConfigFromDB,
  updateOAuthConfigIntoDB,
  getAdsConfigFromDB,
  updateAdsConfigIntoDB,
};
