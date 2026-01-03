import { NextRequest, NextResponse } from "next/server";

// Get super-admin URL
const SUPER_ADMIN_URL = process.env.SUPER_ADMIN_URL || process.env.NEXT_PUBLIC_SUPER_ADMIN_URL || "https://framextech.com";

export async function POST(req: NextRequest) {
  try {
    // SSLCommerz sends data as form-urlencoded
    const formData = await req.formData();
    const data: Record<string, string> = {};
    formData.forEach((value, key) => {
      data[key] = value.toString();
    });

    const { tran_id, error } = data;

    // Update renewal session status in super-admin
    if (tran_id) {
      const baseAdminUrl = SUPER_ADMIN_URL.endsWith("/") ? SUPER_ADMIN_URL.slice(0, -1) : SUPER_ADMIN_URL;
      await fetch(`${baseAdminUrl}/api/payments`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tranId: tran_id,
          status: "failed",
          error: error || "Payment failed",
          failedAt: new Date().toISOString(),
        }),
      }).catch((err) => console.error("Failed to update session:", err));
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    return NextResponse.redirect(`${baseUrl}/merchant/billing?error=${encodeURIComponent(error || "Payment failed")}`);
  } catch (err: any) {
    console.error("Renewal fail handler error:", err);
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    return NextResponse.redirect(`${baseUrl}/merchant/billing?error=${encodeURIComponent("An error occurred")}`);
  }
}

export async function GET(req: NextRequest) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  return NextResponse.redirect(`${baseUrl}/merchant/billing?error=${encodeURIComponent("Payment was not completed")}`);
}
