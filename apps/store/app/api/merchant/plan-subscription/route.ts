import { NextResponse } from "next/server";
import { getMerchantIdForAPI } from "@/lib/api-helpers";
import { getMerchantSubscriptionData } from "@/lib/super-admin-client";

/**
 * Get merchant plan and subscription data from super-admin
 * GET /api/merchant/plan-subscription
 *
 * Returns:
 * - Merchant info (id, name, email, status)
 * - Subscription details (status, period, etc.)
 * - Plan details (name, price, features, limits)
 */
export async function GET() {
  try {
    // Get merchant ID
    const merchantId = await getMerchantIdForAPI();

    if (!merchantId) {
      return NextResponse.json(
        { error: "Merchant ID not found. Set MERCHANT_ID in environment." },
        { status: 400 }
      );
    }

    console.log(`[plan-subscription] Fetching data for merchant: ${merchantId}`);

    // Get merchant subscription data from super-admin
    const data = await getMerchantSubscriptionData(merchantId);

    if (!data) {
      console.log(`[plan-subscription] No data found for merchant: ${merchantId}`);
      return NextResponse.json(
        { error: `Merchant data not found for ${merchantId}` },
        { status: 404 }
      );
    }

    // Extract data
    const { merchant, subscription, plan } = data;

    // Prepare response
    const response = {
      merchant: merchant
        ? {
            id: merchant.id,
            name: merchant.name,
            email: merchant.email,
            status: merchant.status,
          }
        : null,
      subscription: subscription
        ? {
            id: subscription.id,
            status: subscription.status,
            planId: subscription.planId,
            currentPeriodStart: subscription.currentPeriodStart,
            currentPeriodEnd: subscription.currentPeriodEnd,
            trialEndsAt: subscription.trialEndsAt,
            cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
            cancelledAt: subscription.cancelledAt,
          }
        : null,
      plan: plan
        ? {
            id: plan.id,
            name: plan.name,
            description: plan.description,
            price: plan.price,
            billingCycle: plan.billingCycle,
            isActive: plan.isActive,
            isPopular: plan.isPopular,
            features: plan.features,
          }
        : null,
      features: plan?.features || null,
    };

    console.log(`[plan-subscription] Data retrieved successfully for merchant: ${merchantId}`);

    return NextResponse.json(response);
  } catch (error: any) {
    console.error(`[plan-subscription] Error:`, error?.message);
    return NextResponse.json(
      { error: error?.message || "Failed to get plan and subscription data" },
      { status: 500 }
    );
  }
}
