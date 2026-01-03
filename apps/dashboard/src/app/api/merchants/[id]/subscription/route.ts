import { NextResponse } from "next/server";
import { getCollection } from "@/lib/mongodb";

/**
 * Get merchant subscription by merchantId
 * GET /api/merchants/[id]/subscription
 */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: merchantId } = await params;
    console.log(`\n🔍 [Super-Admin API] GET /api/merchants/${merchantId}/subscription`);
    console.log(`📋 Requesting subscription for merchantId: ${merchantId}`);

    // Get merchant subscription
    const subscriptionsCol = await getCollection("merchant_subscriptions");
    console.log(`🔎 Querying merchant_subscriptions collection for merchantId: ${merchantId}`);
    const subscription = await subscriptionsCol.findOne({ merchantId });

    if (!subscription) {
      console.log(`❌ No subscription found for merchantId: ${merchantId}`);
      return NextResponse.json({ error: "Subscription not found" }, { status: 404 });
    }

    console.log(`✅ Found subscription in database:`, JSON.stringify(subscription, null, 2));

    // Get plan details
    const planId = (subscription as any).planId;
    console.log(`🔎 Looking up plan with planId: ${planId}`);
    const plansCol = await getCollection("subscription_plans");
    const plan = planId ? await plansCol.findOne({ id: planId }) : null;

    if (plan) {
      console.log(`✅ Found plan:`, JSON.stringify(plan, null, 2));
    } else {
      console.log(`⚠️ No plan found for planId: ${planId}`);
    }

    const { _id, ...subscriptionData } = subscription as any;
    const result: any = {
      ...subscriptionData,
      plan: plan
        ? (() => {
            const { _id: planId, ...planData } = plan as any;
            return planData;
          })()
        : null,
    };

    console.log(`\n📦 [Super-Admin API] Final Subscription Response Data:`);
    console.log(JSON.stringify(result, null, 2));
    console.log(`✅ [Super-Admin API] Returning subscription data for merchantId: ${merchantId}\n`);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("GET /api/merchants/[id]/subscription error:", error);
    return NextResponse.json({ error: error?.message || "Failed to get merchant subscription" }, { status: 500 });
  }
}
