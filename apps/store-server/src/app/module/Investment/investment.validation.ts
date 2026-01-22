import { z } from "zod";

const createInvestmentValidationSchema = z.object({
  body: z.object({
    key: z.string().min(1, "Key/description is required"),
    value: z.number().positive("Value must be positive"),
    category: z.string().optional(),
    notes: z.string().optional(),
  }),
});

const updateInvestmentValidationSchema = z.object({
  body: z.object({
    key: z.string().min(1).optional(),
    value: z.number().positive().optional(),
    category: z.string().optional(),
    notes: z.string().optional(),
  }),
});

export const InvestmentValidation = {
  createInvestmentValidationSchema,
  updateInvestmentValidationSchema,
};
