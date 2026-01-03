import { NextRequest, NextResponse } from "next/server";
import { getCollection } from "@/lib/mongodb";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const col = await getCollection("feature_requests");
    const doc = await col.findOne({ id });
    if (!doc) {
      return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
    }
    const { _id, ...rest } = doc;
    return NextResponse.json({ success: true, data: rest });
  } catch (error: any) {
    console.error("GET /api/feature-requests/[id] error:", error);
    return NextResponse.json({ success: false, error: error?.message || "Failed to load request" }, { status: 500 });
  }
}
