import { z } from "zod";

const saleStatusEnum = z.enum(["completed", "pending", "failed", "refunded"]);
const saleTypeEnum = z.enum(["new", "renewal", "upgrade", "downgrade"]);

export const createSaleValidationSchema = z.object({
  body: z.object({
    id: z.string().optional(),
    tenantId: z.string().min(1, "Tenant ID is required"),
    tenantName: z.string().optional(),
    tenantEmail: z.string().email().optional(),
    subscriptionId: z.string().optional(),
    planId: z.string().min(1, "Plan ID is required"),
    planName: z.string().optional(),
    amount: z.number().min(0, "Amount is required"),
    currency: z.string().optional(),
    billingCycleMonths: z.number().int().min(1).optional(),
    paymentMethod: z.string().optional(),
    transactionId: z.string().optional(),
    status: saleStatusEnum.optional(),
    type: saleTypeEnum.optional(),
    metadata: z.record(z.string(), z.any()).optional(),
  }),
});
