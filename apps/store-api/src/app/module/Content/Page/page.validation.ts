import { z } from "zod";

// Create page validation schema
const createPageValidationSchema = z.object({
  body: z.object({
    id: z.string().optional(),
    title: z.string({ message: "Title is required" }),
    slug: z.string().optional(),
    content: z.string({ message: "Content is required" }),
    category: z.string().optional(),
    order: z.number().optional(),
    enabled: z.boolean().optional(),
  }),
});

// Update page validation schema
const updatePageValidationSchema = z.object({
  body: z.object({
    title: z.string().optional(),
    slug: z.string().optional(),
    content: z.string().optional(),
    category: z.string().optional(),
    order: z.number().optional(),
    enabled: z.boolean().optional(),
  }),
});

// Create page category validation schema
const createPageCategoryValidationSchema = z.object({
  body: z.object({
    id: z.string().optional(),
    name: z.string({ message: "Name is required" }),
    order: z.number().optional(),
  }),
});

// Update page category validation schema
const updatePageCategoryValidationSchema = z.object({
  body: z.object({
    name: z.string().optional(),
    order: z.number().optional(),
  }),
});

export const PageValidation = {
  createPageValidationSchema,
  updatePageValidationSchema,
  createPageCategoryValidationSchema,
  updatePageCategoryValidationSchema,
};
