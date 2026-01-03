import { z } from "zod";

const createMerchantValidationSchema = z.object({
  body: z.object({
    name: z.string().min(1, "Name is required"),
    email: z.string().email("Valid email is required"),
    password: z.string().min(6, "Password must be at least 6 characters"),
  }),
});

const updateMerchantValidationSchema = z.object({
  body: z.object({
    id: z.string().min(1, "Merchant ID is required"),
    name: z.string().optional(),
    email: z.string().email().optional(),
    status: z.enum(["in-progress", "blocked"]).optional(),
  }),
});

export const SuperAdminValidation = {
  createMerchantValidationSchema,
  updateMerchantValidationSchema,
};
