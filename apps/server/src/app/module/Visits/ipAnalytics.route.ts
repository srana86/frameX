import express from "express";
import auth from "../../middlewares/auth";
import { VisitsControllers } from "../Visits/visits.controller";

const router = express.Router();

// Get IP analytics (admin/tenant/owner)
router.get("/", auth("admin", "tenant", "owner"), VisitsControllers.getIpAnalytics);

export const IpAnalyticsRoutes = router;
