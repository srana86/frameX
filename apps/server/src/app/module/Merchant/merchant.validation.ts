import { z } from 'zod';

const merchantStatusEnum = z.enum(['active', 'suspended', 'trial', 'inactive']);

const merchantSettingsSchema = z.object({
  brandName: z.string().optional(),
  logo: z.string().optional(),
  theme: z
    .object({
      primaryColor: z.string().optional(),
    })
    .optional(),
  currency: z.string().optional(),
  timezone: z.string().optional(),
});

export const createMerchantValidationSchema = z.object({
  body: z.object({
    id: z.string().optional(),
    name: z.string().min(1, 'Name is required'),
    email: z.string().email('Invalid email address'),
    phone: z.string().optional(),
    status: merchantStatusEnum.optional(),
    customDomain: z.string().optional(),
    deploymentUrl: z.string().optional(),
    subscriptionId: z.string().optional(),
    settings: merchantSettingsSchema.optional(),
  }),
});

export const updateMerchantValidationSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Merchant ID is required'),
  }),
  body: z.object({
    name: z.string().min(1).optional(),
    email: z.string().email().optional(),
    phone: z.string().optional(),
    status: merchantStatusEnum.optional(),
    customDomain: z.string().optional(),
    deploymentUrl: z.string().optional(),
    subscriptionId: z.string().optional(),
    settings: merchantSettingsSchema.optional(),
  }),
});

export const getMerchantValidationSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Merchant ID is required'),
  }),
});

export const deleteMerchantValidationSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Merchant ID is required'),
  }),
});
