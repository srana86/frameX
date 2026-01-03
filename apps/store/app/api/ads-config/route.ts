import { NextResponse } from "next/server";
import { getMerchantCollectionForAPI, buildMerchantQuery } from "@/lib/api-helpers";
import type { AdsConfig } from "@/lib/ads-config-types";
import { defaultAdsConfig } from "@/lib/ads-config-types";
import { requireAuth } from "@/lib/auth-helpers";

const ADS_CONFIG_ID = "ads_config_v1";

export async function GET() {
  try {
    // Merchants and admins can view Ads config
    await requireAuth("merchant");

    const col = await getMerchantCollectionForAPI("ads_config");
    const query = await buildMerchantQuery({ id: ADS_CONFIG_ID });
    const doc = await col.findOne(query);

    if (doc) {
      // Remove MongoDB _id field
      const { _id, ...config } = doc;
      return NextResponse.json(config as AdsConfig);
    }

    // Return default config if no config exists in database
    return NextResponse.json(defaultAdsConfig);
  } catch (error: any) {
    console.error("GET /api/ads-config error:", error);
    if (error.message === "NEXT_REDIRECT") {
      throw error; // Re-throw redirect errors
    }
    return NextResponse.json({ error: error?.message || "Failed to get Ads config" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    // Merchants and admins can update Ads config
    await requireAuth("merchant");

    const body = await request.json();
    const col = await getMerchantCollectionForAPI("ads_config");
    const baseQuery = await buildMerchantQuery();

    // Validate required fields
    if (!body.hasOwnProperty("metaPixel") || typeof body.metaPixel?.enabled !== "boolean") {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const query = { ...baseQuery, id: ADS_CONFIG_ID };

    // Prepare update data
    const updateData: Partial<AdsConfig> = {
      id: ADS_CONFIG_ID,
      metaPixel: {
        enabled: body.metaPixel?.enabled === true,
        pixelId: body.metaPixel?.pixelId || "",
        serverSideTracking: body.metaPixel?.serverSideTracking
          ? {
              enabled: body.metaPixel.serverSideTracking.enabled === true,
              accessToken: body.metaPixel.serverSideTracking.accessToken || "",
              testEventCode: body.metaPixel.serverSideTracking.testEventCode || "",
            }
          : undefined,
      },

      googleTagManager: {
        enabled: body.googleTagManager?.enabled === true,
        containerId: body.googleTagManager?.containerId || "",
      },

      updatedAt: new Date().toISOString(),
    };

    // Get existing config to check if we're creating new
    const existing = await col.findOne(query);
    if (!existing) {
      updateData.createdAt = new Date().toISOString();
    }

    // Upsert the Ads config
    await col.updateOne(
      query,
      {
        $set: updateData,
      },
      { upsert: true }
    );

    const updated = await col.findOne(query);
    const { _id, ...config } = updated as any;

    return NextResponse.json(config as AdsConfig);
  } catch (error: any) {
    console.error("PUT /api/ads-config error:", error);
    if (error.message === "NEXT_REDIRECT") {
      throw error;
    }
    return NextResponse.json({ error: error?.message || "Failed to update Ads config" }, { status: 500 });
  }
}
