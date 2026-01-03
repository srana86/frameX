import { NextResponse } from "next/server";
import { getMerchantDeploymentFromSuperAdmin } from "@/lib/super-admin-client";
import { getMerchantIdFromRequest } from "@/lib/merchant-loader";

/**
 * Get merchant deployment from super-admin
 * GET /api/super-admin/merchants/[id]/deployment
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: merchantId } = await params;
    
    // Optionally verify the merchantId matches the current merchant context
    const currentMerchantId = await getMerchantIdFromRequest();
    if (currentMerchantId && currentMerchantId !== merchantId) {
      return NextResponse.json(
        { error: "Unauthorized: Merchant ID mismatch" },
        { status: 403 }
      );
    }

    const deployment = await getMerchantDeploymentFromSuperAdmin(merchantId);
    
    console.log("🚀 [my-app] Merchant Deployment Response:", JSON.stringify(deployment, null, 2));
    
    if (!deployment) {
      return NextResponse.json(
        { error: "Deployment not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(deployment);
  } catch (error: any) {
    console.error("GET /api/super-admin/merchants/[id]/deployment error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to get merchant deployment" },
      { status: 500 }
    );
  }
}

