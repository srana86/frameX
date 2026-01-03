import { StatusCodes } from "http-status-codes";
import { Request, Response } from "express";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { Order } from "../Order/order.model";
import { CourierServicesConfig } from "../Config/config.model";
import { getCourierOrderStatus } from "../Delivery/courier.util";
import { CourierService } from "../Delivery/delivery.interface";

// Sync delivery status for all merchants (cron job)
const syncDeliveryStatus = catchAsync(async (req: Request, res: Response) => {
  // Get all orders with courier info that are not in final states
  const orders = await Order.find({
    isDeleted: false,
    "courier.serviceId": { $exists: true, $ne: null },
    "courier.consignmentId": { $exists: true, $ne: null },
    status: { $nin: ["delivered", "cancelled"] },
  }).limit(500); // Limit to prevent timeout

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
  const courierConfig = await CourierServicesConfig.findOne({
    id: "courier-services-config",
  });

  if (
    !courierConfig ||
    !courierConfig.services ||
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
        await Order.findOneAndUpdate(
          { id: order.id },
          {
            $set: {
              "courier.status": statusResult.deliveryStatus,
              "courier.consignmentId": statusResult.consignmentId,
            },
          }
        );
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
