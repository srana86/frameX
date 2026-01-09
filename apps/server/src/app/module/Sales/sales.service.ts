/* eslint-disable @typescript-eslint/no-explicit-any */
import { prisma, Decimal } from "@framex/database";

const getAllSales = async (
  status?: string,
  type?: string,
  merchantId?: string,
  startDate?: string,
  endDate?: string,
  limit: number = 100
) => {
  const where: any = {};
  // Ignoring status and type as they don't exist in Prisma Sales model
  if (merchantId) where.merchantId = merchantId;
  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) where.createdAt.gte = new Date(startDate);
    if (endDate) where.createdAt.lte = new Date(endDate);
  }

  const sales = await prisma.sales.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: limit
  });

  const completedSales = sales;
  const totalRevenue = completedSales.reduce((sum, s) => sum + Number(s.amount), 0);
  const totalSales = completedSales.length;

  return {
    sales: completedSales.map(s => ({
      ...s,
      amount: Number(s.amount),
      type: "sale",
      status: "completed"
    })),
    stats: {
      totalRevenue,
      totalSales,
      byType: {},
      currency: "BDT",
    },
  };
};

const createSale = async (payload: any) => {
  const sale = await prisma.sales.create({
    data: {
      merchantId: payload.merchantId,
      orderId: payload.transactionId || payload.orderId,
      amount: new Decimal(payload.amount),
      productName: payload.planName || payload.productName,
      productId: payload.planId || payload.productId,
      quantity: 1,
      saleDate: new Date()
    }
  });

  await prisma.activityLog.create({
    data: {
      action: "sale_recorded",
      resource: "sale",
      resourceId: sale.id,
      details: {
        saleId: sale.id,
        merchantId: sale.merchantId,
        amount: Number(sale.amount)
      }
    }
  });

  return { ...sale, amount: Number(sale.amount) };
};

export const SalesServices = {
  getAllSales,
  createSale,
};
