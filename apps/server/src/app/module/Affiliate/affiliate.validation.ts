import { z } from "zod";

const createWithdrawalValidationSchema = z.object({
  body: z.object({
    action: z.enum(["create", "update"]),
    amount: z.number().positive("Amount must be positive").optional(),
    paymentMethod: z.string().optional(),
    paymentDetails: z
      .object({
        accountName: z.string().optional(),
        accountNumber: z.string().optional(),
        bankName: z.string().optional(),
        mobileNumber: z.string().optional(),
      })
      .optional(),
    withdrawalId: z.string().optional(),
    status: z.enum(["pending", "approved", "rejected", "completed"]).optional(),
    notes: z.string().optional(),
  }),
});

const updateSettingsValidationSchema = z.object({
  body: z.object({
    enabled: z.boolean().optional(),
    minWithdrawalAmount: z.number().nonnegative().optional(),
    commissionLevels: z
      .record(
        z.string(),
        z.object({
          percentage: z.number().min(0).max(100),
          enabled: z.boolean(),
          requiredSales: z.number().nonnegative().optional(),
        })
      )
      .optional(),
    salesThresholds: z.record(z.string(), z.number().nonnegative()).optional(),
    cookieExpiryDays: z.number().positive().optional(),
  }),
});

const setCookieValidationSchema = z.object({
  body: z.object({
    promoCode: z.string().min(1, "Promo code is required"),
  }),
});

const assignCouponValidationSchema = z.object({
  body: z.object({
    affiliateId: z.string().min(1, "Affiliate ID is required"),
    couponId: z.string().optional(),
  }),
});

export const AffiliateValidation = {
  createWithdrawalValidationSchema,
  updateSettingsValidationSchema,
  setCookieValidationSchema,
  assignCouponValidationSchema,
};
