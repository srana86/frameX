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

// Get all coupons with pagination, filter, and search (admin/tenant)
router.get(
  "/",
  tenantMiddleware,
  auth("admin", "tenant", "owner"),
  CouponControllers.getAllCoupons
);

// Get coupon usage records (admin/tenant)
router.get(
  "/record-usage",
  tenantMiddleware,
  auth("admin", "tenant", "owner"),
  CouponControllers.getCouponUsageRecords
);

// Get single coupon by ID or code (admin/tenant)
router.get(
  "/:id",
  tenantMiddleware,
  auth("admin", "tenant", "owner"),
  CouponControllers.getSingleCoupon
);

// Create coupon (admin/tenant only)
router.post(
  "/",
  tenantMiddleware,
  auth("admin", "tenant", "owner"),
  validateRequest(CouponValidation.createCouponValidationSchema),
  CouponControllers.createCoupon
);

// Update coupon (admin/tenant only)
router.patch(
  "/:id",
  tenantMiddleware,
  auth("admin", "tenant", "owner"),
  validateRequest(CouponValidation.updateCouponValidationSchema),
  CouponControllers.updateCoupon
);

router.put(
  "/:id",
  tenantMiddleware,
  auth("admin", "tenant", "owner"),
  validateRequest(CouponValidation.updateCouponValidationSchema),
  CouponControllers.updateCoupon
);

// Delete coupon (admin/tenant only)
router.delete(
  "/:id",
  tenantMiddleware,
  auth("admin", "tenant", "owner"),
  CouponControllers.deleteCoupon
);

export const CouponRoutes = router;
