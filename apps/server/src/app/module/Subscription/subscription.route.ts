import express from "express";
import validateRequest from "../../middlewares/validateRequest";
import { SubscriptionControllers } from "./subscription.controller";
import {
  createSubscriptionValidationSchema,
  updateSubscriptionValidationSchema,
  getSubscriptionValidationSchema,
  deleteSubscriptionValidationSchema,
  renewSubscriptionValidationSchema,
} from "./subscription.validation";

const router = express.Router();

router.get("/", SubscriptionControllers.getAllSubscriptions);

router.post(
  "/",
  validateRequest(createSubscriptionValidationSchema),
  SubscriptionControllers.createSubscription
);

router.get("/expiring", SubscriptionControllers.getExpiringSubscriptions);

router.post(
  "/renew",
  validateRequest(renewSubscriptionValidationSchema),
  SubscriptionControllers.renewSubscription
);

router.get(
  "/:id",
  validateRequest(getSubscriptionValidationSchema),
  SubscriptionControllers.getSubscriptionById
);

router.put(
  "/:id",
  validateRequest(updateSubscriptionValidationSchema),
  SubscriptionControllers.updateSubscription
);

router.delete(
  "/:id",
  validateRequest(deleteSubscriptionValidationSchema),
  SubscriptionControllers.deleteSubscription
);

export const SubscriptionRoutes = router;
