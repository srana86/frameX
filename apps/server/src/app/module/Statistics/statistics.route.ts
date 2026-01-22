import express from "express";
import auth from "../../middlewares/auth";
import { tenantMiddleware } from "../../middlewares/tenant";
import { StatisticsControllers } from "./statistics.controller";

const router = express.Router();

// Get comprehensive statistics (owner/admin/tenant)
// tenantMiddleware MUST come before auth
router.get(
  "/",
  tenantMiddleware,
  auth("admin", "tenant", "owner"),
  StatisticsControllers.getStatistics
);

export const StatisticsRoutes = router;
