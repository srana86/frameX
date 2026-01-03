import { NextResponse } from "next/server";
import { getCollection } from "@/lib/mongodb";

/**
 * Get merchant deployment by merchantId
 * GET /api/merchants/[id]/deployment
 */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: merchantId } = await params;
    console.log(`\n🔍 [Super-Admin API] GET /api/merchants/${merchantId}/deployment`);
    console.log(`📋 Requesting deployment for merchantId: ${merchantId}`);

    // Get merchant deployment
    const deploymentsCol = await getCollection("merchant_deployments");
    console.log(`🔎 Querying merchant_deployments collection for merchantId: ${merchantId}`);
    const deployment = await deploymentsCol.findOne({
      $or: [{ merchantId }, { id: merchantId }],
    });

    if (!deployment) {
      console.log(`❌ No deployment found for merchantId: ${merchantId}`);
      return NextResponse.json({ error: "Deployment not found" }, { status: 404 });
    }

    console.log(`✅ Found deployment in database:`, JSON.stringify(deployment, null, 2));

    const { _id, ...deploymentData } = deployment as any;
    console.log(`\n🚀 [Super-Admin API] Final Deployment Response Data:`);
    console.log(JSON.stringify(deploymentData, null, 2));
    console.log(`✅ [Super-Admin API] Returning deployment data for merchantId: ${merchantId}\n`);
    return NextResponse.json(deploymentData);
  } catch (error: any) {
    console.error("GET /api/merchants/[id]/deployment error:", error);
    return NextResponse.json({ error: error?.message || "Failed to get merchant deployment" }, { status: 500 });
  }
}
