import express from "express";
import validateRequest from "../../middlewares/validateRequest";
import { TenantControllers } from "./tenant.controller";
import {
  createTenantValidationSchema,
  updateTenantValidationSchema,
  getTenantValidationSchema,
  deleteTenantValidationSchema,
} from "./tenant.validation";

const router = express.Router();

// All routes use TenantControllers internally

router.get("/", TenantControllers.getAllTenants);

router.post(
  "/",
  validateRequest(createTenantValidationSchema),
  TenantControllers.createTenant
);

router.get(
  "/:id",
  validateRequest(getTenantValidationSchema),
  TenantControllers.getTenantById
);

router.put(
  "/:id",
  validateRequest(updateTenantValidationSchema),
  TenantControllers.updateTenant
);

router.get(
  "/:id/full",
  validateRequest(getTenantValidationSchema),
  TenantControllers.getTenantFull
);

router.get(
  "/:id/subscription",
  validateRequest(getTenantValidationSchema),
  TenantControllers.getTenantSubscription
);

router.get(
  "/:id/deployment",
  validateRequest(getTenantValidationSchema),
  TenantControllers.getTenantDeployment
);

router.get(
  "/:id/database",
  validateRequest(getTenantValidationSchema),
  TenantControllers.getTenantDatabase
);

router.put(
  "/:id/domain",
  validateRequest(updateTenantValidationSchema),
  TenantControllers.updateTenantDomain
);

router.delete(
  "/:id",
  validateRequest(deleteTenantValidationSchema),
  TenantControllers.deleteTenant
);

export const TenantRoutes = router;
