import { z } from "zod";

const trackVisitValidationSchema = z.object({
  body: z.object({
    path: z.string().optional(),
    referrer: z.string().optional(),
    userAgent: z.string().optional(),
  }),
});

export const VisitsValidation = {
  trackVisitValidationSchema,
};
