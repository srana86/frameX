import { NextResponse } from "next/server";
import { getSSLCommerzConfig } from "@/lib/sslcommerz-config";
import { getCollection } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { initSSLCommerzPayment } from "@/lib/sslcommerz-axios";

// Initialize Easy Checkout payment
// This endpoint can be called:
// 1. From frontend with orderId and customer data
// 2. From SSLCommerz embed script with postdata containing orderId
export async function POST(request: Request) {
  try {
    const contentType = request.headers.get("content-type");
    let body: any = {};

    // Handle form data from SSLCommerz embed script
    if (contentType?.includes("application/x-www-form-urlencoded")) {
      const formData = await request.formData();
      const postdata = formData.get("postdata");
      if (postdata) {
        try {
          const parsed = JSON.parse(postdata as string);
          body = { orderId: parsed.orderId, fromEmbed: true };
        } catch {
          body = { orderId: postdata, fromEmbed: true };
        }
      }
    } else {
      // Handle JSON from frontend
      body = await request.json();
    }

    const { orderId, customer, fromEmbed } = body;

    if (!orderId) {
      return NextResponse.json({ error: "Order ID is required" }, { status: 400 });
    }

    // If called from embed script, get customer info from order
    let customerInfo = customer;
    if (fromEmbed && !customerInfo) {
      // We'll get customer info from the order
    }

    // Get SSLCommerz configuration
    const sslConfig = await getSSLCommerzConfig();

    if (!sslConfig.enabled || !sslConfig.storeId || !sslConfig.storePassword) {
      return NextResponse.json({ error: "SSLCommerz is not configured" }, { status: 400 });
    }

    // Get order from database
    const ordersCol = await getCollection("orders");
    const order = await ordersCol.findOne({ _id: new ObjectId(orderId) });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Get customer info from order if not provided
    if (!customerInfo && order.customer) {
      customerInfo = order.customer;
    }

    if (!customerInfo) {
      return NextResponse.json({ error: "Customer information is required" }, { status: 400 });
    }

    // Check if order is already paid
    if (order.paymentStatus === "completed") {
      return NextResponse.json({ error: "Order is already paid" }, { status: 400 });
    }

    // Validate order amount (SSLCommerz requires 10.00 to 500000.00 BDT)
    if (order.total < 10 || order.total > 500000) {
      return NextResponse.json({ error: "Order amount must be between 10.00 and 500000.00 BDT" }, { status: 400 });
    }

    // Build request URL for callbacks
    const requestUrl = new URL(request.url);
    const origin = requestUrl.origin;

    const city = customerInfo.city || "";
    const postalCode = customerInfo.postalCode || "";
    const addressLine2 = customerInfo.addressLine2 || "";

    // Prepare SSLCommerz payment data for Easy Checkout
    const paymentData = {
      total_amount: parseFloat(order.total.toFixed(2)),
      currency: "BDT",
      tran_id: orderId,
      success_url: `${origin}/checkout/success`,
      fail_url: `${origin}/checkout/fail`,
      cancel_url: `${origin}/checkout/cancel`,
      ipn_url: `${origin}/api/payment/ipn`,
      shipping_method: "Courier",
      product_name: order.items
        .map((item: any) => item.name)
        .slice(0, 5)
        .join(", "),
      product_category: "General",
      product_profile: "physical-goods",
      cus_name: customerInfo.fullName,
      cus_email: customerInfo.email || "customer@example.com",
      cus_add1: customerInfo.addressLine1,
      cus_add2: addressLine2,
      cus_city: city,
      cus_state: city,
      cus_postcode: postalCode,
      cus_country: "Bangladesh",
      cus_phone: customerInfo.phone,
      cus_fax: customerInfo.phone,
      ship_name: customerInfo.fullName,
      ship_add1: customerInfo.addressLine1,
      ship_add2: addressLine2,
      ship_city: city,
      ship_state: city,
      ship_postcode: postalCode,
      ship_country: "Bangladesh",
    };

    // Initialize SSLCommerz payment using axios
    const apiResponse = await initSSLCommerzPayment(
      {
        storeId: sslConfig.storeId,
        storePassword: sslConfig.storePassword,
        isLive: sslConfig.isLive,
      },
      paymentData
    );

    if (apiResponse.GatewayPageURL) {
      // Update order with payment transaction ID
      await ordersCol.updateOne(
        { _id: new ObjectId(orderId) },
        {
          $set: {
            paymentMethod: "online",
            paymentStatus: "pending",
            paymentTransactionId: apiResponse.sessionkey || orderId,
            updatedAt: new Date().toISOString(),
          },
        }
      );

      // Return format expected by SSLCommerz embed script
      if (fromEmbed) {
        return NextResponse.json({
          status: "success",
          data: apiResponse.GatewayPageURL,
          logo: apiResponse.storeLogo || null,
        });
      }

      // Return format for frontend
      return NextResponse.json({
        success: true,
        gatewayPageURL: apiResponse.GatewayPageURL,
        sessionkey: apiResponse.sessionkey,
        storeLogo: apiResponse.storeLogo || null,
        storeBanner: apiResponse.storeBanner || null,
      });
    } else {
      return NextResponse.json({ error: "Failed to initialize payment" }, { status: 500 });
    }
  } catch (error: any) {
    console.error("Easy checkout init error:", error);
    return NextResponse.json({ error: error?.message || "Failed to initialize payment" }, { status: 500 });
  }
}
