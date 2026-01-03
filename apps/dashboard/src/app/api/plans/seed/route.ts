import { NextResponse } from "next/server";
import { getCollection } from "@/lib/mongodb";

// Calculate price with custom discount
function calculatePrice(basePrice: number, cycleMonths: number, discountPercent: number): number {
  const totalBeforeDiscount = basePrice * cycleMonths;
  const discountAmount = totalBeforeDiscount * (discountPercent / 100);
  return Math.round((totalBeforeDiscount - discountAmount) * 100) / 100;
}

// Default plans configuration - simple and clean
const DEFAULT_PLANS = [
  {
    id: "starter",
    name: "Starter",
    description: "Perfect for small businesses getting started",
    basePrice: 29,
    discount6Month: 10,
    discount12Month: 20,
    isPopular: false,
    sortOrder: 1,
    featuresList: ["Up to 50 products", "5GB storage", "Basic analytics", "Email support", "1 payment gateway"],
  },
  {
    id: "professional",
    name: "Professional",
    description: "For growing businesses with advanced needs",
    basePrice: 79,
    discount6Month: 15,
    discount12Month: 25,
    isPopular: true,
    sortOrder: 2,
    featuresList: [
      "Up to 500 products",
      "50GB storage",
      "Custom domain",
      "Advanced analytics",
      "Priority support",
      "5 team members",
      "API access",
    ],
  },
  {
    id: "enterprise",
    name: "Enterprise",
    description: "For large businesses with unlimited needs",
    basePrice: 199,
    discount6Month: 15,
    discount12Month: 30,
    isPopular: false,
    sortOrder: 3,
    featuresList: [
      "Unlimited products",
      "500GB storage",
      "Custom domain",
      "Remove branding",
      "Advanced analytics",
      "Unlimited team members",
      "Full API access",
      "24/7 priority support",
      "Dedicated success manager",
    ],
  },
];

export async function POST() {
  try {
    const col = await getCollection("subscription_plans");

    // Check if plans already exist
    const existingCount = await col.countDocuments({});
    if (existingCount > 0) {
      return NextResponse.json({ message: "Plans already exist. Use DELETE first to reset.", existingCount }, { status: 400 });
    }

    const now = new Date().toISOString();

    // Create plans with pre-calculated prices
    const plansToInsert = DEFAULT_PLANS.map((plan) => ({
      ...plan,
      prices: {
        monthly: calculatePrice(plan.basePrice, 1, 0),
        semi_annual: calculatePrice(plan.basePrice, 6, plan.discount6Month),
        yearly: calculatePrice(plan.basePrice, 12, plan.discount12Month),
      },
      isActive: true,
      createdAt: now,
      updatedAt: now,
    }));

    await col.insertMany(plansToInsert);

    // Log activity
    const activityCol = await getCollection("activity_logs");
    await activityCol.insertOne({
      action: "plans_seeded",
      details: { count: plansToInsert.length, planIds: plansToInsert.map((p) => p.id) },
      timestamp: now,
    });

    return NextResponse.json({
      success: true,
      message: `Created ${plansToInsert.length} default plans`,
      plans: plansToInsert.map((p) => ({
        id: p.id,
        name: p.name,
        basePrice: p.basePrice,
        discount6Month: p.discount6Month,
        discount12Month: p.discount12Month,
      })),
    });
  } catch (error: any) {
    console.error("Seed plans error:", error);
    return NextResponse.json({ error: error?.message || "Failed to seed plans" }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const col = await getCollection("subscription_plans");
    const result = await col.deleteMany({});

    // Log activity
    const activityCol = await getCollection("activity_logs");
    await activityCol.insertOne({
      action: "plans_deleted",
      details: { deletedCount: result.deletedCount },
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      message: `Deleted ${result.deletedCount} plans`,
      deletedCount: result.deletedCount,
    });
  } catch (error: any) {
    console.error("Delete plans error:", error);
    return NextResponse.json({ error: error?.message || "Failed to delete plans" }, { status: 500 });
  }
}
