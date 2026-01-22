import { z } from "zod";

const createBudgetValidationSchema = z.object({
  body: z.object({
    name: z.string().min(1, "Name is required"),
    category: z.string().optional(),
    amount: z.number().positive("Amount must be positive"),
    period: z.string().min(1, "Period is required"),
    notes: z.string().optional(),
  }),
});

const updateBudgetValidationSchema = z.object({
  body: z.object({
    name: z.string().min(1).optional(),
    category: z.string().optional(),
    amount: z.number().positive().optional(),
    period: z.string().min(1).optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    isActive: z.boolean().optional(),
    notes: z.string().optional(),
  }),
});

export const BudgetValidation = {
  createBudgetValidationSchema,
  updateBudgetValidationSchema,
};
