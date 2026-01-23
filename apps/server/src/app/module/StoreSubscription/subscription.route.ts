import express from "express";
import auth from "../../middlewares/auth";
import validateRequest from "../../middlewares/validateRequest";
import { SubscriptionControllers } from "./subscription.controller";
import { SubscriptionValidation } from "./subscription.validation";

const router = express.Router();

// Get store subscription (frontend format) - protected
router.get("/", auth(), SubscriptionControllers.getStoreSubscription);

// Get active subscription plans (public)
router.get("/plans", SubscriptionControllers.getActivePlans);

// Get current subscription (protected)
router.get("/current", auth(), SubscriptionControllers.getCurrentSubscription);

// Get subscription status (protected)
router.get("/status", auth(), SubscriptionControllers.getSubscriptionStatus);

// Create subscription (protected - tenant only)
router.post(
  "/create",
  auth("tenant"),
  validateRequest(SubscriptionValidation.createSubscriptionValidationSchema),
  SubscriptionControllers.createSubscription
);

export const SubscriptionRoutes = router;
