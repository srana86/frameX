import { CheckoutSession } from "../Checkout/checkout.model";
import { toPlainObjectArray, toPlainObject } from "../../utils/mongodb";
import { ICheckoutSession } from "../Checkout/checkout.interface";

const getAllPayments = async (
  status?: string,
  merchantId?: string,
  limit: number = 100,
  page: number = 1
) => {
  const query: any = {};
  if (status && status !== "all") {
    query.status = status;
  }
  if (merchantId) {
    query.merchantId = merchantId;
  }

  const total = await CheckoutSession.countDocuments(query);
  const payments = await CheckoutSession.find(query)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);

  return {
    payments: payments
      .map((p) => {
        const data = toPlainObject<ICheckoutSession>(p);
        if (!data) return null;
        return {
          id: (p as any)._id?.toString(),
          tranId: data.tranId,
          merchantId: data.merchantId,
          merchantName: data.merchantName,
          merchantEmail: data.merchantEmail,
          merchantPhone: data.merchantPhone,
          planId: data.planId,
          planName: data.planName,
          amount: data.planPrice || 0,
          billingCycle: data.billingCycle,
          currency: "BDT", // Default currency
          status:
            data.status === "completed"
              ? "completed"
              : data.status === "failed"
                ? "failed"
                : "pending",
          paymentMethod: data.card_type || data.paymentMethod,
          cardType: data.card_type,
          cardNo: data.card_no,
          bankTranId: data.bank_tran_id,
          valId: data.val_id,
          customerName: data.customerName,
          customerEmail: data.customerEmail,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
        };
      })
      .filter(Boolean),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

const getPaymentStats = async () => {
  const [completed, pending, failed, total] = await Promise.all([
    CheckoutSession.countDocuments({ status: "completed" }),
    CheckoutSession.countDocuments({ status: "pending" }),
    CheckoutSession.countDocuments({ status: "failed" }),
    CheckoutSession.countDocuments({}),
  ]);

  // Get total revenue
  const revenueResult = await CheckoutSession.aggregate([
    { $match: { status: "completed" } },
    { $group: { _id: null, total: { $sum: "$planPrice" } } },
  ]);

  const totalRevenue = revenueResult[0]?.total || 0;

  // Get this month's revenue
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const thisMonthResult = await CheckoutSession.aggregate([
    {
      $match: {
        status: "completed",
        createdAt: { $gte: startOfMonth.toISOString() },
      },
    },
    { $group: { _id: null, total: { $sum: "$planPrice" } } },
  ]);

  const thisMonthRevenue = thisMonthResult[0]?.total || 0;

  return {
    total,
    completed,
    pending,
    failed,
    totalRevenue,
    thisMonthRevenue,
  };
};

const updatePaymentSession = async (
  tranId: string,
  updateData: {
    status?: string;
    valId?: string;
    error?: string;
    completedAt?: string;
    failedAt?: string;
  }
) => {
  const updatePayload: any = {
    ...updateData,
    updatedAt: new Date().toISOString(),
  };

  const result = await CheckoutSession.findOneAndUpdate(
    { tranId },
    { $set: updatePayload },
    { new: true }
  );

  if (!result) {
    throw new Error("Session not found");
  }

  return {
    success: true,
    updated: "checkout_session",
    session: toPlainObject<ICheckoutSession>(result),
  };
};

export const PaymentServices = {
  getAllPayments,
  getPaymentStats,
  updatePaymentSession,
};
