/* eslint-disable @typescript-eslint/no-explicit-any */
import AppError from "../../errors/AppError";
import { StatusCodes } from "http-status-codes";
import { Payment } from "./payment.model";
import QueryBuilder from "../../builder/QueryBuilder";
import { TPayment } from "./payment.interface";
import { SSLCommerzConfig } from "./sslcommerz.model";
import { Order } from "../Order/order.model";
import { initSSLCommerzPayment, validateSSLCommerzPayment } from "./sslcommerz.utils";
import config from "../../../config";

// Get all payments with pagination, filter, and search
const getAllPaymentsFromDB = async (query: Record<string, unknown>) => {
  const paymentQuery = new QueryBuilder(Payment.find(), query)
    .search(["orderId", "transactionId", "valId"])
    .filter()
    .sort()
    .paginate()
    .fields();

  const result = await paymentQuery.modelQuery;
  const meta = await paymentQuery.countTotal();

  return {
    meta,
    data: result,
  };
};

// Get single payment by ID
const getSinglePaymentFromDB = async (id: string) => {
  const result = await Payment.findOne({ id });

  if (!result) {
    throw new AppError(StatusCodes.NOT_FOUND, "Payment not found");
  }

  return result;
};

// Create payment
const createPaymentIntoDB = async (payload: TPayment) => {
  // Generate ID if not provided
  if (!payload.id) {
    payload.id = `PAY${Date.now()}${Math.random().toString(36).substr(2, 9)}`;
  }

  const result = await Payment.create(payload);
  return result;
};

// Update payment
const updatePaymentIntoDB = async (id: string, payload: Partial<TPayment>) => {
  const result = await Payment.findOneAndUpdate({ id }, payload, {
    new: true,
    runValidators: true,
  });

  if (!result) {
    throw new AppError(StatusCodes.NOT_FOUND, "Payment not found");
  }

  return result;
};

// Initialize payment (SSLCommerz integration)
const initPayment = async (payload: any) => {
  const { orderId, customer, origin } = payload;

  // Get SSLCommerz configuration
  const sslConfig = await SSLCommerzConfig.findOne({ id: "sslcommerz_config_v1" });

  if (!sslConfig || !sslConfig.enabled || !sslConfig.storeId || !sslConfig.storePassword) {
    throw new AppError(StatusCodes.BAD_REQUEST, "SSLCommerz is not configured");
  }

  // Get order from database
  const order = await Order.findOne({ id: orderId });

  if (!order) {
    throw new AppError(StatusCodes.NOT_FOUND, "Order not found");
  }

  // Check if order is already paid
  if (order.paymentStatus === "completed") {
    throw new AppError(StatusCodes.BAD_REQUEST, "Order is already paid");
  }

  // Validate order amount
  if (order.total < 10 || order.total > 500000) {
    throw new AppError(StatusCodes.BAD_REQUEST, "Order amount must be between 10.00 and 500,000.00 BDT");
  }

  // Prepare payment data
  const paymentData: any = {
    total_amount: parseFloat(order.total.toFixed(2)),
    currency: "BDT",
    tran_id: orderId,
    success_url: `${origin}/api/payment/success`,
    fail_url: `${origin}/api/payment/fail`,
    cancel_url: `${origin}/api/payment/cancel`,
    ipn_url: `${origin}/api/payment/ipn`,
    shipping_method: "Courier",
    product_name: order.items
      .map((item: any) => item.name)
      .slice(0, 5)
      .join(", "),
    product_category: "General",
    product_profile: "physical-goods",
    cus_name: customer.fullName,
    cus_email: customer.email || "customer@example.com",
    cus_add1: customer.addressLine1,
    cus_add2: customer.addressLine2 || "",
    cus_city: customer.city,
    cus_state: customer.city,
    cus_postcode: customer.postalCode,
    cus_country: "Bangladesh",
    cus_phone: customer.phone,
    ship_name: customer.fullName,
    ship_add1: customer.addressLine1,
    ship_city: customer.city,
    ship_state: customer.city,
    ship_postcode: customer.postalCode,
    ship_country: "Bangladesh",
  };

  // Initialize SSLCommerz payment
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
    await Order.findOneAndUpdate(
      { id: orderId },
      {
        $set: {
          paymentMethod: "online",
          paymentStatus: "pending",
          paymentTransactionId: apiResponse.sessionkey || orderId,
        },
      }
    );

    return {
      success: true,
      gatewayPageURL: apiResponse.GatewayPageURL,
      sessionkey: apiResponse.sessionkey,
    };
  } else {
    throw new AppError(StatusCodes.INTERNAL_SERVER_ERROR, "Failed to initialize payment");
  }
};

// Easy checkout (Pay on Page)
// Easy checkout (Pay on Page)
const easyCheckout = async (payload: any) => {
  return initPayment(payload);
};

// Handle payment success
const handlePaymentSuccess = async (payload: any) => {
  const { val_id, tran_id } = payload;

  if (!val_id || !tran_id) {
    return `${config.frontend_url}/checkout?error=payment_validation_failed`;
  }

  // Get SSLCommerz configuration
  const sslConfig = await SSLCommerzConfig.findOne({ id: "sslcommerz_config_v1" });

  if (!sslConfig || !sslConfig.enabled || !sslConfig.storeId || !sslConfig.storePassword) {
    return `${config.frontend_url}/checkout?error=payment_not_configured`;
  }

  // Find order
  const order = await Order.findOne({
    $or: [{ id: tran_id }, { paymentTransactionId: tran_id }]
  });

  if (!order) {
    return `${config.frontend_url}/checkout?error=order_not_found`;
  }

  // Validate payment
  const validationData = await validateSSLCommerzPayment(
    {
      storeId: sslConfig.storeId,
      storePassword: sslConfig.storePassword,
      isLive: sslConfig.isLive,
    },
    val_id
  );

  if (validationData.status !== "VALID" && validationData.status !== "VALIDATED") {
    return `${config.frontend_url}/checkout?error=payment_validation_failed&orderId=${order.id}`;
  }

  // Validate amount (allow 1% difference)
  const orderAmount = order.total;
  const validatedAmount = parseFloat(validationData.amount || "0");

  if (Math.abs(orderAmount - validatedAmount) > orderAmount * 0.01) {
    return `${config.frontend_url}/checkout?error=amount_mismatch&orderId=${order.id}`;
  }

  // Check if already processed
  if (order.paymentStatus === "completed") {
    return `${config.frontend_url}/checkout/success?orderId=${order.id}&payment=online`;
  }

  // Update order status
  await Order.findOneAndUpdate(
    { id: order.id },
    {
      $set: {
        paymentStatus: "completed",
        paidAmount: validatedAmount,
        paymentValId: val_id,
        status: "processing",
      },
    }
  );

  // Store payment transaction
  await Payment.create({
    id: `PAY${Date.now()}${Math.random().toString(36).substr(2, 9)}`,
    orderId: order.id,
    transactionId: tran_id,
    valId: val_id,
    amount: validatedAmount,
    paymentMethod: "online",
    paymentStatus: "completed",
    gatewayResponse: validationData,
  });

  return `${config.frontend_url}/checkout/success?orderId=${order.id}&payment=online`;
};

// Handle payment fail
const handlePaymentFail = async (payload: any) => {
  const { tran_id } = payload;

  await Order.findOneAndUpdate(
    { $or: [{ id: tran_id }, { paymentTransactionId: tran_id }] },
    { $set: { paymentStatus: "failed" } }
  );

  return `${config.frontend_url}/checkout?error=payment_failed&orderId=${tran_id}`;
};

// Handle payment cancel
const handlePaymentCancel = async (payload: any) => {
  const { tran_id } = payload;

  await Order.findOneAndUpdate(
    { $or: [{ id: tran_id }, { paymentTransactionId: tran_id }] },
    { $set: { paymentStatus: "cancelled" } }
  );

  return `${config.frontend_url}/checkout?error=payment_cancelled&orderId=${tran_id}`;
};

// Handle payment IPN
const handlePaymentIPN = async (payload: any) => {
  const { val_id, tran_id, status } = payload;

  if (status === "VALID" || status === "VALIDATED") {
    // Basic IPN handling - in a real app, you'd do full validation here too
    await Order.findOneAndUpdate(
      { $or: [{ id: tran_id }, { paymentTransactionId: tran_id }], paymentStatus: { $ne: "completed" } },
      {
        $set: {
          paymentStatus: "completed",
          paymentValId: val_id,
          status: "processing",
        },
      }
    );
  }

  return { success: true };
};

export const PaymentServices = {
  getAllPaymentsFromDB,
  getSinglePaymentFromDB,
  createPaymentIntoDB,
  updatePaymentIntoDB,
  initPayment,
  easyCheckout,
  handlePaymentSuccess,
  handlePaymentFail,
  handlePaymentCancel,
  handlePaymentIPN,
};
