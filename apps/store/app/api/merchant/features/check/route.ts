import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-helpers";
import { checkFeatureAccess } from "@/lib/subscription-helpers";

/**
 * Check if merchant has access to a feature
 * Used by client components
 */
export async function POST(request: Request) {
  try {
    const user = await requireAuth("merchant");
    const body = await request.json();

    const { feature } = body;

    if (!feature) {
      return NextResponse.json({ error: "Feature key is required" }, { status: 400 });
    }

    const hasAccess = await checkFeatureAccess(user.id, feature);

    return NextResponse.json({ hasAccess, feature });
  } catch (error: any) {
    console.error("Error checking feature access:", error);
    if (error.message === "NEXT_REDIRECT") {
      throw error;
    }
    return NextResponse.json({ error: error?.message || "Failed to check feature" }, { status: 500 });
  }
}

