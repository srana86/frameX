/**
 * Server-Side Meta CAPI Parameter Builder
 *
 * This module implements Meta's recommended server-side parameter handling
 * following the Parameter Builder Library patterns for Node.js
 *
 * Features:
 * - Proper PII normalization and SHA-256 hashing
 * - Cookie parsing for fbc, fbp, and client_ip_address (_fbi)
 * - Client IP extraction from various headers
 * - ETLD+1 domain handling
 *
 * @see https://developers.facebook.com/docs/marketing-api/conversions-api/parameters/parameter-builder-library
 */

import { createHash } from "crypto";
import type { NextRequest } from "next/server";

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

// Cookie names
const COOKIE_FBC = "_fbc";
const COOKIE_FBP = "_fbp";
const COOKIE_FBI = "_fbi"; // Client IP stored by clientParamBuilder

// Interface for processed request data
export interface MetaRequestParams {
  fbc: string | null;
  fbp: string | null;
  clientIpAddress: string | null;
  userAgent: string | null;
  eventSourceUrl: string | null;
}

// Interface for cookies to set
export interface CookieSetting {
  name: string;
  value: string;
  domain: string;
  maxAge: number; // in seconds
}

/**
 * Parse cookies from request or cookie string
 */
export function parseCookies(cookieString: string): Record<string, string> {
  const cookies: Record<string, string> = {};
  if (!cookieString) return cookies;

  cookieString.split(";").forEach((cookie) => {
    const [name, ...rest] = cookie.trim().split("=");
    if (name) {
      cookies[name] = decodeURIComponent(rest.join("=") || "");
    }
  });

  return cookies;
}

/**
 * Process request and extract Meta tracking parameters
 * This is the main API similar to Meta's processRequest
 */
export function processRequest(request: NextRequest): MetaRequestParams {
  const headers = request.headers;
  const cookieString = headers.get("cookie") || "";
  const cookies = parseCookies(cookieString);

  // Extract fbc from cookies or try to create from URL
  let fbc = cookies[COOKIE_FBC] || null;
  if (!fbc) {
    // Try to create fbc from fbclid URL parameter
    try {
      const url = new URL(request.url);
      const fbclid = url.searchParams.get("fbclid");
      if (fbclid) {
        const timestamp = Math.floor(Date.now() / 1000);
        fbc = `fb.1.${timestamp}.${fbclid}`;
      }
    } catch {
      // Silently fail
    }
  }

  // Extract fbp from cookies
  const fbp = cookies[COOKIE_FBP] || null;

  // Extract client IP address
  // Priority: _fbi cookie > x-forwarded-for > x-real-ip > cf-connecting-ip
  let clientIpAddress = cookies[COOKIE_FBI] || null;
  if (!clientIpAddress) {
    clientIpAddress = extractClientIp(request);
  }

  // Get user agent
  const userAgent = headers.get("user-agent");

  // Get event source URL
  const eventSourceUrl = headers.get("referer") || request.url;

  return {
    fbc,
    fbp,
    clientIpAddress,
    userAgent,
    eventSourceUrl,
  };
}

/**
 * Extract client IP address from request headers
 * Handles various proxy and CDN headers
 */
export function extractClientIp(request: NextRequest): string | null {
  const headers = request.headers;

  // Priority order for IP extraction
  const ipHeaders = [
    "x-forwarded-for", // Standard proxy header
    "x-real-ip", // Nginx proxy
    "cf-connecting-ip", // Cloudflare
    "true-client-ip", // Akamai, Cloudflare Enterprise
    "x-client-ip", // Some proxies
  ];

  for (const headerName of ipHeaders) {
    const value = headers.get(headerName);
    if (value) {
      // x-forwarded-for can contain multiple IPs, take the first (client)
      const ip = value.split(",")[0].trim();
      if (isValidIp(ip)) {
        return ip;
      }
    }
  }

  return null;
}

/**
 * Validate IP address format (IPv4 or IPv6)
 */
function isValidIp(ip: string): boolean {
  // IPv4
  const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
  // IPv6 (simplified)
  const ipv6Regex = /^([a-fA-F0-9:]+)$/;

  if (ipv4Regex.test(ip)) {
    const parts = ip.split(".");
    return parts.every((part) => {
      const num = parseInt(part, 10);
      return num >= 0 && num <= 255;
    });
  }

  if (ipv6Regex.test(ip)) {
    // Basic IPv6 validation
    const parts = ip.split(":");
    return parts.length >= 2 && parts.length <= 8;
  }

  return false;
}

/**
 * Get cookies to set for fbc/fbp
 * Returns an array of cookies that should be set
 */
export function getCookiesToSet(
  host: string,
  queryParams: Record<string, string>,
  existingCookies: Record<string, string>,
  allowedDomains: string[] = []
): CookieSetting[] {
  const cookies: CookieSetting[] = [];
  const domain = resolveETLDPlus1(host, allowedDomains);
  const maxAge = 90 * 24 * 60 * 60; // 90 days in seconds

  // Handle fbc cookie
  const fbclid = queryParams.fbclid;
  if (fbclid && !existingCookies[COOKIE_FBC]) {
    const timestamp = Math.floor(Date.now() / 1000);
    cookies.push({
      name: COOKIE_FBC,
      value: `fb.1.${timestamp}.${fbclid}`,
      domain,
      maxAge,
    });
  }

  // fbp is generated client-side by Meta's SDK
  // We don't generate it server-side

  return cookies;
}

/**
 * Resolve ETLD+1 (effective top-level domain + 1)
 * This ensures cookies are set on the correct domain
 */
export function resolveETLDPlus1(host: string, allowedDomains: string[]): string {
  // Check if host matches any allowed domains
  for (const domain of allowedDomains) {
    if (host === domain || host.endsWith(`.${domain}`)) {
      return domain;
    }
  }

  // Default: try to extract ETLD+1 from host
  const parts = host.split(".");
  if (parts.length >= 2) {
    // Handle common TLDs
    const commonTLDs = ["com", "org", "net", "co", "io", "dev", "app"];
    const lastPart = parts[parts.length - 1];

    if (commonTLDs.includes(lastPart)) {
      return parts.slice(-2).join(".");
    }

    // Handle country code TLDs like .co.uk, .com.au
    if (parts.length >= 3) {
      const secondLast = parts[parts.length - 2];
      if (["co", "com", "org", "gov", "net"].includes(secondLast)) {
        return parts.slice(-3).join(".");
      }
    }

    return parts.slice(-2).join(".");
  }

  return host;
}

/**
 * Normalize PII value according to Meta's requirements
 */
export function normalizePII(value: string, dataType: MetaPIIType): string | null {
  if (!value || typeof value !== "string") return null;

  let normalized = value.toLowerCase().trim();

  switch (dataType) {
    case "email":
      // Validate email format
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) return null;
      // Remove dots from username for Gmail normalization (optional)
      // normalized = normalized.replace(/\.(?=.*@)/g, '');
      break;

    case "phone":
      // Remove all non-digit characters
      normalized = normalized.replace(/\D/g, "");
      // Should have at least 7 digits for a valid phone
      if (normalized.length < 7) return null;
      break;

    case "first_name":
    case "last_name":
    case "city":
      // Remove special characters and numbers, keep spaces
      normalized = normalized.replace(/[^a-z\s]/g, "").trim();
      // Remove extra spaces
      normalized = normalized.replace(/\s+/g, " ");
      break;

    case "state":
      // State can be 2-letter code or full name
      normalized = normalized.replace(/[^a-z\s]/g, "").trim();
      break;

    case "zip_code":
      // Keep only alphanumeric
      normalized = normalized.replace(/[^a-z0-9]/g, "");
      break;

    case "country":
      // Should be 2-letter ISO code
      normalized = normalized.slice(0, 2);
      if (normalized.length !== 2) return null;
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
      // Should be YYYYMMDD format
      // Try to parse various formats
      const dateMatch = normalized.match(/(\d{4})[-/]?(\d{2})[-/]?(\d{2})/);
      if (dateMatch) {
        normalized = dateMatch[1] + dateMatch[2] + dateMatch[3];
      } else {
        normalized = normalized.replace(/\D/g, "");
      }
      if (normalized.length !== 8) return null;
      // Validate it's a reasonable date
      const year = parseInt(normalized.slice(0, 4));
      const month = parseInt(normalized.slice(4, 6));
      const day = parseInt(normalized.slice(6, 8));
      if (year < 1900 || year > new Date().getFullYear()) return null;
      if (month < 1 || month > 12) return null;
      if (day < 1 || day > 31) return null;
      break;

    case "external_id":
      // No normalization needed for external_id
      // Just ensure it's not empty after trimming
      if (!normalized) return null;
      break;
  }

  return normalized;
}

/**
 * Hash a normalized value using SHA-256
 */
export function hashValue(value: string): string {
  if (!value) return "";
  return createHash("sha256").update(value).digest("hex");
}

/**
 * Normalize and hash PII in one step
 * Returns null if normalization fails
 */
export function getNormalizedAndHashedPII(piiValue: string, dataType: MetaPIIType): string | null {
  const normalized = normalizePII(piiValue, dataType);
  if (!normalized) return null;
  return hashValue(normalized);
}

/**
 * Process all user data for Meta Conversions API
 * Returns properly normalized and hashed user_data object
 */
export function processUserData(userData: {
  email?: string;
  emails?: string[];
  phone?: string;
  phones?: string[];
  firstName?: string;
  lastName?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  gender?: string;
  dateOfBirth?: string;
  externalId?: string;
}): Record<string, string | string[] | undefined> {
  const result: Record<string, string | string[] | undefined> = {};

  // Handle single email
  if (userData.email) {
    const hashed = getNormalizedAndHashedPII(userData.email, "email");
    if (hashed) result.em = hashed;
  }

  // Handle multiple emails
  if (userData.emails && userData.emails.length > 0) {
    const hashedEmails = userData.emails.map((e) => getNormalizedAndHashedPII(e, "email")).filter((e): e is string => e !== null);
    if (hashedEmails.length > 0) {
      result.em = hashedEmails.length === 1 ? hashedEmails[0] : hashedEmails;
    }
  }

  // Handle single phone
  if (userData.phone) {
    const hashed = getNormalizedAndHashedPII(userData.phone, "phone");
    if (hashed) result.ph = hashed;
  }

  // Handle multiple phones
  if (userData.phones && userData.phones.length > 0) {
    const hashedPhones = userData.phones.map((p) => getNormalizedAndHashedPII(p, "phone")).filter((p): p is string => p !== null);
    if (hashedPhones.length > 0) {
      result.ph = hashedPhones.length === 1 ? hashedPhones[0] : hashedPhones;
    }
  }

  // Other PII fields
  if (userData.firstName) {
    const hashed = getNormalizedAndHashedPII(userData.firstName, "first_name");
    if (hashed) result.fn = hashed;
  }

  if (userData.lastName) {
    const hashed = getNormalizedAndHashedPII(userData.lastName, "last_name");
    if (hashed) result.ln = hashed;
  }

  if (userData.city) {
    const hashed = getNormalizedAndHashedPII(userData.city, "city");
    if (hashed) result.ct = hashed;
  }

  if (userData.state) {
    const hashed = getNormalizedAndHashedPII(userData.state, "state");
    if (hashed) result.st = hashed;
  }

  if (userData.zipCode) {
    const hashed = getNormalizedAndHashedPII(userData.zipCode, "zip_code");
    if (hashed) result.zp = hashed;
  }

  if (userData.country) {
    const hashed = getNormalizedAndHashedPII(userData.country, "country");
    if (hashed) result.country = hashed;
  }

  if (userData.gender) {
    const hashed = getNormalizedAndHashedPII(userData.gender, "gender");
    if (hashed) result.ge = hashed;
  }

  if (userData.dateOfBirth) {
    const hashed = getNormalizedAndHashedPII(userData.dateOfBirth, "date_of_birth");
    if (hashed) result.db = hashed;
  }

  if (userData.externalId) {
    const hashed = getNormalizedAndHashedPII(userData.externalId, "external_id");
    if (hashed) result.external_id = hashed;
  }

  return result;
}

/**
 * Build complete user_data object for Conversions API
 * Combines request params with user data
 */
export function buildUserData(
  requestParams: MetaRequestParams,
  userData?: {
    email?: string;
    emails?: string[];
    phone?: string;
    phones?: string[];
    firstName?: string;
    lastName?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
    gender?: string;
    dateOfBirth?: string;
    externalId?: string;
  }
): Record<string, string | string[] | undefined> {
  const processedUserData = userData ? processUserData(userData) : {};

  return {
    // Include fbc and fbp (not hashed)
    ...(requestParams.fbc && { fbc: requestParams.fbc }),
    ...(requestParams.fbp && { fbp: requestParams.fbp }),
    // Include client IP and user agent (not hashed)
    ...(requestParams.clientIpAddress && { client_ip_address: requestParams.clientIpAddress }),
    ...(requestParams.userAgent && { client_user_agent: requestParams.userAgent }),
    // Include hashed PII
    ...processedUserData,
  };
}
