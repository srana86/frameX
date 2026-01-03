import { NextResponse } from "next/server";
import { getMerchantCollectionForAPI, buildMerchantQuery } from "@/lib/api-helpers";
import type { SSLCommerzConfig } from "@/lib/sslcommerz-config-types";
import { defaultSSLCommerzConfig } from "@/lib/sslcommerz-config-types";
import { requireAuth } from "@/lib/auth-helpers";

const SSLCOMMERZ_CONFIG_ID = "sslcommerz_config_v1";

export async function GET() {
  try {
    // Merchants and admins can view SSLCommerz config
    await requireAuth("merchant");

    const col = await getMerchantCollectionForAPI("sslcommerz_config");
    const query = await buildMerchantQuery({ id: SSLCOMMERZ_CONFIG_ID });
    const doc = await col.findOne(query);

    if (doc) {
      // Remove MongoDB _id field
      const { _id, ...config } = doc;
      // Don't return store password in GET request for security
      const safeConfig = {
        ...config,
        storePassword: undefined, // Don't expose password
      };
      return NextResponse.json(safeConfig as Omit<SSLCommerzConfig, "storePassword"> & { storePassword?: undefined });
    }

    // Return default config if no config exists in database
    return NextResponse.json(defaultSSLCommerzConfig);
  } catch (error: any) {
    console.error("GET /api/sslcommerz-config error:", error);
    if (error.message === "NEXT_REDIRECT") {
      throw error; // Re-throw redirect errors
    }
    return NextResponse.json({ error: error?.message || "Failed to get SSLCommerz config" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    // Merchants and admins can update SSLCommerz config
    await requireAuth("merchant");

    const body = await request.json();
    const col = await getMerchantCollectionForAPI("sslcommerz_config");
    const baseQuery = await buildMerchantQuery();

    // Validate required fields
    if (!body.hasOwnProperty("enabled") || typeof body.enabled !== "boolean") {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const query = { ...baseQuery, id: SSLCOMMERZ_CONFIG_ID };

    // Get existing config to preserve storePassword if not provided
    const existing = await col.findOne(query);
    const existingConfig = existing as SSLCommerzConfig | null;

    // Prepare update data
    const updateData: Partial<SSLCommerzConfig> = {
      id: SSLCOMMERZ_CONFIG_ID,
      storeId: body.storeId || "",
      // Only update storePassword if provided, otherwise keep existing
      storePassword: body.storePassword || existingConfig?.storePassword || "",
      isLive: body.isLive === true,
      enabled: body.enabled,
      updatedAt: new Date().toISOString(),
    };

    // Set createdAt if creating new
    if (!existingConfig) {
      updateData.createdAt = new Date().toISOString();
    }

    // Upsert the SSLCommerz config
    await col.updateOne(
      query,
      {
        $set: updateData,
      },
      { upsert: true }
    );

    // Fetch and return the updated config (without password)
    const updated = await col.findOne(query);
    const { _id, ...config } = updated as any;
    const safeConfig = {
      ...config,
      storePassword: undefined, // Don't expose password
    };

    return NextResponse.json(safeConfig);
  } catch (error: any) {
    console.error("PUT /api/sslcommerz-config error:", error);
    if (error.message === "NEXT_REDIRECT") {
      throw error; // Re-throw redirect errors
    }
    return NextResponse.json({ error: error?.message || "Failed to update SSLCommerz config" }, { status: 500 });
  }
}
