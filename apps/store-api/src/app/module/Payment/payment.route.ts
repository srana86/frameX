import express from "express";
import validateRequest from "../../middlewares/validateRequest";
import auth from "../../middlewares/auth";
import { PaymentControllers } from "./payment.controller";
import { PaymentValidation } from "./payment.validation";

const router = express.Router();

// Get all payments
router.get("/", auth("admin", "tenant"), PaymentControllers.getAllPayments);

// Get single payment
router.get(
  "/:id",
  auth("admin", "tenant"),
  PaymentControllers.getSinglePayment
);

// Initialize payment
router.post(
  "/init",
  validateRequest(PaymentValidation.initPaymentValidationSchema),
  PaymentControllers.initPayment
);

// Initialize easy checkout (Pay on Page)
router.post(
  "/easy-checkout",
  validateRequest(PaymentValidation.initPaymentValidationSchema),
  PaymentControllers.easyCheckout
);

// Callback routes
router.all("/success", PaymentControllers.handleSuccess);
router.all("/fail", PaymentControllers.handleFail);
router.all("/cancel", PaymentControllers.handleCancel);
router.post("/ipn", PaymentControllers.handleIPN);

export const PaymentRoutes = router;
