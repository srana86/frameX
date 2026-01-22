import { z } from "zod";

const checkFeaturesValidationSchema = z.object({
  body: z.object({
    features: z.array(z.string()).min(1, "At least one feature is required"),
  }),
});

const fraudCheckValidationSchema = z.object({
  body: z.object({
    phone: z.string().min(1, "Phone number is required"),
  }),
});

const configureDomainValidationSchema = z.object({
  body: z.object({
    domain: z.string().min(1, "Domain is required"),
  }),
});

const verifyDomainValidationSchema = z.object({
  body: z.object({
    domain: z.string().min(1, "Domain is required"),
  }),
});

const updateEmailSettingsValidationSchema = z.object({
  body: z.object({
    provider: z.string().optional(),
    enabled: z.boolean().optional(),
    settings: z.any().optional(),
  }),
});

const testEmailSettingsValidationSchema = z.object({
  body: z.object({
    to: z.string().email("Invalid email address"),
    subject: z.string().optional(),
    body: z.string().optional(),
  }),
});

const updateEmailTemplatesValidationSchema = z.object({
  body: z.object({
    event: z.string().min(1, "Event is required"),
    name: z.string().optional(),
    description: z.string().optional(),
    subject: z.string().optional(),
    previewText: z.string().optional(),
    fromName: z.string().optional(),
    fromEmail: z.string().optional(),
    replyTo: z.string().optional(),
    design: z.any().optional(),
    html: z.string().optional(),
    variables: z.array(z.string()).optional(),
    enabled: z.boolean().optional(),
  }),
});

const createEmailTemplateValidationSchema = z.object({
  body: z.object({
    event: z.string().min(1, "Event is required"),
    subject: z.string().min(1, "Subject is required"),
    body: z.string().min(1, "Body is required"),
    enabled: z.boolean().optional(),
  }),
});

export const TenantValidation = {
  checkFeaturesValidationSchema,
  fraudCheckValidationSchema,
  configureDomainValidationSchema,
  verifyDomainValidationSchema,
  updateEmailSettingsValidationSchema,
  testEmailSettingsValidationSchema,
  updateEmailTemplatesValidationSchema,
  createEmailTemplateValidationSchema,
};
