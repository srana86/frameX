import express from "express";
import validateRequest from "../../middlewares/validateRequest";
import { ReviewControllers } from "./review.controller";
import { ReviewValidation } from "./review.validation";

const router = express.Router();

// Get product reviews
router.get("/:id", ReviewControllers.getProductReviews);

// Create product review
router.post(
  "/:id",
  validateRequest(ReviewValidation.createReviewValidationSchema),
  ReviewControllers.createProductReview
);

export const ReviewRoutes = router;
