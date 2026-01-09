export type EmailEvent =
  | "ORDER_CONFIRMATION"
  | "PAYMENT_CONFIRMATION"
  | "ORDER_SHIPPED"
  | "ORDER_DELIVERED"
  | "ORDER_CANCELLED"
  | "ORDER_REFUNDED"
  | "ABANDONED_CART"
  | "PASSWORD_RESET"
  | "ACCOUNT_WELCOME"
  | "ACCOUNT_VERIFICATION"
  | "REVIEW_REQUEST"
  | "LOW_STOCK_ALERT"
  | "ADMIN_NEW_ORDER_ALERT";

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

