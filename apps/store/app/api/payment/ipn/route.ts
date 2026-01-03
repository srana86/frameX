import { NextResponse } from "next/server";
import { getSSLCommerzConfig } from "@/lib/sslcommerz-config";
import { getCollection } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { validateSSLCommerzPayment } from "@/lib/sslcommerz-axios";

// IPN (Instant Payment Notification) - Called by SSLCommerz server
// According to SSLCommerz docs, IPN sends POST form data
export async function POST(request: Request) {
  try {
    const formData = await request.formData();

    // Extract all IPN parameters
    const status = formData.get("status") as string;
    const tran_id = formData.get("tran_id") as string;
    const val_id = formData.get("val_id") as string;
    const amount = formData.get("amount") as string;
    const store_amount = formData.get("store_amount") as string;
    const currency = formData.get("currency") as string;
    const currency_type = formData.get("currency_type") as string;
    const currency_amount = formData.get("currency_amount") as string;
    const bank_tran_id = formData.get("bank_tran_id") as string;
    const card_type = formData.get("card_type") as string;
    const card_no = formData.get("card_no") as string;
    const card_issuer = formData.get("card_issuer") as string;
    const card_brand = formData.get("card_brand") as string;
    const tran_date = formData.get("tran_date") as string;
    const risk_level = formData.get("risk_level") as string;
    const risk_title = formData.get("risk_title") as string;

    if (!tran_id || !status) {
      return new Response("Missing required parameters", { status: 400 });
    }

    // Get SSLCommerz configuration
    const sslConfig = await getSSLCommerzConfig();

    if (!sslConfig.enabled || !sslConfig.storeId || !sslConfig.storePassword) {
      return new Response("SSLCommerz not configured", { status: 400 });
    }

    // Find order by transaction ID
    const ordersCol = await getCollection("orders");
    let order = await ordersCol.findOne({ paymentTransactionId: tran_id });

    // If not found by transaction ID, try finding by order ID
    if (!order && ObjectId.isValid(tran_id)) {
      order = await ordersCol.findOne({ _id: new ObjectId(tran_id) });
    }

    if (!order) {
      console.error("IPN: Order not found for tran_id:", tran_id);
      return new Response("Order not found", { status: 404 });
    }

    // Security: Validate amount matches order amount
    const orderAmount = parseFloat(order.total.toString());
    const receivedAmount = parseFloat(amount || "0");

    // Allow small difference due to currency conversion (within 1%)
    if (Math.abs(orderAmount - receivedAmount) > orderAmount * 0.01 && status === "VALID") {
      console.error("IPN: Amount mismatch", { orderAmount, receivedAmount, tran_id });
      // Still process but log the issue
    }

    // Validate payment with SSLCommerz if val_id is provided
    let validationData: any = null;
    if (val_id && status === "VALID") {
      try {
        validationData = await validateSSLCommerzPayment(
          {
            storeId: sslConfig.storeId,
            storePassword: sslConfig.storePassword,
            isLive: sslConfig.isLive,
          },
          val_id
        );

        // Double-check validation status
        if (validationData.status !== "VALID" && validationData.status !== "VALIDATED") {
          console.error("IPN: Validation failed", { val_id, status: validationData.status });
          // Don't update order if validation fails
          return new Response("Validation failed", { status: 400 });
        }
      } catch (error) {
        console.error("IPN: Validation API error", error);
        // Continue with IPN data if validation API fails
      }
    }

    // Determine payment status based on IPN status
    let paymentStatus: "completed" | "failed" | "cancelled" | "pending" = "pending";
    let orderStatus = order.status;
    let paidAmount = order.paidAmount || 0;

    if (status === "VALID") {
      paymentStatus = "completed";
      orderStatus = "processing"; // Update order to processing when payment is completed
      // Set paid amount to the validated amount or order total
      paidAmount = validationData
        ? parseFloat(validationData.amount || order.total.toString())
        : parseFloat(amount || order.total.toString());
    } else if (status === "FAILED") {
      paymentStatus = "failed";
      paidAmount = 0; // Reset paid amount on failure
      orderStatus = "cancelled";
    } else if (status === "CANCELLED") {
      paymentStatus = "cancelled";
      paidAmount = 0; // Reset paid amount on cancellation
      orderStatus = "cancelled";
    } else if (status === "UNATTEMPTED" || status === "EXPIRED") {
      paymentStatus = "failed";
      paidAmount = 0; // Reset paid amount on failure
      orderStatus = "cancelled";
    }

    // Only update if payment status is not already completed (to avoid race conditions)
    // But if IPN says VALID, we should update even if it was already completed (re-validation)
    const shouldUpdate = status === "VALID" || order.paymentStatus !== "completed";

    if (shouldUpdate) {
      // Update order
      await ordersCol.updateOne(
        { _id: new ObjectId(order._id) },
        {
          $set: {
            paymentStatus,
            paidAmount,
            status: orderStatus,
            paymentValId: val_id || order.paymentValId,
            updatedAt: new Date().toISOString(),
          },
        }
      );
    }

    // Store payment transaction (use validation data if available, otherwise use IPN data)
    const paymentsCol = await getCollection("payment_transactions");
    const paymentData = validationData || {
      amount: amount || order.total,
      currency: currency || "BDT",
      bank_tran_id,
      card_type,
      card_no,
      card_issuer,
      card_brand,
      status,
    };

    await paymentsCol.insertOne({
      orderId: String(order._id),
      transactionId: tran_id,
      valId: val_id || null,
      amount: parseFloat(paymentData.amount || order.total.toString()),
      currency: paymentData.currency || currency || "BDT",
      storeAmount: store_amount ? parseFloat(store_amount) : null,
      status: status,
      paymentMethod: "online",
      bankTranId: paymentData.bank_tran_id || bank_tran_id,
      cardType: paymentData.card_type || card_type,
      cardNo: paymentData.card_no || card_no,
      cardIssuer: paymentData.card_issuer || card_issuer,
      cardBrand: paymentData.card_brand || card_brand,
      currencyType: currency_type,
      currencyAmount: currency_amount ? parseFloat(currency_amount) : null,
      tranDate: tran_date,
      riskLevel: risk_level ? parseInt(risk_level) : null,
      riskTitle: risk_title,
      sslcommerzResponse: validationData || {
        status,
        tran_id,
        val_id,
        amount,
        currency,
        bank_tran_id,
        card_type,
        card_no,
        card_issuer,
        card_brand,
      },
      createdAt: new Date().toISOString(),
    });

    // Return simple success response (SSLCommerz expects plain text response)
    return new Response("IPN received successfully", { status: 200 });
  } catch (error: any) {
    console.error("IPN handler error:", error);
    return new Response("IPN processing failed", { status: 500 });
  }
}
