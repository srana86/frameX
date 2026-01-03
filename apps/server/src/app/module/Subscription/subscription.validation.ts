import { z } from "zod";

const subscriptionStatusEnum = z.enum([
  "active",
  "trial",
  "past_due",
  "cancelled",
  "expired",
]);
const billingCycleEnum = z.enum(["monthly", "semi_annual", "yearly"]);

export const createSubscriptionValidationSchema = z.object({
  body: z.object({
    id: z.string().optional(),
    merchantId: z.string().min(1, "Merchant ID is required"),
    planId: z.string().min(1, "Plan ID is required"),
    planName: z.string().optional(),
    billingCycleMonths: z.number().int().min(1).max(12).optional(),
    billingCycle: billingCycleEnum.optional(),
    amount: z.number().min(0).optional(),
    currency: z.string().optional(),
    status: subscriptionStatusEnum.optional(),
    currentPeriodStart: z.string().optional(),
    currentPeriodEnd: z.string().optional(),
    gracePeriodEndsAt: z.string().optional(),
    trialEndsAt: z.string().optional(),
    cancelAtPeriodEnd: z.boolean().optional(),
    cancelledAt: z.string().optional(),
    paymentMethodId: z.string().optional(),
    lastPaymentDate: z.string().optional(),
    nextBillingDate: z.string().optional(),
    totalPaid: z.number().optional(),
    autoRenew: z.boolean().optional(),
  }),
});

export const updateSubscriptionValidationSchema = z.object({
  params: z.object({
    id: z.string().min(1, "Subscription ID is required"),
  }),
  body: z.object({
    planId: z.string().optional(),
    planName: z.string().optional(),
    billingCycleMonths: z.number().int().min(1).max(12).optional(),
    billingCycle: billingCycleEnum.optional(),
    amount: z.number().min(0).optional(),
    currency: z.string().optional(),
    status: subscriptionStatusEnum.optional(),
    currentPeriodStart: z.string().optional(),
    currentPeriodEnd: z.string().optional(),
    gracePeriodEndsAt: z.string().optional(),
    trialEndsAt: z.string().optional(),
    cancelAtPeriodEnd: z.boolean().optional(),
    cancelledAt: z.string().optional(),
    paymentMethodId: z.string().optional(),
    lastPaymentDate: z.string().optional(),
    nextBillingDate: z.string().optional(),
    totalPaid: z.number().optional(),
    autoRenew: z.boolean().optional(),
  }),
});

export const getSubscriptionValidationSchema = z.object({
  params: z.object({
    id: z.string().min(1, "Subscription ID is required"),
  }),
});

export const deleteSubscriptionValidationSchema = z.object({
  params: z.object({
    id: z.string().min(1, "Subscription ID is required"),
  }),
});

export const renewSubscriptionValidationSchema = z.object({
  body: z.object({
    subscriptionId: z.string().min(1, "Subscription ID is required"),
    billingCycleMonths: z.number().int().min(1).max(12).optional(),
    paymentAmount: z.number().min(0).optional(),
    paymentMethod: z.string().optional(),
    transactionId: z.string().optional(),
  }),
});
