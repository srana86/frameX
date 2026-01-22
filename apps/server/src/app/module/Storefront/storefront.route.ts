import express from "express";
import validateRequest from "../../middlewares/validateRequest";
import { tenantMiddleware } from "../../middlewares/tenant";
import { StorefrontControllers } from "./storefront.controller";
import { StorefrontValidation } from "./storefront.validation";

const router = express.Router();

// Get storefront delivery config (public but needs tenant context)
router.get(
  "/delivery-config",
  tenantMiddleware,
  StorefrontControllers.getStorefrontDeliveryConfig
);

// Calculate shipping (public but needs tenant context)
router.post(
  "/calculate-shipping",
  tenantMiddleware,
  validateRequest(StorefrontValidation.calculateShippingValidationSchema),
  StorefrontControllers.calculateShipping
);

export const StorefrontRoutes = router;
