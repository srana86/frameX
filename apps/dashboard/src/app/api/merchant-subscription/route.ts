import { NextResponse } from "next/server";
import { getCollection } from "@/lib/mongodb";

// CORS headers for cross-origin requests from merchant apps
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, X-Merchant-ID",
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

/**
 * Get merchant subscription and plan by merchantId
 *
 * This is a public endpoint for merchant apps to fetch their subscription details.
 *
 * Usage:
 *   GET /api/merchant-subscription?merchantId=merchant_xxxxx
 *   OR
 *   GET /api/merchant-subscription with X-Merchant-ID header
 *
 * Returns:
 * {
 *   merchant: { id, name, email, ... },
 *   subscription: { planId, status, startDate, endDate, ... },
 *   plan: { id, name, features, price, ... }
 * }
 */
export async function GET(request: Request) {
  try {
    // Get merchantId from query param or header
    const url = new URL(request.url);
    const merchantId = url.searchParams.get("merchantId") || request.headers.get("X-Merchant-ID");

    if (!merchantId) {
      return NextResponse.json(
        { error: "merchantId is required (query param or X-Merchant-ID header)" },
        { status: 400, headers: corsHeaders }
      );
    }

    console.log(`[merchant-subscription] Fetching data for merchantId: ${merchantId}`);

    // Get merchant details
    const merchantsCol = await getCollection("merchants");
    const merchant = await merchantsCol.findOne({ id: merchantId });

    if (!merchant) {
      return NextResponse.json({ error: "Merchant not found" }, { status: 404, headers: corsHeaders });
    }

    // Get subscription
    const subscriptionsCol = await getCollection("merchant_subscriptions");
    const subscription = await subscriptionsCol.findOne({ merchantId });

    if (!subscription) {
      // Return merchant without subscription (might be on free tier or not subscribed)
      const { _id: mId, ...merchantData } = merchant as any;
      return NextResponse.json(
        {
          merchant: merchantData,
          subscription: null,
          plan: null,
        },
        { headers: corsHeaders }
      );
    }

    // Get plan details
    const planId = (subscription as any).planId;
    const plansCol = await getCollection("subscription_plans");
    const plan = planId ? await plansCol.findOne({ id: planId }) : null;

    // Clean up MongoDB _id fields
    const { _id: mId, ...merchantData } = merchant as any;
    const { _id: sId, ...subscriptionData } = subscription as any;
    const planData = plan
      ? (() => {
          const { _id: pId, ...data } = plan as any;
          return data;
        })()
      : null;

    // Calculate dynamic subscription status
    const now = new Date();
    const periodEnd = new Date(subscriptionData.currentPeriodEnd);
    const graceEnd = subscriptionData.gracePeriodEndsAt ? new Date(subscriptionData.gracePeriodEndsAt) : null;

    let dynamicStatus = subscriptionData.status;
    let isExpired = false;
    let isGracePeriod = false;
    let daysRemaining = Math.ceil((periodEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (subscriptionData.status === "active") {
      if (now > periodEnd) {
        if (graceEnd && now <= graceEnd) {
          dynamicStatus = "grace_period";
          isGracePeriod = true;
          daysRemaining = Math.ceil((graceEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        } else {
          dynamicStatus = "expired";
          isExpired = true;
          daysRemaining = 0;
        }
      }
    }

    const result = {
      merchant: merchantData,
      subscription: {
        ...subscriptionData,
        dynamicStatus,
        isExpired,
        isGracePeriod,
        daysRemaining,
        isExpiringSoon: daysRemaining <= 7 && daysRemaining > 0,
        requiresPayment: isExpired || isGracePeriod,
      },
      plan: planData,
    };

    console.log(`[merchant-subscription] Successfully fetched data for merchantId: ${merchantId}`);

    return NextResponse.json(result, { headers: corsHeaders });
  } catch (error: any) {
    console.error("[merchant-subscription] Error:", error);
    return NextResponse.json({ error: error?.message || "Failed to get merchant subscription" }, { status: 500, headers: corsHeaders });
  }
}
