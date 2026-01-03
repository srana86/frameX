import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-helpers";
import { getMerchantSubscription, getSubscriptionPlan } from "@/lib/subscription-helpers";

/**
 * Get current subscription for authenticated merchant
 */
export async function GET() {
  try {
    const user = await requireAuth("merchant");

    const subscription = await getMerchantSubscription(user.id);
    if (!subscription) {
      return NextResponse.json({ subscription: null, plan: null });
    }

    const plan = await getSubscriptionPlan(subscription.planId);

    return NextResponse.json({
      subscription,
      plan,
    });
  } catch (error: any) {
    console.error("GET /api/subscriptions/current error:", error);
    if (error.message === "NEXT_REDIRECT") {
      throw error;
    }
    return NextResponse.json({ error: error?.message || "Failed to get subscription" }, { status: 500 });
  }
}

