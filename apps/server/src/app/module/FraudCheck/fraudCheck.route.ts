import express from "express";
import validateRequest from "../../middlewares/validateRequest";
import auth from "../../middlewares/auth";
import { FraudCheckControllers } from "./fraudCheck.controller";
import { checkCustomerFraudValidationSchema } from "./fraudCheck.validation";

const router = express.Router();

// Get fraud check settings (protected)
router.get("/settings", auth(), FraudCheckControllers.getFraudCheckSettings);

// Update fraud check settings (protected)
router.put("/settings", auth(), FraudCheckControllers.updateFraudCheckSettings);

router.get("/", FraudCheckControllers.getFraudCheckStats);

router.post(
  "/",
  validateRequest(checkCustomerFraudValidationSchema),
  FraudCheckControllers.checkCustomerFraud
);

export const FraudCheckRoutes = router;
