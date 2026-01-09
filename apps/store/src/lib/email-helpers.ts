import { getMerchantCollectionForAPI } from "./api-helpers";
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
import crypto from "crypto";

export const EMAIL_TEMPLATE_COLLECTION = "email_templates";
export const EMAIL_PROVIDER_COLLECTION = "email_providers";

export async function getEmailTemplatesCollection() {
  return getMerchantCollectionForAPI<EmailTemplate>(EMAIL_TEMPLATE_COLLECTION);
}

export async function getEmailProvidersCollection() {
  return getMerchantCollectionForAPI<EmailProviderSettings>(EMAIL_PROVIDER_COLLECTION);
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
  // Shim allows usage of countDocuments
  const existingCount = await col.countDocuments(baseQuery);

  if (existingCount >= emailEvents.length) {
    return;
  }

  // Shim allows find()
  const existing = await col.find(baseQuery, { projection: { event: 1 } }).toArray();
  const existingEvents = new Set(existing.map((doc: any) => doc.event as EmailEvent));

  const missing = emailEvents.filter((event) => !existingEvents.has(event));
  if (missing.length === 0) return;

  const docs = missing.map((event) => ({
    ...buildDefaultTemplate(event, merchantId, brand),
    ...baseQuery,
  }));

  // Shim insertMany? No, shim only has insertOne.
  // Loop insertOne
  for (const doc of docs) {
    await col.insertOne(doc);
  }
}

const SECRET_MASK = "ENCRYPTED";
// Use environment var or default key for now
const ENCRYPTION_KEY = process.env.MONGODB_URI || "default-secret-key-123";

export function encryptSecret(text: string): string {
  if (!text) return text;
  try {
    const algorithm = "aes-256-cbc";
    const key = crypto.createHash("sha256").update(ENCRYPTION_KEY).digest();
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(algorithm, key, iv);
    let encrypted = cipher.update(text, "utf8", "hex");
    encrypted += cipher.final("hex");
    return iv.toString("hex") + ":" + encrypted;
  } catch (e) {
    return text;
  }
}

export function decryptSecret(encryptedText: string): string {
  if (!encryptedText || !encryptedText.includes(":")) return encryptedText;
  try {
    const algorithm = "aes-256-cbc";
    const key = crypto.createHash("sha256").update(ENCRYPTION_KEY).digest();
    const parts = encryptedText.split(":");
    if (parts.length !== 2) return encryptedText;
    const [ivHex, encrypted] = parts;
    const iv = Buffer.from(ivHex, "hex");
    const decipher = crypto.createDecipheriv(algorithm, key, iv);
    let decrypted = decipher.update(encrypted, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
  } catch (e) {
    return encryptedText;
  }
}

const encryptIfPresent = (value?: string) => (value ? encryptSecret(value) : value);
const decryptIfPresent = (value?: string) => (value ? decryptSecret(value) : value);
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
