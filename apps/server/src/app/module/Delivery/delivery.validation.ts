import { z } from "zod";

const deliveryDetailsSchema = z.object({
  recipientName: z.string().min(2, "Recipient name is required"),
  recipientPhone: z.string().min(8, "Recipient phone is required"),
  recipientAddress: z
    .string()
    .min(10, "Recipient address must be at least 10 characters"),
  city: z.string().min(1, "City is required"),
  area: z.string().min(1, "Area is required"),
  amountToCollect: z
    .number()
    .nonnegative("Amount to collect must be 0 or greater"),
  itemWeight: z.number().positive("Item weight must be greater than 0"),
  specialInstruction: z.string().optional(),
});

const calculateShippingValidationSchema = z.object({
  body: z.object({
    city: z.string().min(1, "City is required"),
    area: z.string().optional(),
    postalCode: z.string().optional(),
    weight: z.number().optional(),
    total: z.number().optional(),
  }),
});

const sendOrderToCourierValidationSchema = z.object({
  body: z.object({
    serviceId: z.string().min(1, "Service ID is required"),
    deliveryDetails: deliveryDetailsSchema,
  }),
});

const checkCourierStatusValidationSchema = z.object({
  body: z.object({
    serviceId: z.string().min(1, "Service ID is required"),
    consignmentId: z.string().optional(),
  }),
});

export const DeliveryValidation = {
  calculateShippingValidationSchema,
  sendOrderToCourierValidationSchema,
  checkCourierStatusValidationSchema,
};
