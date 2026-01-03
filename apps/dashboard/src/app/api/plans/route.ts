import { NextRequest, NextResponse } from "next/server";
import { getCollection } from "@/lib/mongodb";

// Simple plan structure - each plan has its own billing cycle
export interface SimplePlan {
  id: string;
  name: string;
  description?: string;
  price: number; // Total price for the billing cycle
  billingCycleMonths: number; // 1, 6, or 12
  featuresList: string[];
  isActive: boolean;
  isPopular?: boolean;
  sortOrder?: number;
  buttonText?: string;
  buttonVariant?: "default" | "outline" | "gradient";
  iconType?: "star" | "grid" | "sparkles";
  createdAt?: string;
  updatedAt?: string;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const activeOnly = searchParams.get("active") === "true";
    const cycleMonths = searchParams.get("cycle"); // Filter by billing cycle

    const col = await getCollection("subscription_plans");
    
    // Build query
    const query: any = {};
    if (activeOnly) {
      query.isActive = true;
    }
    if (cycleMonths) {
      query.billingCycleMonths = parseInt(cycleMonths);
    }

    const plans = await col.find(query).sort({ sortOrder: 1, createdAt: -1 }).toArray();

    const plansWithoutId = plans.map((plan: any) => {
      const { _id, ...planData } = plan;
      return planData;
    });

    return NextResponse.json(plansWithoutId);
  } catch (error: any) {
    console.error("GET /api/plans error:", error);
    return NextResponse.json({ error: error?.message || "Failed to get plans" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const col = await getCollection("subscription_plans");

    if (!body.name) {
      return NextResponse.json({ error: "Plan name is required" }, { status: 400 });
    }

    // Generate plan ID from name + billing cycle if not provided
    const billingCycleMonths = body.billingCycleMonths || 1;
    const cycleSuffix = billingCycleMonths === 1 ? "monthly" : billingCycleMonths === 6 ? "6month" : "yearly";
    const baseId = body.name.toLowerCase().replace(/[^a-z0-9]+/g, "_");
    const planId = body.id || `${baseId}_${cycleSuffix}_${Date.now()}`;

    // Check if plan already exists
    const existing = await col.findOne({ id: planId });
    if (existing) {
      return NextResponse.json({ error: "Plan with this ID already exists" }, { status: 400 });
    }

    const newPlan: SimplePlan = {
      id: planId,
      name: body.name,
      description: body.description || "",
      price: parseFloat(body.price) || 0,
      billingCycleMonths: billingCycleMonths,
      featuresList: body.featuresList || [],
      isActive: body.isActive !== false,
      isPopular: body.isPopular || false,
      sortOrder: body.sortOrder || 0,
      buttonText: body.buttonText || "Get Started",
      buttonVariant: body.buttonVariant || "outline",
      iconType: body.iconType || "star",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await col.insertOne(newPlan);

    // Log activity
    const activityCol = await getCollection("activity_logs");
    await activityCol.insertOne({
      action: "plan_created",
      details: { 
        planId: newPlan.id, 
        planName: newPlan.name, 
        price: newPlan.price,
        billingCycleMonths: newPlan.billingCycleMonths 
      },
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json(newPlan, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/plans error:", error);
    return NextResponse.json({ error: error?.message || "Failed to create plan" }, { status: 500 });
  }
}
