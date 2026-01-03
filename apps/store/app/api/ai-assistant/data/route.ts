import { NextResponse } from "next/server";
import { getMerchantCollectionForAPI, buildMerchantQuery } from "@/lib/api-helpers";
import { requireAuth } from "@/lib/auth-helpers";

export const dynamic = "force-dynamic";

export interface AIAssistantData {
  // Brand Info
  brand: {
    name: string;
    tagline?: string;
    currency: string;
  };

  // Orders Overview
  orders: {
    total: number;
    pending: number;
    processing: number;
    restocking: number;
    packed: number;
    sentToLogistics: number;
    shipped: number;
    delivered: number;
    cancelled: number;
    todayCount: number;
    last7DaysCount: number;
    last30DaysCount: number;
    thisMonthCount: number;
    lastMonthCount: number;
  };

  // Revenue Overview
  revenue: {
    total: number;
    paid: number;
    pending: number;
    today: number;
    last7Days: number;
    last30Days: number;
    thisMonth: number;
    lastMonth: number;
    avgOrderValue: number;
    growth: number;
  };

  // Products Overview
  products: {
    total: number;
    totalCategories: number;
    avgPrice: number;
    totalStock: number;
    lowStockCount: number;
    outOfStockCount: number;
  };

  // Customers Overview
  customers: {
    total: number;
    newLast30Days: number;
    repeatCustomers: number;
    retentionRate: number;
    avgOrdersPerCustomer: number;
  };

  // Investments Overview
  investments: {
    total: number;
    count: number;
    avgInvestment: number;
    byCategory: Record<string, { total: number; count: number }>;
  };

  // Payments Overview
  payments: {
    total: number;
    successful: number;
    failed: number;
    successRate: number;
    codOrders: number;
    onlineOrders: number;
  };

  // Profit Analysis
  profit: {
    grossRevenue: number;
    totalInvestments: number;
    netProfit: number;
    profitMargin: number;
    shippingRevenue: number;
    productRevenueOnly: number;
  };

  // Top Performing
  topProducts: Array<{
    name: string;
    totalSold: number;
    revenue: number;
  }>;

  topCategories: Array<{
    name: string;
    totalOrders: number;
    revenue: number;
  }>;

  // Detailed Products List
  productsList: Array<{
    id: string;
    name: string;
    category: string;
    brand: string;
    price: number;
    buyPrice?: number;
    discountPercentage?: number;
    stock?: number;
    sku?: string;
    featured?: boolean;
    profitPerUnit?: number;
    profitMargin?: number;
    effectivePrice?: number; // Price after discount
  }>;

  // Recent Activity
  recentOrdersCount: {
    lastHour: number;
    last24Hours: number;
  };

  // Affiliate Overview (if applicable)
  affiliates?: {
    total: number;
    active: number;
    totalCommissions: number;
    pendingCommissions: number;
  };

  // Coupons Overview
  coupons?: {
    total: number;
    active: number;
    totalUsed: number;
    totalDiscount: number;
  };
}

/**
 * GET /api/ai-assistant/data
 * Returns comprehensive aggregated data for AI assistant context
 */
export async function GET() {
  try {
    await requireAuth("merchant");

    const query = await buildMerchantQuery();

    // Fetch all collections in parallel
    const [
      ordersCol,
      productsCol,
      categoriesCol,
      investmentsCol,
      paymentsCol,
      brandConfigCol,
      affiliatesCol,
      affiliateCommissionsCol,
      couponsCol,
    ] = await Promise.all([
      getMerchantCollectionForAPI("orders"),
      getMerchantCollectionForAPI("products"),
      getMerchantCollectionForAPI("product_categories"),
      getMerchantCollectionForAPI("investments"),
      getMerchantCollectionForAPI("payment_transactions"),
      getMerchantCollectionForAPI("brand_config"),
      getMerchantCollectionForAPI("affiliates"),
      getMerchantCollectionForAPI("affiliate_commissions"),
      getMerchantCollectionForAPI("coupons"),
    ]);

    // Fetch all data in parallel
    const [orders, products, categories, investments, payments, brandConfig, affiliates, commissions, coupons] = await Promise.all([
      ordersCol.find(query).toArray(),
      productsCol.find(query).toArray(),
      categoriesCol.find(query).toArray(),
      investmentsCol.find(query).toArray(),
      paymentsCol.find(query).toArray(),
      brandConfigCol.findOne({ id: "brand_config_v1" }),
      affiliatesCol.find(query).toArray(),
      affiliateCommissionsCol.find(query).toArray(),
      couponsCol.find(query).toArray(),
    ]);

    const ordersData = orders as any[];
    const productsData = products as any[];
    const investmentsData = investments as any[];
    const paymentsData = payments as any[];
    const affiliatesData = affiliates as any[];
    const commissionsData = commissions as any[];
    const couponsData = coupons as any[];

    // Date calculations
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const last7Days = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const last30Days = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

    const isInRange = (date: Date, start: Date, end?: Date) => {
      const d = new Date(date);
      return d >= start && (!end || d <= end);
    };

    // Helper function to get effective status (courier status first, then fallback to order status)
    const getEffectiveStatus = (order: any): string => {
      // Prioritize courier delivery status if available
      if (order.courier?.deliveryStatus) {
        const courierStatus = String(order.courier.deliveryStatus).toLowerCase().trim();

        // Map courier statuses to our standard statuses (most specific first)
        if (courierStatus.includes("delivered") || courierStatus.includes("completed") || courierStatus.includes("delivery completed")) {
          return "delivered";
        }
        if (
          courierStatus.includes("cancelled") ||
          courierStatus.includes("canceled") ||
          courierStatus.includes("failed") ||
          courierStatus.includes("returned")
        ) {
          return "cancelled";
        }
        if (
          courierStatus.includes("shipped") ||
          courierStatus.includes("transit") ||
          courierStatus.includes("on-the-way") ||
          courierStatus.includes("on the way") ||
          courierStatus.includes("delivery-in-progress") ||
          courierStatus.includes("out for delivery") ||
          courierStatus.includes("in transit")
        ) {
          return "shipped";
        }
        if (
          courierStatus.includes("processing") ||
          courierStatus.includes("in_review") ||
          courierStatus.includes("in review") ||
          courierStatus.includes("ready-for-delivery") ||
          courierStatus.includes("ready for delivery") ||
          courierStatus.includes("pickup-pending") ||
          courierStatus.includes("pickup pending") ||
          courierStatus.includes("picked up")
        ) {
          return "processing";
        }
        // If courier status doesn't match known patterns, still use courier status but normalize
        // This ensures we prioritize real-time courier data
        return courierStatus;
      }

      // Fallback to order status
      const orderStatus = String(order.status || "pending")
        .toLowerCase()
        .trim();
      return orderStatus;
    };

    // Orders calculations
    const totalOrders = ordersData.length;

    // Count orders by effective status (courier status prioritized)
    const ordersByStatus = {
      pending: ordersData.filter((o) => {
        const status = getEffectiveStatus(o);
        return status === "pending";
      }).length,
      processing: ordersData.filter((o) => {
        const status = getEffectiveStatus(o);
        return status === "processing";
      }).length,
      restocking: ordersData.filter((o) => {
        const status = getEffectiveStatus(o);
        return status === "restocking";
      }).length,
      packed: ordersData.filter((o) => {
        const status = getEffectiveStatus(o);
        return status === "packed";
      }).length,
      sentToLogistics: ordersData.filter((o) => {
        const status = getEffectiveStatus(o);
        return status === "sent_to_logistics" || status === "senttologistics" || status === "sent to logistics";
      }).length,
      shipped: ordersData.filter((o) => {
        const status = getEffectiveStatus(o);
        return (
          status === "shipped" ||
          status.includes("transit") ||
          status.includes("on-the-way") ||
          status.includes("delivery-in-progress") ||
          status.includes("out for delivery")
        );
      }).length,
      delivered: ordersData.filter((o) => {
        const status = getEffectiveStatus(o);
        return status === "delivered" || status.includes("completed") || status.includes("delivery completed");
      }).length,
      cancelled: ordersData.filter((o) => {
        const status = getEffectiveStatus(o);
        return status === "cancelled" || status.includes("failed") || status.includes("returned") || status.includes("canceled");
      }).length,
    };

    // Revenue calculations
    const totalRevenue = ordersData.reduce((sum, o) => sum + (Number(o.total) || 0), 0);
    const paidRevenue = ordersData
      .filter((o) => o.paymentStatus === "completed")
      .reduce((sum, o) => sum + (Number(o.paidAmount || o.total) || 0), 0);
    const pendingRevenue = ordersData.filter((o) => o.paymentStatus !== "completed").reduce((sum, o) => sum + (Number(o.total) || 0), 0);

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

    // Order counts by time
    const ordersToday = ordersData.filter((o) => isInRange(new Date(o.createdAt), today)).length;
    const ordersLast7Days = ordersData.filter((o) => isInRange(new Date(o.createdAt), last7Days)).length;
    const ordersLast30Days = ordersData.filter((o) => isInRange(new Date(o.createdAt), last30Days)).length;
    const ordersThisMonth = ordersData.filter((o) => isInRange(new Date(o.createdAt), thisMonthStart)).length;
    const ordersLastMonth = ordersData.filter((o) => isInRange(new Date(o.createdAt), lastMonthStart, lastMonthEnd)).length;

    // Shipping revenue
    const totalShippingRevenue = ordersData.reduce((sum, o) => sum + (Number(o.shipping) || 0), 0);
    const productRevenueOnly = totalRevenue - totalShippingRevenue;

    // Products calculations
    const totalProducts = productsData.length;
    const totalCategories = categories.length;
    const avgProductPrice =
      productsData.length > 0 ? productsData.reduce((sum, p) => sum + (Number(p.price) || 0), 0) / productsData.length : 0;
    const totalStock = productsData.reduce((sum, p) => sum + (Number(p.stock) || 0), 0);
    const lowStockCount = productsData.filter((p) => {
      const stock = Number(p.stock) || 0;
      return stock > 0 && stock <= 10;
    }).length;
    const outOfStockCount = productsData.filter((p) => (Number(p.stock) || 0) <= 0).length;

    // Customers calculations
    const customerMap = new Map<string, { orders: number; totalSpent: number; firstOrder: Date }>();
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
      } else {
        customerMap.set(customerId, {
          orders: 1,
          totalSpent: orderTotal,
          firstOrder: orderDate,
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

    // Investments calculations
    const totalInvestments = investmentsData.reduce((sum, inv) => sum + (Number(inv.value) || 0), 0);
    const investmentsByCategory = investmentsData.reduce((acc, inv) => {
      const category = inv.category || "Uncategorized";
      if (!acc[category]) {
        acc[category] = { total: 0, count: 0 };
      }
      acc[category].total += Number(inv.value) || 0;
      acc[category].count += 1;
      return acc;
    }, {} as Record<string, { total: number; count: number }>);

    // Payments calculations
    const totalPayments = paymentsData.length;
    const successfulPayments = paymentsData.filter((p) => p.status === "VALID" || p.status === "completed").length;
    const failedPayments = paymentsData.filter((p) => p.status === "FAILED" || p.status === "failed").length;
    const paymentSuccessRate = totalPayments > 0 ? (successfulPayments / totalPayments) * 100 : 0;
    const codOrders = ordersData.filter((o) => o.paymentMethod === "cod").length;
    const onlineOrders = ordersData.filter((o) => o.paymentMethod === "online").length;

    // Profit calculations
    const netProfit = productRevenueOnly - totalInvestments;
    const profitMargin = productRevenueOnly > 0 ? (netProfit / productRevenueOnly) * 100 : 0;

    // Top products by sales
    const productSalesMap = new Map<string, { name: string; totalSold: number; revenue: number }>();
    ordersData.forEach((order) => {
      (order.items || []).forEach((item: any) => {
        const existing = productSalesMap.get(item.productId);
        if (existing) {
          existing.totalSold += item.quantity || 1;
          existing.revenue += (item.price || 0) * (item.quantity || 1);
        } else {
          productSalesMap.set(item.productId, {
            name: item.name || "Unknown",
            totalSold: item.quantity || 1,
            revenue: (item.price || 0) * (item.quantity || 1),
          });
        }
      });
    });

    const topProducts = Array.from(productSalesMap.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    // Top categories by revenue
    const categorySalesMap = new Map<string, { name: string; totalOrders: number; revenue: number }>();
    const productCategoryMap = new Map<string, string>();
    productsData.forEach((p) => {
      if (p._id && p.category) {
        productCategoryMap.set(String(p._id), p.category);
      }
    });

    ordersData.forEach((order) => {
      const orderCategories = new Set<string>();
      let orderRevenue = 0;

      (order.items || []).forEach((item: any) => {
        const category = productCategoryMap.get(item.productId) || "Uncategorized";
        orderCategories.add(category);

        const existing = categorySalesMap.get(category);
        const itemRevenue = (item.price || 0) * (item.quantity || 1);
        orderRevenue += itemRevenue;

        if (existing) {
          existing.revenue += itemRevenue;
        } else {
          categorySalesMap.set(category, {
            name: category,
            totalOrders: 0,
            revenue: itemRevenue,
          });
        }
      });

      // Count unique orders per category
      orderCategories.forEach((cat) => {
        const existing = categorySalesMap.get(cat);
        if (existing) {
          existing.totalOrders += 1;
        }
      });
    });

    const topCategories = Array.from(categorySalesMap.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    // Recent activity
    const ordersLastHour = ordersData.filter((o) => new Date(o.createdAt) >= oneHourAgo).length;
    const ordersLast24Hours = ordersData.filter((o) => new Date(o.createdAt) >= twentyFourHoursAgo).length;

    // Affiliates overview
    const affiliatesOverview =
      affiliatesData.length > 0
        ? {
            total: affiliatesData.length,
            active: affiliatesData.filter((a) => a.status === "active").length,
            totalCommissions: commissionsData.reduce((sum, c) => sum + (Number(c.commissionAmount) || 0), 0),
            pendingCommissions: commissionsData
              .filter((c) => c.status === "pending")
              .reduce((sum, c) => sum + (Number(c.commissionAmount) || 0), 0),
          }
        : undefined;

    // Coupons overview
    const couponsOverview =
      couponsData.length > 0
        ? {
            total: couponsData.length,
            active: couponsData.filter((c) => c.isActive !== false).length,
            totalUsed: couponsData.reduce((sum, c) => sum + (Number(c.usageCount) || 0), 0),
            totalDiscount: ordersData.reduce((sum, o) => sum + (Number(o.discountAmount) || 0), 0),
          }
        : undefined;

    // Brand info
    const brandInfo = {
      name: (brandConfig as any)?.brandName || "E-Commerce Store",
      tagline: (brandConfig as any)?.brandTagline,
      currency: (brandConfig as any)?.currency?.iso || "USD",
    };

    // Products list with detailed pricing and profit info
    const productsList = productsData.map((p: any) => {
      const price = Number(p.price) || 0;
      const buyPrice = p.buyPrice !== undefined ? Number(p.buyPrice) : undefined;
      const discountPercentage = p.discountPercentage !== undefined ? Number(p.discountPercentage) : 0;
      const effectivePrice = discountPercentage > 0 ? price * (1 - discountPercentage / 100) : price;
      const profitPerUnit = buyPrice !== undefined ? effectivePrice - buyPrice : undefined;
      const profitMargin = buyPrice !== undefined && buyPrice > 0 ? (profitPerUnit! / buyPrice) * 100 : undefined;

      return {
        id: String(p._id),
        name: p.name || "Unknown",
        category: p.category || "Uncategorized",
        brand: p.brand || "",
        price: parseFloat(price.toFixed(2)),
        buyPrice: buyPrice !== undefined ? parseFloat(buyPrice.toFixed(2)) : undefined,
        discountPercentage: discountPercentage > 0 ? parseFloat(discountPercentage.toFixed(2)) : undefined,
        stock: p.stock !== undefined ? Number(p.stock) : undefined,
        sku: p.sku || undefined,
        featured: Boolean(p.featured || false),
        profitPerUnit: profitPerUnit !== undefined ? parseFloat(profitPerUnit.toFixed(2)) : undefined,
        profitMargin: profitMargin !== undefined ? parseFloat(profitMargin.toFixed(2)) : undefined,
        effectivePrice: parseFloat(effectivePrice.toFixed(2)),
      };
    });

    const data: AIAssistantData = {
      brand: brandInfo,
      orders: {
        total: totalOrders,
        pending: ordersByStatus.pending,
        processing: ordersByStatus.processing,
        restocking: ordersByStatus.restocking,
        packed: ordersByStatus.packed,
        sentToLogistics: ordersByStatus.sentToLogistics,
        shipped: ordersByStatus.shipped,
        delivered: ordersByStatus.delivered,
        cancelled: ordersByStatus.cancelled,
        todayCount: ordersToday,
        last7DaysCount: ordersLast7Days,
        last30DaysCount: ordersLast30Days,
        thisMonthCount: ordersThisMonth,
        lastMonthCount: ordersLastMonth,
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
      },
      products: {
        total: totalProducts,
        totalCategories,
        avgPrice: parseFloat(avgProductPrice.toFixed(2)),
        totalStock,
        lowStockCount,
        outOfStockCount,
      },
      customers: {
        total: totalCustomers,
        newLast30Days: newCustomersLast30Days,
        repeatCustomers,
        retentionRate: parseFloat(customerRetentionRate.toFixed(2)),
        avgOrdersPerCustomer: parseFloat(avgOrdersPerCustomer.toFixed(2)),
      },
      investments: {
        total: parseFloat(totalInvestments.toFixed(2)),
        count: investmentsData.length,
        avgInvestment: investmentsData.length > 0 ? parseFloat((totalInvestments / investmentsData.length).toFixed(2)) : 0,
        byCategory: investmentsByCategory,
      },
      payments: {
        total: totalPayments,
        successful: successfulPayments,
        failed: failedPayments,
        successRate: parseFloat(paymentSuccessRate.toFixed(2)),
        codOrders,
        onlineOrders,
      },
      profit: {
        grossRevenue: parseFloat(totalRevenue.toFixed(2)),
        totalInvestments: parseFloat(totalInvestments.toFixed(2)),
        netProfit: parseFloat(netProfit.toFixed(2)),
        profitMargin: parseFloat(profitMargin.toFixed(2)),
        shippingRevenue: parseFloat(totalShippingRevenue.toFixed(2)),
        productRevenueOnly: parseFloat(productRevenueOnly.toFixed(2)),
      },
      topProducts,
      topCategories,
      productsList,
      recentOrdersCount: {
        lastHour: ordersLastHour,
        last24Hours: ordersLast24Hours,
      },
      affiliates: affiliatesOverview,
      coupons: couponsOverview,
    };

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error("GET /api/ai-assistant/data error:", error);
    if (error.message === "NEXT_REDIRECT") {
      throw error;
    }
    return NextResponse.json({ error: error?.message || "Failed to get AI assistant data" }, { status: 500 });
  }
}
