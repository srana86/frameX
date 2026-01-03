import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { getMerchantDb } from "@/lib/mongodb-tenant";
import { getCourierOrderStatus } from "@/lib/courier-status";
import type { OrderCourierInfo, Order } from "@/lib/types";
import type { CourierServicesConfig, CourierService } from "@/types/delivery-config-types";
import { emitOrderUpdate } from "@/lib/socket-emitter";

/**
 * Cron job to sync delivery status for all orders with courier info
 * Runs every 5 minutes to update courier delivery statuses across all merchants
 */
export async function GET(request: Request) {
  try {
    console.log("[Cron] Starting delivery status sync...");

    const mainDb = await getDb();
    const results = {
      totalMerchants: 0,
      totalOrders: 0,
      updated: 0,
      failed: 0,
      skipped: 0,
      errors: [] as string[],
    };

    // Get all merchants from the super-admin database
    const merchantsCollection = mainDb.collection("merchants");
    const merchants = await merchantsCollection.find({ isActive: true }).toArray();

    results.totalMerchants = merchants.length;
    console.log(`[Cron] Found ${merchants.length} active merchants`);

    for (const merchant of merchants) {
      const merchantId = String(merchant._id);
      const merchantDbName = merchant.database?.databaseName;

      if (!merchantDbName) {
        console.log(`[Cron] Skipping merchant ${merchantId}: No database configured`);
        continue;
      }

      try {
        // Get merchant-specific database
        const merchantDb = await getMerchantDb(merchantId);

        // Get courier services config for this merchant
        const courierConfigCollection = merchantDb.collection("courier_services_config");
        const courierConfig = (await courierConfigCollection.findOne({
          id: "courier_services_config_v1",
        })) as CourierServicesConfig | null;

        if (!courierConfig?.services?.length) {
          console.log(`[Cron] Skipping merchant ${merchantId}: No courier services configured`);
          continue;
        }

        // Build a map of enabled courier services
        const enabledServices = new Map<string, CourierService>();
        courierConfig.services.forEach((service) => {
          if (service.enabled) {
            enabledServices.set(service.id, service);
          }
        });

        if (enabledServices.size === 0) {
          console.log(`[Cron] Skipping merchant ${merchantId}: No enabled courier services`);
          continue;
        }

        // Get orders that have courier info and are not in final states
        const ordersCollection = merchantDb.collection("orders");
        const ordersToSync = await ordersCollection
          .find({
            "courier.consignmentId": { $exists: true, $ne: "" },
            "courier.serviceId": { $exists: true },
            status: { $nin: ["delivered", "cancelled"] }, // Skip final states
          })
          .toArray();

        console.log(`[Cron] Merchant ${merchantId}: Found ${ordersToSync.length} orders to sync`);
        results.totalOrders += ordersToSync.length;

        for (const orderDoc of ordersToSync) {
          const orderId = String(orderDoc._id);
          const courier = orderDoc.courier as OrderCourierInfo;

          if (!courier?.consignmentId || !courier?.serviceId) {
            results.skipped++;
            continue;
          }

          const service = enabledServices.get(courier.serviceId);
          if (!service) {
            console.log(`[Cron] Order ${orderId}: Courier service ${courier.serviceId} not enabled, skipping`);
            results.skipped++;
            continue;
          }

          try {
            // Get the current delivery status from courier API
            const statusResult = await getCourierOrderStatus(service, courier.consignmentId);

            // Check if status has changed
            if (statusResult.deliveryStatus !== courier.deliveryStatus) {
              const now = new Date().toISOString();
              const updatedCourier: OrderCourierInfo = {
                ...courier,
                deliveryStatus: statusResult.deliveryStatus,
                lastSyncedAt: now,
                rawStatus: statusResult.rawStatus,
              };

              // Update the order in database
              await ordersCollection.updateOne({ _id: orderDoc._id }, { $set: { courier: updatedCourier } });

              // Emit real-time update to merchant dashboard
              const updatedOrder: Order = {
                id: orderId,
                createdAt: orderDoc.createdAt,
                status: orderDoc.status,
                orderType: orderDoc.orderType || "online",
                items: orderDoc.items,
                subtotal: Number(orderDoc.subtotal ?? 0),
                discountPercentage: orderDoc.discountPercentage !== undefined ? Number(orderDoc.discountPercentage) : undefined,
                discountAmount: orderDoc.discountAmount !== undefined ? Number(orderDoc.discountAmount) : undefined,
                vatTaxPercentage: orderDoc.vatTaxPercentage !== undefined ? Number(orderDoc.vatTaxPercentage) : undefined,
                vatTaxAmount: orderDoc.vatTaxAmount !== undefined ? Number(orderDoc.vatTaxAmount) : undefined,
                shipping: Number(orderDoc.shipping ?? 0),
                total: Number(orderDoc.total ?? 0),
                paymentMethod: orderDoc.paymentMethod,
                paymentStatus: orderDoc.paymentStatus,
                paidAmount: orderDoc.paidAmount !== undefined ? Number(orderDoc.paidAmount) : undefined,
                paymentTransactionId: orderDoc.paymentTransactionId,
                paymentValId: orderDoc.paymentValId,
                customer: orderDoc.customer,
                courier: updatedCourier,
                couponCode: orderDoc.couponCode,
                couponId: orderDoc.couponId,
              };

              emitOrderUpdate(merchantId, updatedOrder);

              console.log(`[Cron] Order ${orderId}: Updated status from "${courier.deliveryStatus}" to "${statusResult.deliveryStatus}"`);
              results.updated++;
            } else {
              // Status unchanged, just update lastSyncedAt
              const now = new Date().toISOString();
              await ordersCollection.updateOne({ _id: orderDoc._id }, { $set: { "courier.lastSyncedAt": now } });
              results.skipped++;
            }
          } catch (orderError: any) {
            const errorMsg = `Order ${orderId} (${courier.serviceId}): ${orderError?.message || "Unknown error"}`;
            console.error(`[Cron] Error syncing order:`, errorMsg);
            results.errors.push(errorMsg);
            results.failed++;
          }

          // Add a small delay between API calls to avoid rate limiting
          await new Promise((resolve) => setTimeout(resolve, 200));
        }
      } catch (merchantError: any) {
        const errorMsg = `Merchant ${merchantId}: ${merchantError?.message || "Unknown error"}`;
        console.error(`[Cron] Error processing merchant:`, errorMsg);
        results.errors.push(errorMsg);
      }
    }

    console.log(`[Cron] Delivery status sync completed:`, results);

    return NextResponse.json({
      success: true,
      message: "Delivery status sync completed",
      results: {
        totalMerchants: results.totalMerchants,
        totalOrders: results.totalOrders,
        updated: results.updated,
        failed: results.failed,
        skipped: results.skipped,
        errorCount: results.errors.length,
        // Only include first 10 errors to avoid response size issues
        sampleErrors: results.errors.slice(0, 10),
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("[Cron] Critical error in delivery status sync:", error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Critical error in delivery status sync",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
