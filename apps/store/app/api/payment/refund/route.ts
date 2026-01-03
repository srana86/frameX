import { NextResponse } from "next/server";
import { getSSLCommerzConfig } from "@/lib/sslcommerz-config";
import { requireAuth } from "@/lib/auth-helpers";
import SSLCommerzPayment from "sslcommerz-lts";

// Initiate refund - Only merchants/admins can access
export async function POST(request: Request) {
  try {
    await requireAuth("merchant");

    const body = await request.json();
    const { bank_tran_id, refund_trans_id, refund_amount, refund_remarks, refe_id } = body;

    if (!bank_tran_id || !refund_trans_id || !refund_amount || !refund_remarks) {
      return NextResponse.json({ error: "bank_tran_id, refund_trans_id, refund_amount, and refund_remarks are required" }, { status: 400 });
    }

    // Get SSLCommerz configuration
    const sslConfig = await getSSLCommerzConfig();

    if (!sslConfig.enabled || !sslConfig.storeId || !sslConfig.storePassword) {
      return NextResponse.json({ error: "SSLCommerz is not configured" }, { status: 400 });
    }

    // Initiate refund
    const sslcz = new SSLCommerzPayment(sslConfig.storeId, sslConfig.storePassword, sslConfig.isLive);
    const refundData = await sslcz.initiateRefund({
      bank_tran_id,
      refund_trans_id,
      refund_amount: parseFloat(refund_amount.toString()),
      refund_remarks,
      refe_id: refe_id || "",
    });

    return NextResponse.json({
      success: refundData.status === "success",
      refundData,
    });
  } catch (error: any) {
    console.error("Refund initiation error:", error);
    return NextResponse.json({ error: error?.message || "Failed to initiate refund" }, { status: 500 });
  }
}
