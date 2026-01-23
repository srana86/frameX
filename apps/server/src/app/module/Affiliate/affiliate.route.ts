import express from "express";
import validateRequest from "../../middlewares/validateRequest";
import auth from "../../middlewares/auth";
import { tenantMiddleware } from "../../middlewares/tenant";
import { AffiliateControllers } from "./affiliate.controller";
import { AffiliateValidation } from "./affiliate.validation";

const router = express.Router();

// =====================
// Public routes (tenant context required)
// =====================

// Set affiliate cookie (public)
router.post(
  "/set-cookie",
  tenantMiddleware,
  validateRequest(AffiliateValidation.setCookieValidationSchema),
  AffiliateControllers.setCookie
);

// =====================
// Protected routes (tenant + auth required)
// tenantMiddleware MUST come before auth
// =====================

// Get current user's affiliate info
router.get(
  "/me",
  tenantMiddleware,
  auth("customer", "tenant", "admin"),
  AffiliateControllers.getMyAffiliate
);

// Create affiliate account
router.post(
  "/me",
  tenantMiddleware,
  auth("customer", "tenant", "admin"),
  AffiliateControllers.createMyAffiliate
);

// Get all affiliates (admin/tenant only)
router.get(
  "/",
  tenantMiddleware,
  auth("admin", "tenant", "owner"),
  AffiliateControllers.getAllAffiliates
);

router.get(
  "/list",
  tenantMiddleware,
  auth("admin", "tenant", "owner"),
  AffiliateControllers.getAllAffiliates
);

// Get commissions
router.get(
  "/commissions",
  tenantMiddleware,
  auth("admin", "tenant", "customer"),
  AffiliateControllers.getCommissions
);

// Get affiliate progress (uses current user)
router.get(
  "/progress",
  tenantMiddleware,
  auth("admin", "tenant", "customer"),
  AffiliateControllers.getAffiliateProgress
);

// Get withdrawals
router.get(
  "/withdrawals",
  tenantMiddleware,
  auth("admin", "tenant", "customer"),
  AffiliateControllers.getWithdrawals
);

// Create/Update withdrawal
router.post(
  "/withdrawals",
  tenantMiddleware,
  auth("customer", "tenant", "admin"),
  validateRequest(AffiliateValidation.createWithdrawalValidationSchema),
  AffiliateControllers.handleWithdrawal
);

// Get affiliate settings (admin/tenant only)
router.get(
  "/settings",
  tenantMiddleware,
  auth("admin", "tenant", "owner"),
  AffiliateControllers.getSettings
);

// Get affiliate stats (admin/tenant only)
router.get(
  "/stats",
  tenantMiddleware,
  auth("admin", "tenant", "owner"),
  AffiliateControllers.getStats
);

// Update affiliate settings (admin/tenant only)
router.patch(
  "/settings",
  tenantMiddleware,
  auth("admin", "tenant", "owner"),
  validateRequest(AffiliateValidation.updateSettingsValidationSchema),
  AffiliateControllers.updateSettings
);

router.put(
  "/settings",
  tenantMiddleware,
  auth("admin", "tenant", "owner"),
  validateRequest(AffiliateValidation.updateSettingsValidationSchema),
  AffiliateControllers.updateSettings
);

// Update affiliate (admin/tenant only)
router.patch(
  "/:id",
  tenantMiddleware,
  auth("admin", "tenant", "owner"),
  AffiliateControllers.updateAffiliate
);

router.put(
  "/:id",
  tenantMiddleware,
  auth("admin", "tenant", "owner"),
  AffiliateControllers.updateAffiliate
);

// Assign coupon to affiliate (admin/tenant only)
router.post(
  "/assign-coupon",
  tenantMiddleware,
  auth("admin", "tenant", "owner"),
  validateRequest(AffiliateValidation.assignCouponValidationSchema),
  AffiliateControllers.assignCoupon
);

export const AffiliateRoutes = router;
