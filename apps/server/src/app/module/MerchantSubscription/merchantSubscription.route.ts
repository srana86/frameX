import express from "express";
import { MerchantSubscriptionControllers } from "./merchantSubscription.controller";

const router = express.Router();

// GET /api/v1/merchant-subscription?merchantId=xxx
router.get("/", MerchantSubscriptionControllers.getMerchantSubscription);

export const MerchantSubscriptionRoutes = router;
