import { z } from "zod";

// Buy X Get Y config schema
const buyXGetYConfigSchema = z.object({
  buyQuantity: z.number(),
  getQuantity: z.number(),
  productId: z.string().optional(),
  categoryId: z.string().optional(),
});

// Usage limit schema
const usageLimitSchema = z.object({
  totalUses: z.number().optional(),
  usesPerCustomer: z.number().optional(),
  currentUses: z.number().optional(),
});

// Conditions schema
const conditionsSchema = z.object({
  minPurchaseAmount: z.number().optional(),
  maxPurchaseAmount: z.number().optional(),
  applicableCategories: z.array(z.string()).optional(),
  excludedCategories: z.array(z.string()).optional(),
  applicableProducts: z.array(z.string()).optional(),
  excludedProducts: z.array(z.string()).optional(),
  firstOrderOnly: z.boolean().optional(),
});

// Create coupon validation schema
const createCouponValidationSchema = z.object({
  body: z.object({
    code: z.string({ message: "Coupon code is required" }),
    discountType: z.enum(["PERCENTAGE", "FIXED"], {
      message: "Discount type is required",
    }),
    discountValue: z.number({ message: "Discount value is required" }),
    minOrderValue: z.number().optional(),
    maxUses: z.number().optional(),
    expiresAt: z.string().optional(),
    isActive: z.boolean().optional(),
  }),
});

// Update coupon validation schema
const updateCouponValidationSchema = z.object({
  body: z.object({
    code: z.string().optional(),
    discountType: z.enum(["PERCENTAGE", "FIXED"]).optional(),
    discountValue: z.number().optional(),
    minOrderValue: z.number().optional(),
    maxUses: z.number().optional(),
    expiresAt: z.string().optional(),
    isActive: z.boolean().optional(),
  }),
});

const applyCouponValidationSchema = z.object({
  body: z.object({
    code: z.string().min(1, "Coupon code is required"),
    cartSubtotal: z.number().min(0),
    cartItems: z.array(
      z.object({
        productId: z.string(),
        categoryId: z.string().optional(),
        quantity: z.number().min(1),
        price: z.number().min(0),
      })
    ),
    customerEmail: z.string().email().optional(),
    customerPhone: z.string().optional(),
    isFirstOrder: z.boolean().optional(),
  }),
});

const recordUsageValidationSchema = z.object({
  body: z.object({
    couponId: z.string().min(1, "Coupon ID is required"),
    couponCode: z.string().min(1, "Coupon code is required"),
    orderId: z.string().min(1, "Order ID is required"),
    customerId: z.string().optional(),
    customerEmail: z.string().email().optional(),
    customerPhone: z.string().optional(),
    discountApplied: z.number().min(0),
    orderTotal: z.number().min(0),
  }),
});

export const CouponValidation = {
  createCouponValidationSchema,
  updateCouponValidationSchema,
  applyCouponValidationSchema,
  recordUsageValidationSchema,
};
