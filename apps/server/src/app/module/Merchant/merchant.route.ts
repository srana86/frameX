import express from "express";
import validateRequest from "../../middlewares/validateRequest";
import { TenantControllers, MerchantControllers } from "./merchant.controller";
import {
  createMerchantValidationSchema,
  updateMerchantValidationSchema,
  getMerchantValidationSchema,
  deleteMerchantValidationSchema,
} from "./merchant.validation";

const router = express.Router();

// All routes use TenantControllers internally

router.get("/", TenantControllers.getAllTenants);

router.post(
  "/",
  validateRequest(createMerchantValidationSchema),
  TenantControllers.createTenant
);

router.get(
  "/:id",
  validateRequest(getMerchantValidationSchema),
  TenantControllers.getTenantById
);

router.put(
  "/:id",
  validateRequest(updateMerchantValidationSchema),
  TenantControllers.updateTenant
);

router.get(
  "/:id/full",
  validateRequest(getMerchantValidationSchema),
  TenantControllers.getTenantFull
);

router.get(
  "/:id/subscription",
  validateRequest(getMerchantValidationSchema),
  TenantControllers.getTenantSubscription
);

router.get(
  "/:id/deployment",
  validateRequest(getMerchantValidationSchema),
  TenantControllers.getTenantDeployment
);

router.get(
  "/:id/database",
  validateRequest(getMerchantValidationSchema),
  TenantControllers.getTenantDatabase
);

router.put(
  "/:id/domain",
  validateRequest(updateMerchantValidationSchema),
  TenantControllers.updateTenantDomain
);

router.delete(
  "/:id",
  validateRequest(deleteMerchantValidationSchema),
  TenantControllers.deleteTenant
);

// Export as both TenantRoutes and MerchantRoutes for backward compatibility
// MerchantRoutes stays at /api/v1/merchants path for API compatibility
export const TenantRoutes = router;
export const MerchantRoutes = router;
