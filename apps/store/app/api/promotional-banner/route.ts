import { NextResponse } from "next/server";
import { getMerchantCollectionForAPI, buildMerchantQuery } from "@/lib/api-helpers";

const PROMOTIONAL_BANNER_ID = "promotional_banner_v1";

export interface PromotionalBanner {
  id: string;
  enabled: boolean;
  text: string;
  link?: string;
  linkText?: string;
  backgroundColor?: string;
  textColor?: string;
  updatedAt?: string;
}

const defaultBanner: PromotionalBanner = {
  id: PROMOTIONAL_BANNER_ID,
  enabled: false,
  text: "Free shipping on orders over $75 • Fast delivery • 30-day returns",
  backgroundColor: "#f3f4f6",
  textColor: "#6b7280",
  updatedAt: new Date().toISOString(),
};

export async function GET() {
  try {
    const col = await getMerchantCollectionForAPI("promotional_banner");
    const query = await buildMerchantQuery({ id: PROMOTIONAL_BANNER_ID });
    const doc = await col.findOne(query);

    if (doc) {
      const { _id, ...banner } = doc;
      return NextResponse.json(banner as PromotionalBanner);
    }

    // Return default banner if no banner exists in database
    return NextResponse.json(defaultBanner);
  } catch (error: any) {
    console.error("GET /api/promotional-banner error:", error);
    // Return default banner on error
    return NextResponse.json(defaultBanner);
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const col = await getMerchantCollectionForAPI("promotional_banner");
    const baseQuery = await buildMerchantQuery();

    // Validate required fields
    if (typeof body.enabled !== "boolean") {
      return NextResponse.json({ error: "Missing required field: enabled" }, { status: 400 });
    }

    // Only require text if banner is enabled
    if (body.enabled && !body.text) {
      return NextResponse.json({ error: "Text is required when banner is enabled" }, { status: 400 });
    }

    const query = { ...baseQuery, id: PROMOTIONAL_BANNER_ID };

    // Upsert the promotional banner
    await col.updateOne(
      query,
      {
        $set: {
          ...body,
          id: PROMOTIONAL_BANNER_ID,
          updatedAt: new Date().toISOString(),
        },
      },
      { upsert: true }
    );

    // Fetch and return the updated banner
    const updated = await col.findOne(query);
    const { _id, ...banner } = updated as any;

    return NextResponse.json(banner as PromotionalBanner);
  } catch (error: any) {
    console.error("PUT /api/promotional-banner error:", error);
    return NextResponse.json({ error: error?.message || "Failed to update promotional banner" }, { status: 500 });
  }
}
