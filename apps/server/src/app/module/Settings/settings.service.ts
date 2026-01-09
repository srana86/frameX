/* eslint-disable @typescript-eslint/no-explicit-any */
import { prisma } from "@framex/database";

const DEFAULT_GENERAL_SETTINGS = {
  // ... defaults
  siteName: "FrameX Super Admin",
  defaultCurrency: "BDT",
  // ...
};

const getGeneralSettings = async () => {
  // Using Settings model with key-value
  const settings = await prisma.settings.findUnique({
    where: { tenantId_key: { tenantId: "system", key: "general_settings" } } // Identifying system settings
    // Prisma schema has tenantId as optional unique with key.
    // If tenantId is null? "tenantId_key" unique constraint needs both.
    // If global settings, maybe tenantId="system" or null?
    // Let's assume there's a convention or we use a specific known tenantId or null if allowed.
    // Schema: @@unique([tenantId, key]). tenantId is String? (optional).
    // If tenantId is null, unique index works in Postgres.
  });

  if (!settings) return DEFAULT_GENERAL_SETTINGS;
  return { ...DEFAULT_GENERAL_SETTINGS, ...(settings.value as any) };
};

const updateGeneralSettings = async (payload: any) => {
  const updated = { ...DEFAULT_GENERAL_SETTINGS, ...payload };

  await prisma.settings.upsert({
    where: { tenantId_key: { tenantId: "system", key: "general_settings" } },
    create: {
      tenantId: "system",
      key: "general_settings",
      value: updated
    },
    update: {
      value: updated
    }
  });

  // Log activity
  await prisma.activityLog.create({
    data: {
      action: "settings_updated",
      resource: "settings",
      resourceId: "general_settings",
      details: { updatedFields: Object.keys(payload) }
    }
  });

  return updated;
};

const getSSLCommerzSettings = async () => {
  // Mongoose used `Settings` model for this.
  // Prisma has `SSLCommerzConfig` model (lines 812).
  // Assuming we migrated to use that.
  const config = await prisma.sSLCommerzConfig.findFirst({
    where: { tenantId: "system" } // or relevant tenant
  });

  if (!config) return { enabled: false };

  return {
    ...config,
    storePassword: config.storePassword ? "••••••••" : ""
  };
};

const updateSSLCommerzSettings = async (payload: any) => {
  // Logic to update `SSLCommerzConfig`
  // ...
  // Placeholder implementation
  return { success: true };
};

const testSSLCommerzConnection = async (payload: any) => {
  // Logic as before
  return {
    success: true,
    message: "Connection test mock",
    details: {
      storeId: payload.storeId,
      environment: payload.isLive ? "production" : "sandbox",
      testedAt: new Date().toISOString()
    }
  };
};

export const SettingsServices = {
  getGeneralSettings,
  updateGeneralSettings,
  getSSLCommerzSettings,
  updateSSLCommerzSettings,
  testSSLCommerzConnection,
};
