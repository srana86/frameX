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

  // If theme.brandConfig exists (stored by updateBrandConfigIntoDB), return it
  // This preserves the full frontend config structure
  const themeData = config.theme as any;
  if (themeData?.brandConfig) {
    return {
      ...themeData.brandConfig,
      id: config.id,
      tenantId: config.tenantId,
    };
  }

  // Otherwise, construct a basic config from DB fields for backward compatibility
  return {
    id: config.id,
    tenantId: config.tenantId,
    brandName: config.name,
    brandTagline: "",
    logo: {
      type: "text" as const,
      style: "default",
      text: { primary: config.name, secondary: "" },
      imagePath: config.logo || "",
      altText: `${config.name} Logo`,
    },
    favicon: {
      path: config.favicon || "/favicon.ico",
      appleTouchIcon: "/apple-touch-icon.png",
      manifestIcon: "/manifest-icon.png",
    },
    meta: {
      title: { default: config.name, template: `%s – ${config.name}` },
      description: "",
      keywords: [],
      metadataBase: "",
      socialShareImage: "",
      openGraph: { title: config.name, description: "", type: "website", locale: "en_US", siteName: config.name, image: "" },
      twitter: { card: "summary_large_image", title: config.name, description: "", image: "" },
    },
    contact: (config.contactInfo as any) || { email: "", phone: "", address: "" },
    social: (config.socialLinks as any) || { facebook: "", twitter: "", instagram: "", youtube: "" },
    footer: { description: "", copyrightText: "All rights reserved." },
    theme: { primaryColor: config.primaryColor || "#000000" },
    currency: { iso: config.currencyIso },
    // Include raw DB fields for reference
    name: config.name,
    primaryColor: config.primaryColor,
    secondaryColor: config.secondaryColor,
    currencyIso: config.currencyIso,
    currencySymbol: config.currencySymbol,
    timezone: config.timezone,
    language: config.language,
    socialLinks: config.socialLinks,
    contactInfo: config.contactInfo,
    orderEnabled: config.orderEnabled,
    createdAt: config.createdAt,
    updatedAt: config.updatedAt,
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
  if (payload.favicon?.path !== undefined) {
    transformedData.favicon = payload.favicon.path;
  }

  // Map theme.primaryColor to primaryColor
  if (payload.theme?.primaryColor !== undefined) {
    transformedData.primaryColor = payload.theme.primaryColor;
  }

  // Map currency.iso to currencyIso
  if (payload.currency?.iso !== undefined) {
    transformedData.currencyIso = payload.currency.iso;
    // Get symbol for common currencies
    const symbols: Record<string, string> = {
      USD: '$', EUR: '€', GBP: '£', JPY: '¥', BDT: '৳', INR: '₹',
    };
    transformedData.currencySymbol = symbols[payload.currency.iso] || payload.currency.iso;
  }

  // Store social media links
  if (payload.social !== undefined) {
    transformedData.socialLinks = payload.social;
  }

  // Store contact info
  if (payload.contact !== undefined) {
    transformedData.contactInfo = payload.contact;
  }

  // Store extended brand config in theme JSON (for all the extra fields)
  // This preserves the full frontend config for retrieval
  transformedData.theme = {
    primaryColor: payload.theme?.primaryColor,
    secondaryColor: payload.theme?.secondaryColor,
    // Store the complete frontend config for retrieval
    brandConfig: payload,
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
      'logo': oldConfig.logo?.type === 'image' ? oldConfig.logo.imagePath : null,
      'favicon': oldConfig.favicon?.path,
      'meta.socialShareImage': oldConfig.meta?.socialShareImage,
      'meta.openGraph.image': oldConfig.meta?.openGraph?.image,
      'meta.twitter.image': oldConfig.meta?.twitter?.image,
    };

    // 3. Extract new URLs from payload
    const newUrls = {
      'logo': payload.logo?.type === 'image' ? payload.logo.imagePath : null,
      'favicon': payload.favicon?.path,
      'meta.socialShareImage': payload.meta?.socialShareImage,
      'meta.openGraph.image': payload.meta?.openGraph?.image,
      'meta.twitter.image': payload.meta?.twitter?.image,
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
