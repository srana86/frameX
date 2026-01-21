import express from "express";
import auth from "../../middlewares/auth";
import { tenantMiddleware } from "../../middlewares/tenant";
import { StatisticsControllers } from "./statistics.controller";

const router = express.Router();

// Get comprehensive statistics (admin/tenant only)
// tenantMiddleware MUST come before auth
router.get(
  "/",
  tenantMiddleware,
  auth("admin", "tenant"),
  StatisticsControllers.getStatistics
);

export const StatisticsRoutes = router;
