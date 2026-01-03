import { NextResponse } from "next/server";
import { getSSLCommerzConfig } from "@/lib/sslcommerz-config";
import { requireAuth } from "@/lib/auth-helpers";
import SSLCommerzPayment from "sslcommerz-lts";

// Query refund status - Only merchants/admins can access
export async function GET(request: Request) {
  try {
    await requireAuth("merchant");

    const { searchParams } = new URL(request.url);
    const refund_ref_id = searchParams.get("refund_ref_id");

    if (!refund_ref_id) {
      return NextResponse.json({ error: "refund_ref_id is required" }, { status: 400 });
    }

    // Get SSLCommerz configuration
    const sslConfig = await getSSLCommerzConfig();

    if (!sslConfig.enabled || !sslConfig.storeId || !sslConfig.storePassword) {
      return NextResponse.json({ error: "SSLCommerz is not configured" }, { status: 400 });
    }

    // Query refund status
    const sslcz = new SSLCommerzPayment(sslConfig.storeId, sslConfig.storePassword, sslConfig.isLive);
    const refundData = await sslcz.refundQuery({
      refund_ref_id,
    });

    return NextResponse.json({
      success: true,
      refundData,
    });
  } catch (error: any) {
    console.error("Refund query error:", error);
    return NextResponse.json({ error: error?.message || "Failed to query refund status" }, { status: 500 });
  }
}

