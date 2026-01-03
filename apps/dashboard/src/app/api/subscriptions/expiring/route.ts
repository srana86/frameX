import { NextRequest, NextResponse } from "next/server";
import { getCollection } from "@/lib/mongodb";

// GET - Get expiring subscriptions
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const daysAhead = parseInt(searchParams.get("days") || "7");

    const now = new Date();
    const futureDate = new Date(now);
    futureDate.setDate(futureDate.getDate() + daysAhead);

    const [subscriptions, plans, merchants] = await Promise.all([
      getCollection("merchant_subscriptions").then((col) =>
        col
          .find({
            status: "active",
            currentPeriodEnd: {
              $gte: now.toISOString(),
              $lte: futureDate.toISOString(),
            },
          })
          .sort({ currentPeriodEnd: 1 })
          .toArray()
      ),
      getCollection("subscription_plans").then((col) => col.find({}).toArray()),
      getCollection("merchants").then((col) => col.find({}).toArray()),
    ]);

    // Map with plan and merchant details
    const expiringSubscriptions = subscriptions.map((sub: any) => {
      const plan = plans.find((p: any) => p.id === sub.planId);
      const merchant = merchants.find((m: any) => m.id === sub.merchantId);
      const { _id, ...subData } = sub;

      const daysUntilExpiry = Math.ceil((new Date(subData.currentPeriodEnd).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      return {
        ...subData,
        daysUntilExpiry,
        plan: plan ? { name: plan.name, price: plan.price } : null,
        merchant: merchant ? { name: merchant.name, email: merchant.email } : null,
      };
    });

    return NextResponse.json({
      count: expiringSubscriptions.length,
      subscriptions: expiringSubscriptions,
    });
  } catch (error: any) {
    console.error("Get expiring subscriptions error:", error);
    return NextResponse.json({ error: error?.message || "Failed to get expiring subscriptions" }, { status: 500 });
  }
}

// POST - Send renewal reminders
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { subscriptionIds } = body;

    if (!subscriptionIds || !Array.isArray(subscriptionIds)) {
      return NextResponse.json({ error: "subscriptionIds array is required" }, { status: 400 });
    }

    const subsCol = await getCollection("merchant_subscriptions");
    const merchantsCol = await getCollection("merchants");

    const results = [];

    for (const subscriptionId of subscriptionIds) {
      const subscription = await subsCol.findOne({ id: subscriptionId });
      if (!subscription) continue;

      const merchant = await merchantsCol.findOne({ id: subscription.merchantId });
      if (!merchant) continue;

      // TODO: Implement actual email sending
      // For now, just log and update the reminder sent timestamp
      console.log(`Sending renewal reminder to ${merchant.email} for subscription ${subscriptionId}`);

      await subsCol.updateOne(
        { id: subscriptionId },
        {
          $set: {
            lastReminderSent: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          $inc: { reminderCount: 1 },
        }
      );

      results.push({
        subscriptionId,
        merchantEmail: merchant.email,
        status: "reminder_sent",
      });
    }

    // Log activity
    const activityCol = await getCollection("activity_logs");
    await activityCol.insertOne({
      action: "renewal_reminders_sent",
      details: { count: results.length, subscriptionIds },
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      message: `Sent ${results.length} renewal reminders`,
      results,
    });
  } catch (error: any) {
    console.error("Send renewal reminders error:", error);
    return NextResponse.json({ error: error?.message || "Failed to send reminders" }, { status: 500 });
  }
}
