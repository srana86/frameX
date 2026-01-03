import { NextRequest, NextResponse } from "next/server";
import { renewSubscriptionViaSuperAdmin, updateInvoiceViaSuperAdmin } from "@/lib/super-admin-client";

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

    const { tran_id, val_id, status, amount, value_a: merchantId, value_b: invoiceId, value_c: subscriptionId } = data;

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

    if (!tran_id || status !== "VALID") {
      return NextResponse.redirect(`${baseUrl}/merchant/billing?error=${encodeURIComponent("Payment verification failed")}`);
    }

    // Update renewal session in super-admin
    const baseAdminUrl = SUPER_ADMIN_URL.endsWith("/") ? SUPER_ADMIN_URL.slice(0, -1) : SUPER_ADMIN_URL;
    await fetch(`${baseAdminUrl}/api/payments`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tranId: tran_id,
        status: "completed",
        valId: val_id,
        completedAt: new Date().toISOString(),
      }),
    }).catch((err) => console.error("Failed to update session:", err));

    // Update invoice status via super-admin
    if (invoiceId) {
      await updateInvoiceViaSuperAdmin(invoiceId, {
        status: "paid",
        paidAt: new Date().toISOString(),
        transactionId: val_id || tran_id,
      });
    }

    // Renew subscription via super-admin
    if (subscriptionId) {
      const result = await renewSubscriptionViaSuperAdmin(subscriptionId, {
        transactionId: val_id || tran_id,
        paymentMethod: "sslcommerz",
        amount: parseFloat(amount) || 0,
      });

      if (!result.success) {
        console.error("Failed to renew subscription:", result.error);
        return NextResponse.redirect(`${baseUrl}/merchant/billing?error=${encodeURIComponent("Failed to renew subscription")}`);
      }
    }

    return NextResponse.redirect(
      `${baseUrl}/merchant/billing?success=true&message=${encodeURIComponent("Subscription renewed successfully!")}`
    );
  } catch (error: any) {
    console.error("Renewal success handler error:", error);
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    return NextResponse.redirect(`${baseUrl}/merchant/billing?error=${encodeURIComponent("An error occurred")}`);
  }
}

export async function GET(req: NextRequest) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  return NextResponse.redirect(`${baseUrl}/merchant/billing`);
}
