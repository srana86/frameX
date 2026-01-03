import express from "express";
import validateRequest from "../../middlewares/validateRequest";
import auth from "../../middlewares/auth";
import { AffiliateControllers } from "./affiliate.controller";
import { AffiliateValidation } from "./affiliate.validation";

const router = express.Router();

// Get current user's affiliate info
router.get(
  "/me",
  auth("customer", "merchant", "admin"),
  AffiliateControllers.getMyAffiliate
);

// Create affiliate account
router.post(
  "/me",
  auth("customer", "merchant", "admin"),
  AffiliateControllers.createMyAffiliate
);

// Get all affiliates (admin)
router.get(
  "/list",
  auth("admin", "merchant"),
  AffiliateControllers.getAllAffiliates
);

// Get commissions
router.get(
  "/commissions",
  auth("admin", "merchant", "customer"),
  AffiliateControllers.getCommissions
);

// Get affiliate progress (uses current user)
router.get(
  "/progress",
  auth("admin", "merchant", "customer"),
  AffiliateControllers.getAffiliateProgress
);

// Get withdrawals
router.get(
  "/withdrawals",
  auth("admin", "merchant", "customer"),
  AffiliateControllers.getWithdrawals
);

// Create/Update withdrawal
router.post(
  "/withdrawals",
  auth("customer", "merchant", "admin"),
  validateRequest(AffiliateValidation.createWithdrawalValidationSchema),
  AffiliateControllers.handleWithdrawal
);

// Get affiliate settings
router.get(
  "/settings",
  auth("admin", "merchant"),
  AffiliateControllers.getSettings
);

// Update affiliate settings
router.put(
  "/settings",
  auth("admin", "merchant"),
  validateRequest(AffiliateValidation.updateSettingsValidationSchema),
  AffiliateControllers.updateSettings
);

// Set affiliate cookie (public)
router.post(
  "/set-cookie",
  validateRequest(AffiliateValidation.setCookieValidationSchema),
  AffiliateControllers.setCookie
);

// Assign coupon to affiliate
router.post(
  "/assign-coupon",
  auth("admin", "merchant"),
  validateRequest(AffiliateValidation.assignCouponValidationSchema),
  AffiliateControllers.assignCoupon
);

export const AffiliateRoutes = router;
