import express from "express";
import validateRequest from "../../middlewares/validateRequest";
import auth from "../../middlewares/auth";
import { EmailProviderControllers } from "./emailProvider.controller";
import { EmailProviderValidation } from "./emailProvider.validation";

const router = express.Router();

// Get email provider settings
router.get(
  "/",
  auth("admin", "tenant"),
  EmailProviderControllers.getEmailSettings
);

// Update email provider settings
router.put(
  "/",
  auth("admin", "tenant"),
  validateRequest(EmailProviderValidation.updateEmailSettingsValidationSchema),
  EmailProviderControllers.updateEmailSettings
);

// Test email provider settings
router.post(
  "/test",
  auth("admin", "tenant"),
  validateRequest(EmailProviderValidation.testEmailSettingsValidationSchema),
  EmailProviderControllers.testEmailSettings
);

export const EmailProviderRoutes = router;
