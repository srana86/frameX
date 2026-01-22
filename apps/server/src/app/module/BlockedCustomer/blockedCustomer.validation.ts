import { z } from "zod";

const createBlockedCustomerValidationSchema = z.object({
  body: z.object({
    phone: z.string().optional(),
    email: z.string().email().optional(),
    reason: z.string().min(1, "Reason is required"),
    notes: z.string().optional(),
  }).refine((data) => data.phone || data.email, {
    message: "Either phone or email is required",
  }),
});

const checkBlockedCustomerValidationSchema = z.object({
  body: z.object({
    phone: z.string().optional(),
    email: z.string().email().optional(),
  }).refine((data) => data.phone || data.email, {
    message: "Either phone or email is required",
  }),
});

const updateBlockedCustomerValidationSchema = z.object({
  body: z.object({
    reason: z.string().optional(),
    notes: z.string().optional(),
    isActive: z.boolean().optional(),
  }),
});

export const BlockedCustomerValidation = {
  createBlockedCustomerValidationSchema,
  checkBlockedCustomerValidationSchema,
  updateBlockedCustomerValidationSchema,
};

