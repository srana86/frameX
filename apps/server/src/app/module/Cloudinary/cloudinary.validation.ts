import { z } from "zod";

export const uploadImageValidationSchema = z.object({
  body: z.object({
    file: z.any().optional(),
    url: z.string().url().optional(),
    folder: z.string().optional(),
    public_id: z.string().optional(),
    resource_type: z.string().optional(),
  }),
});

export const deleteImageValidationSchema = z.object({
  body: z.object({
    public_id: z.string().min(1, "public_id is required"),
    resource_type: z.string().optional(),
  }),
});
