/**
 * Helper functions to get merchant plan and subscription data
 * These functions fetch data from super-admin and provide easy access to plan features
 */

import { getMerchantIdForAPI } from "./api-helpers";
import { getMerchantFullDataFromSuperAdmin } from "./super-admin-client";
import type { PlanFeatures } from "./subscription-types";

export interface MerchantPlanData {
  merchant: {
    id: string;
    name: string;
    email: string;
    status: string;
  };
  subscription: {
    id: string;
    status: string;
    planId: string;
    currentPeriodStart: string;
    currentPeriodEnd: string;
    trialEndsAt?: string;
    cancelAtPeriodEnd: boolean;
  } | null;
  plan: {
    id: string;
    name: string;
    description?: string;
    price: number;
    billingCycle: string;
    isActive: boolean;
    isPopular?: boolean;
    features: PlanFeatures;
  } | null;
  features: PlanFeatures | null;
  deployment: any;
  database: any;
}

/**
 * Get merchant plan and subscription data
 * Fetches from super-admin and returns structured data
 */
export async function getMerchantPlanData(): Promise<MerchantPlanData | null> {
  try {
    const merchantId = await getMerchantIdForAPI();
    if (!merchantId) {
      console.warn("⚠️ [Merchant Plan Helpers] No merchant ID found");
      return null;
    }

    console.log(`\n🔍 [Merchant Plan Helpers] Fetching plan data for merchantId: ${merchantId}`);

    const fullData = await getMerchantFullDataFromSuperAdmin(merchantId);
    if (!fullData) {
      console.warn(`⚠️ [Merchant Plan Helpers] No data found for merchantId: ${merchantId}`);
      return null;
    }

    const response: MerchantPlanData = {
      merchant: {
        id: fullData.merchant.id,
        name: fullData.merchant.name,
        email: fullData.merchant.email,
        status: fullData.merchant.status,
      },
      subscription: fullData.subscription
        ? {
            id: fullData.subscription.id,
            status: fullData.subscription.status,
            planId: fullData.subscription.planId,
            currentPeriodStart: fullData.subscription.currentPeriodStart,
            currentPeriodEnd: fullData.subscription.currentPeriodEnd,
            trialEndsAt: fullData.subscription.trialEndsAt,
            cancelAtPeriodEnd: fullData.subscription.cancelAtPeriodEnd,
          }
        : null,
      plan: fullData.plan
        ? {
            id: fullData.plan.id,
            name: fullData.plan.name,
            description: fullData.plan.description,
            price: fullData.plan.price,
            billingCycle: fullData.plan.billingCycle,
            isActive: fullData.plan.isActive,
            isPopular: fullData.plan.isPopular,
            features: fullData.plan.features,
          }
        : null,
      features: fullData.plan?.features || null,
      deployment: fullData.deployment,
      database: fullData.database,
    };

    console.log(`✅ [Merchant Plan Helpers] Plan data retrieved successfully`);
    return response;
  } catch (error: any) {
    console.error(`❌ [Merchant Plan Helpers] Error:`, error);
    return null;
  }
}

/**
 * Get plan features for current merchant
 */
export async function getMerchantFeatures(): Promise<PlanFeatures | null> {
  const planData = await getMerchantPlanData();
  return planData?.features || null;
}

/**
 * Check if merchant has access to a specific feature
 */
export async function hasFeatureAccess(featureKey: string): Promise<boolean> {
  const features = await getMerchantFeatures();
  if (!features) return false;

  const featureValue = features[featureKey];
  
  // Boolean features
  if (typeof featureValue === "boolean") {
    return featureValue;
  }

  // Number/unlimited features
  if (featureValue === "unlimited" || (typeof featureValue === "number" && featureValue > 0)) {
    return true;
  }

  // String features (like api_access: "full" | "limited")
  if (typeof featureValue === "string" && featureValue !== "none" && featureValue !== "") {
    return true;
  }

  // Array features
  if (Array.isArray(featureValue) && featureValue.length > 0) {
    return true;
  }

  return false;
}

/**
 * Get feature limit/value for merchant
 */
export async function getFeatureValue(featureKey: string): Promise<any> {
  const features = await getMerchantFeatures();
  if (!features) return null;
  return features[featureKey] ?? null;
}

