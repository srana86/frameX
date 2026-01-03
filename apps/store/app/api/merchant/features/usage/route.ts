import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-helpers";
import { getFeatureUsage } from "@/lib/subscription-helpers";

/**
 * Get current usage for a feature
 */
export async function GET(request: Request) {
  try {
    const user = await requireAuth("merchant");
    const { searchParams } = new URL(request.url);
    const feature = searchParams.get("feature");

    if (!feature) {
      return NextResponse.json({ error: "Feature key is required" }, { status: 400 });
    }

    const usage = await getFeatureUsage(user.id, feature);

    return NextResponse.json({ usage, feature });
  } catch (error: any) {
    console.error("Error getting feature usage:", error);
    if (error.message === "NEXT_REDIRECT") {
      throw error;
    }
    return NextResponse.json({ error: error?.message || "Failed to get feature usage" }, { status: 500 });
  }
}

