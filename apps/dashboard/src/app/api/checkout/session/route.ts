import { NextRequest, NextResponse } from "next/server";
import { getCollection } from "@/lib/mongodb";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const tranId = searchParams.get("tran_id");

    if (!tranId) {
      return NextResponse.json({ message: "Transaction ID required" }, { status: 400 });
    }

    const checkoutSessionsCol = await getCollection("checkout_sessions");
    const session = await checkoutSessionsCol.findOne({ tranId });

    if (!session) {
      return NextResponse.json({ message: "Session not found" }, { status: 404 });
    }

    // Don't expose sensitive payment details
    const { paymentDetails, ...safeSession } = session as any;

    return NextResponse.json({
      ...safeSession,
      hasPaymentDetails: !!paymentDetails,
    });
  } catch (error: any) {
    console.error("Get session error:", error);
    return NextResponse.json(
      { message: error.message || "Failed to get session" },
      { status: 500 }
    );
  }
}

