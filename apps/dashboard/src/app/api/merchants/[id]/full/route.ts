import { NextResponse } from "next/server";
import { getCollection } from "@/lib/mongodb";

/**
 * Get complete merchant data with subscription, deployment, database, and plan
 * GET /api/merchants/[id]/full
 */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: merchantId } = await params;
    console.log(`\n🔍 [Super-Admin API] GET /api/merchants/${merchantId}/full`);
    console.log(`📋 Requesting complete merchant data for merchantId: ${merchantId}`);

    // Get all merchant-related data in parallel
    console.log(`🔎 Querying all collections in parallel for merchantId: ${merchantId}`);
    const [merchant, subscription, deployment, database] = await Promise.all([
      getCollection("merchants").then((col) => col.findOne({ id: merchantId })),
      getCollection("merchant_subscriptions").then((col) => col.findOne({ merchantId })),
      getCollection("merchant_deployments").then((col) => col.findOne({ $or: [{ merchantId }, { id: merchantId }] })),
      getCollection("merchant_databases").then((col) => col.findOne({ $or: [{ merchantId }, { id: merchantId }] })),
    ]);

    console.log(`\n📊 [Super-Admin API] Raw Data Retrieved from Database:`);
    console.log(`  ✅ Merchant:`, merchant ? `Found (${(merchant as any).name}, ${(merchant as any).email})` : `❌ Not found`);
    console.log(`  ✅ Subscription:`, subscription ? `Found (${(subscription as any).status})` : `❌ Not found`);
    console.log(`  ✅ Deployment:`, deployment ? `Found (${(deployment as any).deploymentStatus})` : `❌ Not found`);
    console.log(`  ✅ Database:`, database ? `Found (${(database as any).databaseName})` : `❌ Not found`);

    if (!merchant) {
      console.log(`❌ Merchant not found for merchantId: ${merchantId}`);
      return NextResponse.json({ error: "Merchant not found" }, { status: 404 });
    }

    // Get plan details if subscription exists
    let plan = null;
    if (subscription && (subscription as any).planId) {
      const planId = (subscription as any).planId;
      console.log(`🔎 Looking up plan with planId: ${planId}`);
      const plansCol = await getCollection("subscription_plans");
      const planDoc = await plansCol.findOne({ id: planId });
      if (planDoc) {
        const { _id, ...planData } = planDoc as any;
        plan = planData;
        console.log(`✅ Found plan:`, JSON.stringify(planData, null, 2));
      } else {
        console.log(`⚠️ No plan found for planId: ${planId}`);
      }
    } else {
      console.log(`⚠️ No subscription or planId found, skipping plan lookup`);
    }

    // Clean up MongoDB _id fields
    const { _id: merchantId_mongo, ...merchantData } = merchant as any;
    const subscriptionData = subscription
      ? (() => {
          const { _id, ...data } = subscription as any;
          return data;
        })()
      : null;
    const deploymentData = deployment
      ? (() => {
          const { _id, ...data } = deployment as any;
          return data;
        })()
      : null;
    const databaseData = database
      ? (() => {
          const { _id, ...data } = database as any;
          // Don't expose connection string
          return {
            ...data,
            connectionString: data.connectionString ? "***encrypted***" : undefined,
          };
        })()
      : null;

    const result = {
      merchant: merchantData,
      subscription: subscriptionData,
      plan: plan,
      deployment: deploymentData,
      database: databaseData,
    };

    console.log(`\n📊 [Super-Admin API] Final Complete Merchant Data Response:`);
    console.log(`  📝 Merchant:`, merchantData ? `${merchantData.name} (${merchantData.email})` : `null`);
    console.log(`  📦 Subscription:`, subscriptionData ? `${subscriptionData.status} (Plan: ${subscriptionData.planId})` : `null`);
    console.log(`  💳 Plan:`, plan ? `${plan.name} ($${plan.price}/month)` : `null`);
    console.log(`  🚀 Deployment:`, deploymentData ? `${deploymentData.deploymentStatus} - ${deploymentData.deploymentUrl}` : `null`);
    console.log(
      `  💾 Database:`,
      databaseData ? `${databaseData.databaseName} (${databaseData.useSharedDatabase ? "shared" : "separate"})` : `null`
    );
    console.log(`\n📊 [Super-Admin API] Full JSON Response:`);
    console.log(JSON.stringify(result, null, 2));
    console.log(`✅ [Super-Admin API] Returning complete merchant data for merchantId: ${merchantId}\n`);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("GET /api/merchants/[id]/full error:", error);
    return NextResponse.json({ error: error?.message || "Failed to get merchant data" }, { status: 500 });
  }
}
