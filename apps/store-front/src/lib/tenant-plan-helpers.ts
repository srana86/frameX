/**
 * Helper functions to get tenant plan and subscription data
 * These functions fetch data from super-admin and provide easy access to plan features
 */

import { getTenantIdForAPI } from "./api-helpers";
import { getTenantFullDataFromSuperAdmin } from "./super-admin-client";
import type { PlanFeatures } from "./subscription-types";

export interface TenantPlanData {
  tenant: {
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
 * Get tenant plan and subscription data
 * Fetches from super-admin and returns structured data
 */
export async function getTenantPlanData(): Promise<TenantPlanData | null> {
  try {
    const tenantId = await getTenantIdForAPI();
    if (!tenantId) {
      console.warn("⚠️ [Tenant Plan Helpers] No tenant ID found");
      return null;
    }

    console.log(`\n🔍 [Tenant Plan Helpers] Fetching plan data for tenantId: ${tenantId}`);

    const fullData = await getTenantFullDataFromSuperAdmin(tenantId);
    if (!fullData) {
      console.warn(`⚠️ [Tenant Plan Helpers] No data found for tenantId: ${tenantId}`);
      return null;
    }

    const response: TenantPlanData = {
      tenant: {
        id: fullData.tenant.id,
        name: fullData.tenant.name,
        email: fullData.tenant.email,
        status: fullData.tenant.status,
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

    console.log(`✅ [Tenant Plan Helpers] Plan data retrieved successfully`);
    return response;
  } catch (error: any) {
    console.error(`❌ [Tenant Plan Helpers] Error:`, error);
    return null;
  }
}

/**
 * Get plan features for current tenant
 */
export async function getTenantFeatures(): Promise<PlanFeatures | null> {
  const planData = await getTenantPlanData();
  return planData?.features || null;
}

/**
 * Check if tenant has access to a specific feature
 */
export async function hasFeatureAccess(featureKey: string): Promise<boolean> {
  const features = await getTenantFeatures();
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
 * Get feature limit/value for tenant
 */
export async function getFeatureValue(featureKey: string): Promise<any> {
  const features = await getTenantFeatures();
  if (!features) return null;
  return features[featureKey] ?? null;
}

