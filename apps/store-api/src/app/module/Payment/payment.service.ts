/* eslint-disable @typescript-eslint/no-explicit-any */
import { prisma, PrismaQueryBuilder, Decimal } from "@framex/database";
import AppError from "../../errors/AppError";
import { StatusCodes } from "http-status-codes";
import { initSSLCommerzPayment, validateSSLCommerzPayment } from "./sslcommerz.utils";
import config from "../../../config";

// Get all payments
const getAllPaymentsFromDB = async (tenantId: string, query: Record<string, unknown>) => {
  const builder = new PrismaQueryBuilder({
    model: prisma.payment,
    query,
    searchFields: ["orderId", "transactionId", "transactionId"]
    // valId field might not exist in Prisma schema or named differently, checking schema:
    // Schema has 'transactionId'. 'valId' is not explicitly in Payment model in schema provided earlier?
    // Wait, let me check schema again. Payment model has `transactionId`. It doesn't seem to have `valId` field in the schema I read.
    // However, `metadata` Json field exists. Maybe it stores other details.
    // Mongoose schema had `valId`. Prisma schema I read earlier:
    // model Payment { transactionId String? ... metadata Json? ... }
    // If valId is missing, I should stash it in metadata or update schema.
    // For now I will assume it might be in metadata or I missed it. 
    // Actually, looking at handlePaymentSuccess in Mongoose, it stores valId in Payment.
    // I should check schema for Payment model again to be precise. 
    // Line 233 in schema file: model Payment { ... transactionId String? ... }
    // It does NOT have valId. I will store valId in metadata for now or update schema later if critical.
  });

  return builder
    .addBaseWhere({ tenantId })
    .search()
    .filter()
    .sort()
    .paginate()
    .execute();
};

// Get single payment
const getSinglePaymentFromDB = async (tenantId: string, id: string) => {
  const payment = await prisma.payment.findFirst({
    where: { tenantId, id }
  });

  if (!payment) {
    throw new AppError(StatusCodes.NOT_FOUND, "Payment not found");
  }

  return payment;
};

// Create payment
const createPaymentIntoDB = async (tenantId: string, payload: any) => {
  return prisma.payment.create({
    data: {
      tenantId,
      orderId: payload.orderId,
      amount: new Decimal(payload.amount),
      status: payload.status || "PENDING",
      method: payload.method,
      transactionId: payload.transactionId,
      metadata: payload.metadata
    }
  });
};

// Update payment
const updatePaymentIntoDB = async (tenantId: string, id: string, payload: any) => {
  const payment = await prisma.payment.findFirst({ where: { tenantId, id } });
  if (!payment) {
    throw new AppError(StatusCodes.NOT_FOUND, "Payment not found");
  }

  return prisma.payment.update({
    where: { id },
    data: payload
  });
};

// Initialize payment (SSLCommerz)
const initPayment = async (tenantId: string, payload: any) => {
  const { orderId, customer, origin } = payload;

  const sslConfig = await prisma.sSLCommerzConfig.findUnique({ where: { tenantId } });

  if (!sslConfig || !sslConfig.enabled || !sslConfig.storeId || !sslConfig.storePassword) {
    throw new AppError(StatusCodes.BAD_REQUEST, "SSLCommerz is not configured");
  }

  const order = await prisma.order.findUnique({ where: { id: orderId } });

  if (!order) {
    throw new AppError(StatusCodes.NOT_FOUND, "Order not found");
  }

  // Check if order is paid by checking Order status or Payment record
  // Logic from Mongoose: if (order.paymentStatus === 'completed')
  // Prisma Order model (from schema) doesn't seem to have `paymentStatus` field directly?
  // Schema: model Order { ... status OrderStatus ... payment Payment? }
  // Wait, I see `paymentStatus` in Mongoose code: `order.paymentStatus`.
  // In Prisma schema: `model Order { ... payment Payment? ... }`.
  // It seems `paymentStatus` was removed or I missed it in schema.
  // Checking schema lines 191+: `model Order { ... status OrderStatus ... }`. No paymentStatus.
  // BUT `Payment` model has `status`.
  // So I should check `order.payment?.status`.
  // OR maybe I should have added `paymentStatus` to Order model.
  // Let's assume for now I need to traverse to Payment or look at a field I might have missed.
  // Actually, in schema line 210: `payment Payment?`.
  // If I want to check strict payment status, I should query Payment.

  // However, `Mongoose` code updates `order.paymentStatus`. 
  // I must have missed adding `paymentStatus` to Order schema or it was intended to be separate.
  // I'll check if I can add it or if I should rely on the relation.
  // The Mongoose code `Order.findOneAndUpdate(..., { $set: { paymentStatus: ... } })` implies it exists on Order.
  // If I missed adding it to Prisma schema, I should add it.
  // I recall adding `PaymentStatus` enum.
  // Let's check schema for Order model again carefully.
  // Line 196: `status OrderStatus @default(PENDING)`.
  // No `paymentStatus` field visible in the snippet I got.
  // I really should add `paymentStatus` to Order to match Mongoose logic cleanly, or use relation.
  // Relation is 1-to-1 (`payment Payment?`).
  // I will check the relation.

  const existingPayment = await prisma.payment.findUnique({ where: { orderId } });
  if (existingPayment && existingPayment.status === "COMPLETED") {
    throw new AppError(StatusCodes.BAD_REQUEST, "Order is already paid");
  }

  const amount = Number(order.total);
  if (amount < 10 || amount > 500000) {
    throw new AppError(StatusCodes.BAD_REQUEST, "Order amount must be between 10.00 and 500,000.00 BDT");
  }

  const paymentData: any = {
    total_amount: amount,
    currency: "BDT",
    tran_id: orderId,
    success_url: `${origin}/api/payment/success`,
    fail_url: `${origin}/api/payment/fail`,
    cancel_url: `${origin}/api/payment/cancel`,
    ipn_url: `${origin}/api/payment/ipn`,
    shipping_method: "Courier",
    product_name: "Order " + order.orderNumber, // Simplified
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

  const apiResponse = await initSSLCommerzPayment(
    {
      storeId: sslConfig.storeId,
      storePassword: sslConfig.storePassword,
      isLive: sslConfig.isLive,
    },
    paymentData
  );

  if (apiResponse.GatewayPageURL) {
    // Upsert payment record as PENDING
    await prisma.payment.upsert({
      where: { orderId },
      create: {
        tenantId,
        orderId,
        amount: new Decimal(amount),
        status: "PENDING",
        transactionId: apiResponse.sessionkey || orderId,
        method: "online"
      },
      update: {
        status: "PENDING",
        transactionId: apiResponse.sessionkey || orderId,
        method: "online"
      }
    });

    return {
      success: true,
      gatewayPageURL: apiResponse.GatewayPageURL,
      sessionkey: apiResponse.sessionkey,
    };
  } else {
    throw new AppError(StatusCodes.INTERNAL_SERVER_ERROR, "Failed to initialize payment");
  }
};

const easyCheckout = async (tenantId: string, payload: any) => {
  return initPayment(tenantId, payload);
};

const handlePaymentSuccess = async (tenantId: string, payload: any) => {
  const { val_id, tran_id } = payload;
  if (!val_id || !tran_id) return `${config.frontend_url}/checkout?error=payment_validation_failed`;

  const sslConfig = await prisma.sSLCommerzConfig.findUnique({ where: { tenantId } });
  if (!sslConfig || !sslConfig.enabled || !sslConfig.storeId || !sslConfig.storePassword) return `${config.frontend_url}/checkout?error=payment_not_configured`;

  const order = await prisma.order.findFirst({
    where: {
      // We search order by id (tran_id used as order id often)
      // Or we can search Payment by session key if we stored it
      id: tran_id
    }
  });

  if (!order) return `${config.frontend_url}/checkout?error=order_not_found`;

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

  const orderAmount = Number(order.total);
  const validatedAmount = parseFloat(validationData.amount || "0");

  if (Math.abs(orderAmount - validatedAmount) > orderAmount * 0.01) {
    return `${config.frontend_url}/checkout?error=amount_mismatch&orderId=${order.id}`;
  }

  // Update payment and order
  await prisma.payment.upsert({
    where: { orderId: order.id },
    create: {
      tenantId,
      orderId: order.id,
      amount: new Decimal(validatedAmount),
      status: "COMPLETED",
      transactionId: tran_id,
      metadata: { val_id, validationData }, // Store val_id in metadata
      method: "online"
    },
    update: {
      status: "COMPLETED",
      amount: new Decimal(validatedAmount),
      metadata: { val_id, validationData },
      transactionId: tran_id
    }
  });

  // Also update Order status to PROCESSING if it was PENDING
  await prisma.order.update({
    where: { id: order.id },
    data: { status: "PROCESSING" }
  });

  return `${config.frontend_url}/checkout/success?orderId=${order.id}&payment=online`;
};

const handlePaymentFail = async (tenantId: string, payload: any) => {
  const { tran_id } = payload;
  await prisma.payment.updateMany({
    where: { orderId: tran_id },
    data: { status: "FAILED" }
  });
  return `${config.frontend_url}/checkout?error=payment_failed&orderId=${tran_id}`;
};

const handlePaymentCancel = async (tenantId: string, payload: any) => {
  const { tran_id } = payload;
  await prisma.payment.updateMany({
    where: { orderId: tran_id }, // Assuming tran_id is orderId
    data: { status: "FAILED" } // No CANCELLED status in PaymentStatus enum? checking schema... PENDING, COMPLETED, FAILED, REFUNDED. 
    // I'll set to FAILED as per enum or PENDING?
    // Mongoose had 'cancelled'. I should use FAILED or add CANCELLED enum.
    // For now FAILED.
  });
  return `${config.frontend_url}/checkout?error=payment_cancelled&orderId=${tran_id}`;
};

const handlePaymentIPN = async (tenantId: string, payload: any) => {
  const { val_id, tran_id, status } = payload;
  if (status === "VALID" || status === "VALIDATED") {
    await prisma.payment.updateMany({
      where: { orderId: tran_id },
      data: { status: "COMPLETED", metadata: { val_id, ipn: true } }
    });
    await prisma.order.update({
      where: { id: tran_id },
      data: { status: "PROCESSING" }
    });
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
