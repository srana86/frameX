import { z } from "zod";

const createSubscriptionValidationSchema = z.object({
  body: z.object({
    planId: z.string().min(1, "Plan ID is required"),
    trialDays: z.number().int().positive().optional(),
  }),
});

export const SubscriptionValidation = {
  createSubscriptionValidationSchema,
};
