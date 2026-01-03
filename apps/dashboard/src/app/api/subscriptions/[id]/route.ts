import { NextResponse } from "next/server";
import { getCollection } from "@/lib/mongodb";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const col = await getCollection("merchant_subscriptions");
    const subscription = await col.findOne({ id });

    if (!subscription) {
      return NextResponse.json({ error: "Subscription not found" }, { status: 404 });
    }

    // Get plan details
    const plansCol = await getCollection("subscription_plans");
    const plan = await plansCol.findOne({ id: (subscription as any).planId });

    const { _id, ...data } = subscription as any;
    return NextResponse.json({
      ...data,
      plan: plan
        ? (() => {
            const { _id: planId, ...planData } = plan as any;
            return planData;
          })()
        : null,
    });
  } catch (error: any) {
    console.error("GET /api/subscriptions/[id] error:", error);
    return NextResponse.json({ error: error?.message || "Failed to get subscription" }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const col = await getCollection("merchant_subscriptions");

    const updateData: any = {
      ...body,
      updatedAt: new Date().toISOString(),
    };

    delete updateData.id; // Don't update the id
    delete updateData.plan; // Don't update plan object

    const result = await col.updateOne(
      { id },
      {
        $set: updateData,
      }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Subscription not found" }, { status: 404 });
    }

    const updated = await col.findOne({ id });
    const { _id, ...data } = updated as any;
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("PUT /api/subscriptions/[id] error:", error);
    return NextResponse.json({ error: error?.message || "Failed to update subscription" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const col = await getCollection("merchant_subscriptions");
    const result = await col.deleteOne({ id });

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Subscription not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("DELETE /api/subscriptions/[id] error:", error);
    return NextResponse.json({ error: error?.message || "Failed to delete subscription" }, { status: 500 });
  }
}
