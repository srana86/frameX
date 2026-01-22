/**
 * Order Service - Prisma Version
 * Multi-tenant order operations using Prisma ORM
 */

import { prisma, Prisma, OrderStatus, PaymentStatus } from "@framex/database";
import { StatusCodes } from "http-status-codes";
import AppError from "../../errors/AppError";

/**
 * Generate unique order number for tenant
 */
const generateOrderNumber = async (tenantId: string): Promise<string> => {
    const count = await prisma.order.count({ where: { tenantId } });
    const date = new Date();
    const prefix = `ORD-${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}`;
    return `${prefix}-${String(count + 1).padStart(5, "0")}`;
};

/**
 * Get all orders with pagination and filters
 */
const getAllOrders = async (
    tenantId: string,
    query: {
        page?: number;
        limit?: number;
        status?: OrderStatus;
        customerId?: string;
        startDate?: string;
        endDate?: string;
    }
) => {
    const { page = 1, limit = 20, status, customerId, startDate, endDate } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.OrderWhereInput = {
        tenantId,
        ...(status && { status }),
        ...(customerId && { customerId }),
        ...(startDate && endDate && {
            createdAt: {
                gte: new Date(startDate),
                lte: new Date(endDate),
            },
        }),
    };

    const [orders, total] = await Promise.all([
        prisma.order.findMany({
            where,
            include: {
                customer: true,
                items: {
                    include: { product: { select: { name: true, images: true } } },
                },
                payment: true,
            },
            orderBy: { createdAt: "desc" },
            skip,
            take: limit,
        }),
        prisma.order.count({ where }),
    ]);

    return {
        data: orders,
        meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
};

/**
 * Get order by ID
 */
const getOrderById = async (tenantId: string, orderId: string) => {
    const order = await prisma.order.findFirst({
        where: { tenantId, id: orderId },
        include: {
            customer: true,
            items: {
                include: { product: true },
            },
            payment: true,
        },
    });

    if (!order) {
        throw new AppError(StatusCodes.NOT_FOUND, "Order not found");
    }

    return order;
};

/**
 * Create new order
 */
const createOrder = async (
    tenantId: string,
    data: {
        customerId?: string;
        customerData?: { name: string; phone: string; email?: string; address?: string };
        items: Array<{ productId: string; quantity: number }>;
        deliveryAddress?: string;
        notes?: string;
        couponCode?: string;
    }
) => {
    // Find or create customer
    let customerId = data.customerId;

    if (!customerId && data.customerData) {
        const { phone, ...customerInfo } = data.customerData;
        const customer = await prisma.customer.upsert({
            where: {
                tenantId_phone: { tenantId, phone },
            },
            update: customerInfo,
            create: {
                tenantId,
                phone,
                ...customerInfo,
            },
        });
        customerId = customer.id;
    }

    // Get products and calculate totals
    const productIds = data.items.map((item) => item.productId);
    const products = await prisma.product.findMany({
        where: { tenantId, id: { in: productIds } },
    });

    const productMap = new Map(products.map((p) => [p.id, p]));

    let subtotal = 0;
    const orderItems = data.items.map((item) => {
        const product = productMap.get(item.productId);
        if (!product) {
            throw new AppError(StatusCodes.BAD_REQUEST, `Product ${item.productId} not found`);
        }
        const price = Number(product.price);
        subtotal += price * item.quantity;
        return {
            productId: item.productId,
            name: product.name,
            price,
            quantity: item.quantity,
        };
    });

    // Generate order number
    const orderNumber = await generateOrderNumber(tenantId);

    // Create order with items and payment
    const order = await prisma.order.create({
        data: {
            tenantId,
            customerId,
            orderNumber,
            subtotal,
            total: subtotal, // Add discount/delivery logic as needed
            deliveryAddress: data.deliveryAddress,
            notes: data.notes,
            couponCode: data.couponCode,
            items: {
                create: orderItems,
            },
            payment: {
                create: {
                    tenantId,
                    amount: subtotal,
                    status: PaymentStatus.PENDING,
                },
            },
        },
        include: {
            customer: true,
            items: true,
            payment: true,
        },
    });

    return order;
};

/**
 * Update order status
 */
const updateOrderStatus = async (
    tenantId: string,
    orderId: string,
    status: OrderStatus
) => {
    const order = await prisma.order.findFirst({
        where: { tenantId, id: orderId },
    });

    if (!order) {
        throw new AppError(StatusCodes.NOT_FOUND, "Order not found");
    }

    return prisma.order.update({
        where: { id: orderId },
        data: { status },
        include: { customer: true, items: true, payment: true },
    });
};

/**
 * Get order statistics
 */
const getOrderStats = async (tenantId: string, period: "day" | "week" | "month" = "month") => {
    const now = new Date();
    let startDate: Date;

    switch (period) {
        case "day":
            startDate = new Date(now.setHours(0, 0, 0, 0));
            break;
        case "week":
            startDate = new Date(now.setDate(now.getDate() - 7));
            break;
        case "month":
        default:
            startDate = new Date(now.setMonth(now.getMonth() - 1));
    }

    const [totalOrders, totalRevenue, statusCounts] = await Promise.all([
        prisma.order.count({
            where: { tenantId, createdAt: { gte: startDate } },
        }),
        prisma.order.aggregate({
            where: { tenantId, createdAt: { gte: startDate } },
            _sum: { total: true },
        }),
        prisma.order.groupBy({
            by: ["status"],
            where: { tenantId, createdAt: { gte: startDate } },
            _count: true,
        }),
    ]);

    return {
        totalOrders,
        totalRevenue: totalRevenue._sum.total || 0,
        statusBreakdown: statusCounts.reduce(
            (acc, curr) => ({ ...acc, [curr.status]: curr._count }),
            {}
        ),
    };
};

export const OrderServicesPrisma = {
    getAllOrders,
    getOrderById,
    createOrder,
    updateOrderStatus,
    getOrderStats,
};
