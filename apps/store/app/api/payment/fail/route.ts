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
 * For fail callbacks we primarily need tran_id.
 */
async function extractFailParams(request: Request) {
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
      console.error("Error parsing SSLCommerz fail form data:", err);
    }
  }

  return { origin, tran_id };
}

async function handlePaymentFail(request: Request) {
  try {
    const { origin, tran_id } = await extractFailParams(request);

    if (!tran_id) {
      return createRedirectResponse(`${origin}/checkout?error=payment_failed`);
    }

    // Find and update order
    const ordersCol = await getCollection("orders");
    let order = await ordersCol.findOne({ paymentTransactionId: tran_id });

    // If not found by transaction ID, try finding by order ID
    if (!order && ObjectId.isValid(tran_id)) {
      order = await ordersCol.findOne({ _id: new ObjectId(tran_id) });
    }

    if (order) {
      // Only update if payment status is not already completed (to avoid overwriting successful payments)
      // This prevents race conditions where IPN might have already marked it as completed
      if (order.paymentStatus !== "completed") {
        // Update order payment status to failed and mark order as cancelled
        await ordersCol.updateOne(
          { _id: new ObjectId(order._id) },
          {
            $set: {
              paymentStatus: "failed",
              status: "cancelled",
              paidAmount: 0, // Reset paid amount on failure
              updatedAt: new Date().toISOString(),
            },
          }
        );

        // Store failed payment transaction (check if already exists to avoid duplicates)
        const paymentsCol = await getCollection("payment_transactions");
        const existingPayment = await paymentsCol.findOne({
          orderId: String(order._id),
          transactionId: tran_id,
          status: "FAILED",
        });

        if (!existingPayment) {
          await paymentsCol.insertOne({
            orderId: String(order._id),
            transactionId: tran_id,
            status: "FAILED",
            paymentMethod: "online",
            errorMessage: "Payment failed",
            createdAt: new Date().toISOString(),
          });
        }
      } else {
        // Payment was already completed, redirect to success page instead
        return createRedirectResponse(`${origin}/checkout/success?orderId=${order._id}&payment=online`);
      }
    }

    // Redirect to fail page with order ID
    const orderId = order ? String(order._id) : tran_id;
    const redirectUrl = `${origin}/checkout/fail?orderId=${orderId}`;
    console.log("Redirecting to:", redirectUrl);
    return createRedirectResponse(redirectUrl);
  } catch (error: any) {
    console.error("Payment fail handler error:", error);
    const requestUrl = new URL(request.url);
    const origin = requestUrl.origin;
    return createRedirectResponse(`${origin}/checkout?error=payment_processing_failed`);
  }
}

export async function GET(request: Request) {
  return handlePaymentFail(request);
}

export async function POST(request: Request) {
  return handlePaymentFail(request);
}
