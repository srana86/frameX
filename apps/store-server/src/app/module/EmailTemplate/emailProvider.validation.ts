import { z } from "zod";

const updateEmailSettingsValidationSchema = z.object({
  body: z.object({
    providers: z.array(
      z.object({
        id: z.string().optional(),
        provider: z.enum(["smtp", "ses", "sendgrid", "postmark"]),
        name: z.string().optional(),
        fromEmail: z.string().email().optional(),
        fromName: z.string().optional(),
        enabled: z.boolean().optional(),
        // SMTP specific
        host: z.string().optional(),
        port: z.number().optional(),
        username: z.string().optional(),
        password: z.string().optional(),
        secure: z.boolean().optional(),
        // SES specific
        region: z.string().optional(),
        accessKeyId: z.string().optional(),
        secretAccessKey: z.string().optional(),
        // SendGrid specific
        apiKey: z.string().optional(),
        // Postmark specific
        serverToken: z.string().optional(),
        messageStream: z.string().optional(),
      })
    ),
    defaultProviderId: z.string().optional(),
    fallbackProviderId: z.string().optional(),
  }),
});

const testEmailSettingsValidationSchema = z.object({
  body: z.object({
    providerId: z.string().optional(),
    to: z.string().email("Valid email is required"),
  }),
});

export const EmailProviderValidation = {
  updateEmailSettingsValidationSchema,
  testEmailSettingsValidationSchema,
};
