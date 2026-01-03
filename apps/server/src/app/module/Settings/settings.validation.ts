import { z } from "zod";

export const updateGeneralSettingsValidationSchema = z.object({
  body: z.object({
    siteName: z.string().optional(),
    defaultCurrency: z.string().optional(),
    timezone: z.string().optional(),
    dateFormat: z.string().optional(),
    darkMode: z.boolean().optional(),
    autoRefresh: z.boolean().optional(),
    refreshInterval: z.number().int().min(1).optional(),
  }),
});

export const updateSSLCommerzSettingsValidationSchema = z.object({
  body: z.object({
    storeId: z.string().optional(),
    storePassword: z.string().optional(),
    isLive: z.boolean().optional(),
    enabled: z.boolean().optional(),
  }),
});

export const testSSLCommerzConnectionValidationSchema = z.object({
  body: z.object({
    storeId: z.string().min(1, "Store ID is required"),
    storePassword: z.string().min(1, "Store Password is required"),
    isLive: z.boolean().optional(),
  }),
});
