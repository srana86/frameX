import { z } from "zod";

// Payment init validation schema
const initPaymentValidationSchema = z.object({
  body: z.object({
    orderId: z.string({ message: "Order ID is required" }),
    customer: z.object({
      fullName: z.string({ message: "Full name is required" }),
      email: z.string().email().optional(),
      phone: z.string({ message: "Phone is required" }),
      addressLine1: z.string({ message: "Address line 1 is required" }),
      addressLine2: z.string().optional(),
      city: z.string({ message: "City is required" }),
      postalCode: z.string({ message: "Postal code is required" }),
    }),
  }),
});

export const PaymentValidation = {
  initPaymentValidationSchema,
};
