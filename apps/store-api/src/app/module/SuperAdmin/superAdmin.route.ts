import express from "express";
import validateRequest from "../../middlewares/validateRequest";
import auth from "../../middlewares/auth";
import { SuperAdminControllers } from "./superAdmin.controller";
import { SuperAdminValidation } from "./superAdmin.validation";

const router = express.Router();

// All super admin routes require admin role
router.use(auth("admin"));

// Get all tenants
router.get("/tenants", SuperAdminControllers.getAllTenants);

// Create new tenant
router.post(
  "/tenants",
  validateRequest(SuperAdminValidation.createTenantValidationSchema),
  SuperAdminControllers.createTenant
);

// Update tenant
router.put(
  "/tenants",
  validateRequest(SuperAdminValidation.updateTenantValidationSchema),
  SuperAdminControllers.updateTenant
);

// Get full tenant data
router.get("/tenants/:id/full", SuperAdminControllers.getFullTenantData);

// Get tenant database
router.get(
  "/tenants/:id/database",
  SuperAdminControllers.getTenantDatabase
);

// Get tenant deployment
router.get(
  "/tenants/:id/deployment",
  SuperAdminControllers.getTenantDeployment
);

// Get tenant subscription
router.get(
  "/tenants/:id/subscription",
  SuperAdminControllers.getTenantSubscription
);

export const SuperAdminRoutes = router;
