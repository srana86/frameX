import { z } from "zod";

export const createOwnerValidationSchema = z.object({
    body: z.object({
        displayName: z.string().optional(),
        companyName: z.string().optional(),
        phone: z.string().optional(),
        address: z.string().optional(),
        billingEmail: z.string().email().optional(),
        billingAddress: z.string().optional(),
        vatNumber: z.string().optional(),
    }),
});

export const updateOwnerValidationSchema = z.object({
    body: z.object({
        displayName: z.string().optional(),
        companyName: z.string().optional(),
        phone: z.string().optional(),
        address: z.string().optional(),
        billingEmail: z.string().email().optional(),
        billingAddress: z.string().optional(),
        vatNumber: z.string().optional(),
    }),
});

export const createStoreValidationSchema = z.object({
    body: z.object({
        name: z.string().min(2, "Store name must be at least 2 characters"),
        email: z.string().email("Invalid email address"),
        slug: z.string().regex(/^[a-z0-9-]+$/, "Slug must be lowercase with hyphens only").optional(),
        phone: z.string().optional(),
    }),
});

export const updateStoreValidationSchema = z.object({
    params: z.object({
        storeId: z.string().uuid("Invalid store ID"),
    }),
    body: z.object({
        name: z.string().min(2).optional(),
        slug: z.string().regex(/^[a-z0-9-]+$/).optional(),
        phone: z.string().optional(),
        customDomain: z.string().optional(),
    }),
});

export const storeIdParamValidationSchema = z.object({
    params: z.object({
        storeId: z.string().uuid("Invalid store ID"),
    }),
});
