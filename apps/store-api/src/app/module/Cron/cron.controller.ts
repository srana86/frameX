/* eslint-disable @typescript-eslint/no-explicit-any */
import { StatusCodes } from "http-status-codes";
import { Request, Response } from "express";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { prisma } from "@framex/database"; // Prisma
import { getCourierOrderStatus } from "../Delivery/courier.util";
import { CourierService } from "../Delivery/delivery.interface";

// Sync delivery status for all merchants (cron job)
const syncDeliveryStatus = catchAsync(async (req: Request, res: Response) => {
  // Get all orders with courier info that are not in final states
  // In Prisma, we check the relation 'courier'
  const orders = await prisma.order.findMany({
    where: {
      isDeleted: false,
      courier: {
        isNot: null,
        serviceId: { not: null }, // Assuming serviceId is not nullable in OrderCourier if strict, but safe to check
        consignmentId: { not: null }
      },
      // Status check: 'delivered' and 'cancelled' are string values? Or Enum?
      // OrderStatus enum usually: PENDING, PROCESSING, SHIPPED, DELIVERED, CANCELLED
      // Mongoose used lowercase strings. Prisma usually uses Uppercase Enum.
      // We should check 'DELIVERED', 'CANCELLED'.
      // But let's assume loose string if status is string.
      // Schema says `status OrderStatus` (Enum).
      status: { notIn: ["DELIVERED", "CANCELLED"] },
    },
    include: { courier: true },
    take: 500
  });

  const results = {
    totalMerchants: 1, // Single tenant for now
    totalOrders: orders.length,
    updated: 0,
    failed: 0,
    skipped: 0,
    errorCount: 0,
    sampleErrors: [] as string[],
  };

  // Get courier config
  // CourierServicesConfig in Prisma (check schema)
  // model CourierServicesConfig { id String @id, ... services Json ... }
  const courierConfig = await prisma.courierServicesConfig.findFirst({
    where: { id: "courier-services-config" }
  });

  if (
    !courierConfig ||
    !courierConfig.services ||
    !Array.isArray(courierConfig.services) ||
    courierConfig.services.length === 0
  ) {
    return sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "No courier services configured",
      data: {
        success: true,
        message: "No courier services configured",
        results,
        timestamp: new Date().toISOString(),
      },
    });
  }

  // Build map of enabled services
  const enabledServices = new Map<string, any>();
  courierConfig.services.forEach((service: any) => {
    if (service.enabled) {
      enabledServices.set(service.id, service);
    }
  });

  for (const order of orders) {
    try {
      if (!order.courier?.serviceId || !order.courier?.consignmentId) {
        results.skipped++;
        continue;
      }

      const service = enabledServices.get(order.courier.serviceId);
      if (!service) {
        results.skipped++;
        continue;
      }

      // Get status from courier
      const statusResult = await getCourierOrderStatus(
        service,
        order.courier.consignmentId
      );

      // Check if status changed
      if (statusResult.deliveryStatus !== order.courier.status) {
        // Update Courier Info in database
        // We update the related OrderCourier record
        await prisma.orderCourier.update({
          where: { orderId: order.id }, // orderId is unique
          data: {
            status: statusResult.deliveryStatus,
            consignmentId: statusResult.consignmentId
          }
        });

        // Optionally update Order status if mapped
        // e.g. if courier says "Delivered", update Order to "DELIVERED"
        if (String(statusResult.deliveryStatus).toLowerCase() === 'delivered') {
          await prisma.order.update({
            where: { id: order.id },
            data: { status: 'DELIVERED' }
          });
        }

        results.updated++;
      } else {
        results.skipped++;
      }

      // Small delay to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 100));
    } catch (error: any) {
      results.failed++;
      results.errorCount++;
      if (results.sampleErrors.length < 10) {
        results.sampleErrors.push(
          `Order ${order.id}: ${error.message || String(error)}`
        );
      }
    }
  }

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Delivery status sync completed",
    data: {
      success: true,
      message: "Delivery status sync completed",
      results,
      timestamp: new Date().toISOString(),
    },
  });
});

export const CronControllers = {
  syncDeliveryStatus,
};
