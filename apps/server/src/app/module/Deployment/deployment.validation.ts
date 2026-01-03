import { z } from "zod";

export const fixProjectIdValidationSchema = z.object({
  body: z.object({
    deploymentId: z.string().min(1, "Deployment ID is required"),
    projectId: z.string().min(1, "Project ID is required"),
  }),
});
