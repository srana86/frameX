import express from "express";
import validateRequest from "../../middlewares/validateRequest";
import auth from "../../middlewares/auth";
import { SuperAdminControllers } from "./superAdmin.controller";
import { SuperAdminValidation } from "./superAdmin.validation";

const router = express.Router();

// All super admin routes require admin role
router.use(auth("admin"));

// Get all merchants
router.get("/merchants", SuperAdminControllers.getAllMerchants);

// Create new merchant
router.post(
  "/merchants",
  validateRequest(SuperAdminValidation.createMerchantValidationSchema),
  SuperAdminControllers.createMerchant
);

// Update merchant
router.put(
  "/merchants",
  validateRequest(SuperAdminValidation.updateMerchantValidationSchema),
  SuperAdminControllers.updateMerchant
);

// Get full merchant data
router.get("/merchants/:id/full", SuperAdminControllers.getFullMerchantData);

// Get merchant database
router.get(
  "/merchants/:id/database",
  SuperAdminControllers.getMerchantDatabase
);

// Get merchant deployment
router.get(
  "/merchants/:id/deployment",
  SuperAdminControllers.getMerchantDeployment
);

// Get merchant subscription
router.get(
  "/merchants/:id/subscription",
  SuperAdminControllers.getMerchantSubscription
);

export const SuperAdminRoutes = router;
