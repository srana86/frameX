import { Schema, model } from "mongoose";

export type EmailProviderType = "smtp" | "ses" | "sendgrid" | "postmark";

// Base schema for all email providers
const emailProviderBaseSchema = {
  id: { type: String, required: true },
  merchantId: String,
  provider: {
    type: String,
    enum: ["smtp", "ses", "sendgrid", "postmark"],
    required: true,
  },
  name: { type: String, required: true },
  fromEmail: String,
  fromName: String,
  replyTo: String,
  enabled: { type: Boolean, default: true },
  isFallback: Boolean,
};

// Email Provider Settings Schema
const emailProviderSettingsSchema = new Schema(
  {
    id: {
      type: String,
      required: true,
      unique: true,
      default: "email_providers_default",
    },
    merchantId: String,
    defaultProviderId: String,
    fallbackProviderId: String,
    providers: [
      new Schema(
        {
          ...emailProviderBaseSchema,
          // SMTP specific fields
          host: String,
          port: Number,
          username: String,
          password: String, // Should be encrypted
          secure: Boolean,
          // SES specific fields
          region: String,
          accessKeyId: String,
          secretAccessKey: String, // Should be encrypted
          // SendGrid specific fields
          apiKey: String, // Should be encrypted
          // Postmark specific fields
          serverToken: String, // Should be encrypted
          messageStream: String,
        },
        { _id: false }
      ),
    ],
  },
  {
    timestamps: true,
  }
);

export const EmailProviderSettings = model(
  "EmailProviderSettings",
  emailProviderSettingsSchema
);

