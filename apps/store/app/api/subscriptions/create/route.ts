import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-helpers";
import { getCollection } from "@/lib/mongodb";
import { calculatePeriodEnd, type MerchantSubscription, type SubscriptionPlan } from "@/lib/subscription-types";
import { getSubscriptionPlan } from "@/lib/subscription-helpers";

/**
 * Create a new subscription for merchant
 * This would typically be called after payment is processed
 */
export async function POST(request: Request) {
  try {
    const user = await requireAuth("merchant");
    const body = await request.json();

    if (!body.planId) {
      return NextResponse.json({ error: "Plan ID is required" }, { status: 400 });
    }

    // Verify plan exists
    const plan = await getSubscriptionPlan(body.planId);
    if (!plan || !plan.isActive) {
      return NextResponse.json({ error: "Invalid or inactive plan" }, { status: 400 });
    }

    // Check if merchant already has an active subscription
    const existingSubCol = await getCollection<MerchantSubscription>("merchant_subscriptions");
    const existing = await existingSubCol.findOne({
      merchantId: user.id,
      status: { $in: ["active", "trial"] },
    });

    if (existing) {
      return NextResponse.json({ error: "Merchant already has an active subscription" }, { status: 400 });
    }

    // Calculate period dates
    const now = new Date();
    const billingCycleMonths = plan.billingCycleMonths || 1;
    const periodEnd = calculatePeriodEnd(now, billingCycleMonths);

    // Create subscription
    const subscription: MerchantSubscription = {
      id: `sub_${Date.now()}_${user.id}`,
      merchantId: user.id,
      planId: body.planId,
      status: body.trialDays ? "trial" : "active",
      billingCycle: plan.billingCycle || "monthly",
      billingCycleMonths,
      amount: plan.price ?? plan.basePrice ?? 0,
      currency: (plan as any).currency || "BDT",
      currentPeriodStart: now.toISOString(),
      currentPeriodEnd: periodEnd.toISOString(),
      trialEndsAt: body.trialDays ? new Date(now.getTime() + body.trialDays * 24 * 60 * 60 * 1000).toISOString() : undefined,
      cancelAtPeriodEnd: false,
      autoRenew: true,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };

    await existingSubCol.insertOne(subscription as any);

    const { _id, ...subData } = subscription as any;
    return NextResponse.json(subData, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/subscriptions/create error:", error);
    if (error.message === "NEXT_REDIRECT") {
      throw error;
    }
    return NextResponse.json({ error: error?.message || "Failed to create subscription" }, { status: 500 });
  }
}
