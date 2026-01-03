/* eslint-disable @typescript-eslint/no-explicit-any */
import { StatusCodes } from "http-status-codes";
import AppError from "../../errors/AppError";
import { EmailProviderSettings } from "./emailProvider.model";
import {
  EmailProviderConfig,
  EmailProviderSettings as TEmailProviderSettings,
} from "./emailProvider.interface";

const SETTINGS_ID = "email_providers_default";

// Get email provider settings
const getEmailProviderSettingsFromDB = async (
  merchantId?: string
): Promise<TEmailProviderSettings> => {
  const query: any = { id: SETTINGS_ID };
  if (merchantId) {
    query.merchantId = merchantId;
  }

  let settings = await EmailProviderSettings.findOne(query);

  if (!settings) {
    // Create default empty settings
    settings = await EmailProviderSettings.create({
      id: SETTINGS_ID,
      merchantId: merchantId || undefined,
      providers: [],
    });
  }

  // Mask sensitive fields (passwords, API keys, etc.)
  const masked = maskProviderSecrets(settings.toObject());

  return masked;
};

// Update email provider settings
const updateEmailProviderSettingsFromDB = async (
  payload: {
    providers: EmailProviderConfig[];
    defaultProviderId?: string;
    fallbackProviderId?: string;
  },
  merchantId?: string
): Promise<TEmailProviderSettings> => {
  const query: any = { id: SETTINGS_ID };
  if (merchantId) {
    query.merchantId = merchantId;
  }

  const existing = await EmailProviderSettings.findOne(query);

  // Encrypt sensitive fields in providers
  const encryptedProviders = payload.providers.map((provider) =>
    encryptProviderSecrets(provider)
  );

  const updateData: any = {
    id: SETTINGS_ID,
    providers: encryptedProviders,
    defaultProviderId: payload.defaultProviderId,
    fallbackProviderId: payload.fallbackProviderId,
    updatedAt: new Date(),
  };

  if (merchantId) {
    updateData.merchantId = merchantId;
  }

  if (!existing) {
    updateData.createdAt = new Date();
  }

  const result = await EmailProviderSettings.findOneAndUpdate(
    query,
    { $set: updateData },
    { new: true, upsert: true, runValidators: true }
  );

  if (!result) {
    throw new AppError(
      StatusCodes.INTERNAL_SERVER_ERROR,
      "Failed to update email provider settings"
    );
  }

  // Return masked version
  return maskProviderSecrets(result.toObject());
};

// Helper: Mask sensitive fields
function maskProviderSecrets(settings: any): TEmailProviderSettings {
  return {
    ...settings,
    providers: (settings.providers || []).map((provider: any) => {
      const masked: any = { ...provider };
      if (masked.password) masked.password = "ENCRYPTED";
      if (masked.secretAccessKey) masked.secretAccessKey = "ENCRYPTED";
      if (masked.apiKey) masked.apiKey = "ENCRYPTED";
      if (masked.serverToken) masked.serverToken = "ENCRYPTED";
      return masked;
    }),
  };
}

// Helper: Encrypt sensitive fields (placeholder - implement actual encryption)
function encryptProviderSecrets(provider: EmailProviderConfig): any {
  // TODO: Implement actual encryption for sensitive fields
  // For now, just return as-is (in production, encrypt passwords, API keys, etc.)
  return provider;
}

export const EmailProviderServices = {
  getEmailProviderSettingsFromDB,
  updateEmailProviderSettingsFromDB,
};
