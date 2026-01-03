import { z } from "zod";

// Customer info schema
const customerInfoSchema = z.object({
  fullName: z.string({ required_error: "Full name is required" }),
  email: z.string().email().optional(),
  phone: z.string({ required_error: "Phone is required" }),
  addressLine1: z.string({ required_error: "Address line 1 is required" }),
  addressLine2: z.string().optional(),
  city: z.string({ required_error: "City is required" }),
  postalCode: z.string({ required_error: "Postal code is required" }),
  notes: z.string().optional(),
});

// Cart line item schema
const cartLineItemSchema = z.object({
  productId: z.string(),
  slug: z.string(),
  name: z.string(),
  price: z.number(),
  image: z.string(),
  size: z.string().optional(),
  color: z.string().optional(),
  quantity: z.number(),
  category: z.string().optional(),
});

// Create order validation schema
const createOrderValidationSchema = z.object({
  body: z.object({
    id: z.string().optional(),
    status: z
      .enum(["pending", "processing", "shipped", "delivered", "cancelled"])
      .optional(),
    orderType: z.enum(["online", "offline"]).optional(),
    items: z.array(cartLineItemSchema).min(1, "At least one item is required"),
    subtotal: z.number({ required_error: "Subtotal is required" }),
    discountPercentage: z.number().optional(),
    discountAmount: z.number().optional(),
    vatTaxPercentage: z.number().optional(),
    vatTaxAmount: z.number().optional(),
    shipping: z.number().default(0),
    total: z.number({ required_error: "Total is required" }),
    paymentMethod: z.enum(["cod", "online"], {
      required_error: "Payment method is required",
    }),
    paymentStatus: z
      .enum(["pending", "completed", "failed", "cancelled", "refunded"])
      .optional(),
    paidAmount: z.number().optional(),
    paymentTransactionId: z.string().optional(),
    paymentValId: z.string().optional(),
    customer: customerInfoSchema,
    couponCode: z.string().optional(),
    couponId: z.string().optional(),
    affiliateCode: z.string().optional(),
    affiliateId: z.string().optional(),
    affiliateCommission: z.number().optional(),
  }),
});

// Update order validation schema
const updateOrderValidationSchema = z.object({
  body: z.object({
    status: z
      .enum(["pending", "processing", "shipped", "delivered", "cancelled"])
      .optional(),
    paymentStatus: z
      .enum(["pending", "completed", "failed", "cancelled", "refunded"])
      .optional(),
    paidAmount: z.number().optional(),
    paymentTransactionId: z.string().optional(),
    paymentValId: z.string().optional(),
  }),
});

// Assign courier validation schema
const assignCourierValidationSchema = z.object({
  body: z.object({
    serviceId: z.string({ required_error: "Service ID is required" }),
    consignmentId: z.string().optional(),
  }),
});

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

const sendOrderToCourierValidationSchema = z.object({
  body: z.object({
    serviceId: z.string().min(1, "Service ID is required"),
    deliveryDetails: deliveryDetailsSchema,
  }),
});

const checkCourierStatusValidationSchema = z.object({
  body: z.object({
    serviceId: z.string().optional(), // Optional, can be retrieved from order
    consignmentId: z.string().optional(),
  }),
});

const placeOrderValidationSchema = z.object({
  body: z.object({
    productSlug: z.string().min(1, "Product slug is required"),
    quantity: z.number().int().positive("Quantity must be positive"),
    size: z.string().optional(),
    color: z.string().optional(),
    customer: customerInfoSchema,
    paymentMethod: z.enum(["cod", "online"]).optional(),
    shipping: z.number().nonnegative().optional(),
    notes: z.string().optional(),
    couponCode: z.string().optional(),
    sourceTracking: z
      .object({
        source: z.string().optional(),
        medium: z.string().optional(),
        campaign: z.string().optional(),
        referrer: z.string().optional(),
      })
      .optional(),
  }),
});

export const OrderValidation = {
  createOrderValidationSchema,
  updateOrderValidationSchema,
  assignCourierValidationSchema,
  sendOrderToCourierValidationSchema,
  checkCourierStatusValidationSchema,
  placeOrderValidationSchema,
};
