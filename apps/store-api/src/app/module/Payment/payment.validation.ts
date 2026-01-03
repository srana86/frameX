import { z } from "zod";

// Payment init validation schema
const initPaymentValidationSchema = z.object({
  body: z.object({
    orderId: z.string({ required_error: "Order ID is required" }),
    customer: z.object({
      fullName: z.string({ required_error: "Full name is required" }),
      email: z.string().email().optional(),
      phone: z.string({ required_error: "Phone is required" }),
      addressLine1: z.string({ required_error: "Address line 1 is required" }),
      addressLine2: z.string().optional(),
      city: z.string({ required_error: "City is required" }),
      postalCode: z.string({ required_error: "Postal code is required" }),
    }),
  }),
});

export const PaymentValidation = {
  initPaymentValidationSchema,
};
