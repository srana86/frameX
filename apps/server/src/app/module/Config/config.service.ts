/* eslint-disable @typescript-eslint/no-explicit-any */
import { prisma, Decimal } from "@framex/database";

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

  const theme = (config.theme as any) || {};

  return {
    id: config.id,
    tenantId: config.tenantId,
    brandName: config.name,
    tagline: theme.tagline || "",
    logo: {
      light: config.logo || "",
      dark: theme.logoDark || config.logo || ""
    },
    favicon: {
      url: config.favicon || "/favicon.ico"
    },
    meta: theme.meta || {
      title: config.name,
      description: "",
      keywords: "",
    },
    contact: (config.contactInfo as any) || { email: "", phone: "", address: "" },
    social: (config.socialLinks as any) || { facebook: "", twitter: "", instagram: "", youtube: "" },
    footer: theme.footer || { copyright: "All rights reserved." },
    theme: {
      primaryColor: config.primaryColor || "#000000",
      secondaryColor: config.secondaryColor || "#ffffff"
    },
    currency: {
      code: config.currencyIso || "BDT",
      symbol: config.currencySymbol || "৳",
      position: theme.currencyPosition || "before"
    },
  };
};


const updateBrandConfigIntoDB = async (tenantId: string, payload: any) => {
  // Transform frontend BrandConfig to database schema
  // Frontend sends: brandName, brandTagline, logo (object), favicon (object), meta, contact, social, footer, theme, currency
  // Database expects: name, logo (string), favicon (string), theme (json), socialLinks (json), contactInfo (json), etc.

  const transformedData: any = {};

  // Map brandName to name
  if (payload.brandName !== undefined) {
    transformedData.name = payload.brandName;
  }

  // Store logo as JSON in theme or as string path
  if (payload.logo !== undefined) {
    if (typeof payload.logo === 'object') {
      // If it's an image type, use the imagePath
      if (payload.logo.type === 'image' && payload.logo.imagePath) {
        transformedData.logo = payload.logo.imagePath;
      } else {
        // Store the whole logo config in theme.logo
        transformedData.logo = null; // No image path
      }
    } else {
      transformedData.logo = payload.logo;
    }
  }

  // Store favicon path
  if (payload.favicon?.url !== undefined) {
    transformedData.favicon = payload.favicon.url;
  }

  // Map theme.primaryColor to primaryColor
  if (payload.theme?.primaryColor !== undefined) {
    transformedData.primaryColor = payload.theme.primaryColor;
  }

  // Map theme.secondaryColor to secondaryColor
  if (payload.theme?.secondaryColor !== undefined) {
    transformedData.secondaryColor = payload.theme.secondaryColor;
  }

  // Map currency.code to currencyIso
  if (payload.currency?.code !== undefined) {
    transformedData.currencyIso = payload.currency.code;
    // Get symbol for common currencies if symbol not provided
    const symbols: Record<string, string> = {
      USD: '$', EUR: '€', GBP: '£', JPY: '¥', BDT: '৳', INR: '₹',
    };
    transformedData.currencySymbol = payload.currency.symbol || symbols[payload.currency.code] || payload.currency.code;
  }

  // Store social media links
  if (payload.social !== undefined) {
    transformedData.socialLinks = payload.social;
  }

  // Store contact info
  if (payload.contact !== undefined) {
    transformedData.contactInfo = payload.contact;
  }

  // Store extended brand config in theme JSON (for fields without columns)
  transformedData.theme = {
    primaryColor: payload.theme?.primaryColor,
    secondaryColor: payload.theme?.secondaryColor,
    tagline: payload.tagline,
    meta: payload.meta,
    footer: payload.footer,
    logoDark: payload.logo?.dark,
    currencyPosition: payload.currency?.position,
  };

  // ... (previous transformation code remains)

  // Sync Asset References
  try {
    // 1. Get existing config to compare
    const existingConfig = await prisma.brandConfig.findUnique({
      where: { tenantId }
    });

    // 2. Extract old URLs from existing config
    const oldTheme = existingConfig?.theme as any;
    const oldConfig = oldTheme?.brandConfig || {};

    const oldUrls = {
      'logo.light': oldConfig.logo?.light,
      'logo.dark': oldConfig.logo?.dark,
      'favicon': oldConfig.favicon?.url,
      'meta.socialShareImage': oldConfig.meta?.socialShareImage,
    };

    // 3. Extract new URLs from payload
    const newUrls = {
      'logo.light': payload.logo?.light,
      'logo.dark': payload.logo?.dark,
      'favicon': payload.favicon?.url,
      'meta.socialShareImage': payload.meta?.socialShareImage,
    };

    // 4. Sync references
    // We import dynamically to avoid circular dependencies if any
    const { AssetServices } = await import("../Asset/asset.service");
    await AssetServices.syncReferences(
      tenantId,
      "BrandConfig",
      existingConfig?.id || "temp-id", // If new, we'll fix ID later or use tenantId logic
      oldUrls,
      newUrls
    );
  } catch (error) {
    console.error("[BrandConfig] Failed to sync asset references:", error);
    // Continue with save - don't block main functionality
  }

  const result = await prisma.brandConfig.upsert({
    where: { tenantId },
    update: transformedData,
    create: {
      tenantId,
      name: transformedData.name || 'My Store',
      currencyIso: transformedData.currencyIso || 'BDT',
      currencySymbol: transformedData.currencySymbol || '৳',
      ...transformedData,
    },
  });

  // If we couldn't get ID before (creation case), we should technically sync again with correct ID
  // But for BrandConfig, there's only one per tenant, so we could use tenantId as entityId conceptually
  // For now, let's keep it simple.

  return result;
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

const getDeliverySupportConfigFromDB = async (tenantId: string) => {
  const deliveryConfig = await getDeliveryConfigFromDB(tenantId);
  const courierConfig = await getDeliveryConfigFromDB(tenantId, "courier");

  return {
    flatRate: Number((deliveryConfig as any).defaultDeliveryCharge || 0),
    freeShippingThreshold: Number((deliveryConfig as any).freeShippingThreshold || 0),
    providers: (courierConfig as any).services || [],
    defaultProvider: (courierConfig as any).defaultProvider || "",
  };
};

const updateDeliverySupportConfigIntoDB = async (
  tenantId: string,
  payload: any
) => {
  const { flatRate, freeShippingThreshold, providers, defaultProvider } = payload;

  // Update DeliveryServiceConfig
  await prisma.deliveryServiceConfig.upsert({
    where: { tenantId },
    update: {
      defaultDeliveryCharge: new Decimal(flatRate || 0),
      freeShippingThreshold: new Decimal(freeShippingThreshold || 0),
    },
    create: {
      tenantId,
      defaultDeliveryCharge: new Decimal(flatRate || 0),
      freeShippingThreshold: new Decimal(freeShippingThreshold || 0),
    },
  });

  // Update CourierServicesConfig
  await prisma.courierServicesConfig.upsert({
    where: { tenantId },
    update: {
      services: providers || [],
      defaultProvider: defaultProvider || "",
    },
    create: {
      tenantId,
      services: providers || [],
      defaultProvider: defaultProvider || "",
    },
  });

  return getDeliverySupportConfigFromDB(tenantId);
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

  if (payload.freeShippingThreshold) {
    payload.freeShippingThreshold = new Decimal(payload.freeShippingThreshold);
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
  getDeliverySupportConfigFromDB,
  updateDeliverySupportConfigIntoDB,
  getSSLCommerzConfigFromDB,
  updateSSLCommerzConfigIntoDB,
  getOAuthConfigFromDB,
  updateOAuthConfigIntoDB,
  getAdsConfigFromDB,
  updateAdsConfigIntoDB,
};
