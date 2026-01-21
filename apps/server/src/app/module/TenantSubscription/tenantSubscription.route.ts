import express from "express";
import { TenantSubscriptionControllers } from "./tenantSubscription.controller";

const router = express.Router();

// GET /api/v1/tenant-subscription?tenantId=xxx
router.get("/", TenantSubscriptionControllers.getTenantSubscription);

export const TenantSubscriptionRoutes = router;
