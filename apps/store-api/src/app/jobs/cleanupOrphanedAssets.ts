/**
 * Cleanup Orphaned Assets Job
 * 
 * This job finds and deletes assets that:
 * 1. Have refCount = 0 (not referenced by any entity)
 * 2. Were marked as unused more than X days ago (grace period)
 * 
 * Run this job periodically (e.g., daily via cron) to clean up storage.
 */

import { AssetServices } from "../module/Asset/asset.service";

interface CleanupOptions {
    gracePeriodDays?: number;
    dryRun?: boolean;
}

export async function cleanupOrphanedAssets(options: CleanupOptions = {}) {
    const { gracePeriodDays = 7, dryRun = false } = options;

    console.log(`[Asset Cleanup] Starting cleanup job...`);
    console.log(`[Asset Cleanup] Grace period: ${gracePeriodDays} days`);
    console.log(`[Asset Cleanup] Dry run: ${dryRun}`);

    const startTime = Date.now();

    // Get orphaned assets
    const orphans = await AssetServices.getOrphanedAssets(gracePeriodDays);
    console.log(`[Asset Cleanup] Found ${orphans.length} orphaned assets`);

    if (orphans.length === 0) {
        console.log(`[Asset Cleanup] No assets to clean up`);
        return {
            success: true,
            total: 0,
            deleted: 0,
            failed: 0,
            dryRun,
            duration: Date.now() - startTime,
        };
    }

    // Log orphans for audit
    for (const asset of orphans) {
        console.log(`[Asset Cleanup] Orphan: ${asset.publicId} (unused since ${asset.markedUnusedAt})`);
    }

    // Perform cleanup if not dry run
    if (dryRun) {
        console.log(`[Asset Cleanup] Dry run - skipping deletion`);
        return {
            success: true,
            total: orphans.length,
            deleted: 0,
            failed: 0,
            dryRun,
            wouldDelete: orphans.map(a => ({ id: a.id, publicId: a.publicId })),
            duration: Date.now() - startTime,
        };
    }

    const result = await AssetServices.cleanupOrphanedAssets(gracePeriodDays);

    console.log(`[Asset Cleanup] Cleanup complete:`);
    console.log(`[Asset Cleanup] - Total: ${result.total}`);
    console.log(`[Asset Cleanup] - Deleted: ${result.deleted}`);
    console.log(`[Asset Cleanup] - Failed: ${result.failed}`);

    if (result.errors.length > 0) {
        console.error(`[Asset Cleanup] Errors:`);
        result.errors.forEach(err => console.error(`  - ${err}`));
    }

    return {
        success: result.failed === 0,
        ...result,
        dryRun,
        duration: Date.now() - startTime,
    };
}

/**
 * Schedule cleanup job (for use with node-cron or similar)
 * 
 * Example usage with node-cron:
 * ```
 * import cron from 'node-cron';
 * import { scheduleAssetCleanup } from './jobs/cleanupOrphanedAssets';
 * 
 * // Run daily at 3 AM
 * cron.schedule('0 3 * * *', () => scheduleAssetCleanup());
 * ```
 */
export async function scheduleAssetCleanup() {
    try {
        const result = await cleanupOrphanedAssets({ gracePeriodDays: 7 });
        console.log(`[Asset Cleanup] Scheduled job completed:`, result);
        return result;
    } catch (error) {
        console.error(`[Asset Cleanup] Scheduled job failed:`, error);
        throw error;
    }
}
