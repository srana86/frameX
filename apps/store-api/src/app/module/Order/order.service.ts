/* eslint-disable @typescript-eslint/no-explicit-any */
import AppError from "../../errors/AppError";
import { StatusCodes } from "http-status-codes";
import { Order } from "./order.model";
import QueryBuilder from "../../builder/QueryBuilder";
import { TOrder } from "./order.interface";
import { Product } from "../Product/product.model";
import { CouponServices } from "../Coupon/coupon.service";
import { ConfigServices } from "../Config/config.service";
import { emitOrderCreated } from "../../socket/socket.emitter";
import { createAndEmitNotification } from "../../utils/emitNotification";

// Get all orders with pagination, filter, and search
const getAllOrdersFromDB = async (query: Record<string, unknown>) => {
  // Query orders where isDeleted is false or doesn't exist (for backward compatibility)
  const orderQuery = new QueryBuilder(
    Order.find({
      $or: [{ isDeleted: false }, { isDeleted: { $exists: false } }],
    }),
    query
  )
    .search(["id", "customer.fullName", "customer.phone", "customer.email"])
    .filter()
    .sort()
    .paginate()
    .fields();

  const result = await orderQuery.modelQuery;
  const meta = await orderQuery.countTotal();

  return {
    meta,
    data: result,
  };
};

// Get single order by ID
const getSingleOrderFromDB = async (id: string) => {
  const result = await Order.findOne({ id, isDeleted: false });

  if (!result) {
    throw new AppError(StatusCodes.NOT_FOUND, "Order not found");
  }

  return result;
};

// Create order
const createOrderIntoDB = async (payload: TOrder) => {
  // Generate ID if not provided
  if (!payload.id) {
    payload.id = `ORD${Date.now()}${Math.random().toString(36).substr(2, 9)}`;
  }

  // Validate stock availability
  for (const item of payload.items) {
    const product = await Product.findOne({
      $or: [{ id: item.productId }, { slug: item.productId }],
      isDeleted: false,
    });

    if (!product) {
      throw new AppError(
        StatusCodes.NOT_FOUND,
        `Product ${item.name} not found`
      );
    }

    if (product.stock !== undefined && product.stock < item.quantity) {
      throw new AppError(
        StatusCodes.BAD_REQUEST,
        `Insufficient stock for ${item.name}`
      );
    }
  }

  const result = await Order.create(payload);

  // Update product stock (decrement)
  for (const item of payload.items) {
    await Product.updateOne(
      {
        $or: [{ id: item.productId }, { slug: item.productId }],
      },
      { $inc: { stock: -item.quantity } }
    );
  }

  // Emit real-time order created event
  try {
    // Extract merchantId from order (if available) or use a default
    const merchantId =
      (payload as any).merchantId ||
      (result as any).merchantId ||
      (result as any).userId;
    if (merchantId) {
      emitOrderCreated(merchantId, result);
    }
  } catch (error) {
    // Log but don't fail the order creation if socket emit fails
    console.error("Failed to emit order created event:", error);
  }

  // Create notification for merchant (order received)
  try {
    const merchantId = (result as any).merchantId || (result as any).userId;
    if (merchantId) {
      await createAndEmitNotification(merchantId, {
        title: "New Order Received",
        message: `Order #${result.id} has been placed`,
        type: "order",
        link: `/orders/${result.id}`,
        data: { orderId: result.id },
      });
    }
  } catch (error) {
    console.error("Failed to create order notification:", error);
  }

  return result;
};

// Update order
const updateOrderIntoDB = async (id: string, payload: Partial<TOrder>) => {
  const result = await Order.findOneAndUpdate(
    { id, isDeleted: false },
    payload,
    {
      new: true,
      runValidators: true,
    }
  );

  if (!result) {
    throw new AppError(StatusCodes.NOT_FOUND, "Order not found");
  }

  return result;
};

// Delete order (soft delete)
const deleteOrderFromDB = async (id: string) => {
  const result = await Order.findOneAndUpdate(
    { id, isDeleted: false },
    { isDeleted: true },
    {
      new: true,
    }
  );

  if (!result) {
    throw new AppError(StatusCodes.NOT_FOUND, "Order not found");
  }

  return { ok: true };
};

// Get orders for current user
const getUserOrdersFromDB = async (
  userId: string,
  query: Record<string, unknown>
) => {
  // Find orders where customer email or phone matches user
  const user = await import("../User/user.model").then((m) => m.User);
  const userDoc = await user.findOne({ id: userId, isDeleted: false });

  if (!userDoc) {
    throw new AppError(StatusCodes.NOT_FOUND, "User not found");
  }

  const customerQueryConditions: any[] = [];
  if (userDoc.email) {
    customerQueryConditions.push({ "customer.email": userDoc.email });
  }
  if (userDoc.phone) {
    customerQueryConditions.push({ "customer.phone": userDoc.phone });
  }

  // Query orders where isDeleted is false or doesn't exist (for backward compatibility)
  const baseQuery = {
    $and: [
      { $or: customerQueryConditions },
      { $or: [{ isDeleted: false }, { isDeleted: { $exists: false } }] },
    ],
  };

  const orderQuery = new QueryBuilder(Order.find(baseQuery), query)
    .search(["id"])
    .filter()
    .sort()
    .paginate()
    .fields();

  const result = await orderQuery.modelQuery;
  const meta = await orderQuery.countTotal();

  return {
    meta,
    data: result,
  };
};

// Assign courier to order
const assignCourierToOrder = async (
  orderId: string,
  courierData: { serviceId: string; consignmentId?: string }
) => {
  const result = await Order.findOneAndUpdate(
    { id: orderId, isDeleted: false },
    {
      courier: {
        serviceId: courierData.serviceId,
        consignmentId: courierData.consignmentId,
      },
    },
    {
      new: true,
      runValidators: true,
    }
  );

  if (!result) {
    throw new AppError(StatusCodes.NOT_FOUND, "Order not found");
  }

  return result;
};

// Remove courier from order
const removeCourierFromOrder = async (orderId: string) => {
  const result = await Order.findOneAndUpdate(
    { id: orderId, isDeleted: false },
    { $unset: { courier: "" } },
    {
      new: true,
    }
  );

  if (!result) {
    throw new AppError(StatusCodes.NOT_FOUND, "Order not found");
  }

  return result;
};

// Send order to courier service
const sendOrderToCourierService = async (
  orderId: string,
  serviceId: string,
  deliveryDetails: any
) => {
  // Use dynamic import to avoid circular dependency
  const deliveryModule = await import("../Delivery/delivery.service");
  return await deliveryModule.DeliveryServices.sendOrderToCourierFromDB(
    orderId,
    serviceId,
    deliveryDetails
  );
};

// Check courier order status
const checkCourierOrderStatus = async (
  orderId: string,
  serviceId?: string,
  consignmentId?: string
) => {
  // Use dynamic import to avoid circular dependency
  const deliveryModule = await import("../Delivery/delivery.service");
  // If serviceId not provided, get it from order
  if (!serviceId) {
    const order = await Order.findOne({ id: orderId, isDeleted: false });
    if (!order?.courier?.serviceId) {
      throw new AppError(
        StatusCodes.BAD_REQUEST,
        "Order does not have a courier assigned"
      );
    }
    return await deliveryModule.DeliveryServices.checkCourierOrderStatusFromDB(
      orderId,
      order.courier.serviceId,
      consignmentId
    );
  }
  return await deliveryModule.DeliveryServices.checkCourierOrderStatusFromDB(
    orderId,
    serviceId,
    consignmentId
  );
};

// Sync courier status for all orders (for current merchant)
const syncCourierStatusFromDB = async () => {
  // Query orders where isDeleted is false or doesn't exist (for backward compatibility)
  const orders = await Order.find({
    $and: [
      { $or: [{ isDeleted: false }, { isDeleted: { $exists: false } }] },
      { "courier.serviceId": { $exists: true, $ne: null } },
      { status: { $nin: ["delivered", "cancelled"] } },
    ],
  }).limit(100); // Limit to prevent timeout

  const results = {
    totalOrders: orders.length,
    updated: 0,
    failed: 0,
    skipped: 0,
    errorCount: 0,
    sampleErrors: [] as string[],
  };

  for (const order of orders) {
    try {
      if (!order.courier?.serviceId || !order.courier?.consignmentId) {
        results.skipped++;
        continue;
      }

      // Use dynamic import to avoid circular dependency
      const deliveryModule = await import("../Delivery/delivery.service");
      await deliveryModule.DeliveryServices.checkCourierOrderStatusFromDB(
        order.id,
        order.courier.serviceId,
        order.courier.consignmentId
      );

      results.updated++;
    } catch (error: any) {
      results.failed++;
      results.errorCount++;
      if (results.sampleErrors.length < 5) {
        results.sampleErrors.push(error.message || String(error));
      }
    }
  }

  return {
    success: true,
    message: "Courier status sync completed",
    results,
    timestamp: new Date().toISOString(),
  };
};

// Place order using product slug (simplified API)
const placeOrderFromDB = async (payload: {
  productSlug: string;
  quantity: number;
  size?: string;
  color?: string;
  customer: TOrder["customer"];
  paymentMethod?: "cod" | "online";
  shipping?: number;
  notes?: string;
  couponCode?: string;
  sourceTracking?: TOrder["sourceTracking"];
}) => {
  // Find product by slug
  const product = await Product.findOne({
    slug: payload.productSlug,
    isDeleted: false,
  });

  if (!product) {
    throw new AppError(StatusCodes.NOT_FOUND, "Product not found");
  }

  // Check stock availability
  if (product.stock !== undefined && product.stock < payload.quantity) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      `Insufficient stock. Available: ${product.stock}, Requested: ${payload.quantity}`
    );
  }

  // Check if customer is blocked
  const { BlockedCustomerServices } = await import(
    "../BlockedCustomer/blockedCustomer.service"
  );
  const blockedCheck = await BlockedCustomerServices.checkBlockedCustomerFromDB(
    payload.customer.phone,
    payload.customer.email
  );

  if (blockedCheck.isBlocked) {
    throw new AppError(
      StatusCodes.FORBIDDEN,
      `Order blocked: ${blockedCheck.block?.reason || "Customer is blocked"}`
    );
  }

  // Calculate pricing
  const basePrice = Number(product.price ?? 0);
  const discountPercentage = product.discountPercentage
    ? Number(product.discountPercentage)
    : 0;
  const discountedPrice =
    discountPercentage > 0
      ? basePrice * (1 - discountPercentage / 100)
      : basePrice;

  // Create cart line item
  const lineItem = {
    productId: product.id || String(product._id),
    slug: product.slug,
    name: product.name,
    price: discountedPrice,
    image: product.images?.[0] || "",
    size: payload.size,
    color: payload.color,
    quantity: payload.quantity,
    category: product.category,
  };

  // Calculate order totals
  let subtotal = discountedPrice * payload.quantity;
  const shipping = Number(payload.shipping ?? 0);
  const discountAmount =
    discountPercentage > 0
      ? (basePrice - discountedPrice) * payload.quantity
      : 0;

  // Apply coupon if provided
  let couponDiscount = 0;
  let couponId: string | undefined;
  let freeShipping = false;
  if (payload.couponCode) {
    const couponResult = await CouponServices.applyCouponToCart({
      code: payload.couponCode,
      cartSubtotal: subtotal,
      cartItems: [lineItem],
      customerEmail: payload.customer.email,
      customerPhone: payload.customer.phone,
      isFirstOrder: true, // TODO: Check actual first order status
      shippingCost: shipping,
    });

    if (couponResult.success && couponResult.coupon) {
      couponDiscount = couponResult.discount || 0;
      couponId = couponResult.coupon.id;
      freeShipping = couponResult.freeShipping || false;
    }
  }

  const finalShipping = freeShipping ? 0 : shipping;
  const total = subtotal - couponDiscount + finalShipping;

  // Create order object
  const orderData: TOrder = {
    id: `ORD${Date.now()}${Math.random().toString(36).substr(2, 9)}`,
    createdAt: new Date(),
    status: "pending",
    orderType: "online",
    items: [lineItem],
    subtotal: discountedPrice * payload.quantity,
    discountPercentage: discountPercentage > 0 ? discountPercentage : undefined,
    discountAmount: discountAmount > 0 ? discountAmount : undefined,
    shipping: finalShipping,
    total,
    paymentMethod: payload.paymentMethod || "cod",
    paymentStatus: "pending",
    customer: {
      ...payload.customer,
      notes: payload.notes,
    },
    couponCode: payload.couponCode,
    couponId,
    sourceTracking: payload.sourceTracking,
  };

  // Create order
  const result = await Order.create(orderData);

  // Update product stock
  await Product.updateOne(
    { id: product.id || product._id },
    { $inc: { stock: -payload.quantity } }
  );

  // Record coupon usage if coupon was applied
  if (payload.couponCode && couponId) {
    await CouponServices.recordCouponUsage({
      couponId,
      couponCode: payload.couponCode,
      orderId: result.id,
      customerId: undefined,
      customerEmail: payload.customer.email,
      customerPhone: payload.customer.phone,
      discountApplied: couponDiscount,
      orderTotal: total,
    });
  }

  // Emit real-time order created event
  try {
    const { emitOrderCreated } = await import("../../socket/socket.emitter");
    // For place order, we need to determine merchantId
    // In production, this should come from the request context or order data
    const merchantId = (result as any).merchantId || "default";
    if (merchantId && merchantId !== "default") {
      emitOrderCreated(merchantId, result);
    }
  } catch (error) {
    console.error("Failed to emit order created event:", error);
  }

  // Create notification for merchant (new order via place order API)
  try {
    const { createAndEmitNotification } = await import(
      "../../utils/emitNotification"
    );
    const merchantId = (result as any).merchantId || "default";
    if (merchantId && merchantId !== "default") {
      await createAndEmitNotification(merchantId, {
        title: "New Order Received",
        message: `Order #${result.id} has been placed via simplified API`,
        type: "order",
        link: `/orders/${result.id}`,
        data: { orderId: result.id },
      });
    }
  } catch (error) {
    console.error("Failed to create order notification:", error);
  }

  return result;
};

// Generate order receipt
const generateOrderReceiptFromDB = async (orderId: string) => {
  const order = await Order.findOne({ id: orderId, isDeleted: false });

  if (!order) {
    throw new AppError(StatusCodes.NOT_FOUND, "Order not found");
  }

  const brandConfig = await ConfigServices.getBrandConfigFromDB();

  // Calculate totals
  const subtotal = order.items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  let discountAmount = order.discountAmount ?? 0;
  if (order.discountPercentage && order.discountPercentage > 0) {
    discountAmount = (subtotal * order.discountPercentage) / 100;
  }

  const subtotalAfterDiscount = Math.max(0, subtotal - discountAmount);

  let vatTaxAmount = order.vatTaxAmount ?? 0;
  if (order.vatTaxPercentage && order.vatTaxPercentage > 0) {
    vatTaxAmount = (subtotalAfterDiscount * order.vatTaxPercentage) / 100;
  }

  const total = subtotalAfterDiscount + vatTaxAmount + (order.shipping || 0);

  return {
    order,
    brandConfig,
    totals: {
      subtotal,
      discountAmount,
      vatTaxAmount,
      shipping: order.shipping || 0,
      total,
    },
  };
};

export const OrderServices = {
  getAllOrdersFromDB,
  getSingleOrderFromDB,
  createOrderIntoDB,
  updateOrderIntoDB,
  deleteOrderFromDB,
  getUserOrdersFromDB,
  assignCourierToOrder,
  removeCourierFromOrder,
  sendOrderToCourierService,
  checkCourierOrderStatus,
  syncCourierStatusFromDB,
  placeOrderFromDB,
  generateOrderReceiptFromDB,
};
