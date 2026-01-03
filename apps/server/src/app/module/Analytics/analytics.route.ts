import express from "express";
import { AnalyticsControllers } from "./analytics.controller";

const router = express.Router();

router.get("/", AnalyticsControllers.getAnalytics);

export const AnalyticsRoutes = router;
