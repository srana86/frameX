import { NextResponse } from "next/server";
import { getSSLCommerzConfig } from "@/lib/sslcommerz-config";
import { getCollection } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import SSLCommerzPayment from "sslcommerz-lts";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { val_id } = body;

    if (!val_id) {
      return NextResponse.json({ error: "Validation ID is required" }, { status: 400 });
    }

    // Get SSLCommerz configuration
    const sslConfig = await getSSLCommerzConfig();

    if (!sslConfig.enabled || !sslConfig.storeId || !sslConfig.storePassword) {
      return NextResponse.json({ error: "SSLCommerz is not configured" }, { status: 400 });
    }

    // Validate payment with SSLCommerz
    const sslcz = new SSLCommerzPayment(sslConfig.storeId, sslConfig.storePassword, sslConfig.isLive);
    const validationData = await sslcz.validate({ val_id });

    // Find order by transaction ID or order ID
    const ordersCol = await getCollection("orders");
    let order = await ordersCol.findOne({ paymentTransactionId: validationData.tran_id });

    // If not found by transaction ID, try finding by order ID (tran_id might be order ID)
    if (!order && ObjectId.isValid(validationData.tran_id)) {
      order = await ordersCol.findOne({ _id: new ObjectId(validationData.tran_id) });
    }

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Update order payment status and order status
    const paymentStatus = validationData.status === "VALID" ? "completed" : "failed";
    const orderStatus = paymentStatus === "completed" ? "processing" : "cancelled";

    await ordersCol.updateOne(
      { _id: new ObjectId(order._id) },
      {
        $set: {
          paymentStatus,
          paymentValId: val_id,
          status: orderStatus,
          updatedAt: new Date().toISOString(),
        },
      }
    );

    // Store payment transaction
    const paymentsCol = await getCollection("payment_transactions");
    await paymentsCol.insertOne({
      orderId: String(order._id),
      transactionId: validationData.tran_id,
      valId: val_id,
      amount: validationData.amount,
      currency: validationData.currency,
      status: validationData.status,
      paymentMethod: "online",
      bankTranId: validationData.bank_tran_id,
      cardType: validationData.card_type,
      cardNo: validationData.card_no,
      cardIssuer: validationData.card_issuer,
      cardBrand: validationData.card_brand,
      sslcommerzResponse: validationData,
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      validation: validationData,
      orderId: String(order._id),
      paymentStatus,
    });
  } catch (error: any) {
    console.error("Payment validation error:", error);
    return NextResponse.json({ error: error?.message || "Failed to validate payment" }, { status: 500 });
  }
}
