import { NextResponse } from "next/server";
import { getMerchantSubscriptionFromSuperAdmin } from "@/lib/super-admin-client";
import { getMerchantIdFromRequest } from "@/lib/merchant-loader";

/**
 * Get merchant subscription from super-admin
 * GET /api/super-admin/merchants/[id]/subscription
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

    const subscription = await getMerchantSubscriptionFromSuperAdmin(merchantId);
    
    console.log("📦 [my-app] Merchant Subscription Response:", JSON.stringify(subscription, null, 2));
    
    if (!subscription) {
      return NextResponse.json(
        { error: "Subscription not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(subscription);
  } catch (error: any) {
    console.error("GET /api/super-admin/merchants/[id]/subscription error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to get merchant subscription" },
      { status: 500 }
    );
  }
}

