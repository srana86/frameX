import express from "express";
import validateRequest from "../../middlewares/validateRequest";
import { PaymentControllers } from "./payment.controller";
import { updatePaymentValidationSchema } from "./payment.validation";

const router = express.Router();

router.get("/", PaymentControllers.getAllPayments);

router.post("/", PaymentControllers.getPaymentStats);

router.put(
  "/",
  validateRequest(updatePaymentValidationSchema),
  PaymentControllers.updatePaymentSession
);

export const PaymentRoutes = router;
