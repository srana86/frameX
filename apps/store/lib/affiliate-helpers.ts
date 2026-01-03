/**
 * Affiliate Helper Functions
 */

import { ObjectId } from "mongodb";
import type { AffiliateSettings, CommissionLevel, AffiliateCookieData } from "./affiliate-types";

/**
 * Generate a unique promo code for an affiliate
 */
export function generatePromoCode(userId: string, fullName?: string): string {
  // Use first 3 letters of name (if available) + last 6 chars of userId
  const namePart = fullName ? fullName.replace(/\s+/g, "").substring(0, 3).toUpperCase() : "AFF";
  const idPart = userId.slice(-6).toUpperCase();
  const randomPart = Math.random().toString(36).substring(2, 5).toUpperCase();
  return `${namePart}${idPart}${randomPart}`;
}

/**
 * Validate promo code format
 */
export function isValidPromoCodeFormat(code: string): boolean {
  // Promo code should be 8-15 alphanumeric characters
  return /^[A-Z0-9]{8,15}$/.test(code);
}

/**
 * Calculate commission amount based on settings and order total
 */
export function calculateCommission(
  orderTotal: number,
  level: CommissionLevel,
  settings: AffiliateSettings
): { percentage: number; amount: number } | null {
  if (!settings.enabled) {
    return null;
  }

  const levelConfig = settings.commissionLevels[level];
  if (!levelConfig || !levelConfig.enabled) {
    return null;
  }

  const percentage = levelConfig.percentage;
  const amount = (orderTotal * percentage) / 100;

  return { percentage, amount };
}

/**
 * Parse affiliate cookie data
 */
export function parseAffiliateCookie(cookieValue: string): AffiliateCookieData | null {
  try {
    if (!cookieValue || typeof cookieValue !== "string") {
      console.warn("[parseAffiliateCookie] Invalid cookie value type:", typeof cookieValue);
      return null;
    }

    const data = JSON.parse(cookieValue);

    // Check for required fields
    if (!data.promoCode) {
      console.warn("[parseAffiliateCookie] Missing promoCode in cookie data");
      return null;
    }
    if (!data.affiliateId) {
      console.warn("[parseAffiliateCookie] Missing affiliateId in cookie data");
      return null;
    }
    if (!data.timestamp) {
      console.warn("[parseAffiliateCookie] Missing timestamp in cookie data");
      return null;
    }
    if (!data.expiry) {
      console.warn("[parseAffiliateCookie] Missing expiry in cookie data");
      return null;
    }

    // Check if cookie is still valid
    if (Date.now() > data.expiry) {
      console.warn("[parseAffiliateCookie] Cookie expired:", { expiry: data.expiry, now: Date.now() });
      return null; // Cookie expired
    }

    return data;
  } catch (error: any) {
    console.error("[parseAffiliateCookie] JSON parse error:", error?.message);
    console.error("[parseAffiliateCookie] Cookie value (first 200 chars):", cookieValue?.substring(0, 200));
    return null;
  }
}

/**
 * Create affiliate cookie data
 */
export function createAffiliateCookieData(promoCode: string, affiliateId: string, expiryDays: number = 30): AffiliateCookieData {
  const now = Date.now();
  const expiry = now + expiryDays * 24 * 60 * 60 * 1000; // Convert days to milliseconds

  return {
    promoCode,
    affiliateId,
    timestamp: now,
    expiry,
  };
}

/**
 * Get affiliate cookie name
 */
export function getAffiliateCookieName(): string {
  return "affiliate_ref";
}

/**
 * Calculate affiliate level based on delivered sales count
 * Uses salesThresholds if available, otherwise falls back to requiredSales in commissionLevels
 */
export function calculateAffiliateLevel(deliveredSales: number, settings: AffiliateSettings): CommissionLevel {
  // First try salesThresholds (new structure)
  if ((settings as any).salesThresholds) {
    let currentLevel: CommissionLevel = 1;
    for (let i = 5; i >= 1; i--) {
      const level = i as CommissionLevel;
      const threshold = (settings as any).salesThresholds[level];
      if (threshold !== undefined && deliveredSales >= threshold) {
        currentLevel = level;
        break;
      }
    }
    return currentLevel;
  }

  // Fallback to old structure (requiredSales in commissionLevels)
  const levels: CommissionLevel[] = [5, 4, 3, 2, 1];
  for (const level of levels) {
    const levelConfig = settings.commissionLevels[level];
    if (levelConfig?.enabled && (levelConfig as any).requiredSales !== undefined) {
      if (deliveredSales >= (levelConfig as any).requiredSales) {
        return level;
      }
    }
  }

  // Default to level 1 if no level requirements met
  return 1;
}

/**
 * Get affiliate level based on delivered orders and sales thresholds
 */
export function getAffiliateLevel(deliveredOrders: number, settings: AffiliateSettings): CommissionLevel {
  return calculateAffiliateLevel(deliveredOrders, settings);
}

/**
 * Get next level progress for affiliate
 */
export function getNextLevelProgress(
  currentLevel: CommissionLevel,
  deliveredSales: number,
  settings: AffiliateSettings
): { nextLevel: CommissionLevel | null; requiredSales: number; progress: number } {
  const levels: CommissionLevel[] = [1, 2, 3, 4, 5];
  const currentIndex = levels.indexOf(currentLevel);

  // Find next enabled level
  for (let i = currentIndex + 1; i < levels.length; i++) {
    const nextLevel = levels[i];
    const levelConfig = settings.commissionLevels[nextLevel];

    if (levelConfig?.enabled && levelConfig.requiredSales !== undefined) {
      const requiredSales = levelConfig.requiredSales;
      const progress = Math.min(100, (deliveredSales / requiredSales) * 100);

      return {
        nextLevel,
        requiredSales,
        progress,
      };
    }
  }

  return {
    nextLevel: null,
    requiredSales: 0,
    progress: 100,
  };
}
