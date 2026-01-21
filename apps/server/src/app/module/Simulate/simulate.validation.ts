import { z } from "zod";

export const createDatabaseValidationSchema = z.object({
  body: z.object({
    tenantId: z.string().min(1, "Tenant ID is required"),
  }),
});

export const createDeploymentValidationSchema = z.object({
  body: z.object({
    tenantId: z.string().min(1, "Tenant ID is required"),
    tenantName: z.string().min(1, "Tenant name is required"),
    tenantEmail: z.string().email().optional(),
    databaseName: z.string().min(1, "Database name is required"),
    customSubdomain: z.string().optional(),
  }),
});

export const getDeploymentStatusValidationSchema = z.object({
  query: z.object({
    deploymentId: z.string().min(1, "Deployment ID is required"),
  }),
});
