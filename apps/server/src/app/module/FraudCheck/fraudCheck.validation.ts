import { z } from "zod";

export const checkCustomerFraudValidationSchema = z.object({
  body: z.object({
    phone: z.string().min(1, "Phone number is required"),
    action: z.enum(["list", "check"]).optional(),
    page: z.number().int().min(1).optional(),
    limit: z.number().int().min(1).max(100).optional(),
    risk_level: z.enum(["low", "medium", "high", "unknown"]).optional(),
  }),
});
