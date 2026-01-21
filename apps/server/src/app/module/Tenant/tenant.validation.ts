import { z } from 'zod';

const tenantStatusEnum = z.enum(['active', 'suspended', 'trial', 'inactive']);

const tenantSettingsSchema = z.object({
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

export const createTenantValidationSchema = z.object({
  body: z.object({
    id: z.string().optional(),
    name: z.string().min(1, 'Name is required'),
    email: z.string().email('Invalid email address'),
    phone: z.string().optional(),
    status: tenantStatusEnum.optional(),
    customDomain: z.string().optional(),
    deploymentUrl: z.string().optional(),
    subscriptionId: z.string().optional(),
    settings: tenantSettingsSchema.optional(),
  }),
});

export const updateTenantValidationSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Tenant ID is required'),
  }),
  body: z.object({
    name: z.string().min(1).optional(),
    email: z.string().email().optional(),
    phone: z.string().optional(),
    status: tenantStatusEnum.optional(),
    customDomain: z.string().optional(),
    deploymentUrl: z.string().optional(),
    subscriptionId: z.string().optional(),
    settings: tenantSettingsSchema.optional(),
  }),
});

export const getTenantValidationSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Tenant ID is required'),
  }),
});

export const deleteTenantValidationSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Tenant ID is required'),
  }),
});
