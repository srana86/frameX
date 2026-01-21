import { z } from "zod";

const featureRequestStatusEnum = z.enum(["new", "in_review", "resolved"]);
const featureRequestPriorityEnum = z.enum(["low", "medium", "high"]);

export const createFeatureRequestValidationSchema = z.object({
  body: z.object({
    title: z.string().min(1, "Title is required"),
    description: z.string().min(1, "Description is required"),
    priority: featureRequestPriorityEnum.optional(),
    contactEmail: z.string().email().optional(),
    contactPhone: z.string().optional(),
    tenantId: z.string().min(1, "Tenant ID is required"),
    status: featureRequestStatusEnum.optional(),
  }),
});

export const updateFeatureRequestValidationSchema = z.object({
  params: z.object({
    id: z.string().min(1, "Feature request ID is required"),
  }),
  body: z.object({
    status: featureRequestStatusEnum.optional(),
    priority: featureRequestPriorityEnum.optional(),
  }),
});

export const getFeatureRequestValidationSchema = z.object({
  params: z.object({
    id: z.string().min(1, "Feature request ID is required"),
  }),
});

export const deleteFeatureRequestValidationSchema = z.object({
  params: z.object({
    id: z.string().min(1, "Feature request ID is required"),
  }),
});
