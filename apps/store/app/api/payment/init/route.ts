import { NextResponse } from "next/server";
import { getSSLCommerzConfig } from "@/lib/sslcommerz-config";
import { getCollection } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { initSSLCommerzPayment } from "@/lib/sslcommerz-axios";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { orderId, customer } = body;

    if (!orderId || !customer) {
      return NextResponse.json({ error: "Order ID and customer information are required" }, { status: 400 });
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

    // Check if order is already paid
    if (order.paymentStatus === "completed") {
      return NextResponse.json({ error: "Order is already paid" }, { status: 400 });
    }

    // Build request URL for callbacks
    const requestUrl = new URL(request.url);
    const origin = requestUrl.origin;

    // Validate order amount (SSLCommerz requires 10.00 to 500000.00 BDT)
    if (order.total < 10 || order.total > 500000) {
      return NextResponse.json({ error: "Order amount must be between 10.00 and 500000.00 BDT" }, { status: 400 });
    }

    const city = customer.city || "";
    const postalCode = customer.postalCode || "";
    const addressLine2 = customer.addressLine2 || "";

    // Prepare SSLCommerz payment data according to official documentation
    const paymentData = {
      total_amount: parseFloat(order.total.toFixed(2)), // Ensure 2 decimal places
      currency: "BDT", // Default to BDT, can be made configurable
      tran_id: orderId, // Use order ID as transaction ID (must be unique)
      success_url: `${origin}/api/payment/success`,
      fail_url: `${origin}/api/payment/fail`,
      cancel_url: `${origin}/api/payment/cancel`,
      ipn_url: `${origin}/api/payment/ipn`, // Important for server-to-server notification
      shipping_method: "Courier",
      product_name: order.items
        .map((item: any) => item.name)
        .slice(0, 5)
        .join(", "), // Limit length
      product_category: "General",
      product_profile: "physical-goods", // According to docs: general, physical-goods, non-physical-goods
      cus_name: customer.fullName,
      cus_email: customer.email || "customer@example.com",
      cus_add1: customer.addressLine1,
      cus_add2: addressLine2,
      cus_city: city,
      cus_state: city, // Using city as state if not available
      cus_postcode: postalCode,
      cus_country: "Bangladesh", // Default to Bangladesh, can be made configurable
      cus_phone: customer.phone,
      cus_fax: customer.phone,
      ship_name: customer.fullName,
      ship_add1: customer.addressLine1,
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

      return NextResponse.json({
        success: true,
        gatewayPageURL: apiResponse.GatewayPageURL,
        sessionkey: apiResponse.sessionkey,
      });
    } else {
      return NextResponse.json({ error: "Failed to initialize payment" }, { status: 500 });
    }
  } catch (error: any) {
    console.error("Payment init error:", error);
    return NextResponse.json({ error: error?.message || "Failed to initialize payment" }, { status: 500 });
  }
}
