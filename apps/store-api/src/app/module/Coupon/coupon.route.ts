import express from "express";
import validateRequest from "../../middlewares/validateRequest";
import auth from "../../middlewares/auth";
import { tenantMiddleware } from "../../middlewares/tenant";
import { CouponControllers } from "./coupon.controller";
import { CouponValidation } from "./coupon.validation";

const router = express.Router();

// =====================
// Public routes (tenant context required)
// =====================

// Apply coupon (public - used during checkout)
router.post(
  "/apply",
  tenantMiddleware,
  validateRequest(CouponValidation.applyCouponValidationSchema),
  CouponControllers.applyCoupon
);

// Record coupon usage (public - used during order)
router.post(
  "/record-usage",
  tenantMiddleware,
  validateRequest(CouponValidation.recordUsageValidationSchema),
  CouponControllers.recordCouponUsage
);

// =====================
// Protected routes (tenant + auth required)
// tenantMiddleware MUST come before auth
// =====================

// Get all coupons with pagination, filter, and search (admin/merchant)
router.get(
  "/",
  tenantMiddleware,
  auth("admin", "merchant"),
  CouponControllers.getAllCoupons
);

// Get coupon usage records (admin/merchant)
router.get(
  "/record-usage",
  tenantMiddleware,
  auth("admin", "merchant"),
  CouponControllers.getCouponUsageRecords
);

// Get single coupon by ID or code (admin/merchant)
router.get(
  "/:id",
  tenantMiddleware,
  auth("admin", "merchant"),
  CouponControllers.getSingleCoupon
);

// Create coupon (admin/merchant only)
router.post(
  "/",
  tenantMiddleware,
  auth("admin", "merchant"),
  validateRequest(CouponValidation.createCouponValidationSchema),
  CouponControllers.createCoupon
);

// Update coupon (admin/merchant only)
router.put(
  "/:id",
  tenantMiddleware,
  auth("admin", "merchant"),
  validateRequest(CouponValidation.updateCouponValidationSchema),
  CouponControllers.updateCoupon
);

// Delete coupon (admin/merchant only)
router.delete(
  "/:id",
  tenantMiddleware,
  auth("admin", "merchant"),
  CouponControllers.deleteCoupon
);

export const CouponRoutes = router;
