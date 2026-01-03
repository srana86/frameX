import { NextRequest, NextResponse } from "next/server";
import { getCollection } from "@/lib/mongodb";

export async function POST(req: NextRequest) {
  try {
    // SSLCommerz sends data as form-urlencoded
    const formData = await req.formData();
    const data: Record<string, string> = {};
    formData.forEach((value, key) => {
      data[key] = value.toString();
    });

    const { tran_id, val_id, status, amount, currency, bank_tran_id, card_type } = data;

    if (!tran_id || status !== "VALID") {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3001";
      return NextResponse.redirect(
        `${baseUrl}/checkout/failed?reason=${encodeURIComponent("Payment verification failed")}`
      );
    }

    // Update checkout session
    const checkoutSessionsCol = await getCollection("checkout_sessions");
    const session = await checkoutSessionsCol.findOne({ tranId: tran_id });

    if (!session) {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3001";
      return NextResponse.redirect(
        `${baseUrl}/checkout/failed?reason=${encodeURIComponent("Session not found")}`
      );
    }

    // Update session with payment details
    await checkoutSessionsCol.updateOne(
      { tranId: tran_id },
      {
        $set: {
          status: "completed",
          paymentDetails: {
            val_id,
            amount,
            currency,
            bank_tran_id,
            card_type,
            verified_at: new Date().toISOString(),
          },
          updatedAt: new Date().toISOString(),
        },
      }
    );

    // Redirect to success page with transaction ID
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3001";
    return NextResponse.redirect(`${baseUrl}/checkout/success?tran_id=${tran_id}`);
  } catch (error: any) {
    console.error("Payment success handler error:", error);
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3001";
    return NextResponse.redirect(
      `${baseUrl}/checkout/failed?reason=${encodeURIComponent("An error occurred processing your payment")}`
    );
  }
}

export async function GET(req: NextRequest) {
  // Handle GET request (for testing or direct navigation)
  const { searchParams } = new URL(req.url);
  const tran_id = searchParams.get("tran_id");
  
  if (!tran_id) {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3001";
    return NextResponse.redirect(`${baseUrl}/checkout/failed?reason=Missing transaction ID`);
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3001";
  return NextResponse.redirect(`${baseUrl}/checkout/success?tran_id=${tran_id}`);
}

