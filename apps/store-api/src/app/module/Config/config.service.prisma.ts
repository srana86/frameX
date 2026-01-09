/**
 * Tenant Settings Service - Prisma Version
 * Multi-tenant configuration operations
 */

import { prisma } from "@framex/database";
import { StatusCodes } from "http-status-codes";
import AppError from "../../errors/AppError";

/**
 * Get tenant settings (brand config)
 */
const getSettings = async (tenantId: string) => {
    const settings = await prisma.tenantSettings.findUnique({
        where: { tenantId },
    });

    if (!settings) {
        // Return default settings if none exist
        return {
            tenantId,
            brandName: "My Store",
            currency: "USD",
            currencySymbol: "$",
            orderEnabled: true,
        };
    }

    return settings;
};

/**
 * Update tenant settings
 */
const updateSettings = async (
    tenantId: string,
    data: Partial<{
        brandName: string;
        logo: string;
        favicon: string;
        currency: string;
        currencySymbol: string;
        timezone: string;
        language: string;
        theme: Record<string, any>;
        socialLinks: Record<string, string>;
        contactInfo: Record<string, string>;
        orderEnabled: boolean;
    }>
) => {
    // Upsert settings
    return prisma.tenantSettings.upsert({
        where: { tenantId },
        update: data,
        create: {
            tenantId,
            brandName: data.brandName || "My Store",
            ...data,
        },
    });
};

/**
 * Get public store config (for frontend)
 */
const getPublicConfig = async (tenantId: string) => {
    const [settings, tenant] = await Promise.all([
        prisma.tenantSettings.findUnique({ where: { tenantId } }),
        prisma.tenant.findUnique({
            where: { id: tenantId },
            select: { name: true, status: true },
        }),
    ]);

    if (!tenant || tenant.status !== "ACTIVE") {
        throw new AppError(StatusCodes.NOT_FOUND, "Store not found");
    }

    return {
        brandName: settings?.brandName || tenant.name,
        logo: settings?.logo,
        favicon: settings?.favicon,
        currency: settings?.currency || "USD",
        currencySymbol: settings?.currencySymbol || "$",
        theme: settings?.theme,
        socialLinks: settings?.socialLinks,
        contactInfo: settings?.contactInfo,
        orderEnabled: settings?.orderEnabled ?? true,
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
    const [tenant, settings, domain] = await Promise.all([
        prisma.tenant.findUnique({ where: { id: tenantId } }),
        prisma.tenantSettings.findUnique({ where: { tenantId } }),
        prisma.tenantDomain.findFirst({ where: { tenantId } }),
    ]);

    if (!tenant) {
        throw new AppError(StatusCodes.NOT_FOUND, "Tenant not found");
    }

    return {
        tenant,
        settings,
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
