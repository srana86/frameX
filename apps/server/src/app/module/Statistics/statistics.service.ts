/* eslint-disable @typescript-eslint/no-explicit-any */
import { prisma, OrderStatus } from "@framex/database";

// Get comprehensive statistics
const getStatisticsFromDB = async (tenantId: string) => {
  // Orders statistics
  const now = new Date();
  const todayStart = new Date(now.setHours(0, 0, 0, 0));
  const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  // Query only tenant data
  const [orders, products, customers, payments] = await Promise.all([
    prisma.order.findMany({
      where: { tenantId, isDeleted: false },
      include: { customer: true, payment: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.product.findMany({
      where: { tenantId },
      include: { inventory: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.customer.findMany({
      where: { tenantId },
    }),
    prisma.payment.findMany({
      where: { tenantId },
    }),
  ]);

  // Orders by status
  const ordersByStatus = {
    pending: orders.filter((o) => o.status === OrderStatus.PENDING).length,
    processing: orders.filter((o) => o.status === OrderStatus.PROCESSING).length,
    shipped: orders.filter((o) => o.status === OrderStatus.SHIPPED).length,
    delivered: orders.filter((o) => o.status === OrderStatus.DELIVERED).length,
    cancelled: orders.filter((o) => o.status === OrderStatus.CANCELLED).length,
  };

  // Revenue calculations
  const safeTotal = (val: any) => Number(val) || 0;

  const totalRevenue = orders.reduce((sum, o) => sum + safeTotal(o.total), 0);
  const revenueThisMonth = orders
    .filter((o) => o.createdAt && new Date(o.createdAt) >= thisMonthStart)
    .reduce((sum, o) => sum + safeTotal(o.total), 0);
  const revenueLastMonth = orders
    .filter(
      (o) =>
        o.createdAt &&
        new Date(o.createdAt) >= lastMonthStart &&
        new Date(o.createdAt) < thisMonthStart
    )
    .reduce((sum, o) => sum + safeTotal(o.total), 0);

  const growth =
    revenueLastMonth > 0
      ? ((revenueThisMonth - revenueLastMonth) / revenueLastMonth) * 100
      : 0;

  // Inventory statistics
  const lowStockItems = products.filter((p) => (p.inventory?.quantity || 0) <= 10).length;

  return {
    stats: {
      totalOrders: orders.length,
      totalRevenue,
      totalProducts: products.length,
      totalCustomers: customers.length,
      pendingOrders: ordersByStatus.pending,
      lowStockItems,
      growth,
    },
    recentOrders: orders.slice(0, 5).map(o => ({
      id: o.id,
      total: Number(o.total),
      status: o.status,
      customer: {
        name: o.customer?.name
      },
      createdAt: o.createdAt
    })),
    topProducts: products.slice(0, 5).map(p => ({
      id: p.id,
      name: p.name,
      price: Number(p.price),
      stock: p.inventory?.quantity || 0,
      category: p.categoryId // or category name if joined
    })),
    // Detailed info for charts if needed
    orders: {
      total: orders.length,
      byStatus: ordersByStatus,
      thisMonth: orders.filter(o => o.createdAt && new Date(o.createdAt) >= thisMonthStart).length,
    },
    revenue: {
      total: totalRevenue,
      thisMonth: revenueThisMonth,
      lastMonth: revenueLastMonth,
      growth
    }
  };
};

export const StatisticsServices = {
  getStatisticsFromDB,
};
