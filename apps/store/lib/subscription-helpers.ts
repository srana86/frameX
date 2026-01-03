// Server-only subscription helper functions
// Uses super-admin database for subscription data
import { getMerchantSubscriptionFromSuperAdmin, getMerchantSubscriptionData } from "./super-admin-client";
import type { MerchantSubscription, SubscriptionInvoice, SubscriptionPlan, SubscriptionStatusDetails } from "./subscription-types";
import { getSubscriptionStatusDetails, calculatePeriodEnd, calculateGracePeriodEnd, generateInvoiceNumber } from "./subscription-types";

// Get super-admin URL
const SUPER_ADMIN_URL = process.env.SUPER_ADMIN_URL || process.env.NEXT_PUBLIC_SUPER_ADMIN_URL || "https://framextech.com";

/**
 * Get active subscription for a merchant from super-admin
 */
export async function getMerchantSubscription(merchantId: string): Promise<MerchantSubscription | null> {
  try {
    // Try to get from super-admin API first
    const data = await getMerchantSubscriptionData(merchantId);

    if (data?.subscription) {
      // Map super-admin subscription to our type
      const sub = data.subscription as any;
      return {
        id: sub.id,
        merchantId: sub.merchantId,
        planId: sub.planId,
        planName: sub.planName || data.plan?.name,
        // Use dynamic status from super-admin if available
        status: sub.dynamicStatus || sub.status || "active",
        billingCycle: sub.billingCycle || "monthly",
        billingCycleMonths: sub.billingCycleMonths || 1,
        amount: sub.amount || data.plan?.price || data.plan?.basePrice || 0,
        currency: sub.currency || "BDT",
        currentPeriodStart: sub.currentPeriodStart,
        currentPeriodEnd: sub.currentPeriodEnd,
        nextBillingDate: sub.nextBillingDate || sub.currentPeriodEnd,
        trialEndsAt: sub.trialEndsAt,
        gracePeriodEndsAt: sub.gracePeriodEndsAt,
        cancelAtPeriodEnd: sub.cancelAtPeriodEnd || false,
        cancelledAt: sub.cancelledAt,
        paymentMethodId: sub.paymentMethodId,
        lastPaymentDate: sub.lastPaymentDate,
        lastPaymentId: sub.lastPaymentId,
        autoRenew: sub.autoRenew !== false,
        createdAt: sub.createdAt,
        updatedAt: sub.updatedAt,
      };
    }

    // Fallback: try direct API call
    const subscription = await getMerchantSubscriptionFromSuperAdmin(merchantId);
    if (subscription) {
      const sub = subscription as any;
      return {
        id: sub.id,
        merchantId: sub.merchantId,
        planId: sub.planId,
        planName: sub.planName || sub.plan?.name,
        status: sub.dynamicStatus || sub.status || "active",
        billingCycle: sub.billingCycle || "monthly",
        billingCycleMonths: sub.billingCycleMonths || 1,
        amount: sub.amount || sub.plan?.price || 0,
        currency: sub.currency || "BDT",
        currentPeriodStart: sub.currentPeriodStart,
        currentPeriodEnd: sub.currentPeriodEnd,
        nextBillingDate: sub.nextBillingDate || sub.currentPeriodEnd,
        trialEndsAt: sub.trialEndsAt,
        gracePeriodEndsAt: sub.gracePeriodEndsAt,
        cancelAtPeriodEnd: sub.cancelAtPeriodEnd || false,
        cancelledAt: sub.cancelledAt,
        paymentMethodId: sub.paymentMethodId,
        autoRenew: sub.autoRenew !== false,
        createdAt: sub.createdAt,
        updatedAt: sub.updatedAt,
      };
    }

    return null;
  } catch (error) {
    console.error("Error fetching merchant subscription from super-admin:", error);
    return null;
  }
}

/**
 * Get subscription plan by ID from super-admin
 */
export async function getSubscriptionPlan(planId: string): Promise<SubscriptionPlan | null> {
  try {
    const baseUrl = SUPER_ADMIN_URL.endsWith("/") ? SUPER_ADMIN_URL.slice(0, -1) : SUPER_ADMIN_URL;
    const response = await fetch(`${baseUrl}/api/plans/${planId}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      next: { revalidate: 300 },
    });

    if (!response.ok) {
      if (response.status === 404) return null;
      throw new Error(`Failed to fetch plan: ${response.statusText}`);
    }

    const plan = await response.json();
    return plan as SubscriptionPlan;
  } catch (error) {
    console.error("Error fetching subscription plan from super-admin:", error);
    return null;
  }
}

/**
 * Get all active plans from super-admin
 */
export async function getActivePlans(): Promise<SubscriptionPlan[]> {
  try {
    const baseUrl = SUPER_ADMIN_URL.endsWith("/") ? SUPER_ADMIN_URL.slice(0, -1) : SUPER_ADMIN_URL;
    const response = await fetch(`${baseUrl}/api/plans`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      next: { revalidate: 300 },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch plans: ${response.statusText}`);
    }

    const plans = await response.json();
    return plans.filter((p: any) => p.isActive !== false);
  } catch (error) {
    console.error("Error fetching active plans from super-admin:", error);
    return [];
  }
}

/**
 * Check if subscription is active and not expired
 */
export async function isSubscriptionActive(merchantId: string): Promise<boolean> {
  const subscription = await getMerchantSubscription(merchantId);
  if (!subscription) return false;

  if (subscription.status !== "active" && subscription.status !== "trial") {
    return false;
  }

  const now = new Date();
  const periodEnd = new Date(subscription.currentPeriodEnd);

  return periodEnd > now;
}

/**
 * Get subscription with full status details
 */
export async function getSubscriptionWithStatus(merchantId: string): Promise<{
  subscription: MerchantSubscription | null;
  status: SubscriptionStatusDetails;
  pendingInvoice: SubscriptionInvoice | null;
}> {
  const subscription = await getMerchantSubscription(merchantId);
  const status = getSubscriptionStatusDetails(subscription);

  let pendingInvoice: SubscriptionInvoice | null = null;

  if (status.requiresPayment && subscription) {
    pendingInvoice = await getPendingInvoice(merchantId);
  }

  return { subscription, status, pendingInvoice };
}

/**
 * Get pending invoice for merchant from super-admin
 */
export async function getPendingInvoice(merchantId: string): Promise<SubscriptionInvoice | null> {
  try {
    const baseUrl = SUPER_ADMIN_URL.endsWith("/") ? SUPER_ADMIN_URL.slice(0, -1) : SUPER_ADMIN_URL;
    const response = await fetch(`${baseUrl}/api/invoices?merchantId=${merchantId}&status=pending`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
    });

    if (!response.ok) {
      if (response.status === 404) return null;
      return null;
    }

    const invoices = await response.json();
    if (Array.isArray(invoices) && invoices.length > 0) {
      return invoices[0] as SubscriptionInvoice;
    }

    return null;
  } catch (error) {
    console.error("Error fetching pending invoice:", error);
    return null;
  }
}

/**
 * Create renewal invoice for subscription via super-admin
 */
export async function createRenewalInvoice(merchantId: string, subscription: MerchantSubscription): Promise<SubscriptionInvoice | null> {
  try {
    const plan = await getSubscriptionPlan(subscription.planId);
    if (!plan) return null;

    const periodStart = new Date(subscription.currentPeriodEnd);
    const periodEnd = calculatePeriodEnd(periodStart, subscription.billingCycleMonths || 1);
    const dueDate = new Date(subscription.currentPeriodEnd);

    const amount = subscription.amount || (plan as any).basePrice || 0;

    const baseUrl = SUPER_ADMIN_URL.endsWith("/") ? SUPER_ADMIN_URL.slice(0, -1) : SUPER_ADMIN_URL;
    const response = await fetch(`${baseUrl}/api/invoices`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        merchantId,
        merchantName: subscription.planName,
        merchantEmail: "",
        subscriptionId: subscription.id,
        planId: plan.id,
        planName: plan.name,
        billingCycle: subscription.billingCycle,
        amount,
        dueDate: dueDate.toISOString(),
        items: [
          {
            description: `${plan.name} Plan - ${subscription.billingCycleMonths} Month${subscription.billingCycleMonths > 1 ? "s" : ""}`,
            quantity: 1,
            unitPrice: amount,
            total: amount,
          },
        ],
      }),
    });

    if (!response.ok) {
      console.error("Failed to create invoice:", await response.text());
      return null;
    }

    const result = await response.json();
    return result as SubscriptionInvoice;
  } catch (error) {
    console.error("Error creating renewal invoice:", error);
    return null;
  }
}

/**
 * Update subscription status based on current date
 */
export async function updateSubscriptionStatus(merchantId: string): Promise<MerchantSubscription | null> {
  // This is now handled by super-admin
  // Just return the current subscription
  return await getMerchantSubscription(merchantId);
}

/**
 * Get all invoices for merchant from super-admin
 */
export async function getMerchantInvoices(merchantId: string): Promise<SubscriptionInvoice[]> {
  try {
    const baseUrl = SUPER_ADMIN_URL.endsWith("/") ? SUPER_ADMIN_URL.slice(0, -1) : SUPER_ADMIN_URL;
    const response = await fetch(`${baseUrl}/api/invoices?merchantId=${merchantId}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
    });

    if (!response.ok) {
      return [];
    }

    const invoices = await response.json();
    return Array.isArray(invoices) ? invoices : [];
  } catch (error) {
    console.error("Error fetching merchant invoices:", error);
    return [];
  }
}

/**
 * Check if merchant has access to a feature based on plan
 */
export async function checkFeatureAccess(merchantId: string, featureKey: string): Promise<boolean> {
  const subscription = await getMerchantSubscription(merchantId);
  if (!subscription) return false;

  // Get plan from super-admin
  const plan = await getSubscriptionPlan(subscription.planId);
  if (!plan) return false;

  // Check if feature exists in featuresList (simple string array)
  const featuresList = (plan as any).featuresList || [];

  // Simple check - if featuresList contains something related to the feature
  return featuresList.some((f: string) => f.toLowerCase().includes(featureKey.toLowerCase()));
}

/**
 * Get plans grouped by base plan (all billing cycles)
 */
export async function getPlansGrouped(): Promise<Record<string, SubscriptionPlan[]>> {
  const plans = await getActivePlans();

  return plans.reduce((acc, plan) => {
    const basePlanId = plan.id.replace(/_monthly$|_semi_annual$|_yearly$/, "");
    if (!acc[basePlanId]) {
      acc[basePlanId] = [];
    }
    acc[basePlanId].push(plan);
    return acc;
  }, {} as Record<string, SubscriptionPlan[]>);
}

/**
 * Get feature limit for merchant from plan
 */
export async function getFeatureLimit(merchantId: string, featureKey: string): Promise<number | "unlimited" | null> {
  const subscription = await getMerchantSubscription(merchantId);
  if (!subscription) return null;

  const plan = await getSubscriptionPlan(subscription.planId);
  if (!plan) return null;

  const features = (plan as any).features || {};
  const featureValue = features[featureKey];

  if (featureValue === undefined) return null;
  if (featureValue === "unlimited") return "unlimited";
  if (typeof featureValue === "number") return featureValue;
  return null;
}

/**
 * Get current usage for a feature
 * Returns 0 if no usage tracking exists (to be implemented with database)
 */
export async function getFeatureUsage(merchantId: string, featureKey: string): Promise<number> {
  // TODO: Implement usage tracking from database
  // For now, return 0 as default
  // This should query a subscription_usage collection or similar
  return 0;
}

/**
 * Check if merchant can use a feature within limits
 */
export async function canUseFeature(merchantId: string, featureKey: string, amount: number = 1): Promise<boolean> {
  const limit = await getFeatureLimit(merchantId, featureKey);
  if (limit === null) return false; // Feature doesn't exist
  if (limit === "unlimited") return true;

  const currentUsage = await getFeatureUsage(merchantId, featureKey);
  return currentUsage + amount <= limit;
}

/**
 * Increment feature usage
 * TODO: Implement with database usage tracking
 */
export async function incrementFeatureUsage(merchantId: string, featureKey: string, amount: number = 1): Promise<void> {
  // TODO: Implement usage tracking to database
  // This should update/create a subscription_usage document
  // For now, just log it
  console.log(`[Feature Usage] ${merchantId} - ${featureKey}: +${amount}`);
}
