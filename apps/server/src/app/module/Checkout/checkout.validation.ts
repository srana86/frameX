import { z } from "zod";

export const initCheckoutValidationSchema = z.object({
  body: z.object({
    planId: z.string().min(1, "Plan ID is required"),
    planName: z.string().min(1, "Plan name is required"),
    planPrice: z.number().min(0),
    billingCycle: z.string().optional(),
    tenantName: z.string().min(1, "Tenant name is required"),
    tenantEmail: z.string().email("Invalid tenant email"),
    tenantPhone: z.string().optional(),
    customSubdomain: z.string().optional(),
    customerName: z.string().min(1, "Customer name is required"),
    customerEmail: z.string().email("Invalid customer email"),
    customerPhone: z.string().optional(),
    customerAddress: z.string().optional(),
    customerCity: z.string().optional(),
    customerState: z.string().optional(),
    customerPostcode: z.string().optional(),
    customerCountry: z.string().optional(),
  }),
});
