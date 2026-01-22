import cron from "node-cron";
import { redis } from "./lib/redis";
import { runSyncDeliveryStatus, scheduleAssetCleanup } from "./app/jobs";

/**
 * Distributed Job Runner
 * Ensures only one instance runs the job by acquiring a Redis lock.
 */
async function runExclusiveJob(jobName: string, jobFn: () => Promise<any>, lockTtlMs = 60000) {
    const lockKey = `cron:lock:${jobName}`;
    const instanceId = process.env.HOSTNAME || `instance-${Math.random()}`;

    try {
        // Try to acquire lock: NX = propery must not exist, PX = generic TTL in milliseconds
        const acquired = await redis.set(lockKey, instanceId, {
            NX: true,
            PX: lockTtlMs
        });

        if (acquired === 'OK') {
            console.log(`[Cron] 🔒 Acquired lock for ${jobName}, running job...`);
            await jobFn();
            console.log(`[Cron] ✅ Job ${jobName} completed.`);
        } else {
            // Lock exists, another instance is running it
            // Intentionally silent to keep logs clean
        }
    } catch (error) {
        console.error(`[Cron] ❌ Error trying to run ${jobName}:`, error);
    }
}

/**
 * Initialize System Cron Jobs
 * Call this from server.ts after Redis connects
 */
export const initCronJobs = () => {
    console.log("[Cron] 🕰️  Initializing distributed cron scheduler...");

    // 1. Sync Delivery Status
    // Runs every 2 hours
    cron.schedule("0 */2 * * *", () => {
        runExclusiveJob('sync-delivery', runSyncDeliveryStatus, 5 * 60 * 1000); // 5 min lock
    });

    // 2. Cleanup Orphaned Assets
    // Runs daily at 3 AM
    cron.schedule("0 3 * * *", () => {
        runExclusiveJob('asset-cleanup', scheduleAssetCleanup, 10 * 60 * 1000); // 10 min lock
    });

    console.log("[Cron] ✅ Scheduler active (Distributed Mode).");
};