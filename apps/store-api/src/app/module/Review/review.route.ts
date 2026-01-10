import express from "express";
import validateRequest from "../../middlewares/validateRequest";
import { tenantMiddleware } from "../../middlewares/tenant";
import { ReviewControllers } from "./review.controller";
import { ReviewValidation } from "./review.validation";

const router = express.Router();

// Get product reviews
router.get("/:id", tenantMiddleware, ReviewControllers.getProductReviews);

// Create product review
router.post(
  "/:id",
  tenantMiddleware,
  validateRequest(ReviewValidation.createReviewValidationSchema),
  ReviewControllers.createProductReview
);

export const ReviewRoutes = router;
