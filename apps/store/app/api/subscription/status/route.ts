import { NextRequest, NextResponse } from "next/server";
import { getMerchantIdForAPI } from "@/lib/api-helpers";
import { getSubscriptionWithStatus, updateSubscriptionStatus, getSubscriptionPlan } from "@/lib/subscription-helpers";

// Cache subscription status for 60 seconds to reduce API calls
export const revalidate = 60;

export async function GET(req: NextRequest) {
  try {
    const merchantId = await getMerchantIdForAPI();
    // Reduced logging - only log in development
    if (process.env.NODE_ENV === "development") {
      console.log("[subscription/status] MerchantId from API:", merchantId);
    }

    if (!merchantId) {
      return NextResponse.json({ error: "Merchant not found" }, { status: 404 });
    }

    // First, update subscription status based on current date
    await updateSubscriptionStatus(merchantId);

    // Then get the full subscription details with status
    const { subscription, status, pendingInvoice } = await getSubscriptionWithStatus(merchantId);

    let plan = null;
    if (subscription?.planId) {
      plan = await getSubscriptionPlan(subscription.planId);
      console.log("[subscription/status] Plan found:", !!plan);
    }

    return NextResponse.json({
      subscription,
      plan,
      status,
      pendingInvoice,
      debug: {
        merchantId,
        hasSubscription: !!subscription,
        hasPlan: !!plan,
      },
    });
  } catch (error: any) {
    console.error("Error fetching subscription status:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch subscription status" }, { status: 500 });
  }
}
