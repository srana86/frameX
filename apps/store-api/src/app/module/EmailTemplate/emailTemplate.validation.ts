import { z } from "zod";

const updateEmailTemplateValidationSchema = z.object({
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
    name: z.string().min(1, "Name is required"),
    subject: z.string().min(1, "Subject is required"),
    html: z.string().optional(),
    enabled: z.boolean().optional(),
  }),
});

const testEmailTemplateValidationSchema = z.object({
  body: z.object({
    event: z.string().min(1, "Event is required"),
    to: z.string().email("Valid email is required"),
    html: z.string().optional(),
    variables: z.record(z.any()).optional(),
  }),
});

export const EmailTemplateValidation = {
  updateEmailTemplateValidationSchema,
  createEmailTemplateValidationSchema,
  testEmailTemplateValidationSchema,
};
