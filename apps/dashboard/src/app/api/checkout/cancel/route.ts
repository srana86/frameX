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

    const { tran_id } = data;

    if (tran_id) {
      // Update checkout session as cancelled
      const checkoutSessionsCol = await getCollection("checkout_sessions");
      await checkoutSessionsCol.updateOne(
        { tranId: tran_id },
        {
          $set: {
            status: "cancelled",
            updatedAt: new Date().toISOString(),
          },
        }
      );
    }

    // Redirect to checkout page with cancel message
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3001";
    return NextResponse.redirect(`${baseUrl}/checkout/failed?reason=Payment+was+cancelled`);
  } catch (error: any) {
    console.error("Payment cancel handler error:", error);
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3001";
    return NextResponse.redirect(`${baseUrl}/checkout/failed?reason=An+error+occurred`);
  }
}

export async function GET(req: NextRequest) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3001";
  return NextResponse.redirect(`${baseUrl}/checkout/failed?reason=Payment+cancelled`);
}

