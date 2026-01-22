/* eslint-disable @typescript-eslint/no-explicit-any */
import { prisma, PrismaQueryBuilder, Decimal } from "@framex/database";
import { StatusCodes } from "http-status-codes";
import AppError from "../../errors/AppError";

export type TOrderItem = {
  productId: string;
  slug?: string;
  name: string;
  price: number;
  image?: string;
  size?: string;
  color?: string;
  quantity: number;
  category?: string;
};

export type TOrderCustomer = {
  fullName: string;
  email?: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  postalCode: string;
  notes?: string;
};

export type TOrderCreate = {
  tenantId: string;
  status?: string;
  orderType?: string;
  items: TOrderItem[];
  subtotal: number;
  discountPercentage?: number;
  discountAmount?: number;
  vatTaxPercentage?: number;
  vatTaxAmount?: number;
  shipping?: number;
  total: number;
  paymentMethod: string;
  paymentStatus?: string;
  customer: TOrderCustomer;
  couponCode?: string;
  couponId?: string;
  affiliateCode?: string;
  affiliateId?: string;
  affiliateCommission?: number;
  sourceTracking?: {
    source?: string;
    medium?: string;
    campaign?: string;
    referrer?: string;
  };
};

// Generate unique order number
function generateOrderNumber(): string {
  return `ORD${Date.now()}${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
}

// Get all orders with pagination, filter, and search
const getAllOrdersFromDB = async (
  tenantId: string,
  query: Record<string, unknown>
) => {
  const orders = await prisma.order.findMany({
    where: { tenantId },
    include: {
      items: true,
      customer: true,
      payment: true,
    },
    orderBy: { createdAt: "desc" },
    take: Number(query.limit) || 100,
    skip: ((Number(query.page) || 1) - 1) * (Number(query.limit) || 100),
  });

  const total = await prisma.order.count({ where: { tenantId } });

  return {
    meta: {
      page: Number(query.page) || 1,
      limit: Number(query.limit) || 100,
      total,
      totalPage: Math.ceil(total / (Number(query.limit) || 100)),
    },
    data: orders,
  };
};

// Get single order by ID
const getSingleOrderFromDB = async (tenantId: string, id: string) => {
  // Try by both id and orderNumber
  const result = await prisma.order.findFirst({
    where: {
      tenantId,
      OR: [{ id }, { orderNumber: id }],
    },
    include: {
      items: true,
      customer: true,
      payment: true,
    },
  });

  if (!result) {
    throw new AppError(StatusCodes.NOT_FOUND, "Order not found");
  }

  return result;
};

// Create order
const createOrderIntoDB = async (payload: TOrderCreate) => {
  const orderNumber = generateOrderNumber();

  // Validate stock and get products
  const productIds = payload.items.map((item) => item.productId);
  const products = await prisma.product.findMany({
    where: {
      tenantId: payload.tenantId,
      OR: [
        { id: { in: productIds } },
        { slug: { in: payload.items.map((i) => i.slug).filter(Boolean) as string[] } },
      ],
    },
    include: { inventory: true },
  });

  // Check stock
  for (const item of payload.items) {
    const product = products.find(
      (p) => p.id === item.productId || p.slug === item.slug
    );
    if (!product) {
      throw new AppError(StatusCodes.NOT_FOUND, `Product ${item.name} not found`);
    }
    const stock = product.inventory?.quantity || 0;
    if (stock < item.quantity) {
      throw new AppError(
        StatusCodes.BAD_REQUEST,
        `Insufficient stock for ${item.name}`
      );
    }
  }

  // Create customer if needed
  let customer = await prisma.customer.findFirst({
    where: {
      tenantId: payload.tenantId,
      phone: payload.customer.phone,
    },
  });

  if (!customer) {
    customer = await prisma.customer.create({
      data: {
        tenantId: payload.tenantId,
        name: payload.customer.fullName,
        phone: payload.customer.phone,
        email: payload.customer.email,
        address: payload.customer.addressLine1,
        city: payload.customer.city,
        notes: payload.customer.notes,
      },
    });
  }

  // Create order with items
  const order = await prisma.order.create({
    data: {
      tenantId: payload.tenantId,
      customerId: customer.id,
      orderNumber,
      status: "PENDING",
      subtotal: new Decimal(payload.subtotal),
      discount: new Decimal(payload.discountAmount || 0),
      deliveryFee: new Decimal(payload.shipping || 0),
      total: new Decimal(payload.total),
      notes: payload.customer.notes,
      deliveryAddress: `${payload.customer.addressLine1}, ${payload.customer.city} ${payload.customer.postalCode}`,
      couponCode: payload.couponCode,
      items: {
        create: payload.items.map((item) => {
          const product = products.find(
            (p) => p.id === item.productId || p.slug === item.slug
          );
          return {
            productId: product?.id || item.productId,
            name: item.name,
            price: new Decimal(item.price),
            quantity: item.quantity,
          };
        }),
      },
    },
    include: {
      items: true,
      customer: true,
    },
  });

  // Update inventory
  for (const item of payload.items) {
    const product = products.find(
      (p) => p.id === item.productId || p.slug === item.slug
    );
    if (product?.inventory) {
      await prisma.inventory.update({
        where: { id: product.inventory.id },
        data: { quantity: { decrement: item.quantity } },
      });
    }
  }

  // Create notification for tenant
  await prisma.notification.create({
    data: {
      tenantId: payload.tenantId,
      userId: payload.tenantId, // Notify tenant admin
      title: "New Order Received",
      message: `Order #${orderNumber} has been placed`,
      type: "ORDER",
      link: `/orders/${order.id}`,
      data: { orderId: order.id },
    },
  });

  return order;
};

// Update order
const updateOrderIntoDB = async (
  tenantId: string,
  id: string,
  payload: { status?: string; notes?: string }
) => {
  const order = await prisma.order.findFirst({
    where: { tenantId, OR: [{ id }, { orderNumber: id }] },
  });

  if (!order) {
    throw new AppError(StatusCodes.NOT_FOUND, "Order not found");
  }

  const result = await prisma.order.update({
    where: { id: order.id },
    data: {
      status: payload.status as any,
      notes: payload.notes,
    },
    include: { items: true, customer: true },
  });

  return result;
};

// Delete order (soft)
const deleteOrderFromDB = async (tenantId: string, id: string) => {
  const order = await prisma.order.findFirst({
    where: { tenantId, OR: [{ id }, { orderNumber: id }] },
  });

  if (!order) {
    throw new AppError(StatusCodes.NOT_FOUND, "Order not found");
  }

  // For now, we'll actually delete - add soft delete if needed
  await prisma.order.delete({ where: { id: order.id } });

  return { ok: true };
};

// Get orders for customer
const getUserOrdersFromDB = async (
  tenantId: string,
  customerPhone: string,
  query: Record<string, unknown>
) => {
  const customer = await prisma.customer.findFirst({
    where: { tenantId, phone: customerPhone },
  });

  if (!customer) {
    return { meta: { page: 1, limit: 10, total: 0, totalPage: 0 }, data: [] };
  }

  const orders = await prisma.order.findMany({
    where: { tenantId, customerId: customer.id },
    include: { items: true },
    orderBy: { createdAt: "desc" },
    take: Number(query.limit) || 10,
    skip: ((Number(query.page) || 1) - 1) * (Number(query.limit) || 10),
  });

  const total = await prisma.order.count({
    where: { tenantId, customerId: customer.id },
  });

  return {
    meta: {
      page: Number(query.page) || 1,
      limit: Number(query.limit) || 10,
      total,
      totalPage: Math.ceil(total / (Number(query.limit) || 10)),
    },
    data: orders,
  };
};

// Generate order receipt
const generateOrderReceiptFromDB = async (tenantId: string, orderId: string) => {
  const order = await prisma.order.findFirst({
    where: { tenantId, OR: [{ id: orderId }, { orderNumber: orderId }] },
    include: { items: true, customer: true },
  });

  if (!order) {
    throw new AppError(StatusCodes.NOT_FOUND, "Order not found");
  }

  const brandConfig = await prisma.brandConfig.findUnique({
    where: { tenantId },
  });

  return {
    order,
    brandConfig,
    totals: {
      subtotal: Number(order.subtotal),
      discountAmount: Number(order.discount),
      shipping: Number(order.deliveryFee),
      total: Number(order.total),
    },
  };
};
// Assign courier to order
const assignCourierToOrder = async (
  id: string,
  payload: { serviceId: string; consignmentId?: string }
) => {
  const result = await prisma.order.update({
    where: { id },
    data: {
      courierServiceId: payload.serviceId,
      consignmentId: payload.consignmentId,
      trackingNumber: payload.consignmentId,
      courierStatus: "assigned",
    },
  });

  return result;
};

// Remove courier from order
const removeCourierFromOrder = async (id: string) => {
  const result = await prisma.order.update({
    where: { id },
    data: {
      courierServiceId: null,
      consignmentId: null,
      trackingNumber: null,
      courierStatus: null,
      courierMetadata: null as any,
    },
  });

  return result;
};

// Send order to courier service
const sendOrderToCourierService = async (
  id: string,
  serviceId: string,
  deliveryDetails: any
) => {
  const order = await prisma.order.findUnique({
    where: { id },
  });

  if (!order) {
    throw new AppError(StatusCodes.NOT_FOUND, "Order not found");
  }

  // Use DeliveryService to send order
  const { DeliveryServices } = await import("../Delivery/delivery.service");

  const courierResult = await DeliveryServices.sendOrderToCourierFromDB(
    order.tenantId,
    id,
    serviceId,
    deliveryDetails
  );

  // Update order with courier info
  const result = await prisma.order.update({
    where: { id },
    data: {
      courierServiceId: serviceId,
      consignmentId: courierResult.consignmentId,
      trackingNumber: courierResult.trackingNumber,
      courierStatus: courierResult.status,
      courierMetadata: courierResult.rawStatus,
    },
  });

  return result;
};

// Check courier order status
const checkCourierOrderStatus = async (id: string) => {
  const order = await prisma.order.findUnique({
    where: { id },
  });

  if (!order) {
    throw new AppError(StatusCodes.NOT_FOUND, "Order not found");
  }

  if (!order.courierServiceId || !order.consignmentId) {
    throw new AppError(StatusCodes.BAD_REQUEST, "Order fails courier information");
  }

  // Use DeliveryService to check status
  const { DeliveryServices } = await import("../Delivery/delivery.service");

  const statusResult = await DeliveryServices.checkCourierOrderStatusFromDB(
    order.tenantId,
    id,
    order.courierServiceId,
    order.consignmentId
  );

  // Update order with latest status
  const result = await prisma.order.update({
    where: { id },
    data: {
      courierStatus: statusResult.deliveryStatus,
      courierMetadata: statusResult.rawStatus,
    },
  });

  return result;
};

// Sync courier status
const syncCourierStatusFromDB = async () => {
  const orders = await prisma.order.findMany({
    where: {
      courierServiceId: { not: null },
      courierStatus: { notIn: ["delivered", "cancelled", "returned"] },
    },
    take: 50,
  });

  const results = [];
  const { DeliveryServices } = await import("../Delivery/delivery.service");

  for (const order of orders) {
    try {
      if (order.courierServiceId && order.consignmentId) {
        const statusResult = await DeliveryServices.checkCourierOrderStatusFromDB(
          order.tenantId,
          order.id,
          order.courierServiceId,
          order.consignmentId
        );

        await prisma.order.update({
          where: { id: order.id },
          data: {
            courierStatus: statusResult.deliveryStatus,
            courierMetadata: statusResult.rawStatus,
          },
        });
        results.push({ id: order.id, status: "updated", newStatus: statusResult.deliveryStatus });
      }
    } catch (error) {
      console.error(`Failed to sync order ${order.id}:`, error);
      results.push({ id: order.id, status: "failed", error });
    }
  }

  return {
    message: `Synced ${results.length} orders`,
    results,
  };
};

export const OrderServices = {
  getAllOrdersFromDB,
  getSingleOrderFromDB,
  createOrderIntoDB,
  updateOrderIntoDB,
  deleteOrderFromDB,
  getUserOrdersFromDB,
  generateOrderReceiptFromDB,
  assignCourierToOrder,
  removeCourierFromOrder,
  sendOrderToCourierService,
  checkCourierOrderStatus,
  syncCourierStatusFromDB,
  placeOrderFromDB: createOrderIntoDB
};
