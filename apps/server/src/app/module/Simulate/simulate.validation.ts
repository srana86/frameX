import { z } from "zod";

export const createDatabaseValidationSchema = z.object({
  body: z.object({
    merchantId: z.string().min(1, "Merchant ID is required"),
  }),
});

export const createDeploymentValidationSchema = z.object({
  body: z.object({
    merchantId: z.string().min(1, "Merchant ID is required"),
    merchantName: z.string().min(1, "Merchant name is required"),
    merchantEmail: z.string().email().optional(),
    databaseName: z.string().min(1, "Database name is required"),
    customSubdomain: z.string().optional(),
  }),
});

export const getDeploymentStatusValidationSchema = z.object({
  query: z.object({
    deploymentId: z.string().min(1, "Deployment ID is required"),
  }),
});
