/**
 * Sync Delivery Status Job
 * 
 * This job syncs delivery status from courier APIs for all tenants.
 * It checks orders that are in transit and updates their status.
 * 
 * Can be triggered via:
 * - HTTP endpoint: GET /api/v1/cron/sync-delivery-status
 * - Programmatically: import { syncDeliveryStatus } from './jobs/syncDeliveryStatus'
 * - Node-cron: cron.schedule('0 0-23/2 * * *', () => runSyncDeliveryStatus())
 */


import { prisma } from "@framex/database";
import { getCourierOrderStatus } from "../module/Delivery/courier.util";

interface SyncResult {
    totalTenants: number;
    totalOrders: number;
    updated: number;
    failed: number;
    skipped: number;
    errorCount: number;
    sampleErrors: string[];
}

interface SyncOptions {
    tenantId?: string; // Optional: only sync for specific tenant
    batchSize?: number; // Orders per tenant per run
    concurrency?: number; // Parallel order processing
}

export async function syncDeliveryStatus(options: SyncOptions = {}): Promise<SyncResult> {
    const { tenantId, batchSize = 50, concurrency = 5 } = options;

    const results: SyncResult = {
        totalTenants: 0,
        totalOrders: 0,
        updated: 0,
        failed: 0,
        skipped: 0,
        errorCount: 0,
        sampleErrors: [],
    };

    console.log(`[DeliverySync] Starting sync job...`);

    // 1. Get courier configs (optionally filtered by tenant)
    const courierConfigs = await prisma.courierServicesConfig.findMany({
        where: {
            ...(tenantId ? { tenantId } : {}),
            services: {
                not: { equals: null }
            }
        }
    });

    results.totalTenants = courierConfigs.length;
    console.log(`[DeliverySync] Found ${results.totalTenants} tenants with courier services`);

    // 2. Process each tenant
    for (const config of courierConfigs) {
        const currentTenantId = config.tenantId;

        if (!config.services || !Array.isArray(config.services) || config.services.length === 0) {
            continue;
        }

        // Build map of enabled services
        const enabledServices = new Map<string, any>();
        (config.services as any[]).forEach((service: any) => {
            if (service.enabled) {
                enabledServices.set(service.id, service);
            }
        });

        if (enabledServices.size === 0) continue;

        // Get active orders for this tenant
        const orders = await prisma.order.findMany({
            where: {
                tenantId: currentTenantId,
                isDeleted: false,
                courierServiceId: { not: null },
                consignmentId: { not: null },
                status: {
                    notIn: ["DELIVERED", "CANCELLED", "REFUNDED"]
                },
            },
            select: {
                id: true,
                tenantId: true,
                courierServiceId: true,
                consignmentId: true,
                courierStatus: true,
                status: true
            },
            take: batchSize
        });

        results.totalOrders += orders.length;

        // Process in chunks for concurrency control
        for (let i = 0; i < orders.length; i += concurrency) {
            const chunk = orders.slice(i, i + concurrency);

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
                    if (statusResult.deliveryStatus !== order.courierStatus) {
                        const updateData: any = {
                            courierStatus: statusResult.deliveryStatus,
                            consignmentId: statusResult.consignmentId
                        };

                        // Map Courier "Delivered" -> Order "DELIVERED"
                        if (String(statusResult.deliveryStatus).toLowerCase() === 'delivered') {
                            updateData.status = 'DELIVERED';
                        }

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
                            `[${currentTenantId}] Order ${order.id}: ${error.message || String(error)}`
                        );
                    }
                }
            }));
        }
    }

    console.log(`[DeliverySync] Sync complete: ${results.updated} updated, ${results.skipped} skipped, ${results.failed} failed`);
    return results;
}

/**
 * Run the sync job (for use with schedulers)
 */
export async function runSyncDeliveryStatus() {
    try {
        const result = await syncDeliveryStatus();
        console.log(`[DeliverySync] Scheduled job completed:`, result);
        return result;
    } catch (error) {
        console.error(`[DeliverySync] Scheduled job failed:`, error);
        throw error;
    }
}