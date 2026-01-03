import { NextResponse } from "next/server";
import { getMerchantIdForAPI } from "@/lib/api-helpers";
import {
  getMerchantSubscriptionFromSuperAdmin,
  getMerchantDeploymentFromSuperAdmin,
  getMerchantDatabaseFromSuperAdmin,
  getMerchantFullDataFromSuperAdmin,
} from "@/lib/super-admin-client";

/**
 * Get merchant data from super-admin
 * GET /api/merchant/super-admin-data?type=subscription|deployment|database|full
 */
export async function GET(request: Request) {
  try {
    // Get merchant ID
    const merchantId = await getMerchantIdForAPI();

    if (!merchantId) {
      console.log("❌ [Super-Admin Data API] No merchant ID found");
      return NextResponse.json(
        { error: "Merchant ID not found. Set MERCHANT_ID in environment or ensure merchant context is loaded." },
        { status: 400 }
      );
    }

    console.log(`\n🔍 [Super-Admin Data API] Request received for merchantId: ${merchantId}`);

    // Get query parameter for data type
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "full";

    console.log(`📋 [Super-Admin Data API] Requesting type: ${type}`);

    let data: any = null;

    switch (type) {
      case "subscription":
        console.log(`📦 [Super-Admin Data API] Fetching subscription...`);
        data = await getMerchantSubscriptionFromSuperAdmin(merchantId);
        break;
      case "deployment":
        console.log(`🚀 [Super-Admin Data API] Fetching deployment...`);
        data = await getMerchantDeploymentFromSuperAdmin(merchantId);
        break;
      case "database":
        console.log(`💾 [Super-Admin Data API] Fetching database...`);
        data = await getMerchantDatabaseFromSuperAdmin(merchantId);
        break;
      case "full":
      default:
        console.log(`📊 [Super-Admin Data API] Fetching complete merchant data...`);
        data = await getMerchantFullDataFromSuperAdmin(merchantId);
        break;
    }

    if (!data) {
      console.log(`⚠️ [Super-Admin Data API] No data found for merchantId: ${merchantId}, type: ${type}`);
      return NextResponse.json({ error: `${type} not found for merchant ${merchantId}` }, { status: 404 });
    }

    console.log(`✅ [Super-Admin Data API] Successfully retrieved ${type} data for merchantId: ${merchantId}`);

    // Enhanced logging for subscription type
    if (type === "subscription" && data && data.plan) {
      console.log(`\n${"─".repeat(80)}`);
      console.log(`📦 SUBSCRIPTION DETAILS:`);
      console.log(`  Status: ${data.status}`);
      console.log(`  Plan ID: ${data.planId}`);
      console.log(`  Period: ${data.currentPeriodStart} to ${data.currentPeriodEnd}`);
      console.log(`\n💳 PLAN DETAILS:`);
      console.log(`  Plan Name: ${data.plan.name}`);
      console.log(`  Price: $${data.plan.price}/${data.plan.billingCycle}`);
      console.log(`  Features:`, JSON.stringify(data.plan.features, null, 2));
      console.log(`${"─".repeat(80)}\n`);
    }

    console.log(`📊 [Super-Admin Data API] Response data:`, JSON.stringify(data, null, 2));

    return NextResponse.json(data);
  } catch (error: any) {
    console.error(`❌ [Super-Admin Data API] Error:`, error);
    return NextResponse.json({ error: error?.message || "Failed to get merchant data from super-admin" }, { status: 500 });
  }
}
