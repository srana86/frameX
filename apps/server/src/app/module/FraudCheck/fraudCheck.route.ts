import express from "express";
import validateRequest from "../../middlewares/validateRequest";
import { FraudCheckControllers } from "./fraudCheck.controller";
import { checkCustomerFraudValidationSchema } from "./fraudCheck.validation";

const router = express.Router();

router.get("/", FraudCheckControllers.getFraudCheckStats);

router.post(
  "/",
  validateRequest(checkCustomerFraudValidationSchema),
  FraudCheckControllers.checkCustomerFraud
);

export const FraudCheckRoutes = router;
