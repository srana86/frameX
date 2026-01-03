import { NextResponse } from "next/server";
import { getCollection } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

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
 * For cancel callbacks we primarily need tran_id.
 */
async function extractCancelParams(request: Request) {
  const requestUrl = new URL(request.url);
  const origin = requestUrl.origin;
  const { searchParams } = requestUrl;

  let tran_id = searchParams.get("tran_id");

  if (!tran_id) {
    try {
      const contentType = request.headers.get("content-type") || "";

      if (contentType.includes("application/x-www-form-urlencoded") || contentType.includes("multipart/form-data")) {
        const formData = await request.formData();
        const t = formData.get("tran_id");
        tran_id = t ? String(t) : null;
      }
    } catch (err) {
      console.error("Error parsing SSLCommerz cancel form data:", err);
    }
  }

  return { origin, tran_id };
}

async function handlePaymentCancel(request: Request) {
  try {
    const { origin, tran_id } = await extractCancelParams(request);

    if (!tran_id) {
      return createRedirectResponse(`${origin}/checkout?error=payment_cancelled`);
    }

    // Find and update order
    const ordersCol = await getCollection("orders");
    let order = await ordersCol.findOne({ paymentTransactionId: tran_id });

    // If not found by transaction ID, try finding by order ID
    if (!order && ObjectId.isValid(tran_id)) {
      order = await ordersCol.findOne({ _id: new ObjectId(tran_id) });
    }

    if (order) {
      // Update order payment status to cancelled and mark order as cancelled
      await ordersCol.updateOne(
        { _id: new ObjectId(order._id) },
        {
          $set: {
            paymentStatus: "cancelled",
            status: "cancelled",
            updatedAt: new Date().toISOString(),
          },
        }
      );

      // Store cancelled payment transaction
      const paymentsCol = await getCollection("payment_transactions");
      await paymentsCol.insertOne({
        orderId: String(order._id),
        transactionId: tran_id,
        status: "CANCELLED",
        paymentMethod: "online",
        errorMessage: "Payment cancelled by user",
        createdAt: new Date().toISOString(),
      });
    }

    // Redirect to cancel page with order ID
    const orderId = order ? String(order._id) : tran_id;
    const redirectUrl = `${origin}/checkout/cancel?orderId=${orderId}`;
    console.log("Redirecting to:", redirectUrl);
    return createRedirectResponse(redirectUrl);
  } catch (error: any) {
    console.error("Payment cancel handler error:", error);
    const requestUrl = new URL(request.url);
    const origin = requestUrl.origin;
    return createRedirectResponse(`${origin}/checkout?error=payment_processing_failed`);
  }
}

export async function GET(request: Request) {
  return handlePaymentCancel(request);
}

export async function POST(request: Request) {
  return handlePaymentCancel(request);
}
