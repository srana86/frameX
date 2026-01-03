import { NextResponse } from "next/server";
import { getCollection } from "@/lib/mongodb";

// Calculate period end based on billing cycle (1, 6, or 12 months)
function calculatePeriodEnd(startDate: Date, billingCycleMonths: number = 1): Date {
  const endDate = new Date(startDate);
  endDate.setMonth(endDate.getMonth() + billingCycleMonths);
  return endDate;
}

// Check if subscription is expiring soon (within 7 days)
function isExpiringSoon(endDate: string | Date): boolean {
  const end = new Date(endDate);
  const now = new Date();
  const daysUntilExpiry = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  return daysUntilExpiry <= 7 && daysUntilExpiry > 0;
}

// Check if subscription is past due
function isPastDue(endDate: string | Date): boolean {
  const end = new Date(endDate);
  const now = new Date();
  return now > end;
}

export async function GET() {
  try {
    const [subscriptions, plans, merchants] = await Promise.all([
      getCollection("merchant_subscriptions").then((col) => col.find({}).sort({ createdAt: -1 }).toArray()),
      getCollection("subscription_plans").then((col) => col.find({}).toArray()),
      getCollection("merchants").then((col) => col.find({}).toArray()),
    ]);

    // Map subscriptions with plan and merchant details + status calculations
    const subscriptionsWithPlans = subscriptions.map((sub: any) => {
      const plan = plans.find((p: any) => p.id === sub.planId);
      const merchant = merchants.find((m: any) => m.id === sub.merchantId);
      const { _id, ...subData } = sub;

      // Calculate dynamic status
      let dynamicStatus = subData.status;
      if (subData.status === "active") {
        if (isPastDue(subData.currentPeriodEnd)) {
          dynamicStatus = "expired";
        } else if (isExpiringSoon(subData.currentPeriodEnd)) {
          dynamicStatus = "expiring_soon";
        }
      }

      return {
        ...subData,
        dynamicStatus,
        isExpiringSoon: isExpiringSoon(subData.currentPeriodEnd),
        isPastDue: isPastDue(subData.currentPeriodEnd),
        daysUntilExpiry: Math.ceil((new Date(subData.currentPeriodEnd).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)),
        plan: plan
          ? (() => {
              const { _id: planId, ...planData } = plan as any;
              return planData;
            })()
          : null,
        merchant: merchant
          ? (() => {
              const { _id: merchantId, ...merchantData } = merchant as any;
              return { name: merchantData.name, email: merchantData.email };
            })()
          : null,
      };
    });

    return NextResponse.json(subscriptionsWithPlans);
  } catch (error: any) {
    console.error("GET /api/subscriptions error:", error);
    return NextResponse.json({ error: error?.message || "Failed to get subscriptions" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const col = await getCollection("merchant_subscriptions");

    // Validate required fields
    if (!body.merchantId || !body.planId) {
      return NextResponse.json({ error: "merchantId and planId are required" }, { status: 400 });
    }

    // Check if subscription already exists for this merchant
    const existingSub = await col.findOne({ merchantId: body.merchantId });
    if (existingSub) {
      // Update existing subscription instead of creating new
      const billingCycleMonths = body.billingCycleMonths || existingSub.billingCycleMonths || 1;
      const now = new Date();
      const periodEnd = body.currentPeriodEnd ? new Date(body.currentPeriodEnd) : calculatePeriodEnd(now, billingCycleMonths);
      const gracePeriodEnd = new Date(periodEnd);
      gracePeriodEnd.setDate(gracePeriodEnd.getDate() + 7);

      await col.updateOne(
        { merchantId: body.merchantId },
        {
          $set: {
            planId: body.planId,
            planName: body.planName || existingSub.planName,
            billingCycleMonths,
            billingCycle: body.billingCycle || (billingCycleMonths === 1 ? "monthly" : billingCycleMonths === 6 ? "semi_annual" : "yearly"),
            amount: body.amount || existingSub.amount,
            currency: body.currency || existingSub.currency || "BDT",
            status: body.status || "active",
            currentPeriodStart: body.currentPeriodStart || now.toISOString(),
            currentPeriodEnd: periodEnd.toISOString(),
            gracePeriodEndsAt: body.gracePeriodEndsAt || gracePeriodEnd.toISOString(),
            nextBillingDate: body.nextBillingDate || periodEnd.toISOString(),
            lastPaymentDate: body.lastPaymentDate || now.toISOString(),
            autoRenew: body.autoRenew !== false,
            cancelAtPeriodEnd: body.cancelAtPeriodEnd || false,
            updatedAt: new Date().toISOString(),
          },
          $inc: { totalPaid: body.amount || 0 },
        }
      );

      const updated = await col.findOne({ merchantId: body.merchantId });
      const { _id, ...subData } = updated as any;
      return NextResponse.json(subData, { status: 200 });
    }

    // Get billing cycle from body or default to 1 month
    const billingCycleMonths = body.billingCycleMonths || 1;

    const now = new Date();
    const periodEnd = body.currentPeriodEnd ? new Date(body.currentPeriodEnd) : calculatePeriodEnd(now, billingCycleMonths);
    const gracePeriodEnd = new Date(periodEnd);
    gracePeriodEnd.setDate(gracePeriodEnd.getDate() + 7);

    const newSubscription = {
      id: body.id || `sub_${Date.now()}`,
      merchantId: body.merchantId,
      planId: body.planId,
      planName: body.planName,
      billingCycleMonths,
      billingCycle: body.billingCycle || (billingCycleMonths === 1 ? "monthly" : billingCycleMonths === 6 ? "semi_annual" : "yearly"),
      amount: body.amount || 0,
      currency: body.currency || "BDT",
      status: body.status || "active",
      currentPeriodStart: body.currentPeriodStart || now.toISOString(),
      currentPeriodEnd: periodEnd.toISOString(),
      gracePeriodEndsAt: body.gracePeriodEndsAt || gracePeriodEnd.toISOString(),
      trialEndsAt: body.trialEndsAt || undefined,
      cancelAtPeriodEnd: body.cancelAtPeriodEnd || false,
      cancelledAt: body.cancelledAt || undefined,
      paymentMethodId: body.paymentMethodId || undefined,
      lastPaymentDate: body.lastPaymentDate || now.toISOString(),
      nextBillingDate: body.nextBillingDate || periodEnd.toISOString(),
      totalPaid: body.totalPaid || body.amount || 0,
      autoRenew: body.autoRenew !== false,
      renewalCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await col.insertOne(newSubscription);

    // Log activity
    const activityCol = await getCollection("activity_logs");
    await activityCol.insertOne({
      action: "subscription_created",
      details: {
        subscriptionId: newSubscription.id,
        merchantId: newSubscription.merchantId,
        planId: newSubscription.planId,
        planName: newSubscription.planName,
        billingCycleMonths,
        amount: newSubscription.amount,
      },
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json(newSubscription, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/subscriptions error:", error);
    return NextResponse.json({ error: error?.message || "Failed to create subscription" }, { status: 500 });
  }
}
