import express from "express";
import { CronControllers } from "./cron.controller";

const router = express.Router();

// Cron job endpoint (no auth required, but should be protected by API key or IP whitelist in production)
router.get("/sync-delivery-status", CronControllers.syncDeliveryStatus);

export const CronRoutes = router;
