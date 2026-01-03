import { z } from "zod";

const buttonVariantEnum = z.enum(["default", "outline", "gradient"]);
const iconTypeEnum = z.enum(["star", "grid", "sparkles"]);

export const createPlanValidationSchema = z.object({
  body: z.object({
    id: z.string().optional(),
    name: z.string().min(1, "Plan name is required"),
    description: z.string().optional(),
    price: z.number().min(0),
    billingCycleMonths: z.number().int().min(1).max(12).optional(),
    featuresList: z.array(z.string()).optional(),
    isActive: z.boolean().optional(),
    isPopular: z.boolean().optional(),
    sortOrder: z.number().optional(),
    buttonText: z.string().optional(),
    buttonVariant: buttonVariantEnum.optional(),
    iconType: iconTypeEnum.optional(),
  }),
});

export const updatePlanValidationSchema = z.object({
  params: z.object({
    id: z.string().min(1, "Plan ID is required"),
  }),
  body: z.object({
    name: z.string().min(1).optional(),
    description: z.string().optional(),
    price: z.number().min(0).optional(),
    billingCycleMonths: z.number().int().min(1).max(12).optional(),
    featuresList: z.array(z.string()).optional(),
    isActive: z.boolean().optional(),
    isPopular: z.boolean().optional(),
    sortOrder: z.number().optional(),
    buttonText: z.string().optional(),
    buttonVariant: buttonVariantEnum.optional(),
    iconType: iconTypeEnum.optional(),
  }),
});

export const getPlanValidationSchema = z.object({
  params: z.object({
    id: z.string().min(1, "Plan ID is required"),
  }),
});

export const deletePlanValidationSchema = z.object({
  params: z.object({
    id: z.string().min(1, "Plan ID is required"),
  }),
});
