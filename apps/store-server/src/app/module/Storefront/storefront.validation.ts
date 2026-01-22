import { z } from "zod";

const calculateShippingValidationSchema = z.object({
  body: z.object({
    city: z.string().min(1, "City is required"),
    area: z.string().optional(),
    postalCode: z.string().optional(),
    weight: z.number().optional(),
    total: z.number().optional(),
  }),
});

export const StorefrontValidation = {
  calculateShippingValidationSchema,
};
