/**
 * Meta CAPI Parameter Builder Integration
 *
 * This module integrates with Meta's official clientParamBuilder SDK
 * to improve Conversions API event quality by properly managing:
 * - Meta click ID (fbc)
 * - Meta browser ID (fbp)
 * - Client IP Address (client_ip_address)
 * - PII normalization and hashing
 *
 * @see https://developers.facebook.com/docs/marketing-api/conversions-api/parameters/parameter-builder-library
 */

// Cookie keys used by Meta's SDK
export const META_COOKIES = {
  FBC: "_fbc", // Facebook Click ID
  FBP: "_fbp", // Facebook Browser ID
  FBI: "_fbi", // Client IP Address (stored by clientParamBuilder)
} as const;

// PII data types supported by Meta
export type MetaPIIType =
  | "phone"
  | "email"
  | "first_name"
  | "last_name"
  | "date_of_birth"
  | "gender"
  | "city"
  | "state"
  | "zip_code"
  | "country"
  | "external_id";

// Interface for Meta's clientParamBuilder SDK
interface ClientParamBuilder {
  processAndCollectAllParams: (
    url?: string,
    getIpFn?: () => Promise<string>
  ) => Promise<{
    _fbc?: string;
    _fbp?: string;
    _fbi?: string;
  }>;
  getNormalizedAndHashedPII: (piiValue: string, dataType: MetaPIIType) => string | null;
  getFbc: () => string;
  getFbp: () => string;
  getClientIpAddress: () => string;
}

declare global {
  interface Window {
    clientParamBuilder?: ClientParamBuilder;
  }
}

/**
 * Check if clientParamBuilder SDK is loaded
 */
export function isClientParamBuilderLoaded(): boolean {
  return typeof window !== "undefined" && !!window.clientParamBuilder;
}

/**
 * Get the clientParamBuilder instance
 */
export function getClientParamBuilder(): ClientParamBuilder | null {
  if (typeof window === "undefined") return null;
  return window.clientParamBuilder || null;
}

/**
 * Async function to fetch the user's IP address (IPv6 preferred, fallback to IPv4)
 * This is passed to clientParamBuilder.processAndCollectAllParams
 */
export async function getClientIpAddress(): Promise<string> {
  try {
    // Try to get IPv6 first, fallback to IPv4
    const response = await fetch("https://api64.ipify.org?format=text", {
      cache: "no-store",
    });
    if (response.ok) {
      return await response.text();
    }
  } catch (e) {
    // Fallback to IPv4
    try {
      const response = await fetch("https://api.ipify.org?format=text", {
        cache: "no-store",
      });
      if (response.ok) {
        return await response.text();
      }
    } catch {
      // Silently fail
    }
  }
  return "";
}

/**
 * Initialize clientParamBuilder and collect all parameters
 * Should be called once on page load after the SDK is loaded
 */
export async function initializeMetaParamBuilder(): Promise<{
  fbc: string;
  fbp: string;
  clientIpAddress: string;
} | null> {
  const builder = getClientParamBuilder();
  if (!builder) {
    console.warn("[Meta Param Builder] SDK not loaded");
    return null;
  }

  try {
    // Process and collect all parameters using the current URL
    const cookies = await builder.processAndCollectAllParams(
      typeof window !== "undefined" ? window.location.href : undefined,
      getClientIpAddress
    );

    return {
      fbc: cookies._fbc || "",
      fbp: cookies._fbp || "",
      clientIpAddress: cookies._fbi || "",
    };
  } catch (error) {
    console.error("[Meta Param Builder] Error initializing:", error);
    return null;
  }
}

/**
 * Get Facebook Click ID (fbc) from cookies
 * Uses clientParamBuilder if available, otherwise fallback to manual cookie reading
 */
export function getFbc(): string {
  const builder = getClientParamBuilder();
  if (builder) {
    return builder.getFbc();
  }
  // Fallback to manual cookie reading
  return getCookieValue(META_COOKIES.FBC);
}

/**
 * Get Facebook Browser ID (fbp) from cookies
 * Uses clientParamBuilder if available, otherwise fallback to manual cookie reading
 */
export function getFbp(): string {
  const builder = getClientParamBuilder();
  if (builder) {
    return builder.getFbp();
  }
  // Fallback to manual cookie reading
  return getCookieValue(META_COOKIES.FBP);
}

/**
 * Get Client IP Address from cookies (_fbi)
 * Uses clientParamBuilder if available
 */
export function getClientIp(): string {
  const builder = getClientParamBuilder();
  if (builder) {
    return builder.getClientIpAddress();
  }
  // Fallback to manual cookie reading
  return getCookieValue(META_COOKIES.FBI);
}

/**
 * Normalize and hash PII using Meta's official SDK
 * Returns null for invalid input
 *
 * @param piiValue - The PII value to normalize and hash
 * @param dataType - The type of PII (email, phone, first_name, etc.)
 */
export function normalizeAndHashPII(piiValue: string, dataType: MetaPIIType): string | null {
  if (!piiValue || typeof piiValue !== "string") return null;

  const builder = getClientParamBuilder();
  if (builder) {
    return builder.getNormalizedAndHashedPII(piiValue, dataType);
  }

  // Fallback to synchronous local implementation
  return fallbackNormalizeAndHashPIISync(piiValue, dataType);
}

/**
 * Synchronous fallback normalization and hashing for when SDK is not available
 * Uses a simpler hash for sync operations (async version available for full SHA-256)
 */
function fallbackNormalizeAndHashPIISync(piiValue: string, dataType: MetaPIIType): string | null {
  if (!piiValue) return null;

  let normalized = piiValue.toLowerCase().trim();

  switch (dataType) {
    case "email":
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) return null;
      break;
    case "phone":
      normalized = normalized.replace(/\D/g, "");
      if (normalized.length < 7) return null;
      break;
    case "first_name":
    case "last_name":
    case "city":
    case "state":
      normalized = normalized.replace(/[^a-z0-9\s]/g, "");
      break;
    case "zip_code":
      normalized = normalized.replace(/[^a-z0-9]/g, "");
      break;
    case "country":
      normalized = normalized.slice(0, 2);
      break;
    case "gender":
      if (normalized.startsWith("m") || normalized === "male") {
        normalized = "m";
      } else if (normalized.startsWith("f") || normalized === "female") {
        normalized = "f";
      } else {
        return null;
      }
      break;
    case "date_of_birth":
      normalized = normalized.replace(/\D/g, "");
      if (normalized.length !== 8) return null;
      break;
    case "external_id":
      break;
  }

  // Simple hash for sync operation - will be properly hashed on server side
  // This is just for browser fallback when SDK is not available
  return simpleHash(normalized);
}

/**
 * Simple hash function for synchronous browser fallback
 * The server will apply proper SHA-256 hashing
 */
function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16).padStart(8, "0");
}

/**
 * Fallback normalization and hashing for when SDK is not available
 * Follows Meta's normalization rules - async version with proper SHA-256
 */
async function fallbackNormalizeAndHashPII(piiValue: string, dataType: MetaPIIType): Promise<string | null> {
  if (!piiValue) return null;

  let normalized = piiValue.toLowerCase().trim();

  switch (dataType) {
    case "email":
      // Validate email format
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) return null;
      break;

    case "phone":
      // Remove all non-digit characters
      normalized = normalized.replace(/\D/g, "");
      // Should have at least 7 digits
      if (normalized.length < 7) return null;
      break;

    case "first_name":
    case "last_name":
    case "city":
    case "state":
      // Remove special characters, keep only alphanumeric
      normalized = normalized.replace(/[^a-z0-9\s]/g, "");
      break;

    case "zip_code":
      // Remove spaces and special chars
      normalized = normalized.replace(/[^a-z0-9]/g, "");
      break;

    case "country":
      // Should be 2-letter ISO code
      normalized = normalized.slice(0, 2);
      break;

    case "gender":
      // Normalize to 'm' or 'f'
      if (normalized.startsWith("m") || normalized === "male") {
        normalized = "m";
      } else if (normalized.startsWith("f") || normalized === "female") {
        normalized = "f";
      } else {
        return null;
      }
      break;

    case "date_of_birth":
      // Should be in YYYYMMDD format
      normalized = normalized.replace(/\D/g, "");
      if (normalized.length !== 8) return null;
      break;

    case "external_id":
      // No normalization needed
      break;
  }

  // Hash using SHA-256
  return await sha256Hash(normalized);
}

/**
 * SHA-256 hashing (browser-compatible)
 */
async function sha256Hash(message: string): Promise<string> {
  if (typeof window === "undefined") return "";

  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest("SHA-256", msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Helper to get cookie value
 */
function getCookieValue(name: string): string {
  if (typeof document === "undefined") return "";

  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) {
    return parts.pop()?.split(";").shift() || "";
  }
  return "";
}

/**
 * Get all Meta tracking parameters at once
 * Useful for sending with API requests
 */
export function getAllMetaParams(): {
  fbc: string;
  fbp: string;
  clientIpAddress: string;
} {
  return {
    fbc: getFbc(),
    fbp: getFbp(),
    clientIpAddress: getClientIp(),
  };
}

/**
 * Normalize and hash all PII data for Meta API
 * Uses Meta's official normalization rules
 */
export async function normalizeAndHashUserData(userData: {
  email?: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  gender?: string;
  dateOfBirth?: string;
  externalId?: string;
}): Promise<{
  em?: string;
  ph?: string;
  fn?: string;
  ln?: string;
  ct?: string;
  st?: string;
  zp?: string;
  country?: string;
  ge?: string;
  db?: string;
  external_id?: string;
}> {
  const result: Record<string, string | undefined> = {};

  const builder = getClientParamBuilder();

  if (builder) {
    // Use Meta's SDK for normalization
    if (userData.email) result.em = builder.getNormalizedAndHashedPII(userData.email, "email") || undefined;
    if (userData.phone) result.ph = builder.getNormalizedAndHashedPII(userData.phone, "phone") || undefined;
    if (userData.firstName) result.fn = builder.getNormalizedAndHashedPII(userData.firstName, "first_name") || undefined;
    if (userData.lastName) result.ln = builder.getNormalizedAndHashedPII(userData.lastName, "last_name") || undefined;
    if (userData.city) result.ct = builder.getNormalizedAndHashedPII(userData.city, "city") || undefined;
    if (userData.state) result.st = builder.getNormalizedAndHashedPII(userData.state, "state") || undefined;
    if (userData.zipCode) result.zp = builder.getNormalizedAndHashedPII(userData.zipCode, "zip_code") || undefined;
    if (userData.country) result.country = builder.getNormalizedAndHashedPII(userData.country, "country") || undefined;
    if (userData.gender) result.ge = builder.getNormalizedAndHashedPII(userData.gender, "gender") || undefined;
    if (userData.dateOfBirth) result.db = builder.getNormalizedAndHashedPII(userData.dateOfBirth, "date_of_birth") || undefined;
    if (userData.externalId) result.external_id = builder.getNormalizedAndHashedPII(userData.externalId, "external_id") || undefined;
  } else {
    // Use fallback implementation
    if (userData.email) result.em = (await fallbackNormalizeAndHashPII(userData.email, "email")) || undefined;
    if (userData.phone) result.ph = (await fallbackNormalizeAndHashPII(userData.phone, "phone")) || undefined;
    if (userData.firstName) result.fn = (await fallbackNormalizeAndHashPII(userData.firstName, "first_name")) || undefined;
    if (userData.lastName) result.ln = (await fallbackNormalizeAndHashPII(userData.lastName, "last_name")) || undefined;
    if (userData.city) result.ct = (await fallbackNormalizeAndHashPII(userData.city, "city")) || undefined;
    if (userData.state) result.st = (await fallbackNormalizeAndHashPII(userData.state, "state")) || undefined;
    if (userData.zipCode) result.zp = (await fallbackNormalizeAndHashPII(userData.zipCode, "zip_code")) || undefined;
    if (userData.country) result.country = (await fallbackNormalizeAndHashPII(userData.country, "country")) || undefined;
    if (userData.gender) result.ge = (await fallbackNormalizeAndHashPII(userData.gender, "gender")) || undefined;
    if (userData.dateOfBirth) result.db = (await fallbackNormalizeAndHashPII(userData.dateOfBirth, "date_of_birth")) || undefined;
    if (userData.externalId) result.external_id = (await fallbackNormalizeAndHashPII(userData.externalId, "external_id")) || undefined;
  }

  return result;
}
