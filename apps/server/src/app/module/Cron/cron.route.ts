/**
 * Cron Routes
 * 
 * HTTP endpoints for triggering background jobs.
 * 
 * Security Note: These endpoints should be protected in production:
 * - API key authentication
 * - IP whitelist
 * - Internal network only
 */

import express from "express";
import { CronControllers } from "./cron.controller";

const router = express.Router();

// Sync delivery status from courier APIs
// GET /api/v1/cron/sync-delivery-status
// Query params: ?tenantId=xxx (optional, to sync specific tenant)
router.get("/sync-delivery-status", CronControllers.syncDeliveryStatus);

// Cleanup orphaned assets from Cloudinary
// GET /api/v1/cron/cleanup-assets
// Query params: ?gracePeriodDays=7&dryRun=true
router.get("/cleanup-assets", CronControllers.cleanupAssets);

export const CronRoutes = router;
