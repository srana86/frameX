import { NextResponse } from "next/server";
import { getSSLCommerzConfig } from "@/lib/sslcommerz-config";
import { getCollection } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { validateSSLCommerzPayment } from "@/lib/sslcommerz-axios";

// Helper function to handle redirect
function createRedirectResponse(redirectUrl: string) {
  return new NextResponse(
    `<!DOCTYPE html>
<html>
<head>
  <meta http-equiv="refresh" content="0;url=${redirectUrl}">
  <script>window.location.href = "${redirectUrl}";</script>
</head>
<body>
  <p>Redirecting... <a href="${redirectUrl}">Click here if you are not redirected</a></p>
</body>
</html>`,
    {
      status: 200,
      headers: {
        "Content-Type": "text/html",
      },
    }
  );
}

/**
 * Extract SSLCommerz callback params from either query string or POST form body.
 * SSLCommerz typically sends POST form-data on success, but we support both.
 */
async function extractSuccessParams(request: Request) {
  const requestUrl = new URL(request.url);
  const origin = requestUrl.origin;
  const { searchParams } = requestUrl;

  let val_id = searchParams.get("val_id");
  let tran_id = searchParams.get("tran_id");

  // If params are not present in query, try reading from form data (POST callback)
  if (!val_id || !tran_id) {
    try {
      const contentType = request.headers.get("content-type") || "";

      if (contentType.includes("application/x-www-form-urlencoded") || contentType.includes("multipart/form-data")) {
        const formData = await request.formData();
        if (!val_id) {
          const v = formData.get("val_id");
          val_id = v ? String(v) : null;
        }
        if (!tran_id) {
          const t = formData.get("tran_id");
          tran_id = t ? String(t) : null;
        }
      }
    } catch (err) {
      console.error("Error parsing SSLCommerz success form data:", err);
    }
  }

  return { origin, val_id, tran_id };
}

async function handlePaymentSuccess(request: Request) {
  try {
    const { origin, val_id, tran_id } = await extractSuccessParams(request);

    if (!val_id || !tran_id) {
      return createRedirectResponse(`${origin}/checkout?error=payment_validation_failed`);
    }

    // Get SSLCommerz configuration
    const sslConfig = await getSSLCommerzConfig();

    if (!sslConfig.enabled || !sslConfig.storeId || !sslConfig.storePassword) {
      return createRedirectResponse(`${origin}/checkout?error=payment_not_configured`);
    }

    // Find order first
    const ordersCol = await getCollection("orders");
    let order = await ordersCol.findOne({ paymentTransactionId: tran_id });

    // If not found by transaction ID, try finding by order ID
    if (!order && ObjectId.isValid(tran_id)) {
      order = await ordersCol.findOne({ _id: new ObjectId(tran_id) });
    }

    if (!order) {
      return createRedirectResponse(`${origin}/checkout?error=order_not_found`);
    }

    // Validate payment with SSLCommerz using axios (Security: Always validate)
    const validationData = await validateSSLCommerzPayment(
      {
        storeId: sslConfig.storeId,
        storePassword: sslConfig.storePassword,
        isLive: sslConfig.isLive,
      },
      val_id
    );

    // Security checks
    if (validationData.status !== "VALID" && validationData.status !== "VALIDATED") {
      console.error("Payment validation failed", { val_id, status: validationData.status, tran_id });
      return createRedirectResponse(`${origin}/checkout?error=payment_validation_failed&orderId=${tran_id}`);
    }

    // Validate amount matches order amount
    const orderAmount = parseFloat(order.total.toString());
    const validatedAmount = parseFloat(validationData.amount || "0");

    if (Math.abs(orderAmount - validatedAmount) > orderAmount * 0.01) {
      console.error("Amount mismatch", { orderAmount, validatedAmount, tran_id });
      return createRedirectResponse(`${origin}/checkout?error=amount_mismatch&orderId=${tran_id}`);
    }

    // Validate transaction ID matches
    if (validationData.tran_id !== tran_id && validationData.tran_id !== String(order._id)) {
      console.error("Transaction ID mismatch", {
        received: tran_id,
        validated: validationData.tran_id,
        orderId: String(order._id),
      });
      return createRedirectResponse(`${origin}/checkout?error=transaction_mismatch&orderId=${tran_id}`);
    }

    // Check if already processed (avoid duplicate processing)
    if (order.paymentStatus === "completed") {
      // Already processed, just redirect to success
      return createRedirectResponse(`${origin}/checkout/success?orderId=${order._id}&payment=online`);
    }

    // Calculate paid amount (should match order total for completed payments)
    // validatedAmount is already defined above, use it
    const paidAmount = validatedAmount;

    // Update order payment status to completed
    await ordersCol.updateOne(
      { _id: new ObjectId(order._id) },
      {
        $set: {
          paymentStatus: "completed",
          paidAmount: paidAmount,
          paymentValId: val_id,
          status: "processing", // Update order status to processing when payment is completed
          updatedAt: new Date().toISOString(),
        },
      }
    );

    // Store payment transaction (check if already exists to avoid duplicates)
    const paymentsCol = await getCollection("payment_transactions");
    const existingPayment = await paymentsCol.findOne({
      orderId: String(order._id),
      valId: val_id,
    });

    if (!existingPayment) {
      await paymentsCol.insertOne({
        orderId: String(order._id),
        transactionId: tran_id,
        valId: val_id,
        amount: validatedAmount,
        currency: validationData.currency || "BDT",
        storeAmount: validationData.store_amount ? parseFloat(validationData.store_amount) : null,
        status: validationData.status,
        paymentMethod: "online",
        bankTranId: validationData.bank_tran_id,
        cardType: validationData.card_type,
        cardNo: validationData.card_no,
        cardIssuer: validationData.card_issuer,
        cardBrand: validationData.card_brand,
        riskLevel: validationData.risk_level ? parseInt(validationData.risk_level) : null,
        riskTitle: validationData.risk_title,
        sslcommerzResponse: validationData,
        createdAt: new Date().toISOString(),
      });
    }

    // Send server-side purchase tracking event
    try {
      const { trackPurchase } = await import("@/lib/tracking/server-side-tracking");
      await trackPurchase({
        orderId: String(order._id),
        value: order.total,
        // Currency will be fetched from brand config automatically
        contentIds: order.items?.map((item: any) => item.productId || String(item._id)) || [],
        numItems: order.items?.reduce((sum: number, item: any) => sum + (item.quantity || 1), 0) || 0,
        userData: order.customer
          ? {
              email: order.customer.email,
              phone: order.customer.phone,
              firstName: order.customer.fullName?.split(" ")[0],
              lastName: order.customer.fullName?.split(" ").slice(1).join(" "),
              city: order.customer.city,
              zipCode: order.customer.postalCode,
            }
          : undefined,
      });
    } catch (error) {
      // Fail silently - tracking should not block payment processing
      console.error("Failed to send server-side purchase tracking:", error);
    }

    // Send payment confirmation email
    try {
      const { sendEmailEvent } = await import("@/lib/email-service");
      if (order.customer?.email) {
        await sendEmailEvent({
          event: "payment_confirmation",
          to: order.customer.email,
          variables: {
            orderId: String(order._id),
            orderTotal: order.total,
            paymentMethod: "online",
            paymentDate: new Date().toISOString(),
            customerName: order.customer?.fullName || "Customer",
          },
        });
      }
    } catch (emailError) {
      console.error("Failed to send payment confirmation email:", emailError);
    }

    // Redirect to success page
    const redirectUrl = `${origin}/checkout/success?orderId=${order._id}&payment=online`;
    console.log("Redirecting to:", redirectUrl);
    return createRedirectResponse(redirectUrl);
  } catch (error: any) {
    console.error("Payment success handler error:", error);
    const requestUrl = new URL(request.url);
    const origin = requestUrl.origin;
    return createRedirectResponse(`${origin}/checkout?error=payment_processing_failed`);
  }
}

export async function GET(request: Request) {
  return handlePaymentSuccess(request);
}

export async function POST(request: Request) {
  return handlePaymentSuccess(request);
}
