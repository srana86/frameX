import { NextResponse } from "next/server";
import { getMerchantCollectionForAPI, buildMerchantQuery } from "@/lib/api-helpers";
import type { BrandConfig } from "@/lib/brand-config";
import { defaultBrandConfig } from "@/lib/brand-config";
import { CACHE_TAGS, CACHE_HEADERS, revalidateCache } from "@/lib/cache-helpers";

// Cache brand config for 5 minutes (config rarely changes)
export const revalidate = 300;
export const dynamic = "force-dynamic";

const BRAND_CONFIG_ID = "brand_config_v1";

export async function GET() {
  try {
    const col = await getMerchantCollectionForAPI("brand_config");
    const query = await buildMerchantQuery({ id: BRAND_CONFIG_ID });
    const doc = await col.findOne(query);

    if (doc) {
      // Remove MongoDB _id field
      const { _id, ...config } = doc;
      const merchantId = (config as any).merchantId;
      console.log(`\n${"─".repeat(80)}`);
      console.log(`📖 [Brand Config] Retrieved brand config`);
      console.log(`  🔑 Merchant ID: ${merchantId || "❌ NOT SET - Connection missing!"}`);
      console.log(`  📛 Brand Name: ${(config as any).brandName || "Not set"}`);
      console.log(`  📧 Contact Email: ${(config as any).contact?.email || "Not set"}`);
      if (!merchantId) {
        console.log(`  ⚠️  WARNING: Brand config is missing merchantId!`);
        console.log(`  💡 This means the brand config is not connected to super-admin merchant.`);
        console.log(`  💡 Brand config should have merchantId to link it to the merchant record.`);
      } else {
        console.log(`  ✅ Brand config is properly connected to merchant: ${merchantId}`);
      }
      console.log(`${"─".repeat(80)}\n`);
      return NextResponse.json(config as BrandConfig, {
        headers: {
          ...CACHE_HEADERS.STATIC,
          "X-Cache-Tags": CACHE_TAGS.BRAND_CONFIG,
        },
      });
    }

    // Return default config if no config exists in database
    console.log(`⚠️ [Brand Config] No brand config found, returning default`);
    return NextResponse.json(defaultBrandConfig, {
      headers: {
        ...CACHE_HEADERS.STATIC,
        "X-Cache-Tags": CACHE_TAGS.BRAND_CONFIG,
      },
    });
  } catch (error: any) {
    console.error("GET /api/brand-config error:", error);
    // Return default config on error
    return NextResponse.json(defaultBrandConfig, {
      headers: {
        ...CACHE_HEADERS.STATIC,
        "X-Cache-Tags": CACHE_TAGS.BRAND_CONFIG,
      },
    });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const col = await getMerchantCollectionForAPI("brand_config");
    const baseQuery = await buildMerchantQuery();

    // Get merchant ID to store in brand config
    const { getMerchantIdForAPI } = await import("@/lib/api-helpers");
    const merchantId = await getMerchantIdForAPI();

    console.log(`📝 [Brand Config] Saving brand config for merchantId: ${merchantId}`);

    // Validate required fields
    if (!body.brandName || !body.meta || !body.contact) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const query = { ...baseQuery, id: BRAND_CONFIG_ID };

    // Upsert the brand config with merchantId
    const result = await col.updateOne(
      query,
      {
        $set: {
          ...body,
          id: BRAND_CONFIG_ID,
          merchantId: merchantId || body.merchantId, // Store merchantId explicitly
          updatedAt: new Date().toISOString(),
        },
      },
      { upsert: true }
    );

    console.log(`\n${"─".repeat(80)}`);
    console.log(`✅ [Brand Config] Brand config saved successfully`);
    console.log(`  🔑 Merchant ID: ${merchantId || "❌ NOT SET"}`);
    console.log(`  📛 Brand Name: ${body.brandName || "Not set"}`);
    console.log(`  📧 Contact Email: ${body.contact?.email || "Not set"}`);
    if (merchantId) {
      console.log(`  ✅ Brand config is now connected to super-admin merchant: ${merchantId}`);
      console.log(`  🔗 Connection established: Brand Config ↔ Super-Admin Merchant`);
    } else {
      console.log(`  ⚠️  WARNING: Brand config saved without merchantId!`);
    }
    console.log(`${"─".repeat(80)}\n`);

    // Fetch and return the updated config
    const updated = await col.findOne(query);
    const { _id, ...config } = updated as any;

    // Revalidate cache after updating brand config
    await revalidateCache([CACHE_TAGS.BRAND_CONFIG]);

    return NextResponse.json(config as BrandConfig);
  } catch (error: any) {
    console.error("PUT /api/brand-config error:", error);
    return NextResponse.json({ error: error?.message || "Failed to update brand config" }, { status: 500 });
  }
}
