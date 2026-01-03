import express from "express";
import validateRequest from "../../middlewares/validateRequest";
import auth from "../../middlewares/auth";
import { DeliveryControllers } from "./delivery.controller";
import { DeliveryValidation } from "./delivery.validation";

const router = express.Router();

// Storefront endpoints (public)
router.get(
  "/storefront/config",
  DeliveryControllers.getStorefrontDeliveryConfig
);
router.post(
  "/storefront/calculate-shipping",
  validateRequest(DeliveryValidation.calculateShippingValidationSchema),
  DeliveryControllers.calculateShipping
);

// Courier services config (admin/merchant)
router.get(
  "/courier-services",
  auth("admin", "merchant"),
  DeliveryControllers.getCourierServicesConfig
);

export const DeliveryRoutes = router;
