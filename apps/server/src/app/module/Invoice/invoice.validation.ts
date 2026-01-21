import { z } from "zod";

const invoiceStatusEnum = z.enum([
  "draft",
  "sent",
  "paid",
  "overdue",
  "cancelled",
]);

const invoiceItemSchema = z.object({
  description: z.string(),
  quantity: z.number().min(1),
  unitPrice: z.number().min(0),
  total: z.number().min(0),
});

export const createInvoiceValidationSchema = z.object({
  body: z.object({
    tenantId: z.string().min(1, "Tenant ID is required"),
    tenantName: z.string().min(1, "Tenant name is required"),
    tenantEmail: z.string().email("Invalid tenant email"),
    subscriptionId: z.string().optional(),
    planId: z.string().optional(),
    planName: z.string().optional(),
    billingCycle: z.string().optional(),
    amount: z.number().min(0, "Amount is required"),
    currency: z.string().optional(),
    status: invoiceStatusEnum.optional(),
    dueDate: z.string().optional(),
    paidAt: z.string().optional(),
    items: z.array(invoiceItemSchema).optional(),
    notes: z.string().optional(),
  }),
});

export const updateInvoiceValidationSchema = z.object({
  params: z.object({
    id: z.string().min(1, "Invoice ID is required"),
  }),
  body: z.object({
    tenantName: z.string().optional(),
    tenantEmail: z.string().email().optional(),
    subscriptionId: z.string().optional(),
    planId: z.string().optional(),
    planName: z.string().optional(),
    billingCycle: z.string().optional(),
    amount: z.number().min(0).optional(),
    currency: z.string().optional(),
    status: invoiceStatusEnum.optional(),
    dueDate: z.string().optional(),
    paidAt: z.string().optional(),
    items: z.array(invoiceItemSchema).optional(),
    notes: z.string().optional(),
  }),
});

export const getInvoiceValidationSchema = z.object({
  params: z.object({
    id: z.string().min(1, "Invoice ID is required"),
  }),
});

export const deleteInvoiceValidationSchema = z.object({
  params: z.object({
    id: z.string().min(1, "Invoice ID is required"),
  }),
});

export const sendInvoiceValidationSchema = z.object({
  params: z.object({
    id: z.string().min(1, "Invoice ID is required"),
  }),
});
