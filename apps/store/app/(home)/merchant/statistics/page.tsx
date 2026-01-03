import type { Metadata } from "next";
import { StatisticsClient } from "./StatisticsClient";
import { requireAuth } from "@/lib/auth-helpers";
import { getMerchantCollectionForAPI, buildMerchantQuery } from "@/lib/api-helpers";
import type { Order } from "@/lib/types";

export const metadata: Metadata = {
  title: "Merchant · Statistics",
  description: "Comprehensive statistics and analytics for your store",
};

async function getStatisticsData() {
  try {
    const ordersCol = await getMerchantCollectionForAPI("orders");
    const paymentsCol = await getMerchantCollectionForAPI("payment_transactions");
    const productsCol = await getMerchantCollectionForAPI("products");
    const categoriesCol = await getMerchantCollectionForAPI("product_categories");
    const inventoryCol = await getMerchantCollectionForAPI("inventory");
    const query = await buildMerchantQuery();

    // Fetch all data
    const [orders, payments, products, categories, inventoryItems] = await Promise.all([
      ordersCol.find(query).toArray(),
      paymentsCol.find(query).toArray(),
      productsCol.find(query).toArray(),
      categoriesCol.find(query).toArray(),
      inventoryCol.find(query).toArray(),
    ]);

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
    const last7Days = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const last30Days = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

    // Helper to check if date is in range
    const isInRange = (date: Date, start: Date, end?: Date) => {
      const d = new Date(date);
      return d >= start && (!end || d <= end);
    };

    // Orders Statistics
    const ordersData = orders as any[];
    const totalOrders = ordersData.length;
    const ordersByStatus = {
      pending: ordersData.filter((o) => o.status === "pending").length,
      processing: ordersData.filter((o) => o.status === "processing").length,
      shipped: ordersData.filter((o) => o.status === "shipped").length,
      delivered: ordersData.filter((o) => o.status === "delivered").length,
      cancelled: ordersData.filter((o) => o.status === "cancelled").length,
    };

    const totalRevenue = ordersData.reduce((sum, o) => sum + (Number(o.total) || 0), 0);
    const paidRevenue = ordersData
      .filter((o) => o.paymentStatus === "completed")
      .reduce((sum, o) => sum + (Number(o.paidAmount || o.total) || 0), 0);
    const pendingRevenue = ordersData.filter((o) => o.paymentStatus !== "completed").reduce((sum, o) => sum + (Number(o.total) || 0), 0);

    const ordersToday = ordersData.filter((o) => isInRange(new Date(o.createdAt), today)).length;
    const ordersLast7Days = ordersData.filter((o) => isInRange(new Date(o.createdAt), last7Days)).length;
    const ordersLast30Days = ordersData.filter((o) => isInRange(new Date(o.createdAt), last30Days)).length;
    const ordersThisMonth = ordersData.filter((o) => isInRange(new Date(o.createdAt), thisMonthStart)).length;
    const ordersLastMonth = ordersData.filter((o) => isInRange(new Date(o.createdAt), lastMonthStart, lastMonthEnd)).length;

    const revenueToday = ordersData
      .filter((o) => isInRange(new Date(o.createdAt), today))
      .reduce((sum, o) => sum + (Number(o.total) || 0), 0);
    const revenueLast7Days = ordersData
      .filter((o) => isInRange(new Date(o.createdAt), last7Days))
      .reduce((sum, o) => sum + (Number(o.total) || 0), 0);
    const revenueLast30Days = ordersData
      .filter((o) => isInRange(new Date(o.createdAt), last30Days))
      .reduce((sum, o) => sum + (Number(o.total) || 0), 0);
    const revenueThisMonth = ordersData
      .filter((o) => isInRange(new Date(o.createdAt), thisMonthStart))
      .reduce((sum, o) => sum + (Number(o.total) || 0), 0);
    const revenueLastMonth = ordersData
      .filter((o) => isInRange(new Date(o.createdAt), lastMonthStart, lastMonthEnd))
      .reduce((sum, o) => sum + (Number(o.total) || 0), 0);

    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    const revenueGrowth = revenueLastMonth > 0 ? ((revenueThisMonth - revenueLastMonth) / revenueLastMonth) * 100 : 0;
    const ordersGrowth = ordersLastMonth > 0 ? ((ordersThisMonth - ordersLastMonth) / ordersLastMonth) * 100 : 0;

    // Payments Statistics
    const paymentsData = payments as any[];
    const totalPayments = paymentsData.length;
    const successfulPayments = paymentsData.filter((p) => p.status === "VALID" || p.status === "completed").length;
    const failedPayments = paymentsData.filter((p) => p.status === "FAILED" || p.status === "failed").length;
    const paymentSuccessRate = totalPayments > 0 ? (successfulPayments / totalPayments) * 100 : 0;
    const totalPaymentAmount = paymentsData
      .filter((p) => p.status === "VALID" || p.status === "completed")
      .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

    const paymentsToday = paymentsData.filter((p) => isInRange(new Date(p.createdAt), today)).length;
    const paymentsLast7Days = paymentsData.filter((p) => isInRange(new Date(p.createdAt), last7Days)).length;
    const paymentsLast30Days = paymentsData.filter((p) => isInRange(new Date(p.createdAt), last30Days)).length;

    // Customers Statistics
    const customerMap = new Map<string, { orders: number; totalSpent: number; firstOrder: Date; lastOrder: Date }>();
    ordersData.forEach((order) => {
      const customerId = order.customer?.email || order.customer?.phone;
      if (!customerId) return;

      const existing = customerMap.get(customerId);
      const orderDate = new Date(order.createdAt);
      const orderTotal = Number(order.total) || 0;

      if (existing) {
        existing.orders += 1;
        existing.totalSpent += orderTotal;
        if (orderDate < existing.firstOrder) existing.firstOrder = orderDate;
        if (orderDate > existing.lastOrder) existing.lastOrder = orderDate;
      } else {
        customerMap.set(customerId, {
          orders: 1,
          totalSpent: orderTotal,
          firstOrder: orderDate,
          lastOrder: orderDate,
        });
      }
    });

    const totalCustomers = customerMap.size;
    const newCustomersLast30Days = Array.from(customerMap.values()).filter(
      (c) => isInRange(c.firstOrder, last30Days) && c.orders === 1
    ).length;
    const repeatCustomers = Array.from(customerMap.values()).filter((c) => c.orders > 1).length;
    const customerRetentionRate = totalCustomers > 0 ? (repeatCustomers / totalCustomers) * 100 : 0;
    const avgOrdersPerCustomer = totalCustomers > 0 ? totalOrders / totalCustomers : 0;

    // Products Statistics
    const productsData = products as any[];
    const totalProducts = productsData.length;
    const uniqueCategories = new Set(productsData.map((p) => p.category).filter(Boolean)).size;
    const totalProductPrice = productsData.reduce((sum, p) => sum + (Number(p.price) || 0), 0);
    const avgProductPrice = totalProducts > 0 ? totalProductPrice / totalProducts : 0;
    const productsWithImages = productsData.filter((p) => p.images && p.images.length > 0 && p.images[0] !== "/file.svg").length;

    // Categories Statistics
    const categoriesData = categories as any[];
    const totalCategories = categoriesData.length;
    const avgCategoryOrder =
      categoriesData.length > 0 ? categoriesData.reduce((sum, c) => sum + (Number(c.order) || 0), 0) / categoriesData.length : 0;

    // Inventory Statistics
    const inventoryData = inventoryItems as any[];
    const totalStock = inventoryData.reduce((sum, inv) => sum + (Number(inv.quantity) || 0), 0);
    const lowStockThreshold = 10; // Default threshold
    const lowStockItems = inventoryData.filter((inv) => Number(inv.quantity) <= lowStockThreshold && Number(inv.quantity) > 0).length;
    const outOfStockItems = inventoryData.filter((inv) => Number(inv.quantity) <= 0).length;

    // Daily revenue for last 30 days (for chart)
    const dailyRevenue: { date: string; revenue: number; orders: number }[] = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
      const dateStr = date.toISOString().split("T")[0];
      const dayOrders = ordersData.filter((o) => {
        const orderDate = new Date(o.createdAt).toISOString().split("T")[0];
        return orderDate === dateStr;
      });
      dailyRevenue.push({
        date: dateStr,
        revenue: dayOrders.reduce((sum, o) => sum + (Number(o.total) || 0), 0),
        orders: dayOrders.length,
      });
    }

    // Payment methods breakdown
    const paymentMethods = {
      cod: ordersData.filter((o) => o.paymentMethod === "cod").length,
      online: ordersData.filter((o) => o.paymentMethod === "online").length,
    };

    // Order types breakdown
    const orderTypes = {
      online: ordersData.filter((o) => o.orderType === "online" || !o.orderType).length,
      offline: ordersData.filter((o) => o.orderType === "offline").length,
    };

    return {
      orders: {
        total: totalOrders,
        byStatus: ordersByStatus,
        today: ordersToday,
        last7Days: ordersLast7Days,
        last30Days: ordersLast30Days,
        thisMonth: ordersThisMonth,
        lastMonth: ordersLastMonth,
        growth: parseFloat(ordersGrowth.toFixed(2)),
      },
      revenue: {
        total: parseFloat(totalRevenue.toFixed(2)),
        paid: parseFloat(paidRevenue.toFixed(2)),
        pending: parseFloat(pendingRevenue.toFixed(2)),
        today: parseFloat(revenueToday.toFixed(2)),
        last7Days: parseFloat(revenueLast7Days.toFixed(2)),
        last30Days: parseFloat(revenueLast30Days.toFixed(2)),
        thisMonth: parseFloat(revenueThisMonth.toFixed(2)),
        lastMonth: parseFloat(revenueLastMonth.toFixed(2)),
        avgOrderValue: parseFloat(avgOrderValue.toFixed(2)),
        growth: parseFloat(revenueGrowth.toFixed(2)),
        daily: dailyRevenue,
      },
      payments: {
        total: totalPayments,
        successful: successfulPayments,
        failed: failedPayments,
        successRate: parseFloat(paymentSuccessRate.toFixed(2)),
        totalAmount: parseFloat(totalPaymentAmount.toFixed(2)),
        today: paymentsToday,
        last7Days: paymentsLast7Days,
        last30Days: paymentsLast30Days,
        methods: paymentMethods,
      },
      customers: {
        total: totalCustomers,
        newLast30Days: newCustomersLast30Days,
        repeat: repeatCustomers,
        retentionRate: parseFloat(customerRetentionRate.toFixed(2)),
        avgOrdersPerCustomer: parseFloat(avgOrdersPerCustomer.toFixed(2)),
      },
      products: {
        total: totalProducts,
        categories: uniqueCategories,
        avgPrice: parseFloat(avgProductPrice.toFixed(2)),
        withImages: productsWithImages,
      },
      categories: {
        total: totalCategories,
        avgOrder: parseFloat(avgCategoryOrder.toFixed(2)),
      },
      inventory: {
        totalStock: totalStock,
        lowStockItems: lowStockItems,
        outOfStockItems: outOfStockItems,
        lowStockThreshold: lowStockThreshold,
      },
      orderTypes: orderTypes,
    };
  } catch (error: any) {
    console.error("Failed to fetch statistics:", error);
    throw new Error("Failed to fetch statistics data");
  }
}

export default async function StatisticsPage() {
  await requireAuth("merchant");
  const data = await getStatisticsData();

  return <StatisticsClient initialData={data} />;
}
