import { NextRequest, NextResponse } from "next/server";
import { getMerchantIdForAPI } from "@/lib/api-helpers";
import { getMerchantInvoices, getPendingInvoice } from "@/lib/subscription-helpers";

export async function GET(req: NextRequest) {
  try {
    const merchantId = await getMerchantIdForAPI();
    
    if (!merchantId) {
      return NextResponse.json({ error: "Merchant not found" }, { status: 404 });
    }

    const { searchParams } = new URL(req.url);
    const pending = searchParams.get("pending") === "true";

    if (pending) {
      const invoice = await getPendingInvoice(merchantId);
      return NextResponse.json({ invoice });
    }

    const invoices = await getMerchantInvoices(merchantId);
    return NextResponse.json({ invoices });
  } catch (error: any) {
    console.error("Error fetching invoices:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch invoices" },
      { status: 500 }
    );
  }
}

