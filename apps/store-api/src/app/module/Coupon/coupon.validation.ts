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
    id: z.string().optional(),
    code: z.string({
      required_error: "Coupon code is required",
      invalid_type_error: "Code must be string",
    }),
    name: z.string({
      required_error: "Coupon name is required",
      invalid_type_error: "Name must be string",
    }),
    description: z.string().optional(),
    type: z.enum(
      [
        "percentage",
        "fixed_amount",
        "free_shipping",
        "buy_x_get_y",
        "first_order",
      ],
      {
        required_error: "Coupon type is required",
      }
    ),
    status: z.enum(["active", "inactive", "expired", "scheduled"]).optional(),
    discountValue: z.number({
      required_error: "Discount value is required",
      invalid_type_error: "Discount value must be number",
    }),
    maxDiscountAmount: z.number().optional(),
    buyXGetY: buyXGetYConfigSchema.optional(),
    startDate: z.string({
      required_error: "Start date is required",
    }),
    endDate: z.string({
      required_error: "End date is required",
    }),
    usageLimit: usageLimitSchema.optional(),
    conditions: conditionsSchema.optional(),
  }),
});

// Update coupon validation schema
const updateCouponValidationSchema = z.object({
  body: z.object({
    code: z.string().optional(),
    name: z.string().optional(),
    description: z.string().optional(),
    type: z
      .enum([
        "percentage",
        "fixed_amount",
        "free_shipping",
        "buy_x_get_y",
        "first_order",
      ])
      .optional(),
    status: z.enum(["active", "inactive", "expired", "scheduled"]).optional(),
    discountValue: z.number().optional(),
    maxDiscountAmount: z.number().optional(),
    buyXGetY: buyXGetYConfigSchema.optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    usageLimit: usageLimitSchema.optional(),
    conditions: conditionsSchema.optional(),
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
