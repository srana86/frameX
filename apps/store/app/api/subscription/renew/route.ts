import { NextRequest, NextResponse } from "next/server";
import { getMerchantIdForAPI } from "@/lib/api-helpers";
import { getMerchantSubscription, getSubscriptionPlan, createRenewalInvoice } from "@/lib/subscription-helpers";
import { getInvoicesFromSuperAdmin, createInvoiceViaSuperAdmin } from "@/lib/super-admin-client";
import { initSSLCommerzPayment } from "@/lib/sslcommerz-axios";
import { getSSLCommerzConfig } from "@/lib/sslcommerz-config";

// Get super-admin URL for storing sessions
const SUPER_ADMIN_URL = process.env.SUPER_ADMIN_URL || process.env.NEXT_PUBLIC_SUPER_ADMIN_URL || "https://framextech.com";

export async function POST(req: NextRequest) {
  try {
    const merchantId = await getMerchantIdForAPI();

    if (!merchantId) {
      return NextResponse.json({ error: "Merchant not found" }, { status: 404 });
    }

    const body = await req.json();
    const {
      invoiceId,
      customerName,
      customerEmail,
      customerPhone,
      customerAddress,
      customerCity,
      customerState,
      customerPostcode,
      customerCountry,
    } = body;

    // Get subscription from super-admin
    const subscription = await getMerchantSubscription(merchantId);
    if (!subscription) {
      return NextResponse.json({ error: "No subscription found" }, { status: 404 });
    }

    // Get or create invoice from super-admin
    let invoice: any;
    if (invoiceId) {
      // Fetch existing invoice from super-admin
      const invoices = await getInvoicesFromSuperAdmin(merchantId, "pending");
      invoice = invoices.find((inv) => inv.id === invoiceId);
    } else {
      // Try to get pending invoice or create new one
      const pendingInvoices = await getInvoicesFromSuperAdmin(merchantId, "pending");
      if (pendingInvoices.length > 0) {
        invoice = pendingInvoices[0];
      } else {
        // Create invoice via subscription-helpers (which uses super-admin)
        invoice = await createRenewalInvoice(merchantId, subscription);
      }
    }

    if (!invoice) {
      return NextResponse.json({ error: "Failed to get or create invoice" }, { status: 500 });
    }

    // Get plan from super-admin
    const plan = await getSubscriptionPlan(subscription.planId);
    if (!plan) {
      return NextResponse.json({ error: "Plan not found" }, { status: 404 });
    }

    // Get SSLCommerz config
    const sslConfig = await getSSLCommerzConfig();

    if (!sslConfig.enabled || !sslConfig.storeId || !sslConfig.storePassword) {
      // Demo mode - return success directly
      return NextResponse.json({
        success: true,
        demoMode: true,
        invoice,
        message: "Payment gateway not configured. Demo mode active.",
      });
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    const tranId = `RENEW_${invoice.id}_${Date.now()}`;

    // Initialize SSLCommerz payment
    const paymentData = {
      total_amount: invoice.amount,
      currency: "BDT",
      tran_id: tranId,
      success_url: `${baseUrl}/api/subscription/renew/success`,
      fail_url: `${baseUrl}/api/subscription/renew/fail`,
      cancel_url: `${baseUrl}/api/subscription/renew/cancel`,
      ipn_url: `${baseUrl}/api/subscription/renew/ipn`,
      shipping_method: "NO",
      product_name: `${plan.name} Plan Renewal`,
      product_category: "SaaS Subscription",
      product_profile: "non-physical-goods",
      cus_name: customerName || "Merchant",
      cus_email: customerEmail || merchantId,
      cus_add1: customerAddress || "N/A",
      cus_city: customerCity || "Dhaka",
      cus_state: customerState || "Dhaka",
      cus_postcode: customerPostcode || "1000",
      cus_country: customerCountry || "Bangladesh",
      cus_phone: customerPhone || "01XXXXXXXXX",
      value_a: merchantId,
      value_b: invoice.id,
      value_c: subscription.id,
    };

    const response = await initSSLCommerzPayment(
      {
        storeId: sslConfig.storeId!,
        storePassword: sslConfig.storePassword!,
        isLive: sslConfig.isLive,
      },
      paymentData
    );

    if (response.status === "SUCCESS" && response.GatewayPageURL) {
      // Store payment session in super-admin via payments API
      const baseAdminUrl = SUPER_ADMIN_URL.endsWith("/") ? SUPER_ADMIN_URL.slice(0, -1) : SUPER_ADMIN_URL;
      await fetch(`${baseAdminUrl}/api/payments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "renewal_session",
          tranId,
          merchantId,
          invoiceId: invoice.id,
          subscriptionId: subscription.id,
          sessionkey: response.sessionkey,
          status: "pending",
          amount: invoice.amount,
          currency: "BDT",
        }),
      }).catch((err) => console.error("Failed to store renewal session:", err));

      return NextResponse.json({
        success: true,
        GatewayPageURL: response.GatewayPageURL,
        sessionkey: response.sessionkey,
      });
    }

    return NextResponse.json({ error: response.faession || "Payment initialization failed" }, { status: 400 });
  } catch (error: any) {
    console.error("Error initiating renewal:", error);
    return NextResponse.json({ error: error.message || "Failed to initiate renewal" }, { status: 500 });
  }
}
