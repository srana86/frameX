import { CheckoutSession } from "./checkout.model";
import { Settings } from "../Settings/settings.model";
import { Merchant } from "../Merchant/merchant.model";
import { Subscription } from "../Subscription/subscription.model";
import { Plan } from "../Plan/plan.model";
import { ActivityLog } from "../ActivityLog/activityLog.model";
import { toPlainObject } from "../../utils/mongodb";
import { ICheckoutSession } from "./checkout.interface";
import {
  initSSLCommerzPayment,
  validateSSLCommerzPayment,
} from "../Payment/services/sslcommerz.service";
import config from "../../../config/index";

const getSSLCommerzConfig = async () => {
  try {
    const settings = await Settings.findOne({ id: "sslcommerz_config_v1" });
    if (
      settings &&
      (settings as any).enabled &&
      (settings as any).storeId &&
      (settings as any).storePassword
    ) {
      return {
        storeId: (settings as any).storeId,
        storePassword: (settings as any).storePassword,
        isLive: (settings as any).isLive ?? false,
        enabled: true,
      };
    }
  } catch (error) {
    console.warn("Failed to fetch SSLCommerz config from DB:", error);
  }

  // Fallback to environment variables
  const storeId = config.sslcommerz_store_id;
  const storePassword = config.sslcommerz_store_password;
  const isLive = config.sslcommerz_is_live;

  if (storeId && storePassword) {
    return { storeId, storePassword, isLive, enabled: true };
  }

  return { storeId: "", storePassword: "", isLive: false, enabled: false };
};

const initCheckout = async (payload: {
  planId: string;
  planName: string;
  planPrice: number;
  billingCycle?: string;
  merchantName: string;
  merchantEmail: string;
  merchantPhone?: string;
  customSubdomain?: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  customerAddress?: string;
  customerCity?: string;
  customerState?: string;
  customerPostcode?: string;
  customerCountry?: string;
}) => {
  // Validate required fields
  if (
    !payload.planId ||
    !payload.planName ||
    !payload.merchantName ||
    !payload.merchantEmail ||
    !payload.customerName ||
    !payload.customerEmail
  ) {
    throw new Error("Missing required fields");
  }

  // Generate transaction ID
  const tranId = `TXN_${Date.now()}_${Math.random().toString(36).substring(7)}`;

  // Store checkout session in database
  const sessionData: ICheckoutSession = {
    tranId,
    planId: payload.planId,
    planName: payload.planName,
    planPrice: payload.planPrice,
    billingCycle: payload.billingCycle,
    merchantName: payload.merchantName,
    merchantEmail: payload.merchantEmail,
    merchantPhone: payload.merchantPhone,
    customSubdomain: payload.customSubdomain || "",
    customerName: payload.customerName,
    customerEmail: payload.customerEmail,
    customerPhone: payload.customerPhone,
    customerAddress: payload.customerAddress,
    customerCity: payload.customerCity,
    customerState: payload.customerState,
    customerPostcode: payload.customerPostcode,
    customerCountry: payload.customerCountry,
    status: "pending",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  await CheckoutSession.create(sessionData);

  // For free plans, skip payment
  if (payload.planPrice === 0) {
    await CheckoutSession.findOneAndUpdate(
      { tranId },
      { $set: { status: "completed", updatedAt: new Date().toISOString() } }
    );
    return {
      success: true,
      tranId,
      message: "Free plan activated",
    };
  }

  // Get SSLCommerz configuration
  const sslConfig = await getSSLCommerzConfig();

  if (!sslConfig.enabled || !sslConfig.storeId || !sslConfig.storePassword) {
    console.error("SSLCommerz credentials not configured");
    return {
      success: true,
      tranId,
      message: "Demo mode - SSLCommerz not configured",
      GatewayPageURL: null,
      demoMode: true,
    };
  }

  const baseUrl = config.base_url || "http://localhost:5000";

  // Initialize SSLCommerz payment
  const paymentData = {
    total_amount: payload.planPrice,
    currency: "BDT",
    tran_id: tranId,
    success_url: `${baseUrl}/api/v1/checkout/success`,
    fail_url: `${baseUrl}/api/v1/checkout/fail`,
    cancel_url: `${baseUrl}/api/v1/checkout/cancel`,
    ipn_url: `${baseUrl}/api/v1/checkout/ipn`,
    shipping_method: "NO",
    product_name: `${payload.planName} Plan - ${payload.billingCycle || "monthly"}`,
    product_category: "SaaS Subscription",
    product_profile: "non-physical-goods",
    cus_name: payload.customerName,
    cus_email: payload.customerEmail,
    cus_add1: payload.customerAddress || "",
    cus_city: payload.customerCity || "",
    cus_state: payload.customerState || "",
    cus_postcode: payload.customerPostcode || "",
    cus_country: payload.customerCountry || "BD",
    cus_phone: payload.customerPhone || "",
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
    await CheckoutSession.findOneAndUpdate(
      { tranId },
      {
        $set: {
          sessionkey: response.sessionkey,
          updatedAt: new Date().toISOString(),
        },
      }
    );

    return {
      success: true,
      GatewayPageURL: response.GatewayPageURL,
      sessionkey: response.sessionkey,
    };
  } else {
    console.error("SSLCommerz init failed:", response);
    throw new Error(
      (response as any).faession || "Payment initialization failed"
    );
  }
};

const getCheckoutSession = async (tranId: string) => {
  const session = await CheckoutSession.findOne({ tranId });
  if (!session) {
    throw new Error("Session not found");
  }

  const data = toPlainObject<ICheckoutSession>(session);
  // Don't expose sensitive payment details
  const { paymentDetails, ...safeSession } = data as any;

  return {
    ...safeSession,
    hasPaymentDetails: !!paymentDetails,
  };
};

const handleCheckoutSuccess = async (data: Record<string, string>) => {
  const { tran_id, val_id, status, amount, currency, bank_tran_id, card_type } =
    data;

  if (!tran_id || status !== "VALID") {
    throw new Error("Payment verification failed");
  }

  const session = await CheckoutSession.findOne({ tranId: tran_id });
  if (!session) {
    throw new Error("Session not found");
  }

  // Update session with payment details
  await CheckoutSession.findOneAndUpdate(
    { tranId: tran_id },
    {
      $set: {
        status: "completed",
        paymentDetails: {
          val_id,
          amount,
          currency,
          bank_tran_id,
          card_type,
          verified_at: new Date().toISOString(),
        },
        updatedAt: new Date().toISOString(),
      },
    }
  );

  return { success: true, tranId: tran_id };
};

const handleCheckoutFail = async (data: Record<string, string>) => {
  const { tran_id, error } = data;

  if (tran_id) {
    await CheckoutSession.findOneAndUpdate(
      { tranId: tran_id },
      {
        $set: {
          status: "failed",
          error: error || "Payment failed",
          updatedAt: new Date().toISOString(),
        },
      }
    );
  }

  return { success: true, message: "Payment failed" };
};

const handleCheckoutCancel = async (data: Record<string, string>) => {
  const { tran_id } = data;

  if (tran_id) {
    await CheckoutSession.findOneAndUpdate(
      { tranId: tran_id },
      {
        $set: {
          status: "cancelled",
          updatedAt: new Date().toISOString(),
        },
      }
    );
  }

  return { success: true, message: "Payment cancelled" };
};

const handleIPN = async (data: Record<string, string>) => {
  const { tran_id, val_id, status, amount } = data;

  if (!tran_id || !val_id) {
    throw new Error("Missing required fields");
  }

  const session = await CheckoutSession.findOne({ tranId: tran_id });
  if (!session) {
    throw new Error("Session not found");
  }

  // Get SSLCommerz config
  const sslConfig = await getSSLCommerzConfig();

  if (!sslConfig.enabled || !sslConfig.storeId || !sslConfig.storePassword) {
    console.warn("SSLCommerz credentials not configured, skipping validation");
    // In demo mode, trust the IPN data
    if (status === "VALID" || status === "VALIDATED") {
      await CheckoutSession.findOneAndUpdate(
        { tranId: tran_id },
        {
          $set: {
            status: "completed",
            ipnVerified: true,
            paymentDetails: {
              val_id,
              amount,
              verified_at: new Date().toISOString(),
            },
            updatedAt: new Date().toISOString(),
          },
        }
      );
    }
    return { message: "IPN processed (demo mode)" };
  }

  // Validate the payment
  const validation = await validateSSLCommerzPayment(
    {
      storeId: sslConfig.storeId,
      storePassword: sslConfig.storePassword,
      isLive: sslConfig.isLive,
    },
    val_id
  );

  if (validation.status === "VALID" || validation.status === "VALIDATED") {
    // Update session with verified payment details
    await CheckoutSession.findOneAndUpdate(
      { tranId: tran_id },
      {
        $set: {
          status: "completed",
          ipnVerified: true,
          paymentDetails: {
            val_id,
            amount: validation.amount,
            currency: validation.currency,
            card_type: validation.card_type,
            bank_tran_id: validation.bank_tran_id,
            risk_level: validation.risk_level,
            risk_title: validation.risk_title,
            verified_at: new Date().toISOString(),
          },
          updatedAt: new Date().toISOString(),
        },
      }
    );

    return { message: "IPN verified successfully" };
  } else {
    // Mark as failed
    await CheckoutSession.findOneAndUpdate(
      { tranId: tran_id },
      {
        $set: {
          status: "failed",
          error: "Payment validation failed",
          updatedAt: new Date().toISOString(),
        },
      }
    );

    throw new Error("Payment validation failed");
  }
};

export const CheckoutServices = {
  initCheckout,
  getCheckoutSession,
  handleCheckoutSuccess,
  handleCheckoutFail,
  handleCheckoutCancel,
  handleIPN,
};
