import express from "express";
import validateRequest from "../../middlewares/validateRequest";
import auth from "../../middlewares/auth";
import { tenantMiddleware } from "../../middlewares/tenant";
import { MerchantControllers } from "./merchant.controller";
import { MerchantValidation } from "./merchant.validation";

const router = express.Router();

// =====================
// All merchant routes require authentication and tenant context
// tenantMiddleware MUST come before auth for proper tenant validation
// =====================

// Get merchant context
router.get(
  "/context",
  tenantMiddleware,
  auth("admin", "merchant"),
  MerchantControllers.getMerchantContext
);

// Get merchant data from brand config
router.get(
  "/data-from-brand-config",
  tenantMiddleware,
  auth("admin", "merchant"),
  MerchantControllers.getMerchantDataFromBrandConfig
);

// Get merchant plan subscription
router.get(
  "/plan-subscription",
  tenantMiddleware,
  auth("merchant"),
  MerchantControllers.getMerchantPlanSubscription
);

// Features routes
router.post(
  "/features/check",
  tenantMiddleware,
  auth("merchant"),
  validateRequest(MerchantValidation.checkFeaturesValidationSchema),
  MerchantControllers.checkFeatures
);
router.get(
  "/features/limit",
  tenantMiddleware,
  auth("merchant"),
  MerchantControllers.getFeatureLimits
);
router.get(
  "/features/usage",
  tenantMiddleware,
  auth("merchant"),
  MerchantControllers.getFeatureUsage
);

// Fraud check routes
router.get(
  "/fraud-check",
  tenantMiddleware,
  auth("admin", "merchant"),
  MerchantControllers.getFraudCheck
);
router.post(
  "/fraud-check",
  tenantMiddleware,
  auth("admin", "merchant"),
  validateRequest(MerchantValidation.fraudCheckValidationSchema),
  MerchantControllers.postFraudCheck
);

// Domain routes
router.post(
  "/domain/configure",
  tenantMiddleware,
  auth("merchant"),
  validateRequest(MerchantValidation.configureDomainValidationSchema),
  MerchantControllers.configureDomain
);
router.get(
  "/domain/configure",
  tenantMiddleware,
  auth("merchant"),
  MerchantControllers.getDomainConfig
);
router.post(
  "/domain/verify",
  tenantMiddleware,
  auth("merchant"),
  validateRequest(MerchantValidation.verifyDomainValidationSchema),
  MerchantControllers.verifyDomain
);
router.delete(
  "/domain/remove",
  tenantMiddleware,
  auth("merchant"),
  MerchantControllers.removeDomain
);

// Super admin data
router.get(
  "/super-admin-data",
  tenantMiddleware,
  auth("admin", "merchant"),
  MerchantControllers.getSuperAdminData
);

// Email settings routes
router.get(
  "/email-settings",
  tenantMiddleware,
  auth("merchant"),
  MerchantControllers.getEmailSettings
);
router.put(
  "/email-settings",
  tenantMiddleware,
  auth("merchant"),
  validateRequest(MerchantValidation.updateEmailSettingsValidationSchema),
  MerchantControllers.updateEmailSettings
);
router.post(
  "/email-settings",
  tenantMiddleware,
  auth("merchant"),
  validateRequest(MerchantValidation.testEmailSettingsValidationSchema),
  MerchantControllers.testEmailSettings
);

// Email templates routes
router.get(
  "/email-templates",
  tenantMiddleware,
  auth("merchant"),
  MerchantControllers.getEmailTemplates
);
router.put(
  "/email-templates",
  tenantMiddleware,
  auth("merchant"),
  validateRequest(MerchantValidation.updateEmailTemplatesValidationSchema),
  MerchantControllers.updateEmailTemplates
);
router.post(
  "/email-templates",
  tenantMiddleware,
  auth("merchant"),
  validateRequest(MerchantValidation.createEmailTemplateValidationSchema),
  MerchantControllers.createEmailTemplate
);

export const MerchantRoutes = router;
