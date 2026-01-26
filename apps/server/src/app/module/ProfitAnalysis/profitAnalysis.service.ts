/* eslint-disable @typescript-eslint/no-explicit-any */
import { prisma, OrderStatus } from "@framex/database";

/**
 * Get profit analysis statistics for a tenant
 * @param tenantId - The tenant ID
 * @param period - The time period (7d, 30d, 90d, year)
 */
const getProfitAnalysisFromDB = async (tenantId: string, period: string = "30d") => {
    const now = new Date();
    let startDate = new Date();

    // Calculate start date based on period
    if (period === "7d") {
        startDate.setDate(now.getDate() - 7);
    } else if (period === "90d") {
        startDate.setDate(now.getDate() - 90);
    } else if (period === "year") {
        startDate = new Date(now.getFullYear(), 0, 1);
    } else {
        // Default 30d
        startDate.setDate(now.getDate() - 30);
    }

    // Fetch orders with items and products to get costs
    const orders = await prisma.order.findMany({
        where: {
            tenantId,
            status: OrderStatus.DELIVERED, // Only count delivered orders for profit analysis
            isDeleted: false,
            createdAt: {
                gte: startDate,
            },
        },
        include: {
            items: {
                include: {
                    product: true,
                },
            },
        },
        orderBy: {
            createdAt: "asc",
        },
    });

    // Summary calculations
    let totalRevenue = 0;
    let totalCost = 0;

    // Groupings
    const productMap = new Map<string, any>();
    const categoryMap = new Map<string, any>();
    const trendMap = new Map<string, any>();

    // Process orders
    orders.forEach((order) => {
        const dateKey = order.createdAt.toISOString().split("T")[0];

        // Initialize trend if not exists
        if (!trendMap.has(dateKey)) {
            trendMap.set(dateKey, { date: dateKey, revenue: 0, profit: 0 });
        }

        const dayTrend = trendMap.get(dateKey);
        let orderRevenue = Number(order.subtotal); // subtotal is revenue before shipping
        let orderCost = 0;

        order.items.forEach((item) => {
            const itemRevenue = Number(item.price) * item.quantity;
            const itemCost = (Number(item.product?.costPrice) || 0) * item.quantity;

            orderCost += itemCost;

            // Group by Product
            if (!productMap.has(item.productId)) {
                productMap.set(item.productId, {
                    id: item.productId,
                    name: item.name,
                    revenue: 0,
                    cost: 0,
                    profit: 0,
                    margin: 0,
                });
            }
            const productStats = productMap.get(item.productId);
            productStats.revenue += itemRevenue;
            productStats.cost += itemCost;

            // Group by Category
            const categoryName = (item.product as any)?.category?.name || "Uncategorized";
            if (!categoryMap.has(categoryName)) {
                categoryMap.set(categoryName, {
                    name: categoryName,
                    revenue: 0,
                    profit: 0,
                    margin: 0,
                });
            }
            const categoryStats = categoryMap.get(categoryName);
            categoryStats.revenue += itemRevenue;
            categoryStats.profit += (itemRevenue - itemCost);
        });

        totalRevenue += orderRevenue;
        totalCost += orderCost;

        dayTrend.revenue += orderRevenue;
        dayTrend.profit += (orderRevenue - orderCost);
    });

    // Format byProduct
    const byProduct = Array.from(productMap.values()).map((p) => {
        const profit = p.revenue - p.cost;
        return {
            ...p,
            profit,
            margin: p.revenue > 0 ? (profit / p.revenue) * 100 : 0,
        };
    }).sort((a, b) => b.profit - a.profit);

    // Format byCategory
    const byCategory = Array.from(categoryMap.values()).map((c) => {
        return {
            ...c,
            margin: c.revenue > 0 ? (c.profit / c.revenue) * 100 : 0,
        };
    }).sort((a, b) => b.profit - a.profit);

    // Format trend
    const trend = Array.from(trendMap.values());

    const grossProfit = totalRevenue - totalCost;
    const profitMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;

    return {
        summary: {
            totalRevenue,
            totalCost,
            grossProfit,
            profitMargin,
        },
        byProduct,
        byCategory,
        trend,
    };
};

export const ProfitAnalysisServices = {
    getProfitAnalysisFromDB,
};
