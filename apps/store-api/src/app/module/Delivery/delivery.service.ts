/* eslint-disable @typescript-eslint/no-explicit-any */
import AppError from "../../errors/AppError";
import { StatusCodes } from "http-status-codes";
import {
  DeliveryServiceConfig,
  CourierServicesConfig,
} from "../Config/config.model";
import {
  getCourierOrderStatus,
  createCourierOrder,
  getPathaoAccessToken,
} from "./courier.util";
import {
  CourierService,
  DeliveryDetails,
  OrderCourierInfo,
} from "./delivery.interface";
import { TOrder } from "../Order/order.interface";
import { Order } from "../Order/order.model";

// Get delivery config for storefront
const getStorefrontDeliveryConfigFromDB = async () => {
  const config = await DeliveryServiceConfig.findOne({
    id: "delivery-service-config",
  });

  if (!config) {
    return {
      enabled: true,
      methods: [
        {
          id: "standard",
          name: "Standard Delivery",
          cost: 0,
          estimatedDays: 3,
        },
      ],
    };
  }

  return {
    enabled: true,
    methods: [
      {
        id: "standard",
        name: "Standard Delivery",
        cost: config.defaultDeliveryCharge || 0,
        estimatedDays: 3,
      },
    ],
    freeShippingThreshold: (config as any).freeShippingThreshold,
  };
};

// Calculate shipping cost
const calculateShippingFromDB = async (payload: {
  city: string;
  area?: string;
  postalCode?: string;
  weight?: number;
  total?: number;
}) => {
  const config = await DeliveryServiceConfig.findOne({
    id: "delivery-service-config",
  });

  if (!config) {
    return {
      methods: [
        {
          id: "standard",
          name: "Standard Delivery",
          cost: 0,
          estimatedDays: 3,
        },
      ],
      freeShipping: false,
    };
  }

  let shippingCost = config.defaultDeliveryCharge || 0;

  // Check for specific delivery charges
  if (
    config.specificDeliveryCharges &&
    config.specificDeliveryCharges.length > 0
  ) {
    const normalize = (str: string) => str.toLowerCase().trim();

    // Try to match by area first
    if (payload.area) {
      const areaMatch = config.specificDeliveryCharges.find(
        (charge) => normalize(charge.location) === normalize(payload.area!)
      );
      if (areaMatch) {
        shippingCost = areaMatch.charge;
      }
    }

    // Try to match by city
    if (shippingCost === config.defaultDeliveryCharge) {
      const cityMatch = config.specificDeliveryCharges.find(
        (charge) => normalize(charge.location) === normalize(payload.city)
      );
      if (cityMatch) {
        shippingCost = cityMatch.charge;
      }
    }

    // Try partial matching
    if (shippingCost === config.defaultDeliveryCharge) {
      const partialMatch = config.specificDeliveryCharges.find((charge) => {
        const normalizedLocation = normalize(charge.location);
        const normalizedCity = normalize(payload.city);
        return (
          normalizedLocation.includes(normalizedCity) ||
          normalizedCity.includes(normalizedLocation)
        );
      });
      if (partialMatch) {
        shippingCost = partialMatch.charge;
      }
    }
  }

  // Check weight-based charges
  if (
    payload.weight &&
    config.weightBasedCharges &&
    config.weightBasedCharges.length > 0
  ) {
    const applicableCharge = config.weightBasedCharges.find(
      (charge) => payload.weight! >= charge.weight
    );
    if (applicableCharge) {
      shippingCost += applicableCharge.extraCharge;
    }
  }

  // Check free shipping threshold
  const freeShippingThreshold = (config as any).freeShippingThreshold;
  const freeShipping =
    freeShippingThreshold &&
    payload.total &&
    payload.total >= freeShippingThreshold;

  return {
    methods: [
      {
        id: "standard",
        name: "Standard Delivery",
        cost: freeShipping ? 0 : shippingCost,
        estimatedDays: 3,
      },
    ],
    freeShipping: freeShipping || false,
  };
};

// Get courier services config
const getCourierServicesConfigFromDB = async () => {
  let config = await CourierServicesConfig.findOne({
    id: "courier-services-config",
  });

  if (!config) {
    config = await CourierServicesConfig.create({
      id: "courier-services-config",
      services: [],
    });
  }

  return config;
};

// Send order to courier service
const sendOrderToCourierFromDB = async (
  orderId: string,
  serviceId: string,
  deliveryDetails: DeliveryDetails
) => {
  // Find the order by id field (not _id)
  const order = await Order.findOne({ id: orderId, isDeleted: false });
  if (!order) {
    throw new AppError(StatusCodes.NOT_FOUND, "Order not found");
  }

  // Get courier config
  const courierConfig = await getCourierServicesConfigFromDB();
  const service = courierConfig.services.find(
    (s: any) => s.id === serviceId && s.enabled
  );

  if (!service) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      "Courier service not enabled or not found"
    );
  }

  // Generate merchant tracking ID (simplified - you may want to use a better ID generation)
  const merchantTrackingId = `ORD${orderId.slice(-8).toUpperCase()}`;

  // Create courier order
  const orderData: TOrder = {
    id: order.id,
    createdAt: order.createdAt,
    status: order.status,
    orderType: order.orderType,
    items: order.items,
    subtotal: order.subtotal,
    discountPercentage: order.discountPercentage,
    discountAmount: order.discountAmount,
    vatTaxPercentage: order.vatTaxPercentage,
    vatTaxAmount: order.vatTaxAmount,
    shipping: order.shipping,
    total: order.total,
    paymentMethod: order.paymentMethod,
    paymentStatus: order.paymentStatus,
    paidAmount: order.paidAmount,
    paymentTransactionId: order.paymentTransactionId,
    paymentValId: order.paymentValId,
    customer: order.customer,
    couponCode: order.couponCode,
    couponId: order.couponId,
    affiliateCode: order.affiliateCode,
    affiliateId: order.affiliateId,
    affiliateCommission: order.affiliateCommission,
  };

  let createResult = await createCourierOrder(
    service as CourierService,
    orderData,
    merchantTrackingId,
    deliveryDetails
  );

  // For Paperfly, encode consignmentId as orderId|phone
  if (service.id === "paperfly") {
    const phone = deliveryDetails.recipientPhone;
    const encoded = `${createResult.consignmentId}|${phone}`;
    createResult = {
      ...createResult,
      consignmentId: encoded,
    };
  }

  // Update order with courier info
  const courierInfo = {
    serviceId: service.id,
    consignmentId: createResult.consignmentId,
    trackingNumber: createResult.consignmentId,
    status: createResult.deliveryStatus,
  };

  await Order.findOneAndUpdate(
    { id: orderId, isDeleted: false },
    { $set: { courier: courierInfo } },
    { new: true }
  );

  return {
    ...courierInfo,
    serviceName: service.name,
    deliveryStatus: createResult.deliveryStatus,
    lastSyncedAt: new Date().toISOString(),
    rawStatus: createResult.rawStatus,
  };
};

// Check courier order status
const checkCourierOrderStatusFromDB = async (
  orderId: string,
  serviceId: string,
  consignmentId?: string
) => {
  // Find the order by id field (not _id)
  const order = await Order.findOne({ id: orderId, isDeleted: false });
  if (!order) {
    throw new AppError(StatusCodes.NOT_FOUND, "Order not found");
  }

  // Get courier config
  const courierConfig = await getCourierServicesConfigFromDB();
  const service = courierConfig.services.find(
    (s: any) => s.id === serviceId && s.enabled
  );

  if (!service) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      "Courier service not enabled or not found"
    );
  }

  // Use consignmentId from order if not provided
  let trackingId = consignmentId;
  if (!trackingId && order.courier?.consignmentId) {
    trackingId = order.courier.consignmentId;
  }

  if (!trackingId) {
    throw new AppError(StatusCodes.BAD_REQUEST, "Consignment ID is required");
  }

  // Get status from courier
  const statusResult = await getCourierOrderStatus(
    service as CourierService,
    trackingId
  );

  // Update order with latest status
  const courierInfo = {
    serviceId: service.id,
    consignmentId: statusResult.consignmentId,
    trackingNumber: statusResult.consignmentId,
    status: statusResult.deliveryStatus,
  };

  await Order.findOneAndUpdate(
    { id: orderId, isDeleted: false },
    { $set: { courier: courierInfo } },
    { new: true }
  );

  return {
    ...courierInfo,
    serviceName: service.name,
    deliveryStatus: statusResult.deliveryStatus,
    lastSyncedAt: new Date().toISOString(),
    rawStatus: statusResult.rawStatus,
  };
};

export const DeliveryServices = {
  getStorefrontDeliveryConfigFromDB,
  calculateShippingFromDB,
  getCourierServicesConfigFromDB,
  sendOrderToCourierFromDB,
  checkCourierOrderStatusFromDB,
};
