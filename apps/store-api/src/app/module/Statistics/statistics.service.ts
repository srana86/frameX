/* eslint-disable @typescript-eslint/no-explicit-any */
import { Order } from "../Order/order.model";
import { Product } from "../Product/product.model";
import { Payment } from "../Payment/payment.model";

// Get comprehensive statistics
const getStatisticsFromDB = async () => {
  // Orders statistics
  const now = new Date();
  const todayStart = new Date(now.setHours(0, 0, 0, 0));
  const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

  // Query orders and products where isDeleted is false or doesn't exist (for backward compatibility)
  const orders = await Order.find({
    $or: [{ isDeleted: false }, { isDeleted: { $exists: false } }],
  });
  const payments = await Payment.find();
  const products = await Product.find({
    $or: [{ isDeleted: false }, { isDeleted: { $exists: false } }],
  });

  // Orders by status
  const ordersByStatus = {
    pending: orders.filter((o) => o.status === "pending").length,
    processing: orders.filter((o) => o.status === "processing").length,
    shipped: orders.filter((o) => o.status === "shipped").length,
    delivered: orders.filter((o) => o.status === "delivered").length,
    cancelled: orders.filter((o) => o.status === "cancelled").length,
  };

  // Orders by time periods
  const ordersToday = orders.filter(
    (o) => o.createdAt && new Date(o.createdAt) >= todayStart
  ).length;
  const ordersLast7Days = orders.filter(
    (o) => o.createdAt && new Date(o.createdAt) >= last7Days
  ).length;
  const ordersLast30Days = orders.filter(
    (o) => o.createdAt && new Date(o.createdAt) >= last30Days
  ).length;
  const ordersThisMonth = orders.filter(
    (o) => o.createdAt && new Date(o.createdAt) >= thisMonthStart
  ).length;
  const ordersLastMonth = orders.filter(
    (o) =>
      o.createdAt &&
      new Date(o.createdAt) >= lastMonthStart &&
      new Date(o.createdAt) < thisMonthStart
  ).length;

  // Revenue calculations
  const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0);
  const paidRevenue = orders
    .filter((o) => o.paymentStatus === "completed")
    .reduce((sum, o) => sum + o.total, 0);
  const pendingRevenue = orders
    .filter((o) => o.paymentStatus === "pending")
    .reduce((sum, o) => sum + o.total, 0);

  const revenueToday = orders
    .filter((o) => o.createdAt && new Date(o.createdAt) >= todayStart)
    .reduce((sum, o) => sum + o.total, 0);
  const revenueLast7Days = orders
    .filter((o) => o.createdAt && new Date(o.createdAt) >= last7Days)
    .reduce((sum, o) => sum + o.total, 0);
  const revenueLast30Days = orders
    .filter((o) => o.createdAt && new Date(o.createdAt) >= last30Days)
    .reduce((sum, o) => sum + o.total, 0);
  const revenueThisMonth = orders
    .filter((o) => o.createdAt && new Date(o.createdAt) >= thisMonthStart)
    .reduce((sum, o) => sum + o.total, 0);
  const revenueLastMonth = orders
    .filter(
      (o) =>
        o.createdAt &&
        new Date(o.createdAt) >= lastMonthStart &&
        new Date(o.createdAt) < thisMonthStart
    )
    .reduce((sum, o) => sum + o.total, 0);

  const avgOrderValue = orders.length > 0 ? totalRevenue / orders.length : 0;
  const growth =
    revenueLastMonth > 0
      ? ((revenueThisMonth - revenueLastMonth) / revenueLastMonth) * 100
      : 0;

  // Payment statistics
  const successfulPayments = payments.filter(
    (p) => p.paymentStatus === "completed"
  ).length;
  const failedPayments = payments.filter(
    (p) => p.paymentStatus === "failed"
  ).length;
  const paymentMethods = {
    cod: payments.filter((p) => p.paymentMethod === "cod").length,
    online: payments.filter((p) => p.paymentMethod === "online").length,
  };

  // Customer statistics
  const uniqueCustomers = new Set(
    orders.map((o) => o.customer.phone).filter(Boolean)
  ).size;
  const ordersLast30DaysForCustomers = orders.filter(
    (o) => o.createdAt && new Date(o.createdAt) >= last30Days
  );
  const newCustomersLast30Days = new Set(
    ordersLast30DaysForCustomers.map((o) => o.customer.phone).filter(Boolean)
  ).size;

  // Product statistics
  const categories = await Product.distinct("category", {
    $or: [{ isDeleted: false }, { isDeleted: { $exists: false } }],
  });
  const avgPrice =
    products.length > 0
      ? products.reduce((sum, p) => sum + p.price, 0) / products.length
      : 0;
  const productsWithImages = products.filter(
    (p) => p.images?.length > 0
  ).length;

  // Inventory statistics
  const totalStock = products.reduce((sum, p) => sum + (p.stock || 0), 0);
  const lowStockItems = products.filter((p) => (p.stock || 0) <= 10).length;
  const outOfStockItems = products.filter((p) => (p.stock || 0) === 0).length;

  // Order types
  const orderTypes = {
    online: orders.filter((o) => o.orderType === "online").length,
    offline: orders.filter((o) => o.orderType === "offline").length,
  };

  return {
    orders: {
      total: orders.length,
      byStatus: ordersByStatus,
      today: ordersToday,
      last7Days: ordersLast7Days,
      last30Days: ordersLast30Days,
      thisMonth: ordersThisMonth,
      lastMonth: ordersLastMonth,
      growth: growth,
    },
    revenue: {
      total: totalRevenue,
      paid: paidRevenue,
      pending: pendingRevenue,
      today: revenueToday,
      last7Days: revenueLast7Days,
      last30Days: revenueLast30Days,
      thisMonth: revenueThisMonth,
      lastMonth: revenueLastMonth,
      avgOrderValue: avgOrderValue,
      growth: growth,
      daily: [], // Would need to aggregate by date
    },
    payments: {
      total: payments.length,
      successful: successfulPayments,
      failed: failedPayments,
      successRate:
        payments.length > 0 ? (successfulPayments / payments.length) * 100 : 0,
      totalAmount: payments.reduce((sum, p) => sum + p.amount, 0),
      today: payments.filter(
        (p) => p.createdAt && new Date(p.createdAt) >= todayStart
      ).length,
      last7Days: payments.filter(
        (p) => p.createdAt && new Date(p.createdAt) >= last7Days
      ).length,
      last30Days: payments.filter(
        (p) => p.createdAt && new Date(p.createdAt) >= last30Days
      ).length,
      methods: paymentMethods,
    },
    customers: {
      total: uniqueCustomers,
      newLast30Days: newCustomersLast30Days,
      repeat: uniqueCustomers - newCustomersLast30Days,
      retentionRate: 0, // Would need more complex calculation
      avgOrdersPerCustomer:
        uniqueCustomers > 0 ? orders.length / uniqueCustomers : 0,
    },
    products: {
      total: products.length,
      categories: categories.length,
      avgPrice: avgPrice,
      withImages: productsWithImages,
    },
    categories: {
      total: categories.length,
      avgOrder: 0, // Would need more complex calculation
    },
    inventory: {
      totalStock: totalStock,
      lowStockItems: lowStockItems,
      outOfStockItems: outOfStockItems,
      lowStockThreshold: 10,
    },
    orderTypes: orderTypes,
  };
};

export const StatisticsServices = {
  getStatisticsFromDB,
};
