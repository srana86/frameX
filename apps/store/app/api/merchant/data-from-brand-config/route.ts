import { NextResponse } from "next/server";
import { getMerchantCollectionForAPI, buildMerchantQuery } from "@/lib/api-helpers";
import {
  getMerchantFullDataFromSuperAdmin,
  getMerchantSubscriptionFromSuperAdmin,
  getMerchantDeploymentFromSuperAdmin,
  getMerchantDatabaseFromSuperAdmin,
} from "@/lib/super-admin-client";

const BRAND_CONFIG_ID = "brand_config_v1";

/**
 * Get all super-admin data using merchant ID from brand config
 * GET /api/merchant/data-from-brand-config
 * 
 * This endpoint:
 * 1. Gets merchant ID from brand_config
 * 2. Fetches all data from super-admin using that merchant ID
 * 3. Returns complete merchant data
 */
export async function GET(request: Request) {
  try {
    console.log(`\n${"=".repeat(80)}`);
    console.log(`🔍 [Data from Brand Config] Starting data fetch`);
    console.log(`${"=".repeat(80)}\n`);

    // Step 1: Get merchant ID from brand config
    console.log(`📖 [Data from Brand Config] Step 1: Getting merchant ID from brand config...`);
    const col = await getMerchantCollectionForAPI("brand_config");
    const query = await buildMerchantQuery({ id: BRAND_CONFIG_ID });
    const brandConfigDoc = await col.findOne(query);

    if (!brandConfigDoc) {
      console.log(`❌ [Data from Brand Config] Brand config not found`);
      return NextResponse.json(
        { error: "Brand config not found. Please initialize brand config first." },
        { status: 404 }
      );
    }

    const { _id, ...brandConfig } = brandConfigDoc as any;
    const merchantIdFromBrandConfig = brandConfig.merchantId;

    if (!merchantIdFromBrandConfig) {
      console.log(`❌ [Data from Brand Config] Brand config does not have merchantId`);
      console.log(`⚠️  Brand config needs to be connected to a merchant.`);
      return NextResponse.json(
        { 
          error: "Brand config is not connected to a merchant. merchantId is missing.",
          brandConfig: {
            id: brandConfig.id,
            brandName: brandConfig.brandName,
            hasMerchantId: false,
          }
        },
        { status: 400 }
      );
    }

    console.log(`✅ [Data from Brand Config] Found merchant ID in brand config: ${merchantIdFromBrandConfig}`);
    console.log(`📛 Brand Name: ${brandConfig.brandName || 'Not set'}`);
    console.log(`📧 Contact Email: ${brandConfig.contact?.email || 'Not set'}`);

    // Step 2: Get all data from super-admin using merchant ID from brand config
    console.log(`\n${"─".repeat(80)}`);
    console.log(`📊 [Data from Brand Config] Step 2: Fetching all data from super-admin...`);
    console.log(`🔑 Using merchant ID: ${merchantIdFromBrandConfig}`);
    console.log(`${"─".repeat(80)}\n`);

    // Fetch all data in parallel
    const [fullData, subscription, deployment, database] = await Promise.all([
      getMerchantFullDataFromSuperAdmin(merchantIdFromBrandConfig),
      getMerchantSubscriptionFromSuperAdmin(merchantIdFromBrandConfig).catch(() => null),
      getMerchantDeploymentFromSuperAdmin(merchantIdFromBrandConfig).catch(() => null),
      getMerchantDatabaseFromSuperAdmin(merchantIdFromBrandConfig).catch(() => null),
    ]);

    if (!fullData) {
      console.log(`❌ [Data from Brand Config] No data found in super-admin for merchantId: ${merchantIdFromBrandConfig}`);
      return NextResponse.json(
        { 
          error: `Merchant data not found in super-admin for merchantId: ${merchantIdFromBrandConfig}`,
          merchantId: merchantIdFromBrandConfig,
          brandConfig: {
            id: brandConfig.id,
            brandName: brandConfig.brandName,
            merchantId: merchantIdFromBrandConfig,
          }
        },
        { status: 404 }
      );
    }

    // Step 3: Log all retrieved data
    console.log(`\n${"─".repeat(80)}`);
    console.log(`📊 [Data from Brand Config] All Super-Admin Data Retrieved`);
    console.log(`${"─".repeat(80)}`);
    
    console.log(`\n🏪 MERCHANT DATA:`);
    console.log(`  ✅ Merchant ID: ${fullData.merchant?.id}`);
    console.log(`  📛 Name: ${fullData.merchant?.name}`);
    console.log(`  📧 Email: ${fullData.merchant?.email}`);
    console.log(`  📊 Status: ${fullData.merchant?.status}`);
    console.log(`  🌐 Deployment URL: ${fullData.merchant?.deploymentUrl || 'Not set'}`);

    console.log(`\n📦 SUBSCRIPTION DATA:`);
    if (fullData.subscription) {
      console.log(`  ✅ Subscription ID: ${fullData.subscription.id}`);
      console.log(`  📋 Status: ${fullData.subscription.status}`);
      console.log(`  💳 Plan ID: ${fullData.subscription.planId}`);
      console.log(`  📅 Period: ${fullData.subscription.currentPeriodStart} to ${fullData.subscription.currentPeriodEnd}`);
    } else {
      console.log(`  ❌ No subscription found`);
    }

    console.log(`\n💳 PLAN DATA:`);
    if (fullData.plan) {
      console.log(`  ✅ Plan ID: ${fullData.plan.id}`);
      console.log(`  📛 Plan Name: ${fullData.plan.name}`);
      console.log(`  💰 Price: $${fullData.plan.price}/${fullData.plan.billingCycle}`);
      console.log(`  🎯 Features:`);
      if (fullData.plan.features) {
        console.log(`    • Max Products: ${fullData.plan.features.max_products === "unlimited" ? "∞" : fullData.plan.features.max_products}`);
        console.log(`    • Max Storage: ${fullData.plan.features.max_storage_gb === "unlimited" ? "∞" : `${fullData.plan.features.max_storage_gb}GB`}`);
        console.log(`    • Custom Domain: ${fullData.plan.features.custom_domain ? "✅" : "❌"}`);
        console.log(`    • Advanced Analytics: ${fullData.plan.features.advanced_analytics ? "✅" : "❌"}`);
        console.log(`    • API Access: ${fullData.plan.features.api_access || "None"}`);
        console.log(`    • Team Members: ${fullData.plan.features.team_members === "unlimited" ? "∞" : fullData.plan.features.team_members}`);
      }
    } else {
      console.log(`  ❌ No plan found`);
    }

    console.log(`\n🚀 DEPLOYMENT DATA:`);
    if (fullData.deployment) {
      console.log(`  ✅ Deployment ID: ${fullData.deployment.id}`);
      console.log(`  📊 Status: ${fullData.deployment.deploymentStatus}`);
      console.log(`  🔗 URL: ${fullData.deployment.deploymentUrl}`);
      console.log(`  🌐 Subdomain: ${fullData.deployment.subdomain || 'Not set'}`);
      console.log(`  🔧 Provider: ${fullData.deployment.deploymentProvider || 'Not set'}`);
    } else {
      console.log(`  ❌ No deployment found`);
    }

    console.log(`\n💾 DATABASE DATA:`);
    if (fullData.database) {
      console.log(`  ✅ Database ID: ${fullData.database.id}`);
      console.log(`  📊 Status: ${fullData.database.status}`);
      console.log(`  💾 Database Name: ${fullData.database.databaseName}`);
      console.log(`  🔗 Shared Database: ${fullData.database.useSharedDatabase ? "Yes" : "No"}`);
    } else {
      console.log(`  ❌ No database config found`);
    }

    console.log(`\n${"─".repeat(80)}`);
    console.log(`📄 COMPLETE DATA OBJECT:`);
    console.log(`${"─".repeat(80)}`);
    console.log(JSON.stringify(fullData, null, 2));
    console.log(`\n${"=".repeat(80)}\n`);

    // Return complete data
    return NextResponse.json({
      success: true,
      merchantId: merchantIdFromBrandConfig,
      brandConfig: {
        id: brandConfig.id,
        brandName: brandConfig.brandName,
        merchantId: merchantIdFromBrandConfig,
      },
      data: fullData,
    });
  } catch (error: any) {
    console.error(`\n❌ [Data from Brand Config] Error:`, error);
    console.error(`Error Stack:`, error.stack);
    return NextResponse.json(
      { error: error?.message || "Failed to get data from brand config merchant ID" },
      { status: 500 }
    );
  }
}

