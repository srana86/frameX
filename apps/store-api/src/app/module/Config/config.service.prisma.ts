/**
 * Config Service - Prisma Version
 * Uses BrandConfig (merged with TenantSettings)
 */

import { prisma } from "@framex/database";
import { StatusCodes } from "http-status-codes";
import AppError from "../../errors/AppError";

/**
 * Get brand config (replaces TenantSettings)
 */
const getSettings = async (tenantId: string) => {
  const config = await prisma.brandConfig.findUnique({
    where: { tenantId },
  });

  if (!config) {
    // Return default settings if none exist
    return {
      tenantId,
      name: "My Store",
      currencyIso: "BDT",
      currencySymbol: "৳",
      timezone: "UTC",
      language: "en",
      orderEnabled: true,
    };
  }

  return config;
};

/**
 * Update brand config
 */
const updateSettings = async (
  tenantId: string,
  data: Partial<{
    name: string;
    logo: string;
    favicon: string;
    primaryColor: string;
    secondaryColor: string;
    currencyIso: string;
    currencySymbol: string;
    timezone: string;
    language: string;
    theme: Record<string, any>;
    socialLinks: Record<string, string>;
    contactInfo: Record<string, string>;
    orderEnabled: boolean;
  }>
) => {
  // Upsert brand config
  return prisma.brandConfig.upsert({
    where: { tenantId },
    update: data,
    create: {
      tenantId,
      name: data.name || "My Store",
      ...data,
    },
  });
};

/**
 * Get public store config (for frontend)
 */
const getPublicConfig = async (tenantId: string) => {
  const [config, tenant] = await Promise.all([
    prisma.brandConfig.findUnique({ where: { tenantId } }),
    prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { name: true, status: true },
    }),
  ]);

  if (!tenant || tenant.status !== "ACTIVE") {
    throw new AppError(StatusCodes.NOT_FOUND, "Store not found");
  }

  return {
    name: config?.name || tenant.name,
    logo: config?.logo,
    favicon: config?.favicon,
    primaryColor: config?.primaryColor,
    secondaryColor: config?.secondaryColor,
    currencyIso: config?.currencyIso || "BDT",
    currencySymbol: config?.currencySymbol || "৳",
    timezone: config?.timezone || "UTC",
    language: config?.language || "en",
    theme: config?.theme,
    socialLinks: config?.socialLinks,
    contactInfo: config?.contactInfo,
    orderEnabled: config?.orderEnabled ?? true,
  };
};

/**
 * Get tenant domain info
 */
const getDomainInfo = async (tenantId: string) => {
  const domain = await prisma.tenantDomain.findFirst({
    where: { tenantId },
  });

  return domain;
};

/**
 * Get full tenant context
 */
const getTenantContext = async (tenantId: string) => {
  const [tenant, config, domain] = await Promise.all([
    prisma.tenant.findUnique({ where: { id: tenantId } }),
    prisma.brandConfig.findUnique({ where: { tenantId } }),
    prisma.tenantDomain.findFirst({ where: { tenantId } }),
  ]);

  if (!tenant) {
    throw new AppError(StatusCodes.NOT_FOUND, "Tenant not found");
  }

  return {
    tenant,
    config,
    domain,
  };
};

export const ConfigServicesPrisma = {
  getSettings,
  updateSettings,
  getPublicConfig,
  getDomainInfo,
  getTenantContext,
};
