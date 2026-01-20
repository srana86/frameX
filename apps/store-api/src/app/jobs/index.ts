/**
 * Jobs Index
 * 
 * Central export for all background jobs.
 * Jobs can be triggered via:
 * - HTTP endpoints (see /module/Cron routes)
 * - Programmatic calls
 * - External schedulers (node-cron, AWS EventBridge, etc.)
 */

// Asset cleanup job
export {
    cleanupOrphanedAssets,
    scheduleAssetCleanup
} from "./cleanupOrphanedAssets";

// Delivery status sync job
export {
    syncDeliveryStatus,
    runSyncDeliveryStatus
} from "./syncDeliveryStatus";
