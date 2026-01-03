import { NextRequest, NextResponse } from "next/server";
import { getCollection } from "@/lib/mongodb";

// POST - Renew a subscription
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { subscriptionId, billingCycleMonths, paymentAmount, paymentMethod, transactionId } = body;

    if (!subscriptionId) {
      return NextResponse.json({ error: "subscriptionId is required" }, { status: 400 });
    }

    const subsCol = await getCollection("merchant_subscriptions");
    const subscription = await subsCol.findOne({ id: subscriptionId });

    if (!subscription) {
      return NextResponse.json({ error: "Subscription not found" }, { status: 404 });
    }

    // Calculate new period dates
    const now = new Date();
    const currentPeriodEnd = new Date(subscription.currentPeriodEnd);

    // If subscription is still active, extend from current end date
    // If expired, start from today
    const newPeriodStart = currentPeriodEnd > now ? currentPeriodEnd : now;
    const cycleMonths = billingCycleMonths || subscription.billingCycleMonths || 1;

    const newPeriodEnd = new Date(newPeriodStart);
    newPeriodEnd.setMonth(newPeriodEnd.getMonth() + cycleMonths);

    // Update subscription
    await subsCol.updateOne(
      { id: subscriptionId },
      {
        $set: {
          status: "active",
          currentPeriodStart: newPeriodStart.toISOString(),
          currentPeriodEnd: newPeriodEnd.toISOString(),
          billingCycleMonths: cycleMonths,
          lastPaymentDate: now.toISOString(),
          nextBillingDate: newPeriodEnd.toISOString(),
          updatedAt: now.toISOString(),
        },
        $inc: {
          totalPaid: paymentAmount || 0,
          renewalCount: 1,
        },
      }
    );

    // Record the payment
    if (paymentAmount) {
      const paymentsCol = await getCollection("subscription_payments");
      await paymentsCol.insertOne({
        subscriptionId,
        merchantId: subscription.merchantId,
        amount: paymentAmount,
        currency: "BDT",
        paymentMethod: paymentMethod || "manual",
        transactionId: transactionId || `PAY_${Date.now()}`,
        type: "renewal",
        periodStart: newPeriodStart.toISOString(),
        periodEnd: newPeriodEnd.toISOString(),
        createdAt: now.toISOString(),
      });
    }

    // Log activity
    const activityCol = await getCollection("activity_logs");
    await activityCol.insertOne({
      action: "subscription_renewed",
      details: {
        subscriptionId,
        merchantId: subscription.merchantId,
        billingCycleMonths: cycleMonths,
        newPeriodEnd: newPeriodEnd.toISOString(),
        paymentAmount,
      },
      timestamp: now.toISOString(),
    });

    return NextResponse.json({
      success: true,
      message: "Subscription renewed successfully",
      newPeriodStart: newPeriodStart.toISOString(),
      newPeriodEnd: newPeriodEnd.toISOString(),
    });
  } catch (error: any) {
    console.error("Subscription renewal error:", error);
    return NextResponse.json({ error: error?.message || "Failed to renew subscription" }, { status: 500 });
  }
}

// GET - Get renewal history for a subscription
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const subscriptionId = searchParams.get("subscriptionId");
    const merchantId = searchParams.get("merchantId");

    const query: any = {};
    if (subscriptionId) query.subscriptionId = subscriptionId;
    if (merchantId) query.merchantId = merchantId;

    const paymentsCol = await getCollection("subscription_payments");
    const payments = await paymentsCol
      .find(query)
      .sort({ createdAt: -1 })
      .toArray();

    return NextResponse.json(payments);
  } catch (error: any) {
    console.error("Get renewal history error:", error);
    return NextResponse.json({ error: error?.message || "Failed to get renewal history" }, { status: 500 });
  }
}

