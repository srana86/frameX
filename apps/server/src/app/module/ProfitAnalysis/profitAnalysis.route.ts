import express from "express";
import auth from "../../middlewares/auth";
import { tenantMiddleware } from "../../middlewares/tenant";
import { ProfitAnalysisControllers } from "./profitAnalysis.controller";

const router = express.Router();

// Get profit analysis statistics (owner/admin/tenant)
router.get(
    "/",
    tenantMiddleware,
    auth("admin", "tenant", "owner"),
    ProfitAnalysisControllers.getProfitAnalysis
);

export const ProfitAnalysisRoutes = router;
