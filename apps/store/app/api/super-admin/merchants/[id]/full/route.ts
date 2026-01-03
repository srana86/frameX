import { NextResponse } from "next/server";
import { getMerchantFullDataFromSuperAdmin } from "@/lib/super-admin-client";
import { getMerchantIdFromRequest } from "@/lib/merchant-loader";

/**
 * Get complete merchant data (merchant + subscription + plan + deployment + database) from super-admin
 * GET /api/super-admin/merchants/[id]/full
 */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: merchantId } = await params;

    // Optionally verify the merchantId matches the current merchant context
    const currentMerchantId = await getMerchantIdFromRequest();
    if (currentMerchantId && currentMerchantId !== merchantId) {
      return NextResponse.json({ error: "Unauthorized: Merchant ID mismatch" }, { status: 403 });
    }

    const fullData = await getMerchantFullDataFromSuperAdmin(merchantId);

    console.log("📊 [my-app] Complete Merchant Data Response:", JSON.stringify(fullData, null, 2));

    if (!fullData) {
      return NextResponse.json({ error: "Merchant data not found" }, { status: 404 });
    }

    return NextResponse.json(fullData);
  } catch (error: any) {
    console.error("GET /api/super-admin/merchants/[id]/full error:", error);
    return NextResponse.json({ error: error?.message || "Failed to get merchant data" }, { status: 500 });
  }
}
