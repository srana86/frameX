import express from "express";
import auth from "../../middlewares/auth";
import { StatisticsControllers } from "./statistics.controller";

const router = express.Router();

// Get comprehensive statistics
router.get("/", auth("admin", "merchant"), StatisticsControllers.getStatistics);

export const StatisticsRoutes = router;
