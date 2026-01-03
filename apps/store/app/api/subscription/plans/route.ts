import { NextRequest, NextResponse } from "next/server";
import { getActivePlans } from "@/lib/subscription-helpers";

export async function GET(req: NextRequest) {
  try {
    const plans = await getActivePlans();
    return NextResponse.json(plans);
  } catch (error: any) {
    console.error("Error fetching plans:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch plans" }, { status: 500 });
  }
}

