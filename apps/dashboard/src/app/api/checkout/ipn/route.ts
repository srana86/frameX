import { NextRequest, NextResponse } from "next/server";
import { getCollection } from "@/lib/mongodb";
import { validateSSLCommerzPayment } from "@/lib/sslcommerz-axios";

// IPN (Instant Payment Notification) handler
// This is called by SSLCommerz server-to-server for payment confirmation
export async function POST(req: NextRequest) {
  try {
    // SSLCommerz sends data as form-urlencoded
    const formData = await req.formData();
    const data: Record<string, string> = {};
    formData.forEach((value, key) => {
      data[key] = value.toString();
    });

    const { tran_id, val_id, status, amount } = data;

    console.log("IPN received:", { tran_id, val_id, status, amount });

    if (!tran_id || !val_id) {
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
    }

    // Get checkout session
    const checkoutSessionsCol = await getCollection("checkout_sessions");
    const session = await checkoutSessionsCol.findOne({ tranId: tran_id });

    if (!session) {
      return NextResponse.json({ message: "Session not found" }, { status: 404 });
    }

    // Validate payment with SSLCommerz
    const storeId = process.env.SSLCOMMERZ_STORE_ID;
    const storePassword = process.env.SSLCOMMERZ_STORE_PASSWORD;
    const isLive = process.env.SSLCOMMERZ_IS_LIVE === "true";

    if (!storeId || !storePassword) {
      console.warn("SSLCommerz credentials not configured, skipping validation");
      // In demo mode, trust the IPN data
      if (status === "VALID" || status === "VALIDATED") {
        await checkoutSessionsCol.updateOne(
          { tranId: tran_id },
          {
            $set: {
              status: "completed",
              ipnVerified: true,
              paymentDetails: {
                val_id,
                amount,
                verified_at: new Date().toISOString(),
              },
              updatedAt: new Date().toISOString(),
            },
          }
        );
      }
      return NextResponse.json({ message: "IPN processed (demo mode)" });
    }

    // Validate the payment
    const validation = await validateSSLCommerzPayment({ storeId, storePassword, isLive }, val_id);

    if (validation.status === "VALID" || validation.status === "VALIDATED") {
      // Update session with verified payment details
      await checkoutSessionsCol.updateOne(
        { tranId: tran_id },
        {
          $set: {
            status: "completed",
            ipnVerified: true,
            paymentDetails: {
              val_id,
              amount: validation.amount,
              currency: validation.currency,
              card_type: validation.card_type,
              bank_tran_id: validation.bank_tran_id,
              risk_level: validation.risk_level,
              risk_title: validation.risk_title,
              verified_at: new Date().toISOString(),
            },
            updatedAt: new Date().toISOString(),
          },
        }
      );

      return NextResponse.json({ message: "IPN verified successfully" });
    } else {
      // Mark as failed
      await checkoutSessionsCol.updateOne(
        { tranId: tran_id },
        {
          $set: {
            status: "failed",
            error: "Payment validation failed",
            updatedAt: new Date().toISOString(),
          },
        }
      );

      return NextResponse.json({ message: "Payment validation failed" }, { status: 400 });
    }
  } catch (error: any) {
    console.error("IPN handler error:", error);
    return NextResponse.json({ message: error.message || "IPN processing failed" }, { status: 500 });
  }
}

