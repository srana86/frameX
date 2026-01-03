import { z } from "zod";

// Update promotional banner validation schema
const updatePromotionalBannerValidationSchema = z.object({
  body: z.object({
    enabled: z.boolean().optional(),
    text: z.string().optional(),
    link: z.string().optional(),
    backgroundColor: z.string().optional(),
    textColor: z.string().optional(),
  }),
});

export const PromotionalBannerValidation = {
  updatePromotionalBannerValidationSchema,
};
