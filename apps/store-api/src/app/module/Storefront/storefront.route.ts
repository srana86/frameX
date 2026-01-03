import express from "express";
import validateRequest from "../../middlewares/validateRequest";
import { StorefrontControllers } from "./storefront.controller";
import { StorefrontValidation } from "./storefront.validation";

const router = express.Router();

// Get storefront delivery config (public)
router.get(
  "/delivery-config",
  StorefrontControllers.getStorefrontDeliveryConfig
);

// Calculate shipping (public)
router.post(
  "/calculate-shipping",
  validateRequest(StorefrontValidation.calculateShippingValidationSchema),
  StorefrontControllers.calculateShipping
);

export const StorefrontRoutes = router;
