/* eslint-disable @typescript-eslint/no-explicit-any */
import { prisma, Decimal } from "@framex/database";
import config from "../../../config/index";
import {
  initSSLCommerzPayment,
  validateSSLCommerzPayment,
} from "../Payment/services/sslcommerz.service"; // Ensure this path is correct or updated

const getSSLCommerzConfig = async () => {
  const settings = await prisma.sSLCommerzConfig.findFirst({
    where: { tenantId: "system" } // Assuming system config
  });

  if (settings && settings.enabled && settings.storeId && settings.storePassword) {
    return {
      storeId: settings.storeId,
      storePassword: settings.storePassword,
      isLive: settings.isLive,
      enabled: true
    };
  }

  // Fallback
  const storeId = config.sslcommerz_store_id;
  const storePassword = config.sslcommerz_store_password;
  const isLive = config.sslcommerz_is_live;

  if (storeId && storePassword) {
    return { storeId, storePassword, isLive, enabled: true };
  }

  return { storeId: "", storePassword: "", isLive: false, enabled: false };
};

const initCheckout = async (payload: any) => {
  if (!payload.planId || !payload.tenantName || !payload.amount) {
    throw new Error("Missing required fields");
  }

  const tranId = `TXN_${Date.now()}_${Math.random().toString(36).substring(7)}`;

  // Create session
  const session = await prisma.checkout.create({
    data: {
      tenantId: payload.tenantId || "unknown", // Schema requires tenantId
      sessionId: tranId,
      amount: new Decimal(payload.amount || payload.planPrice),
      currency: "BDT",
      status: "PENDING",
      items: [{
        planId: payload.planId,
        planName: payload.planName,
        billingCycle: payload.billingCycle
      }],
      customerEmail: payload.customerEmail,
      customerId: payload.customerId,
      metadata: {
        tenantName: payload.tenantName,
        tenantEmail: payload.tenantEmail,
        customerName: payload.customerName,
        ...payload
      }
    }
  });

  if (payload.planPrice === 0) {
    await prisma.checkout.update({
      where: { id: session.id },
      data: { status: "COMPLETED", completedAt: new Date() }
    });
    return { success: true, tranId, message: "Free plan activated" };
  }

  const sslConfig = await getSSLCommerzConfig();
  if (!sslConfig.enabled) {
    return { success: true, tranId, message: "Demo mode - no SSL", demoMode: true };
  }

  const baseUrl = config.base_url || "http://localhost:5000";
  const paymentData = {
    total_amount: payload.amount || payload.planPrice,
    currency: "BDT",
    tran_id: tranId,
    success_url: `${baseUrl}/api/v1/checkout/success`,
    fail_url: `${baseUrl}/api/v1/checkout/fail`,
    cancel_url: `${baseUrl}/api/v1/checkout/cancel`,
    ipn_url: `${baseUrl}/api/v1/checkout/ipn`,
    shipping_method: "NO",
    product_name: `${payload.planName || "Plan"}`,
    product_category: "SaaS Subscription",
    product_profile: "non-physical-goods",
    cus_name: payload.customerName || "N/A",
    cus_email: payload.customerEmail || "customer@example.com",
    cus_add1: payload.customerAddress || "N/A",
    cus_city: payload.customerCity || "N/A",
    cus_state: payload.customerState || "N/A",
    cus_postcode: payload.customerPostcode || "N/A",
    cus_country: payload.customerCountry || "Bangladesh",
    cus_phone: payload.customerPhone || "N/A",
  };

  const response = await initSSLCommerzPayment(
    { storeId: sslConfig.storeId, storePassword: sslConfig.storePassword, isLive: sslConfig.isLive },
    paymentData
  );

  if (response.status === "SUCCESS" && response.GatewayPageURL) {
    // Update session key
    // Checkout model doesn't have sessionKey field explicit? 
    // Store in metadata
    await prisma.checkout.update({
      where: { id: session.id },
      data: {
        metadata: { ...(session.metadata as any), sessionkey: response.sessionkey }
      }
    });
    return { success: true, GatewayPageURL: response.GatewayPageURL, sessionkey: response.sessionkey };
  } else {
    throw new Error("Payment initialization failed");
  }
};

const getCheckoutSession = async (tranId: string) => {
  const session = await prisma.checkout.findUnique({
    where: { sessionId: tranId }
  });
  if (!session) throw new Error("Session not found");
  return { ...session, amount: Number(session.amount) };
};

const handleCheckoutSuccess = async (data: Record<string, string>) => {
  const { tran_id, val_id } = data;
  if (!tran_id) throw new Error("Invalid callback");

  await prisma.checkout.update({
    where: { sessionId: tran_id },
    data: {
      status: "COMPLETED",
      completedAt: new Date(),
      metadata: { val_id, ...data } // Merging metadata
    }
  });

  return { success: true, tranId: tran_id };
};

const handleCheckoutFail = async (data: Record<string, string>) => {
  const { tran_id, error } = data;
  if (tran_id) {
    await prisma.checkout.updateMany({ // Use updateMany if sessionId not guaranteed unique (though schema says unique)
      where: { sessionId: tran_id },
      data: { status: "CANCELLED", metadata: { error } } // No FAILED status, using CANCELLED
    });
  }
  return { success: true, message: "Payment failed" };
};

const handleCheckoutCancel = async (data: Record<string, string>) => {
  const { tran_id } = data;
  if (tran_id) {
    await prisma.checkout.updateMany({
      where: { sessionId: tran_id },
      data: { status: "CANCELLED" }
    });
  }
  return { success: true, message: "Payment cancelled" };
};

const handleIPN = async (data: Record<string, string>) => {
  const { tran_id, status } = data;
  if (status === "VALID" || status === "VALIDATED") {
    await prisma.checkout.updateMany({
      where: { sessionId: tran_id },
      data: { status: "COMPLETED", completedAt: new Date(), metadata: { ipn: true, ...data } }
    });
    return { message: "IPN verified" };
  }
  throw new Error("IPN validation failed");
};

export const CheckoutServices = {
  initCheckout,
  getCheckoutSession,
  handleCheckoutSuccess,
  handleCheckoutFail,
  handleCheckoutCancel,
  handleIPN,
};
