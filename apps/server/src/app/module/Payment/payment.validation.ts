import { z } from "zod";

export const updatePaymentValidationSchema = z.object({
  body: z.object({
    tranId: z.string().min(1, "Transaction ID is required"),
    status: z.enum(["pending", "completed", "failed", "cancelled"]).optional(),
    valId: z.string().optional(),
    error: z.string().optional(),
    completedAt: z.string().optional(),
    failedAt: z.string().optional(),
  }),
});

export const getPaymentStatsValidationSchema = z.object({
  body: z.object({
    action: z.literal("stats").optional(),
  }),
});
