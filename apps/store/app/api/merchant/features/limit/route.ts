import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-helpers";
import { getFeatureLimit } from "@/lib/subscription-helpers";

/**
 * Get feature limit for merchant
 */
export async function GET(request: Request) {
  try {
    const user = await requireAuth("merchant");
    const { searchParams } = new URL(request.url);
    const feature = searchParams.get("feature");

    if (!feature) {
      return NextResponse.json({ error: "Feature key is required" }, { status: 400 });
    }

    const limit = await getFeatureLimit(user.id, feature);

    return NextResponse.json({ limit, feature });
  } catch (error: any) {
    console.error("Error getting feature limit:", error);
    if (error.message === "NEXT_REDIRECT") {
      throw error;
    }
    return NextResponse.json({ error: error?.message || "Failed to get feature limit" }, { status: 500 });
  }
}

