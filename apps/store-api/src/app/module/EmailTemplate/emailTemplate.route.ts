import express from "express";
import validateRequest from "../../middlewares/validateRequest";
import auth from "../../middlewares/auth";
import { EmailTemplateControllers } from "./emailTemplate.controller";
import { EmailTemplateValidation } from "./emailTemplate.validation";

const router = express.Router();

// Get email templates (optionally filtered by event query param)
router.get(
  "/",
  auth("admin", "merchant"),
  EmailTemplateControllers.getEmailTemplates
);

// Update email template
router.put(
  "/",
  auth("admin", "merchant"),
  validateRequest(EmailTemplateValidation.updateEmailTemplateValidationSchema),
  EmailTemplateControllers.updateEmailTemplate
);

// Create email template
router.post(
  "/",
  auth("admin", "merchant"),
  validateRequest(EmailTemplateValidation.createEmailTemplateValidationSchema),
  EmailTemplateControllers.createEmailTemplate
);

// Test email template
router.post(
  "/test",
  auth("admin", "merchant"),
  validateRequest(EmailTemplateValidation.testEmailTemplateValidationSchema),
  EmailTemplateControllers.testEmailTemplate
);

export const EmailTemplateRoutes = router;
