import { Sale } from "./sales.model";
import { ActivityLog } from "../ActivityLog/activityLog.model";
import { toPlainObjectArray, toPlainObject } from "../../utils/mongodb";
import { ISale } from "./sales.interface";

const getAllSales = async (
  status?: string,
  type?: string,
  merchantId?: string,
  startDate?: string,
  endDate?: string,
  limit: number = 100
) => {
  const query: any = {};
  if (status) query.status = status;
  if (type) query.type = type;
  if (merchantId) query.merchantId = merchantId;
  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = startDate;
    if (endDate) query.createdAt.$lte = endDate;
  }

  const sales = await Sale.find(query).sort({ createdAt: -1 }).limit(limit);

  // Calculate stats
  const completedSales = sales.filter((s) => s.status === "completed");
  const totalRevenue = completedSales.reduce(
    (sum, s) => sum + (s.amount || 0),
    0
  );
  const totalSales = completedSales.length;

  const byType = completedSales.reduce((acc: any, sale) => {
    acc[sale.type] = (acc[sale.type] || 0) + 1;
    return acc;
  }, {});

  return {
    sales: toPlainObjectArray<ISale>(sales),
    stats: {
      totalRevenue,
      totalSales,
      byType,
      currency: "BDT",
    },
  };
};

const createSale = async (payload: Partial<ISale>) => {
  if (!payload.merchantId || !payload.planId || !payload.amount) {
    throw new Error("merchantId, planId, and amount are required");
  }

  const saleData: ISale = {
    id: payload.id || `sale_${Date.now()}`,
    merchantId: payload.merchantId,
    merchantName: payload.merchantName,
    merchantEmail: payload.merchantEmail,
    subscriptionId: payload.subscriptionId,
    planId: payload.planId,
    planName: payload.planName || "Unknown Plan",
    amount: payload.amount,
    currency: payload.currency || "BDT",
    billingCycleMonths: payload.billingCycleMonths || 1,
    paymentMethod: payload.paymentMethod || "sslcommerz",
    transactionId: payload.transactionId,
    status: payload.status || "completed",
    type: payload.type || "new",
    metadata: payload.metadata || {},
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const sale = await Sale.create(saleData);

  // Log activity
  await ActivityLog.create({
    id: `log_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    type: "system",
    action: "sale_recorded",
    entityId: sale.id,
    entityName: `${sale.planName} - ৳${sale.amount}`,
    details: {
      saleId: sale.id,
      merchantId: sale.merchantId,
      merchantName: sale.merchantName,
      planId: sale.planId,
      planName: sale.planName,
      amount: sale.amount,
      type: sale.type,
    },
    createdAt: new Date().toISOString(),
  });

  return toPlainObject<ISale>(sale);
};

export const SalesServices = {
  getAllSales,
  createSale,
};
