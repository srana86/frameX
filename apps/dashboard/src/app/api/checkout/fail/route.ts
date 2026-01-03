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

    const { tran_id, error } = data;

    if (tran_id) {
      // Update checkout session as failed
      const checkoutSessionsCol = await getCollection("checkout_sessions");
      await checkoutSessionsCol.updateOne(
        { tranId: tran_id },
        {
          $set: {
            status: "failed",
            error: error || "Payment failed",
            updatedAt: new Date().toISOString(),
          },
        }
      );
    }

    // Redirect to failed page
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3001";
    const reason = encodeURIComponent(error || "Payment was unsuccessful");
    return NextResponse.redirect(`${baseUrl}/checkout/failed?reason=${reason}`);
  } catch (error: any) {
    console.error("Payment fail handler error:", error);
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3001";
    return NextResponse.redirect(`${baseUrl}/checkout/failed?reason=An+error+occurred`);
  }
}

export async function GET(req: NextRequest) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3001";
  return NextResponse.redirect(`${baseUrl}/checkout/failed?reason=Payment+cancelled`);
}

