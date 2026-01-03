import express from "express";
import validateRequest from "../../middlewares/validateRequest";
import { CheckoutControllers } from "./checkout.controller";
import { initCheckoutValidationSchema } from "./checkout.validation";

const router = express.Router();

router.post(
  "/init",
  validateRequest(initCheckoutValidationSchema),
  CheckoutControllers.initCheckout
);

router.get("/session", CheckoutControllers.getCheckoutSession);

router.post("/success", CheckoutControllers.handleCheckoutSuccess);
router.get("/success", CheckoutControllers.handleCheckoutSuccess);

router.post("/fail", CheckoutControllers.handleCheckoutFail);
router.get("/fail", CheckoutControllers.handleCheckoutFail);

router.post("/cancel", CheckoutControllers.handleCheckoutCancel);
router.get("/cancel", CheckoutControllers.handleCheckoutCancel);

router.post("/ipn", CheckoutControllers.handleIPN);

export const CheckoutRoutes = router;
