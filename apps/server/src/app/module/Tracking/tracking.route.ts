import express from "express";
import validateRequest from "../../middlewares/validateRequest";
import { tenantMiddleware } from "../../middlewares/tenant";
import { TrackingControllers } from "./tracking.controller";
import { TrackingValidation } from "./tracking.validation";

const router = express.Router();

// Facebook Events (legacy endpoint)
router.post(
  "/fb-events",
  tenantMiddleware,
  validateRequest(TrackingValidation.trackFBEventValidationSchema),
  TrackingControllers.trackFBEvent
);
router.get("/fb-events", tenantMiddleware, TrackingControllers.getFBEvents);

// Meta Pixel (newer endpoint)
router.post(
  "/meta-pixel",
  tenantMiddleware,
  validateRequest(TrackingValidation.trackMetaPixelValidationSchema),
  TrackingControllers.trackMetaPixel
);

// TikTok Pixel
router.post(
  "/tiktok-pixel",
  tenantMiddleware,
  validateRequest(TrackingValidation.trackTikTokPixelValidationSchema),
  TrackingControllers.trackTikTokPixel
);

// Google Analytics 4
router.post(
  "/ga4",
  tenantMiddleware,
  validateRequest(TrackingValidation.trackGA4ValidationSchema),
  TrackingControllers.trackGA4
);

export const TrackingRoutes = router;
