import { NextResponse } from "next/server";
import { getMerchantCollectionForAPI, getMerchantIdForAPI, buildMerchantQuery } from "@/lib/api-helpers";
import { getCourierOrderStatus } from "@/lib/courier-status";
import type { OrderCourierInfo, Order } from "@/lib/types";
import type { CourierServicesConfig, CourierService } from "@/types/delivery-config-types";
import { emitOrderUpdate } from "@/lib/socket-emitter";

/**
 * Sync delivery status for all orders with courier info for the current merchant
 */
export async function POST() {
  try {
    const merchantId = await getMerchantIdForAPI();
    if (!merchantId) {
      return NextResponse.json({ error: "Unauthorized - No merchant context" }, { status: 401 });
    }

    console.log(`[Sync] Starting courier status sync for merchant ${merchantId}...`);

    const results = {
      totalOrders: 0,
      updated: 0,
      failed: 0,
      skipped: 0,
      errors: [] as string[],
    };

    // Get courier services config for this merchant
    const courierConfigCollection = await getMerchantCollectionForAPI("courier_services_config");
    const courierConfigQuery = await buildMerchantQuery({ id: "courier_services_config_v1" });
    const courierConfig = (await courierConfigCollection.findOne(courierConfigQuery)) as CourierServicesConfig | null;

    if (!courierConfig?.services?.length) {
      return NextResponse.json({
        success: true,
        message: "No courier services configured",
        results,
      });
    }

    // Build a map of enabled courier services
    const enabledServices = new Map<string, CourierService>();
    courierConfig.services.forEach((service) => {
      if (service.enabled) {
        enabledServices.set(service.id, service);
      }
    });

    if (enabledServices.size === 0) {
      return NextResponse.json({
        success: true,
        message: "No enabled courier services",
        results,
      });
    }

    // Get orders that have courier info and are not in final states
    const ordersCollection = await getMerchantCollectionForAPI("orders");
    const ordersToSync = await ordersCollection
      .find({
        "courier.consignmentId": { $exists: true, $ne: "" },
        "courier.serviceId": { $exists: true },
        status: { $nin: ["delivered", "cancelled"] }, // Skip final states
      })
      .toArray();

    console.log(`[Sync] Found ${ordersToSync.length} orders to sync`);
    results.totalOrders = ordersToSync.length;

    for (const orderDoc of ordersToSync) {
      const orderId = String(orderDoc._id);
      const courier = orderDoc.courier as OrderCourierInfo;

      if (!courier?.consignmentId || !courier?.serviceId) {
        results.skipped++;
        continue;
      }

      const service = enabledServices.get(courier.serviceId);
      if (!service) {
        console.log(`[Sync] Order ${orderId}: Courier service ${courier.serviceId} not enabled, skipping`);
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

          console.log(`[Sync] Order ${orderId}: Updated status from "${courier.deliveryStatus}" to "${statusResult.deliveryStatus}"`);
          results.updated++;
        } else {
          // Status unchanged, just update lastSyncedAt
          const now = new Date().toISOString();
          await ordersCollection.updateOne({ _id: orderDoc._id }, { $set: { "courier.lastSyncedAt": now } });
          results.skipped++;
        }
      } catch (orderError: any) {
        const errorMsg = `Order ${orderId} (${courier.serviceId}): ${orderError?.message || "Unknown error"}`;
        console.error(`[Sync] Error syncing order:`, errorMsg);
        results.errors.push(errorMsg);
        results.failed++;
      }

      // Add a small delay between API calls to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    console.log(`[Sync] Courier status sync completed for merchant ${merchantId}:`, results);

    return NextResponse.json({
      success: true,
      message: "Courier status sync completed",
      results: {
        totalOrders: results.totalOrders,
        updated: results.updated,
        failed: results.failed,
        skipped: results.skipped,
        errorCount: results.errors.length,
        sampleErrors: results.errors.slice(0, 5),
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("[Sync] Critical error in courier status sync:", error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Critical error in courier status sync",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
