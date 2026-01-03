import { NextResponse } from "next/server";
import { getSSLCommerzConfig } from "@/lib/sslcommerz-config";
import { requireAuth } from "@/lib/auth-helpers";
import SSLCommerzPayment from "sslcommerz-lts";

// Query transaction by session ID or transaction ID - Only merchants/admins can access
export async function GET(request: Request) {
  try {
    await requireAuth("merchant");

    const { searchParams } = new URL(request.url);
    const sessionkey = searchParams.get("sessionkey");
    const tran_id = searchParams.get("tran_id");

    if (!sessionkey && !tran_id) {
      return NextResponse.json({ error: "Either sessionkey or tran_id is required" }, { status: 400 });
    }

    // Get SSLCommerz configuration
    const sslConfig = await getSSLCommerzConfig();

    if (!sslConfig.enabled || !sslConfig.storeId || !sslConfig.storePassword) {
      return NextResponse.json({ error: "SSLCommerz is not configured" }, { status: 400 });
    }

    const sslcz = new SSLCommerzPayment(sslConfig.storeId, sslConfig.storePassword, sslConfig.isLive);

    let transactionData;
    if (sessionkey) {
      // Query by session ID
      transactionData = await sslcz.transactionQueryBySessionId({ sessionkey });
    } else {
      // Query by transaction ID
      transactionData = await sslcz.transactionQueryByTransactionId({ tran_id: tran_id! });
    }

    return NextResponse.json({
      success: true,
      transactionData,
    });
  } catch (error: any) {
    console.error("Transaction query error:", error);
    return NextResponse.json({ error: error?.message || "Failed to query transaction" }, { status: 500 });
  }
}
