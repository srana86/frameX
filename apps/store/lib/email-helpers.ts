import { getCollection as getMerchantCollection } from "./mongodb-merchant";
import {
  buildDefaultTemplate,
  defaultEmailTemplates,
  emailEvents,
  type EmailEvent,
  type EmailProviderConfig,
  type EmailProviderSettings,
  type EmailTemplate,
  type BrandEmailMeta,
} from "./email-types";
import { decryptSecret, encryptSecret } from "./database-service";

export const EMAIL_TEMPLATE_COLLECTION = "email_templates";
export const EMAIL_PROVIDER_COLLECTION = "email_providers";

export async function getEmailTemplatesCollection() {
  return getMerchantCollection<EmailTemplate>(EMAIL_TEMPLATE_COLLECTION);
}

export async function getEmailProvidersCollection() {
  return getMerchantCollection<EmailProviderSettings>(EMAIL_PROVIDER_COLLECTION);
}

export function normalizeTemplate(doc: any): EmailTemplate {
  if (!doc) return doc;
  const { _id, ...rest } = doc;
  return rest as EmailTemplate;
}

export function buildDefaultEmailTemplates(merchantId?: string, brand?: BrandEmailMeta): EmailTemplate[] {
  return emailEvents.map((event) => buildDefaultTemplate(event, merchantId, brand));
}

export async function ensureEmailTemplatesExist(merchantId?: string, baseQuery: Record<string, any> = {}, brand?: BrandEmailMeta) {
  const col = await getEmailTemplatesCollection();
  // Use countDocuments for faster check - only fetch events if count doesn't match
  const existingCount = await col.countDocuments(baseQuery);

  // If we already have all templates, skip the expensive find operation
  if (existingCount >= emailEvents.length) {
    return;
  }

  // Only fetch events if we're missing some templates
  const existing = await col.find(baseQuery, { projection: { event: 1 } }).toArray();
  const existingEvents = new Set(existing.map((doc) => doc.event as EmailEvent));

  const missing = emailEvents.filter((event) => !existingEvents.has(event));
  if (missing.length === 0) return;

  const docs = missing.map((event) => ({
    ...buildDefaultTemplate(event, merchantId, brand),
    ...baseQuery,
  }));
  await col.insertMany(docs);
}

const SECRET_MASK = "ENCRYPTED";

const encryptIfPresent = (value?: string) => (value ? encryptSecret(value) : value);
const decryptIfPresent = (value?: string) => {
  if (!value) return value;

  // Check if value looks encrypted (format: iv:encrypted where iv is 32 hex chars)
  const looksEncrypted = value.includes(":") && value.split(":").length === 2;

  try {
    const decrypted = decryptSecret(value);

    // If it looked encrypted but decryption returned the same value, decryption failed
    if (looksEncrypted && decrypted === value) {
      console.error(
        "[Email Helpers] ⚠️ CRITICAL: Password decryption failed! " +
          "The value appears encrypted but couldn't be decrypted. " +
          "This usually means ENCRYPTION_KEY changed or is missing. " +
          "User must re-enter the password."
      );
      // Return a special marker so we can detect this
      return value; // Keep encrypted value but we'll detect it in SMTP
    }

    // Log if value appears to have changed (was encrypted) or stayed same (was plain text)
    if (decrypted !== value) {
      console.log("[Email Helpers] Successfully decrypted secret value");
    }
    return decrypted;
  } catch (error) {
    // If decryption fails and it looked encrypted, this is a problem
    if (looksEncrypted) {
      console.error(
        "[Email Helpers] ⚠️ CRITICAL: Password decryption threw error! " + "Value appears encrypted but decryption failed. Error:",
        error
      );
    } else {
      // If it doesn't look encrypted, assume it's plain text
      console.log("[Email Helpers] Value doesn't appear encrypted, using as plain text");
    }
    return value;
  }
};
const maskIfPresent = (value?: string) => (value ? SECRET_MASK : value);

export function encryptProviderSecrets(config: EmailProviderConfig): EmailProviderConfig {
  switch (config.provider) {
    case "smtp":
      return { ...config, password: encryptIfPresent(config.password) };
    case "ses":
      return { ...config, accessKeyId: encryptIfPresent(config.accessKeyId), secretAccessKey: encryptIfPresent(config.secretAccessKey) };
    case "sendgrid":
      return { ...config, apiKey: encryptIfPresent(config.apiKey) };
    case "postmark":
      return { ...config, serverToken: encryptIfPresent(config.serverToken) };
    default:
      return config;
  }
}

export function decryptProviderSecrets(config: EmailProviderConfig): EmailProviderConfig {
  switch (config.provider) {
    case "smtp":
      return { ...config, password: decryptIfPresent(config.password) };
    case "ses":
      return { ...config, accessKeyId: decryptIfPresent(config.accessKeyId), secretAccessKey: decryptIfPresent(config.secretAccessKey) };
    case "sendgrid":
      return { ...config, apiKey: decryptIfPresent(config.apiKey) };
    case "postmark":
      return { ...config, serverToken: decryptIfPresent(config.serverToken) };
    default:
      return config;
  }
}

export function maskProviderSecrets(config: EmailProviderConfig): EmailProviderConfig {
  switch (config.provider) {
    case "smtp":
      return { ...config, password: maskIfPresent(config.password) };
    case "ses":
      return { ...config, accessKeyId: maskIfPresent(config.accessKeyId), secretAccessKey: maskIfPresent(config.secretAccessKey) };
    case "sendgrid":
      return { ...config, apiKey: maskIfPresent(config.apiKey) };
    case "postmark":
      return { ...config, serverToken: maskIfPresent(config.serverToken) };
    default:
      return config;
  }
}

export function buildEmptyProviderSettings(merchantId?: string): EmailProviderSettings {
  const now = new Date().toISOString();
  return {
    id: "email_providers_default",
    merchantId,
    defaultProviderId: undefined,
    fallbackProviderId: undefined,
    providers: [],
    createdAt: now,
    updatedAt: now,
  };
}

export function getDefaultTemplateMeta(event: EmailEvent) {
  return defaultEmailTemplates[event];
}
