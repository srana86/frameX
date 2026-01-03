import express from "express";
import validateRequest from "../../../middlewares/validateRequest";
import auth from "../../../middlewares/auth";
import { PromotionalBannerControllers } from "./promotionalBanner.controller";
import { PromotionalBannerValidation } from "./promotionalBanner.validation";

const router = express.Router();

// Get promotional banner (public)
router.get("/", PromotionalBannerControllers.getPromotionalBanner);

// Update promotional banner
router.put(
  "/",
  auth("admin", "merchant"),
  validateRequest(
    PromotionalBannerValidation.updatePromotionalBannerValidationSchema
  ),
  PromotionalBannerControllers.updatePromotionalBanner
);

export const PromotionalBannerRoutes = router;
