import express from "express";
import validateRequest from "../../middlewares/validateRequest";
import { SettingsControllers } from "./settings.controller";
import {
  updateGeneralSettingsValidationSchema,
  updateSSLCommerzSettingsValidationSchema,
  testSSLCommerzConnectionValidationSchema,
} from "./settings.validation";

const router = express.Router();

// General settings
router.get("/general", SettingsControllers.getGeneralSettings);
router.put(
  "/general",
  validateRequest(updateGeneralSettingsValidationSchema),
  SettingsControllers.updateGeneralSettings
);

// SSLCommerz settings
router.get("/sslcommerz", SettingsControllers.getSSLCommerzSettings);
router.put(
  "/sslcommerz",
  validateRequest(updateSSLCommerzSettingsValidationSchema),
  SettingsControllers.updateSSLCommerzSettings
);
router.post(
  "/sslcommerz/test",
  validateRequest(testSSLCommerzConnectionValidationSchema),
  SettingsControllers.testSSLCommerzConnection
);

export const SettingsRoutes = router;
