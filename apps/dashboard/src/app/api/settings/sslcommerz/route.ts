import { NextRequest, NextResponse } from "next/server";
import { getCollection } from "@/lib/mongodb";
import { SSLCommerzConfig, defaultSSLCommerzConfig } from "@/lib/sslcommerz-config-types";

const COLLECTION_NAME = "settings";
const CONFIG_ID = "sslcommerz_config_v1";

// GET - Fetch SSLCommerz configuration
export async function GET() {
  try {
    const collection = await getCollection(COLLECTION_NAME);
    const config = await collection.findOne({ id: CONFIG_ID });

    if (!config) {
      return NextResponse.json(defaultSSLCommerzConfig);
    }

    // Remove MongoDB _id and mask password for security
    const { _id, ...configData } = config as any;

    return NextResponse.json({
      ...configData,
      storePassword: configData.storePassword ? "••••••••" : "",
    });
  } catch (error: any) {
    console.error("Failed to fetch SSLCommerz config:", error);
    return NextResponse.json(
      { message: "Failed to fetch configuration" },
      { status: 500 }
    );
  }
}

// PUT - Update SSLCommerz configuration
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { storeId, storePassword, isLive, enabled } = body;

    const collection = await getCollection(COLLECTION_NAME);

    // Get existing config to preserve password if not changed
    const existingConfig = await collection.findOne({ id: CONFIG_ID });

    // If password is masked (••••••••), keep the existing password
    const finalPassword =
      storePassword === "••••••••" && existingConfig
        ? (existingConfig as any).storePassword
        : storePassword;

    const configToSave: SSLCommerzConfig = {
      id: CONFIG_ID,
      storeId: storeId || "",
      storePassword: finalPassword || "",
      isLive: isLive ?? false,
      enabled: enabled ?? false,
      updatedAt: new Date().toISOString(),
      createdAt: existingConfig
        ? (existingConfig as any).createdAt
        : new Date().toISOString(),
    };

    await collection.updateOne(
      { id: CONFIG_ID },
      { $set: configToSave },
      { upsert: true }
    );

    // Log activity
    const activityCollection = await getCollection("activity_logs");
    await activityCollection.insertOne({
      action: "sslcommerz_config_updated",
      details: {
        storeId: configToSave.storeId,
        isLive: configToSave.isLive,
        enabled: configToSave.enabled,
      },
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      message: "Configuration saved successfully",
    });
  } catch (error: any) {
    console.error("Failed to save SSLCommerz config:", error);
    return NextResponse.json(
      { message: "Failed to save configuration" },
      { status: 500 }
    );
  }
}

