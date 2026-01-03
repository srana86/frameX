import { NextResponse } from "next/server";
import { getActivePlans } from "@/lib/subscription-helpers";

/**
 * Public endpoint to get active subscription plans
 * Used by merchants to view available plans
 */
export async function GET() {
  try {
    const plans = await getActivePlans();
    return NextResponse.json(plans);
  } catch (error: any) {
    console.error("GET /api/subscriptions/plans error:", error);
    return NextResponse.json({ error: error?.message || "Failed to get subscription plans" }, { status: 500 });
  }
}

