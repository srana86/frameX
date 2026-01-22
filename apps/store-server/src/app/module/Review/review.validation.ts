import { z } from "zod";

const createReviewValidationSchema = z.object({
  body: z.object({
    name: z.string().min(1, "Name is required"), // Changed from customerName to name to match FrameX-Store
    rating: z.number().min(1).max(5, "Rating must be between 1 and 5"),
    review: z.string().min(1, "Review is required"), // Changed from comment to review
    images: z.array(z.string()).optional(),
  }),
});

export const ReviewValidation = {
  createReviewValidationSchema,
};
