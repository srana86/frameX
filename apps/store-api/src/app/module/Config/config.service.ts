/* eslint-disable @typescript-eslint/no-explicit-any */
import { prisma, Decimal } from "@framex/database";
import AppError from "../../errors/AppError";
import { StatusCodes } from "http-status-codes";

// Brand Config
const getBrandConfigFromDB = async (tenantId: string) => {
  let config = await prisma.brandConfig.findUnique({ where: { tenantId } });
  if (!config) {
    config = await prisma.brandConfig.create({
      data: {
        tenantId,
        name: "My Store",
        currencyIso: "BDT",
        currencySymbol: "৳",
      },
    });
  }
  return config;
};

const updateBrandConfigIntoDB = async (tenantId: string, payload: any) => {
  return prisma.brandConfig.upsert({
    where: { tenantId },
    update: payload,
    create: {
      tenantId,
      ...payload
    },
  });
};

// Delivery Config
const getDeliveryConfigFromDB = async (tenantId: string, type?: string) => {
  if (type === "courier") {
    let config = await prisma.courierServicesConfig.findUnique({
      where: { tenantId },
    });
    if (!config) {
      config = await prisma.courierServicesConfig.create({
        data: { tenantId, services: [] },
      });
    }
    return config;
  }

  let config = await prisma.deliveryServiceConfig.findUnique({
    where: { tenantId },
  });
  if (!config) {
    config = await prisma.deliveryServiceConfig.create({
      data: {
        tenantId,
        defaultDeliveryCharge: new Decimal(100),
        enableCODForDefault: true,
        deliveryOption: "districts",
      },
    });
  }
  return config;
};

const updateDeliveryConfigIntoDB = async (
  tenantId: string,
  payload: any,
  type?: string
) => {
  if (type === "courier") {
    return prisma.courierServicesConfig.upsert({
      where: { tenantId },
      update: payload,
      create: { tenantId, ...payload },
    });
  }

  if (payload.defaultDeliveryCharge) {
    payload.defaultDeliveryCharge = new Decimal(payload.defaultDeliveryCharge);
  }

  return prisma.deliveryServiceConfig.upsert({
    where: { tenantId },
    update: payload,
    create: { tenantId, ...payload },
  });
};

// SSLCommerz Config
const getSSLCommerzConfigFromDB = async (tenantId: string) => {
  let config = await prisma.sSLCommerzConfig.findUnique({ where: { tenantId } });
  if (!config) {
    config = await prisma.sSLCommerzConfig.create({
      data: { tenantId, enabled: false, isLive: false },
    });
  }
  return config;
};

const updateSSLCommerzConfigIntoDB = async (tenantId: string, payload: any) => {
  return prisma.sSLCommerzConfig.upsert({
    where: { tenantId },
    update: payload,
    create: { tenantId, ...payload },
  });
};

// OAuth Config
const getOAuthConfigFromDB = async (tenantId: string) => {
  let config = await prisma.oAuthConfig.findUnique({ where: { tenantId } });
  if (!config) {
    config = await prisma.oAuthConfig.create({
      data: { tenantId, google: { enabled: false } },
    });
  }
  return config;
};

const updateOAuthConfigIntoDB = async (tenantId: string, payload: any) => {
  return prisma.oAuthConfig.upsert({
    where: { tenantId },
    update: payload,
    create: { tenantId, ...payload },
  });
};

// Ads Config
const getAdsConfigFromDB = async (tenantId: string) => {
  let config = await prisma.adsConfig.findUnique({ where: { tenantId } });
  if (!config) {
    config = await prisma.adsConfig.create({
      data: {
        tenantId,
        metaPixel: {
          enabled: false,
          serverSideTracking: { enabled: false }
        },
        googleTagManager: { enabled: false }
      },
    });
  }
  return config;
};

const updateAdsConfigIntoDB = async (tenantId: string, payload: any) => {
  return prisma.adsConfig.upsert({
    where: { tenantId },
    update: payload,
    create: { tenantId, ...payload },
  });
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
