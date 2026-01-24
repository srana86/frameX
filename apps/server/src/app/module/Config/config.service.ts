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
    brandName: config.name || "My Store",
    brandTagline: theme.brandTagline || "",

    logo: {
      type: theme.logoType || (config.logo ? "image" : "text"),
      style: theme.logoStyle || "default",
      imagePath: config.logo || "",
      text: theme.logoText || {
        primary: config.name || "My Store",
        secondary: "",
      },
      altText: theme.logoAltText || `${config.name} Logo`,
      icon: theme.logoIcon || {
        symbol: (config.name || "M").charAt(0),
        backgroundColor: config.primaryColor || "#000000",
        iconColor: "#ffffff",
        size: "md",
        borderRadius: "md",
      },
      colors: theme.logoColors || {
        primary: config.primaryColor || "#000000",
        secondary: config.secondaryColor || "#ffffff",
        gradientFrom: config.primaryColor || "#000000",
        gradientTo: config.secondaryColor || "#ffffff",
      },
    },

    favicon: {
      path: config.favicon || "/favicon.ico",
      appleTouchIcon: theme.appleTouchIcon || config.favicon || "/favicon.ico",
      manifestIcon: theme.manifestIcon || config.favicon || "/favicon.ico",
    },

    meta: theme.meta || {
      title: {
        default: config.name || "My Store",
        template: `%s | ${config.name || "My Store"}`,
      },
      description: "",
      keywords: [],
      metadataBase: "",
      socialShareImage: "",
      openGraph: {
        title: config.name || "My Store",
        description: "",
        type: "website",
        locale: "en_US",
        siteName: config.name || "My Store",
      },
      twitter: {
        card: "summary_large_image",
        title: config.name || "My Store",
        description: "",
      },
    },

    contact: (config.contactInfo as any) || {
      email: "",
      phone: "",
      address: "",
    },

    social: (config.socialLinks as any) || {
      facebook: "",
      twitter: "",
      instagram: "",
      youtube: "",
    },

    footer: theme.footer || {
      description: "",
      copyrightText: `© ${new Date().getFullYear()} ${config.name}. All rights reserved.`,
    },

    theme: {
      primaryColor: config.primaryColor || "#000000",
    },

    currency: {
      iso: config.currencyIso || "BDT",
    },
  };
};

const updateBrandConfigIntoDB = async (tenantId: string, payload: any) => {
  // Map simplified fields to top-level columns
  const transformedData: any = {
    name: payload.brandName,
    logo: payload.logo?.imagePath || null,
    favicon: payload.favicon?.path || null,
    primaryColor: payload.theme?.primaryColor || null,
    currencyIso: payload.currency?.iso || null,
    contactInfo: payload.contact || {},
    socialLinks: payload.social || {},
  };

  // Determine currency symbol
  if (payload.currency?.iso) {
    const symbols: Record<string, string> = {
      USD: "$",
      EUR: "€",
      GBP: "£",
      JPY: "¥",
      BDT: "৳",
      INR: "₹",
    };
    transformedData.currencySymbol =
      symbols[payload.currency.iso] || payload.currency.iso;
  }

  // Store the rest in theme JSON
  transformedData.theme = {
    brandTagline: payload.brandTagline,
    logoType: payload.logo?.type,
    logoStyle: payload.logo?.style,
    logoText: payload.logo?.text,
    logoAltText: payload.logo?.altText,
    logoIcon: payload.logo?.icon,
    logoColors: payload.logo?.colors,
    appleTouchIcon: payload.favicon?.appleTouchIcon,
    manifestIcon: payload.favicon?.manifestIcon,
    meta: payload.meta,
    footer: payload.footer,
  };

  // Sync Asset References
  try {
    const existingConfig = await prisma.brandConfig.findUnique({
      where: { tenantId },
    });

    const oldTheme = (existingConfig?.theme as any) || {};
    const oldUrls: Record<string, string | string[] | null> = {
      logo: existingConfig?.logo || null,
      favicon: existingConfig?.favicon || null,
      appleTouchIcon: oldTheme.appleTouchIcon || null,
      manifestIcon: oldTheme.manifestIcon || null,
      socialShareImage: oldTheme.meta?.socialShareImage || null,
    };

    const newUrls: Record<string, string | string[] | null> = {
      logo: payload.logo?.imagePath || null,
      favicon: payload.favicon?.path || null,
      appleTouchIcon: payload.favicon?.appleTouchIcon || null,
      manifestIcon: payload.favicon?.manifestIcon || null,
      socialShareImage: payload.meta?.socialShareImage || null,
    };

    const { AssetServices } = await import("../Asset/asset.service");
    await AssetServices.syncReferences(
      tenantId,
      "BrandConfig",
      existingConfig?.id || "temp-id",
      oldUrls,
      newUrls
    );
  } catch (error) {
    console.error("[BrandConfig] Failed to sync asset references:", error);
  }

  const result = await prisma.brandConfig.upsert({
    where: { tenantId },
    update: transformedData,
    create: {
      tenantId,
      ...transformedData,
      name: transformedData.name || "My Store",
      currencyIso: transformedData.currencyIso || "BDT",
      currencySymbol: transformedData.currencySymbol || "৳",
    },
  });

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
