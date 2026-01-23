import express from "express";
import validateRequest from "../../middlewares/validateRequest";
import auth from "../../middlewares/auth";
import { tenantMiddleware } from "../../middlewares/tenant";
import { VisitsControllers } from "./visits.controller";
import { VisitsValidation } from "./visits.validation";

const router = express.Router();

// Track visit (public)
router.post(
  "/",
  tenantMiddleware,
  validateRequest(VisitsValidation.trackVisitValidationSchema),
  VisitsControllers.trackVisit
);

// Get visits (admin/tenant)
router.get("/", auth("admin", "tenant", "owner"), VisitsControllers.getVisits);

// Get IP analytics (admin/tenant/owner)
router.get("/analytics", auth("admin", "tenant", "owner"), VisitsControllers.getIpAnalytics);

export const VisitsRoutes = router;
