import { NextRequest, NextResponse } from "next/server";
import { getCollection } from "@/lib/mongodb";

type FeatureRequestStatus = "new" | "in_review" | "resolved";

interface FeatureRequest {
  id: string;
  title: string;
  description: string;
  priority: "low" | "medium" | "high";
  contactEmail?: string;
  contactPhone?: string;
  merchantId: string;
  status: FeatureRequestStatus;
  createdAt: string;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const merchantId = searchParams.get("merchantId");

    const col = await getCollection("feature_requests");
    const query: Record<string, any> = {};
    if (status) query.status = status;
    if (merchantId) query.merchantId = merchantId;

    const requests = await col.find(query).sort({ createdAt: -1 }).limit(200).toArray();
    const cleaned = requests.map((r: any) => {
      const { _id, ...rest } = r;
      return rest as FeatureRequest;
    });

    return NextResponse.json({ success: true, data: cleaned });
  } catch (error: any) {
    console.error("GET /api/feature-requests error:", error);
    return NextResponse.json({ success: false, error: error?.message || "Failed to load feature requests" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, status, priority } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: "id is required" }, { status: 400 });
    }

    const updates: Record<string, any> = {};
    if (status) {
      if (!["new", "in_review", "resolved"].includes(status)) {
        return NextResponse.json({ success: false, error: "Invalid status" }, { status: 400 });
      }
      updates.status = status;
    }
    if (priority) {
      if (!["low", "medium", "high"].includes(priority)) {
        return NextResponse.json({ success: false, error: "Invalid priority" }, { status: 400 });
      }
      updates.priority = priority;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ success: false, error: "No updates provided" }, { status: 400 });
    }

    const col = await getCollection("feature_requests");
    const result = await col.findOneAndUpdate({ id }, { $set: updates }, { returnDocument: "after" });
    if (!result) {
      return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
    }

    const { _id, ...rest } = result;
    return NextResponse.json({ success: true, data: rest });
  } catch (error: any) {
    console.error("PATCH /api/feature-requests error:", error);
    return NextResponse.json({ success: false, error: error?.message || "Failed to update feature request" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, description, priority = "medium", contactEmail, contactPhone, merchantId, status = "new" } = body;

    if (!title || !description || !merchantId) {
      return NextResponse.json({ success: false, error: "title, description, and merchantId are required" }, { status: 400 });
    }

    const safePriority: FeatureRequest["priority"] = ["low", "medium", "high"].includes(priority) ? priority : "medium";
    const safeStatus: FeatureRequestStatus = ["new", "in_review", "resolved"].includes(status) ? status : "new";

    const requestDoc: FeatureRequest = {
      id: `fr_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      title: String(title).trim(),
      description: String(description).trim(),
      priority: safePriority,
      contactEmail: contactEmail ? String(contactEmail).trim() : undefined,
      contactPhone: contactPhone ? String(contactPhone).trim() : undefined,
      merchantId: String(merchantId).trim(),
      status: safeStatus,
      createdAt: new Date().toISOString(),
    };

    const col = await getCollection("feature_requests");
    await col.insertOne(requestDoc);

    return NextResponse.json({ success: true, data: requestDoc }, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/feature-requests error:", error);
    return NextResponse.json({ success: false, error: error?.message || "Failed to create feature request" }, { status: 500 });
  }
}
