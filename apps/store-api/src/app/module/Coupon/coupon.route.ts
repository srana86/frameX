import express from "express";
import validateRequest from "../../middlewares/validateRequest";
import { CouponControllers } from "./coupon.controller";
import { CouponValidation } from "./coupon.validation";

const router = express.Router();

// Get all coupons with pagination, filter, and search
router.get("/", CouponControllers.getAllCoupons);

// Get single coupon by ID or code
router.get("/:id", CouponControllers.getSingleCoupon);

// Create coupon
router.post(
  "/",
  validateRequest(CouponValidation.createCouponValidationSchema),
  CouponControllers.createCoupon
);

// Update coupon
router.put(
  "/:id",
  validateRequest(CouponValidation.updateCouponValidationSchema),
  CouponControllers.updateCoupon
);

// Delete coupon
router.delete("/:id", CouponControllers.deleteCoupon);

// Apply coupon
router.post(
  "/apply",
  validateRequest(CouponValidation.applyCouponValidationSchema),
  CouponControllers.applyCoupon
);

// Record coupon usage
router.post(
  "/record-usage",
  validateRequest(CouponValidation.recordUsageValidationSchema),
  CouponControllers.recordCouponUsage
);

// Get coupon usage records
router.get("/record-usage", CouponControllers.getCouponUsageRecords);

export const CouponRoutes = router;
