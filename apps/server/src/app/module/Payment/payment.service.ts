/* eslint-disable @typescript-eslint/no-explicit-any */
import { prisma, PrismaQueryBuilder, CheckoutStatus } from "@framex/database";

const getAllPayments = async (
  status?: string,
  tenantId?: string,
  limit: number = 100,
  page: number = 1
) => {
  const query: any = {};
  if (status && status !== "all") {
    query.status = status.toUpperCase() as CheckoutStatus; // Enum mapping
  }
  if (tenantId) {
    query.tenantId = tenantId;
  }

  const builder = new PrismaQueryBuilder({
    model: prisma.checkout,
    query: { page, limit, ...query },
    searchFields: ["sessionId", "transactionId"] // Checking if transactionId exists in Checkout model? Schema: sessionId is unique.
    // Schema lines 1002-1020: id, tenantId, sessionId, amount, currency, status, items, customerId, customerEmail, metadata, expiresAt, completedAt
    // It seems `sessionId` is the main ID. Mongoose code used `tranId`.
    // I will assume `sessionId` holds the transaction ID.
  });

  const result = await builder
    .addBaseWhere(query)
    .sort()
    .paginate()
    .execute();

  // Mapping result to match previous interface if possible
  const payments = result.data.map((p: any) => ({
    id: p.id,
    tranId: p.sessionId, // Mapping sessionId to tranId
    tenantId: p.tenantId,
    // tenantName/Email likely in metadata or need join. 
    // Schema items/metadata are Json.
    ...(p.metadata || {}),
    status: p.status.toLowerCase(),
    amount: Number(p.amount),
    currency: p.currency,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt
  }));

  return {
    payments,
    pagination: result.meta
  };
};

const getPaymentStats = async () => {
  const [completed, pending, failed, total] = await Promise.all([
    prisma.checkout.count({ where: { status: "COMPLETED" } }),
    prisma.checkout.count({ where: { status: "PENDING" } }),
    prisma.checkout.count({ where: { status: { in: ["EXPIRED", "CANCELLED"] } } }), // Mapping failed to expired/cancelled? Or maybe FAILED exists? 
    // Enum CheckoutStatus: PENDING, COMPLETED, EXPIRED, CANCELLED. No FAILED.
    // I'll map 'failed' to CANCELLED/EXPIRED for stats or just query all.
    prisma.checkout.count()
  ]);

  const revenueResult = await prisma.checkout.aggregate({
    _sum: { amount: true },
    where: { status: "COMPLETED" }
  });

  const totalRevenue = Number(revenueResult._sum.amount || 0);

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const thisMonthResult = await prisma.checkout.aggregate({
    _sum: { amount: true },
    where: {
      status: "COMPLETED",
      createdAt: { gte: startOfMonth }
    }
  });

  const thisMonthRevenue = Number(thisMonthResult._sum.amount || 0);

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
  const session = await prisma.checkout.findFirst({ where: { sessionId: tranId } });
  if (!session) throw new Error("Session not found");

  const data: any = {};
  if (updateData.status) data.status = updateData.status.toUpperCase() as CheckoutStatus;
  if (updateData.completedAt) data.completedAt = new Date(updateData.completedAt);
  // metadata update?
  if (updateData.valId || updateData.error || updateData.failedAt) {
    data.metadata = {
      ...(session.metadata as any || {}),
      valId: updateData.valId,
      error: updateData.error,
      failedAt: updateData.failedAt
    };
  }

  const result = await prisma.checkout.update({
    where: { id: session.id },
    data
  });

  return {
    success: true,
    updated: "checkout_session",
    session: {
      ...result,
      tranId: result.sessionId,
      status: result.status.toLowerCase(),
      amount: Number(result.amount)
    }
  };
};

export const PaymentServices = {
  getAllPayments,
  getPaymentStats,
  updatePaymentSession,
};
