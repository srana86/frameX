import { Schema, model } from "mongoose";

export type EmailEvent =
  | "order_confirmation"
  | "payment_confirmation"
  | "order_shipped"
  | "order_delivered"
  | "order_cancelled"
  | "order_refunded"
  | "abandoned_cart"
  | "password_reset"
  | "account_welcome"
  | "account_verification"
  | "review_request"
  | "low_stock_alert"
  | "admin_new_order_alert";

// Email Template Schema
const emailTemplateSchema = new Schema(
  {
    id: {
      type: String,
      required: true,
      unique: true,
    },
    merchantId: String,
    event: {
      type: String,
      enum: [
        "order_confirmation",
        "payment_confirmation",
        "order_shipped",
        "order_delivered",
        "order_cancelled",
        "order_refunded",
        "abandoned_cart",
        "password_reset",
        "account_welcome",
        "account_verification",
        "review_request",
        "low_stock_alert",
        "admin_new_order_alert",
      ],
      required: true,
      index: true,
    },
    name: { type: String, required: true },
    description: String,
    subject: { type: String, required: true },
    fromName: String,
    fromEmail: String,
    replyTo: String,
    previewText: String,
    design: Schema.Types.Mixed, // JSON object for design
    html: String,
    variables: [String],
    enabled: { type: Boolean, default: true },
    testRecipient: String,
    lastPublishedAt: Date,
  },
  {
    timestamps: true,
  }
);

// Compound index for merchantId and event
emailTemplateSchema.index({ merchantId: 1, event: 1 });

export const EmailTemplate = model("EmailTemplate", emailTemplateSchema);

