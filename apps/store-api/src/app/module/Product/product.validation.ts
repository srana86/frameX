import { z } from "zod";

// Create product validation schema
const createProductValidationSchema = z.object({
  body: z.object({
    id: z.string().optional(),
    slug: z.string().optional(),
    name: z.string({
      required_error: "Name is required",
      invalid_type_error: "Name must be string",
    }),
    brand: z.string({
      required_error: "Brand is required",
      invalid_type_error: "Brand must be string",
    }),
    category: z.string({
      required_error: "Category is required",
      invalid_type_error: "Category must be string",
    }),
    description: z.string({
      required_error: "Description is required",
      invalid_type_error: "Description must be string",
    }),
    price: z.number({
      required_error: "Price is required",
      invalid_type_error: "Price must be number",
    }),
    buyPrice: z.number().optional(),
    images: z.array(z.string()).optional(),
    sizes: z.array(z.string()).optional(),
    colors: z.array(z.string()).optional(),
    materials: z.array(z.string()).optional(),
    weight: z.string().optional(),
    dimensions: z.string().optional(),
    sku: z.string().optional(),
    condition: z.string().optional(),
    warranty: z.string().optional(),
    tags: z.array(z.string()).optional(),
    discountPercentage: z.number().optional(),
    featured: z.boolean().optional(),
    stock: z.number().optional(),
    order: z.number().optional(),
  }),
});

// Update product validation schema
const updateProductValidationSchema = z.object({
  body: z.object({
    name: z.string().optional(),
    slug: z.string().optional(),
    brand: z.string().optional(),
    category: z.string().optional(),
    description: z.string().optional(),
    price: z.number().optional(),
    buyPrice: z.number().optional(),
    images: z.array(z.string()).optional(),
    sizes: z.array(z.string()).optional(),
    colors: z.array(z.string()).optional(),
    materials: z.array(z.string()).optional(),
    weight: z.string().optional(),
    dimensions: z.string().optional(),
    sku: z.string().optional(),
    condition: z.string().optional(),
    warranty: z.string().optional(),
    tags: z.array(z.string()).optional(),
    discountPercentage: z.number().optional(),
    featured: z.boolean().optional(),
    stock: z.number().optional(),
    order: z.number().optional(),
  }),
});

// Update product order validation schema
const updateProductOrderValidationSchema = z.object({
  body: z.object({
    products: z.array(
      z.object({
        id: z.string(),
        order: z.number(),
      })
    ),
  }),
});

const createCategoryValidationSchema = z.object({
  body: z.object({
    name: z.string().min(1, "Name is required"),
    slug: z.string().optional(),
    description: z.string().optional(),
    order: z.number().optional(),
    enabled: z.boolean().optional(),
  }),
});

const updateCategoryOrderValidationSchema = z.object({
  body: z.object({
    categories: z.array(
      z.object({
        id: z.string().min(1),
        order: z.number(),
      })
    ),
  }),
});

const updateCategoryValidationSchema = z.object({
  body: z.object({
    name: z.string().min(1).optional(),
    slug: z.string().optional(),
    description: z.string().optional(),
    order: z.number().optional(),
    enabled: z.boolean().optional(),
  }),
});

export const ProductValidation = {
  createProductValidationSchema,
  updateProductValidationSchema,
  updateProductOrderValidationSchema,
  createCategoryValidationSchema,
  updateCategoryOrderValidationSchema,
  updateCategoryValidationSchema,
  // Review validation moved to Review module
};
