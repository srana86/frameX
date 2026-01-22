import express from "express";
import validateRequest from "../../middlewares/validateRequest";
import auth from "../../middlewares/auth";
import { tenantMiddleware } from "../../middlewares/tenant";
import { TenantControllers } from "./tenant.controller";
import { TenantValidation } from "./tenant.validation";

const router = express.Router();

// =====================
// All tenant routes require authentication and tenant context
// tenantMiddleware MUST come before auth for proper tenant validation
// =====================

// Get tenant context
router.get(
  "/context",
  tenantMiddleware,
  auth("admin", "tenant", "owner"),
  TenantControllers.getTenantContext
);

// Get tenant data from brand config
router.get(
  "/data-from-brand-config",
  tenantMiddleware,
  auth("admin", "tenant", "owner"),
  TenantControllers.getTenantDataFromBrandConfig
);

// Get tenant plan subscription
router.get(
  "/plan-subscription",
  tenantMiddleware,
  auth("tenant"),
  TenantControllers.getTenantPlanSubscription
);

// Features routes
router.post(
  "/features/check",
  tenantMiddleware,
  auth("tenant"),
  validateRequest(TenantValidation.checkFeaturesValidationSchema),
  TenantControllers.checkFeatures
);
router.get(
  "/features/limit",
  tenantMiddleware,
  auth("tenant"),
  TenantControllers.getFeatureLimits
);
router.get(
  "/features/usage",
  tenantMiddleware,
  auth("tenant"),
  TenantControllers.getFeatureUsage
);

// Fraud check routes
router.get(
  "/fraud-check",
  tenantMiddleware,
  auth("admin", "tenant", "owner"),
  TenantControllers.getFraudCheck
);
router.post(
  "/fraud-check",
  tenantMiddleware,
  auth("admin", "tenant", "owner"),
  validateRequest(TenantValidation.fraudCheckValidationSchema),
  TenantControllers.postFraudCheck
);

// Domain routes
router.post(
  "/domain/configure",
  tenantMiddleware,
  auth("tenant"),
  validateRequest(TenantValidation.configureDomainValidationSchema),
  TenantControllers.configureDomain
);
router.get(
  "/domain/configure",
  tenantMiddleware,
  auth("tenant"),
  TenantControllers.getDomainConfig
);
router.post(
  "/domain/verify",
  tenantMiddleware,
  auth("tenant"),
  validateRequest(TenantValidation.verifyDomainValidationSchema),
  TenantControllers.verifyDomain
);
router.delete(
  "/domain/remove",
  tenantMiddleware,
  auth("tenant"),
  TenantControllers.removeDomain
);

// Super admin data
router.get(
  "/super-admin-data",
  tenantMiddleware,
  auth("admin", "tenant", "owner"),
  TenantControllers.getSuperAdminData
);

// Email settings routes
router.get(
  "/email-settings",
  tenantMiddleware,
  auth("tenant"),
  TenantControllers.getEmailSettings
);
router.put(
  "/email-settings",
  tenantMiddleware,
  auth("tenant"),
  validateRequest(TenantValidation.updateEmailSettingsValidationSchema),
  TenantControllers.updateEmailSettings
);
router.post(
  "/email-settings",
  tenantMiddleware,
  auth("tenant"),
  validateRequest(TenantValidation.testEmailSettingsValidationSchema),
  TenantControllers.testEmailSettings
);

// Email templates routes
router.get(
  "/email-templates",
  tenantMiddleware,
  auth("tenant"),
  TenantControllers.getEmailTemplates
);
router.put(
  "/email-templates",
  tenantMiddleware,
  auth("tenant"),
  validateRequest(TenantValidation.updateEmailTemplatesValidationSchema),
  TenantControllers.updateEmailTemplates
);
router.post(
  "/email-templates",
  tenantMiddleware,
  auth("tenant"),
  validateRequest(TenantValidation.createEmailTemplateValidationSchema),
  TenantControllers.createEmailTemplate
);

export const TenantRoutes = router;
