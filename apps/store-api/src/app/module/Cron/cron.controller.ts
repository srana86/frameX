/**
 * Cron Controller
 * 
 * HTTP endpoints for triggering background jobs.
 * These endpoints should be protected by API key or IP whitelist in production.
 */

import { StatusCodes } from "http-status-codes";
import { Request, Response } from "express";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { syncDeliveryStatus } from "../../jobs/syncDeliveryStatus";
import { cleanupOrphanedAssets } from "../../jobs/cleanupOrphanedAssets";

// Sync delivery status for all merchants
const syncDeliveryStatusHandler = catchAsync(async (req: Request, res: Response) => {
  const tenantId = req.query.tenantId as string | undefined;

  const results = await syncDeliveryStatus({ tenantId });

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Delivery status sync completed",
    data: {
      success: true,
      results,
      timestamp: new Date().toISOString(),
    },
  });
});

// Cleanup orphaned assets
const cleanupAssetsHandler = catchAsync(async (req: Request, res: Response) => {
  const gracePeriodDays = req.query.gracePeriodDays
    ? parseInt(req.query.gracePeriodDays as string)
    : 7;
  const dryRun = req.query.dryRun === 'true';

  const results = await cleanupOrphanedAssets({ gracePeriodDays, dryRun });

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: dryRun
      ? `Dry run complete: would delete ${results.total} assets`
      : `Cleanup complete: ${results.deleted} deleted, ${results.failed} failed`,
    data: {
      success: results.success,
      results,
      timestamp: new Date().toISOString(),
    },
  });
});

export const CronControllers = {
  syncDeliveryStatus: syncDeliveryStatusHandler,
  cleanupAssets: cleanupAssetsHandler,
};
