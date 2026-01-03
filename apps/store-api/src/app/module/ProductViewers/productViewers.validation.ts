import { z } from "zod";

const trackProductViewerValidationSchema = z.object({
  body: z.object({
    slug: z.string().min(1, "Product slug is required"),
    sessionId: z.string().optional(),
  }),
});

const removeProductViewerValidationSchema = z.object({
  body: z.object({
    slug: z.string().min(1, "Product slug is required"),
    sessionId: z.string().min(1, "Session ID is required"),
  }),
});

export const ProductViewersValidation = {
  trackProductViewerValidationSchema,
  removeProductViewerValidationSchema,
};
