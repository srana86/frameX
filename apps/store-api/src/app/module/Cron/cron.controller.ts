/* eslint-disable @typescript-eslint/no-explicit-any */
import { StatusCodes } from "http-status-codes";
import { Request, Response } from "express";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { prisma } from "@framex/database"; // Prisma
import { getCourierOrderStatus } from "../Delivery/courier.util";
import { CourierService } from "../Delivery/delivery.interface";

// Sync delivery status for all merchants (cron job)
// Sync delivery status for all merchants (cron job)
const syncDeliveryStatus = catchAsync(async (req: Request, res: Response) => {
  const results = {
    totalTenants: 0,
    totalOrders: 0,
    updated: 0,
    failed: 0,
    skipped: 0,
    errorCount: 0,
    sampleErrors: [] as string[],
  };

  // 1. Get configs for all tenants that have courier services set up
  // heavily optimized to only fetch what's needed
  const courierConfigs = await prisma.courierServicesConfig.findMany({
    where: {
      services: {
        not: { equals: null }
      }
    }
  });

  results.totalTenants = courierConfigs.length;

  // 2. Process each tenant independenty 
  for (const config of courierConfigs) {
    const tenantId = config.tenantId;

    if (!config.services || !Array.isArray(config.services) || config.services.length === 0) {
      continue;
    }

    // Build map of enabled services for this tenant
    const enabledServices = new Map<string, any>();
    config.services.forEach((service: any) => {
      if (service.enabled) {
        enabledServices.set(service.id, service);
      }
    });

    if (enabledServices.size === 0) continue;

    // Get active orders for this tenant
    const orders = await prisma.order.findMany({
      where: {
        tenantId, // Tenant Isolation
        isDeleted: false,
        courierServiceId: { not: null }, // Flat field check
        consignmentId: { not: null },    // Flat field check
        status: {
          notIn: ["DELIVERED", "CANCELLED", "REFUNDED"] // Optimized status check
        },
        // Also check if we already have a final courier status to avoid API calls
        // Assuming 'courierStatus' is a string. If it's already 'Delivered', skip?
        // But maybe we want to double check? Let's check if courierStatus is NOT 'Delivered'
        // courierStatus: { not: 'Delivered' } // Optional optimization
      },
      select: {
        id: true,
        tenantId: true,
        courierServiceId: true,
        consignmentId: true,
        courierStatus: true,
        status: true
      },
      take: 50 // Process small batches per tenant per run to avoid timeouts
    });

    results.totalOrders += orders.length;

    // Chunking for concurrency control (VPS Optimization)
    // Process 5 orders at a time to be nice to CPUs and APIs
    const chunkSize = 5;
    for (let i = 0; i < orders.length; i += chunkSize) {
      const chunk = orders.slice(i, i + chunkSize);

      await Promise.all(chunk.map(async (order) => {
        try {
          if (!order.courierServiceId || !order.consignmentId) {
            results.skipped++;
            return;
          }

          const service = enabledServices.get(order.courierServiceId);
          if (!service) {
            results.skipped++;
            return;
          }

          // Get status from courier API
          const statusResult = await getCourierOrderStatus(
            service,
            order.consignmentId
          );

          // Check if status changed
          // statusResult.deliveryStatus vs order.courierStatus
          if (statusResult.deliveryStatus !== order.courierStatus) {
            const updateData: any = {
              courierStatus: statusResult.deliveryStatus,
              consignmentId: statusResult.consignmentId // Sometimes tracking IDs change/normalize
            };

            // Map Courier "Delivered" -> Order "DELIVERED"
            if (String(statusResult.deliveryStatus).toLowerCase() === 'delivered') {
              updateData.status = 'DELIVERED';
            }

            // Update Order
            await prisma.order.update({
              where: { id: order.id },
              data: updateData
            });

            results.updated++;
          } else {
            results.skipped++;
          }

        } catch (error: any) {
          results.failed++;
          results.errorCount++;
          if (results.sampleErrors.length < 10) {
            results.sampleErrors.push(
              `[${tenantId}] Order ${order.id}: ${error.message || String(error)}`
            );
          }
        }
      }));
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
