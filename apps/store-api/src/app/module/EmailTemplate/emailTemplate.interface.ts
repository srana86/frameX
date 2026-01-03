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

export type EmailTemplateDesign = Record<string, any> | null;

export interface EmailTemplate {
  id: string;
  merchantId?: string;
  event: EmailEvent;
  name: string;
  description?: string;
  subject: string;
  fromName?: string;
  fromEmail?: string;
  replyTo?: string;
  previewText?: string;
  design?: EmailTemplateDesign;
  html?: string;
  variables?: string[];
  enabled: boolean;
  testRecipient?: string;
  createdAt?: string;
  updatedAt?: string;
  lastPublishedAt?: string;
}

