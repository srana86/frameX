import { NextRequest, NextResponse } from "next/server";
import { getCollection } from "@/lib/mongodb";
import { initSSLCommerzPayment } from "@/lib/sslcommerz-axios";

// Helper to get SSLCommerz config from database or fallback to env
async function getSSLCommerzConfig() {
  try {
    const settingsCol = await getCollection("settings");
    const config = await settingsCol.findOne({ id: "sslcommerz_config_v1" });

    if (config && config.enabled && config.storeId && config.storePassword) {
      return {
        storeId: config.storeId,
        storePassword: config.storePassword,
        isLive: config.isLive ?? false,
        enabled: true,
      };
    }
  } catch (error) {
    console.warn("Failed to fetch SSLCommerz config from DB:", error);
  }

  // Fallback to environment variables
  const storeId = process.env.SSLCOMMERZ_STORE_ID;
  const storePassword = process.env.SSLCOMMERZ_STORE_PASSWORD;
  const isLive = process.env.SSLCOMMERZ_IS_LIVE === "true";

  if (storeId && storePassword) {
    return { storeId, storePassword, isLive, enabled: true };
  }

  return { storeId: "", storePassword: "", isLive: false, enabled: false };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      planId,
      planName,
      planPrice,
      billingCycle,
      merchantName,
      merchantEmail,
      merchantPhone,
      customSubdomain,
      customerName,
      customerEmail,
      customerPhone,
      customerAddress,
      customerCity,
      customerState,
      customerPostcode,
      customerCountry,
    } = body;

    // Validate required fields
    if (!planId || !planName || !merchantName || !merchantEmail || !customerName || !customerEmail) {
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
    }

    // Generate transaction ID
    const tranId = `TXN_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    // Store checkout session in database
    const checkoutSessionsCol = await getCollection("checkout_sessions");
    const session = {
      tranId,
      planId,
      planName,
      planPrice,
      billingCycle,
      merchantName,
      merchantEmail,
      merchantPhone,
      customSubdomain: customSubdomain || "",
      customerName,
      customerEmail,
      customerPhone,
      customerAddress,
      customerCity,
      customerState,
      customerPostcode,
      customerCountry,
      status: "pending",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await checkoutSessionsCol.insertOne(session);

    // For free plans, skip payment
    if (planPrice === 0) {
      // Update session status
      await checkoutSessionsCol.updateOne(
        { tranId },
        { $set: { status: "completed", updatedAt: new Date().toISOString() } }
      );
      return NextResponse.json({
        success: true,
        tranId,
        message: "Free plan activated",
      });
    }

    // Get SSLCommerz configuration (from DB first, then fallback to env)
    const sslConfig = await getSSLCommerzConfig();

    if (!sslConfig.enabled || !sslConfig.storeId || !sslConfig.storePassword) {
      console.error("SSLCommerz credentials not configured");
      // For demo purposes, simulate a successful response
      return NextResponse.json({
        success: true,
        tranId,
        message: "Demo mode - SSLCommerz not configured",
        // Redirect to success page directly in demo mode
        GatewayPageURL: null,
        demoMode: true,
      });
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3001";

    // Initialize SSLCommerz payment
    const paymentData = {
      total_amount: planPrice,
      currency: "BDT",
      tran_id: tranId,
      success_url: `${baseUrl}/api/checkout/success`,
      fail_url: `${baseUrl}/api/checkout/fail`,
      cancel_url: `${baseUrl}/api/checkout/cancel`,
      ipn_url: `${baseUrl}/api/checkout/ipn`,
      shipping_method: "NO",
      product_name: `${planName} Plan - ${billingCycle}`,
      product_category: "SaaS Subscription",
      product_profile: "non-physical-goods",
      cus_name: customerName,
      cus_email: customerEmail,
      cus_add1: customerAddress,
      cus_city: customerCity,
      cus_state: customerState,
      cus_postcode: customerPostcode,
      cus_country: customerCountry,
      cus_phone: customerPhone,
    };

    const response = await initSSLCommerzPayment(
      {
        storeId: sslConfig.storeId,
        storePassword: sslConfig.storePassword,
        isLive: sslConfig.isLive,
      },
      paymentData
    );

    if (response.status === "SUCCESS" && response.GatewayPageURL) {
      // Update session with SSLCommerz session key
      await checkoutSessionsCol.updateOne(
        { tranId },
        {
          $set: {
            sessionkey: response.sessionkey,
            updatedAt: new Date().toISOString(),
          },
        }
      );

      return NextResponse.json({
        success: true,
        GatewayPageURL: response.GatewayPageURL,
        sessionkey: response.sessionkey,
      });
    } else {
      console.error("SSLCommerz init failed:", response);
      return NextResponse.json(
        { message: response.faession || "Payment initialization failed" },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error("Checkout init error:", error);
    return NextResponse.json(
      { message: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

