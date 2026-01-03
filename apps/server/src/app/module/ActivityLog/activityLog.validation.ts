import { z } from "zod";

const activityLogTypeEnum = z.enum([
  "merchant",
  "subscription",
  "plan",
  "deployment",
  "database",
  "system",
]);

export const createActivityLogValidationSchema = z.object({
  body: z.object({
    type: activityLogTypeEnum,
    action: z.string().min(1, "Action is required"),
    entityId: z.string().min(1, "Entity ID is required"),
    entityName: z.string().optional(),
    details: z.record(z.any()).optional(),
    performedBy: z.string().optional(),
  }),
});
