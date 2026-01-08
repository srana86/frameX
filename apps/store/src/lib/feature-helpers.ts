// Feature helper functions for dynamic feature checking
// These functions use the plan from database (single source of truth)

import { getMerchantSubscription, getSubscriptionPlan } from "./subscription-helpers";
import type { PlanFeatures } from "./subscription-types";

/**
 * Get all features for a merchant's current plan
 * Returns the actual plan features from database
 */
export async function getMerchantFeatures(merchantId: string): Promise<PlanFeatures | null> {
  const subscription = await getMerchantSubscription(merchantId);
  if (!subscription) return null;

  const plan = await getSubscriptionPlan(subscription.planId);
  if (!plan) return null;

  return plan.features;
}

/**
 * Get a specific feature value for merchant
 * Returns the actual value from plan (could be boolean, number, string, array, or "unlimited")
 */
export async function getMerchantFeature(
  merchantId: string,
  featureKey: string
): Promise<boolean | number | string | string[] | "unlimited" | null> {
  const features = await getMerchantFeatures(merchantId);
  if (!features) return null;

  return features[featureKey] !== undefined ? features[featureKey] : null;
}

/**
 * Check if merchant has a boolean feature enabled
 */
export async function hasFeature(merchantId: string, featureKey: string): Promise<boolean> {
  const featureValue = await getMerchantFeature(merchantId, featureKey);
  return featureValue === true;
}

/**
 * Get feature value as number (for numeric features)
 */
export async function getFeatureAsNumber(
  merchantId: string,
  featureKey: string
): Promise<number | "unlimited" | null> {
  const featureValue = await getMerchantFeature(merchantId, featureKey);
  
  if (featureValue === "unlimited") return "unlimited";
  if (typeof featureValue === "number") return featureValue;
  return null;
}

/**
 * Get feature value as array (for array features like ads_tracking_platforms)
 */
export async function getFeatureAsArray(
  merchantId: string,
  featureKey: string
): Promise<string[] | null> {
  const featureValue = await getMerchantFeature(merchantId, featureKey);
  
  if (Array.isArray(featureValue)) return featureValue;
  return null;
}

/**
 * Check if merchant has access to a specific value in an array feature
 * Example: Check if merchant has "tiktok" in ads_tracking_platforms
 */
export async function hasFeatureValue(
  merchantId: string,
  featureKey: string,
  value: string
): Promise<boolean> {
  const featureValue = await getMerchantFeature(merchantId, featureKey);
  
  if (Array.isArray(featureValue)) {
    return featureValue.includes(value);
  }
  
  if (typeof featureValue === "string") {
    return featureValue === value;
  }
  
  return false;
}

/**
 * Get feature value as string (for string features like api_access, support_level)
 */
export async function getFeatureAsString(
  merchantId: string,
  featureKey: string
): Promise<string | null> {
  const featureValue = await getMerchantFeature(merchantId, featureKey);
  
  if (typeof featureValue === "string") return featureValue;
  return null;
}

