import express from "express";
import validateRequest from "../../../middlewares/validateRequest";
import auth from "../../../middlewares/auth";
import { tenantMiddleware } from "../../../middlewares/tenant";
import { PromotionalBannerControllers } from "./promotionalBanner.controller";
import { PromotionalBannerValidation } from "./promotionalBanner.validation";

const router = express.Router();

// Get promotional banner (public)
router.get("/", tenantMiddleware, PromotionalBannerControllers.getPromotionalBanner);

// Update promotional banner
router.put(
  "/",
  auth("admin", "tenant"),
  tenantMiddleware,
  validateRequest(
    PromotionalBannerValidation.updatePromotionalBannerValidationSchema
  ),
  PromotionalBannerControllers.updatePromotionalBanner
);

export const PromotionalBannerRoutes = router;
