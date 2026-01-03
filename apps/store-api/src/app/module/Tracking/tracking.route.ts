import express from "express";
import validateRequest from "../../middlewares/validateRequest";
import { TrackingControllers } from "./tracking.controller";
import { TrackingValidation } from "./tracking.validation";

const router = express.Router();

// Facebook Events (legacy endpoint)
router.post(
  "/fb-events",
  validateRequest(TrackingValidation.trackFBEventValidationSchema),
  TrackingControllers.trackFBEvent
);
router.get("/fb-events", TrackingControllers.getFBEvents);

// Meta Pixel (newer endpoint)
router.post(
  "/meta-pixel",
  validateRequest(TrackingValidation.trackMetaPixelValidationSchema),
  TrackingControllers.trackMetaPixel
);

export const TrackingRoutes = router;
