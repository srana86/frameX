export interface AIAssistantData {
    brand: {
        name: string;
        tagline?: string;
        currency: string;
    };
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
    products: {
        total: number;
        totalCategories: number;
        avgPrice: number;
        totalStock: number;
        lowStockCount: number;
        outOfStockCount: number;
    };
    customers: {
        total: number;
        newLast30Days: number;
        repeatCustomers: number;
        retentionRate: number;
        avgOrdersPerCustomer: number;
    };
    investments: {
        total: number;
        count: number;
        avgInvestment: number;
        byCategory: Record<string, { total: number; count: number }>;
    };
    payments: {
        total: number;
        successful: number;
        failed: number;
        successRate: number;
        codOrders: number;
        onlineOrders: number;
    };
    profit: {
        grossRevenue: number;
        totalInvestments: number;
        netProfit: number;
        profitMargin: number;
        shippingRevenue: number;
        productRevenueOnly: number;
    };
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
        effectivePrice?: number;
    }>;
    recentOrdersCount: {
        lastHour: number;
        last24Hours: number;
    };
    affiliates?: {
        total: number;
        active: number;
        totalCommissions: number;
        pendingCommissions: number;
    };
    coupons?: {
        total: number;
        active: number;
        totalUsed: number;
        totalDiscount: number;
    };
}

export interface ChatMessage {
    role: "user" | "assistant";
    content: string;
}

export interface ChatRequest {
    message: string;
    history?: ChatMessage[];
    data?: AIAssistantData;
}
