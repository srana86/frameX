import { NextResponse } from "next/server";
import { getCollection } from "@/lib/mongodb";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> | { id: string } }) {
  try {
    const resolvedParams = await Promise.resolve(params);
    const planId = resolvedParams.id;

    if (!planId) {
      return NextResponse.json({ error: "Plan ID is required" }, { status: 400 });
    }

    const col = await getCollection("subscription_plans");
    const plan = await col.findOne({ id: planId });

    if (!plan) {
      console.error(`Plan not found with id: ${planId}`);
      return NextResponse.json({ error: "Plan not found" }, { status: 404 });
    }

    const { _id, ...data } = plan as any;
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("GET /api/plans/[id] error:", error);
    return NextResponse.json({ error: error?.message || "Failed to get plan" }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> | { id: string } }) {
  try {
    const resolvedParams = await Promise.resolve(params);
    const body = await request.json();
    const col = await getCollection("subscription_plans");

    // Check if plan exists
    const existingPlan = await col.findOne({ id: resolvedParams.id });
    if (!existingPlan) {
      return NextResponse.json({ error: "Plan not found" }, { status: 404 });
    }

    // Prepare update data - simple plan structure
    const updateData: any = {
      updatedAt: new Date().toISOString(),
    };

    // Only update provided fields
    if (body.name !== undefined) updateData.name = body.name;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.price !== undefined) updateData.price = parseFloat(body.price);
    if (body.billingCycleMonths !== undefined) updateData.billingCycleMonths = body.billingCycleMonths;
    if (body.featuresList !== undefined) updateData.featuresList = body.featuresList;
    if (body.isActive !== undefined) updateData.isActive = body.isActive;
    if (body.isPopular !== undefined) updateData.isPopular = body.isPopular;
    if (body.sortOrder !== undefined) updateData.sortOrder = body.sortOrder;
    if (body.buttonText !== undefined) updateData.buttonText = body.buttonText;
    if (body.buttonVariant !== undefined) updateData.buttonVariant = body.buttonVariant;
    if (body.iconType !== undefined) updateData.iconType = body.iconType;

    const result = await col.updateOne(
      { id: resolvedParams.id },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Plan not found" }, { status: 404 });
    }

    // Log activity
    const activityCol = await getCollection("activity_logs");
    await activityCol.insertOne({
      action: "plan_updated",
      details: { planId: resolvedParams.id, updates: Object.keys(updateData) },
      timestamp: new Date().toISOString(),
    });

    const updated = await col.findOne({ id: resolvedParams.id });
    const { _id, ...data } = updated as any;
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("PUT /api/plans/[id] error:", error);
    return NextResponse.json({ error: error?.message || "Failed to update plan" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> | { id: string } }) {
  try {
    const resolvedParams = await Promise.resolve(params);
    const col = await getCollection("subscription_plans");
    
    // Actually delete the plan (or set isActive to false for soft delete)
    const result = await col.deleteOne({ id: resolvedParams.id });

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Plan not found" }, { status: 404 });
    }

    // Log activity
    const activityCol = await getCollection("activity_logs");
    await activityCol.insertOne({
      action: "plan_deleted",
      details: { planId: resolvedParams.id },
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("DELETE /api/plans/[id] error:", error);
    return NextResponse.json({ error: error?.message || "Failed to delete plan" }, { status: 500 });
  }
}
