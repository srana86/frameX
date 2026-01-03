import express from "express";
import validateRequest from "../../middlewares/validateRequest";
import auth from "../../middlewares/auth";
import { MerchantControllers } from "./merchant.controller";
import { MerchantValidation } from "./merchant.validation";

const router = express.Router();

// Get merchant context
router.get(
  "/context",
  auth("admin", "merchant"),
  MerchantControllers.getMerchantContext
);

// Get merchant data from brand config
router.get(
  "/data-from-brand-config",
  auth("admin", "merchant"),
  MerchantControllers.getMerchantDataFromBrandConfig
);

// Get merchant plan subscription
router.get(
  "/plan-subscription",
  auth("merchant"),
  MerchantControllers.getMerchantPlanSubscription
);

// Features routes
router.post(
  "/features/check",
  auth("merchant"),
  validateRequest(MerchantValidation.checkFeaturesValidationSchema),
  MerchantControllers.checkFeatures
);
router.get(
  "/features/limit",
  auth("merchant"),
  MerchantControllers.getFeatureLimits
);
router.get(
  "/features/usage",
  auth("merchant"),
  MerchantControllers.getFeatureUsage
);

// Fraud check routes
router.get(
  "/fraud-check",
  auth("admin", "merchant"),
  MerchantControllers.getFraudCheck
);
router.post(
  "/fraud-check",
  auth("admin", "merchant"),
  validateRequest(MerchantValidation.fraudCheckValidationSchema),
  MerchantControllers.postFraudCheck
);

// Domain routes
router.post(
  "/domain/configure",
  auth("merchant"),
  validateRequest(MerchantValidation.configureDomainValidationSchema),
  MerchantControllers.configureDomain
);
router.get(
  "/domain/configure",
  auth("merchant"),
  MerchantControllers.getDomainConfig
);
router.post(
  "/domain/verify",
  auth("merchant"),
  validateRequest(MerchantValidation.verifyDomainValidationSchema),
  MerchantControllers.verifyDomain
);
router.delete(
  "/domain/remove",
  auth("merchant"),
  MerchantControllers.removeDomain
);

// Super admin data
router.get(
  "/super-admin-data",
  auth("admin", "merchant"),
  MerchantControllers.getSuperAdminData
);

// Email settings routes
router.get(
  "/email-settings",
  auth("merchant"),
  MerchantControllers.getEmailSettings
);
router.put(
  "/email-settings",
  auth("merchant"),
  validateRequest(MerchantValidation.updateEmailSettingsValidationSchema),
  MerchantControllers.updateEmailSettings
);
router.post(
  "/email-settings",
  auth("merchant"),
  validateRequest(MerchantValidation.testEmailSettingsValidationSchema),
  MerchantControllers.testEmailSettings
);

// Email templates routes
router.get(
  "/email-templates",
  auth("merchant"),
  MerchantControllers.getEmailTemplates
);
router.put(
  "/email-templates",
  auth("merchant"),
  validateRequest(MerchantValidation.updateEmailTemplatesValidationSchema),
  MerchantControllers.updateEmailTemplates
);
router.post(
  "/email-templates",
  auth("merchant"),
  validateRequest(MerchantValidation.createEmailTemplateValidationSchema),
  MerchantControllers.createEmailTemplate
);

export const MerchantRoutes = router;
