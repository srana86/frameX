import { z } from "zod";

const createInvestmentValidationSchema = z.object({
  body: z.object({
    // Accept both frontend field names (name, amount) and backend (key, value)
    name: z.string().min(1, "Name is required").optional(),
    key: z.string().min(1, "Key/description is required").optional(),
    amount: z.number().positive("Amount must be positive").optional(),
    value: z.number().positive("Value must be positive").optional(),
    category: z.string().optional(),
    date: z.string().optional(),
    expectedReturn: z.number().optional(),
    notes: z.string().optional(),
  }).refine(
    (data) => data.name || data.key,
    { message: "Name or key is required", path: ["name"] }
  ).refine(
    (data) => data.amount !== undefined || data.value !== undefined,
    { message: "Amount or value is required", path: ["amount"] }
  ),
});

const updateInvestmentValidationSchema = z.object({
  body: z.object({
    name: z.string().min(1).optional(),
    key: z.string().min(1).optional(),
    amount: z.number().positive().optional(),
    value: z.number().positive().optional(),
    category: z.string().optional(),
    date: z.string().optional(),
    expectedReturn: z.number().optional(),
    actualReturn: z.number().optional(),
    notes: z.string().optional(),
  }),
});

export const InvestmentValidation = {
  createInvestmentValidationSchema,
  updateInvestmentValidationSchema,
};
