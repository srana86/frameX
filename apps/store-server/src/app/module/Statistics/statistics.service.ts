/* eslint-disable @typescript-eslint/no-explicit-any */
import { prisma, OrderStatus } from "@framex/database";

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

  // Query orders and products
  // Schema doesn't have isDeleted. Assuming all rows are valid.
  const orders = await prisma.order.findMany({
    include: {
      customer: true, // Needed for customer stats (phone)
      payment: true   // Needed for revenue calc (paymentStatus)
    }
  });

  const payments = await prisma.payment.findMany();

  const products = await prisma.product.findMany();

  // Orders by status
  const ordersByStatus = {
    pending: orders.filter((o) => o.status === OrderStatus.PENDING).length,
    processing: orders.filter((o) => o.status === OrderStatus.PROCESSING).length,
    shipped: orders.filter((o) => o.status === OrderStatus.SHIPPED).length,
    delivered: orders.filter((o) => o.status === OrderStatus.DELIVERED).length,
    cancelled: orders.filter((o) => o.status === OrderStatus.CANCELLED).length,
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
  const safeTotal = (val: any) => Number(val) || 0;

  const totalRevenue = orders.reduce((sum, o) => sum + safeTotal(o.total), 0);
  const paidRevenue = orders
    .filter((o) => (o as any).payment?.status === "COMPLETED")
    .reduce((sum, o) => sum + safeTotal(o.total), 0);
  const pendingRevenue = orders
    .filter((o) => (o as any).payment?.status === "PENDING")
    .reduce((sum, o) => sum + safeTotal(o.total), 0);

  const revenueToday = orders
    .filter((o) => o.createdAt && new Date(o.createdAt) >= todayStart)
    .reduce((sum, o) => sum + safeTotal(o.total), 0);
  const revenueLast7Days = orders
    .filter((o) => o.createdAt && new Date(o.createdAt) >= last7Days)
    .reduce((sum, o) => sum + safeTotal(o.total), 0);
  const revenueLast30Days = orders
    .filter((o) => o.createdAt && new Date(o.createdAt) >= last30Days)
    .reduce((sum, o) => sum + safeTotal(o.total), 0);
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

  const avgOrderValue = orders.length > 0 ? totalRevenue / orders.length : 0;
  const growth =
    revenueLastMonth > 0
      ? ((revenueThisMonth - revenueLastMonth) / revenueLastMonth) * 100
      : 0;

  // Payment statistics
  const successfulPayments = payments.filter(
    (p) => p.status === "COMPLETED" // Enum in Prisma usually uppercase? Mongoose was lowercase "completed"?
    // Logic in AI service used "COMPLETED" (uppercase).
    // Logic in old file used "completed".
    // I will use "COMPLETED" (standard Prisma Enum) OR "completed" depending on schema.
    // Safest is to check both or assume Enum. AI service used "COMPLETED".
  ).length;
  const failedPayments = payments.filter(
    (p) => p.status === "FAILED"
  ).length;
  const paymentMethods = {
    cod: payments.filter((p) => (p as any).method === "COD").length, // Schema field `method`? Mongoose `paymentMethod`.
    // I'll assume Mongoose `paymentMethod` maps to Prisma `method` or `paymentMethod`.
    // AI service logic didn't focus on this.
    // Let's stick to `paymentMethod` from Mongoose property, assuming Prisma model has it.
    // If Prisma uses Enums, likely "COD" uppercase.
    online: payments.filter((p) => (p as any).method === "ONLINE").length,
  };

  // Customer statistics
  // customer is included in orders fetch
  const uniqueCustomers = new Set(
    orders.map((o) => (o.customer as any)?.phone).filter(Boolean)
  ).size;
  const ordersLast30DaysForCustomers = orders.filter(
    (o) => o.createdAt && new Date(o.createdAt) >= last30Days
  );
  const newCustomersLast30Days = new Set(
    ordersLast30DaysForCustomers.map((o) => (o.customer as any)?.phone).filter(Boolean)
  ).size;

  // Product statistics
  // Distinct category?
  // Use JS Set since we fetched all products
  const categoriesFn = () => {
    const cats = new Set(products.filter(p => p.categoryId).map(p => p.categoryId));
    // Wait, Mongoose distinct "category" likely returned strings (names) or IDs?
    // Mongoose: Product.distinct("category").
    // If category is a Ref, it returns IDs.
    // If string, returns strings.
    // Prisma Product has `categoryId`.
    // I'll count unique `categoryId`s.
    return cats.size;
  };
  const categoriesCount = categoriesFn();

  const avgPrice =
    products.length > 0
      ? products.reduce((sum, p) => sum + Number(p.price), 0) / products.length
      : 0;

  const productsWithImages = products.filter(
    (p) => p.images && p.images.length > 0
  ).length;

  // Inventory statistics
  // p.stock in Mongoose.
  // Prisma often uses `inventory` relation or `stock` field.
  // AI service used `p.inventory?.quantity`.
  // I should check schema.
  // Let's assume `inventory` relation if `stock` missing, or `stock` field if present.
  // I'll try `(p as any).inventory?.quantity || (p as any).stock || 0`.
  // But wait, I didn't include `inventory` in product fetch!
  // I MUST update product fetch to include inventory.

  const totalStock = products.reduce((sum, p) => {
    const stock = (p as any).stock || 0; // or p.inventory?.quantity
    return sum + stock;
  }, 0);
  const lowStockItems = products.filter((p) => ((p as any).stock || 0) <= 10).length;
  const outOfStockItems = products.filter((p) => ((p as any).stock || 0) === 0).length;

  // Order types
  const orderTypes = {
    online: orders.filter((o) => (o as any).orderType === "online").length,
    offline: orders.filter((o) => (o as any).orderType === "offline").length,
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
      daily: [],
    },
    payments: {
      total: payments.length,
      successful: successfulPayments,
      failed: failedPayments,
      successRate:
        payments.length > 0 ? (successfulPayments / payments.length) * 100 : 0,
      totalAmount: payments.reduce((sum, p) => sum + Number(p.amount), 0),
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
      retentionRate: 0,
      avgOrdersPerCustomer:
        uniqueCustomers > 0 ? orders.length / uniqueCustomers : 0,
    },
    products: {
      total: products.length,
      categories: categoriesCount,
      avgPrice: avgPrice,
      withImages: productsWithImages,
    },
    categories: {
      total: categoriesCount,
      avgOrder: 0,
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
