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

export const emailEvents: EmailEvent[] = [
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
];

export type EmailTemplateDesign = Record<string, any> | null;

export type EmailTemplate = {
  id: string;
  tenantId?: string;
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
  createdAt: string;
  updatedAt: string;
  lastPublishedAt?: string;
};

export type EmailTemplateUpdate = Partial<Omit<EmailTemplate, "id" | "event" | "createdAt">>;

export type EmailProviderType = "smtp" | "ses" | "sendgrid" | "postmark";

type EmailProviderBase = {
  id: string;
  tenantId?: string;
  provider: EmailProviderType;
  name: string;
  fromEmail?: string;
  fromName?: string;
  replyTo?: string;
  enabled: boolean;
  isFallback?: boolean;
  createdAt: string;
  updatedAt: string;
};

export type SmtpProviderConfig = EmailProviderBase & {
  provider: "smtp";
  host: string;
  port: number;
  username?: string;
  password?: string; // store encrypted at rest
  secure?: boolean;
};

export type SesProviderConfig = EmailProviderBase & {
  provider: "ses";
  region?: string;
  accessKeyId?: string;
  secretAccessKey?: string; // store encrypted at rest
};

export type SendGridProviderConfig = EmailProviderBase & {
  provider: "sendgrid";
  apiKey?: string; // store encrypted at rest
};

export type PostmarkProviderConfig = EmailProviderBase & {
  provider: "postmark";
  serverToken?: string; // store encrypted at rest
  messageStream?: string;
};

export type EmailProviderConfig = SmtpProviderConfig | SesProviderConfig | SendGridProviderConfig | PostmarkProviderConfig;

export type EmailProviderSettings = {
  id: string;
  tenantId?: string;
  defaultProviderId?: string;
  fallbackProviderId?: string;
  providers: EmailProviderConfig[];
  createdAt: string;
  updatedAt: string;
};

export type EmailSendResult = {
  ok: boolean;
  provider?: string;
  messageId?: string;
  responseId?: string;
  error?: string;
};

export type EmailSendPayload = {
  to: string | string[];
  cc?: string | string[];
  bcc?: string | string[];
  fromEmail?: string;
  fromName?: string;
  replyTo?: string;
  subject: string;
  html: string;
  text?: string;
  tags?: string[];
  event?: EmailEvent;
  variables?: Record<string, string | number>;
};

export type BrandEmailMeta = {
  brandName?: string;
  fromEmail?: string;
  fromName?: string;
  replyTo?: string;
};

export const defaultEmailTemplates: Record<
  EmailEvent,
  {
    name: string;
    subject: string;
    description: string;
    variables: string[];
  }
> = {
  order_confirmation: {
    name: "Order Confirmation",
    subject: "Your {{brandName}} order {{orderId}} is confirmed",
    description: "Order summary, totals, and what happens next from {{brandName}}.",
    variables: ["brandName", "orderId", "customerName", "orderTotal", "orderDate", "orderItems", "trackingLink"],
  },
  payment_confirmation: {
    name: "Payment Confirmation",
    subject: "Payment received for order {{orderId}} – {{brandName}}",
    description: "Receipt details for your payment at {{brandName}}.",
    variables: ["brandName", "orderId", "customerName", "orderTotal", "paymentMethod", "paymentDate"],
  },
  order_shipped: {
    name: "Order Shipped",
    subject: "Your order {{orderId}} is on the way",
    description: "Includes courier, tracking link and ETA.",
    variables: ["orderId", "customerName", "trackingLink", "trackingId", "carrierName", "eta"],
  },
  order_delivered: {
    name: "Order Delivered",
    subject: "Order {{orderId}} was delivered",
    description: "Delivery confirmation with support and review CTA.",
    variables: ["orderId", "customerName", "supportEmail", "supportPhone"],
  },
  order_cancelled: {
    name: "Order Cancelled",
    subject: "Order {{orderId}} has been cancelled",
    description: "Cancellation reason and next steps.",
    variables: ["orderId", "customerName", "reason", "refundAmount"],
  },
  order_refunded: {
    name: "Order Refunded",
    subject: "Refund processed for order {{orderId}}",
    description: "Refund confirmation and timeline.",
    variables: ["orderId", "customerName", "refundAmount", "paymentMethod", "refundDate"],
  },
  abandoned_cart: {
    name: "Abandoned Cart",
    subject: "Complete your order for {{cartTotal}}",
    description: "Reminder to finish checkout with cart items.",
    variables: ["customerName", "cartItems", "cartTotal", "checkoutLink"],
  },
  password_reset: {
    name: "Password Reset",
    subject: "Reset your {{brandName}} password",
    description: "Reset link for customer accounts.",
    variables: ["brandName", "customerName", "resetLink", "expiresInMinutes"],
  },
  account_welcome: {
    name: "Welcome",
    subject: "Welcome to {{brandName}}",
    description: "Greets new customers with intro content.",
    variables: ["customerName", "brandName", "supportEmail"],
  },
  account_verification: {
    name: "Account Verification",
    subject: "Verify your email for {{brandName}}",
    description: "Verification code or link for new accounts.",
    variables: ["customerName", "verificationLink", "verificationCode", "expiresInMinutes"],
  },
  review_request: {
    name: "Review Request",
    subject: "How was your {{brandName}} order {{orderId}}?",
    description: "Ask for feedback and review after delivery.",
    variables: ["brandName", "customerName", "orderId", "reviewLink"],
  },
  low_stock_alert: {
    name: "Low Stock Alert",
    subject: "Low stock warning: {{productName}}",
    description: "Internal alert for low inventory.",
    variables: ["productName", "sku", "currentStock", "threshold"],
  },
  admin_new_order_alert: {
    name: "New Order Alert",
    subject: "New order placed: {{orderId}}",
    description: "Internal alert to tenant team for new orders.",
    variables: ["orderId", "customerName", "orderTotal", "orderDate"],
  },
};

function baseEmailHtml(title: string, body: string[], brandName: string) {
  const paragraphs = body.map((p) => `<p style="margin:0 0 12px 0; font-size:15px; color:#1f2937;">${p}</p>`).join("");
  return `
  <div style="font-family: 'Inter', Arial, sans-serif; background:#f7fafc; padding:20px;">
    <div style="max-width:620px;margin:0 auto;background:#ffffff;border-radius:12px;border:1px solid #e5e7eb;overflow:hidden;">
      <div style="background:#0f172a;color:#e2e8f0;padding:16px 20px;font-size:18px;font-weight:700;">
        ${brandName}
      </div>
      <div style="padding:20px 24px;">
        <h2 style="margin:0 0 12px 0;font-size:20px;color:#0f172a;">${title}</h2>
        ${paragraphs}
      </div>
      <div style="padding:14px 20px;background:#f8fafc;color:#475569;font-size:13px;border-top:1px solid #e5e7eb;">
        Sent by ${brandName}. If you need help, reply to this email.
      </div>
    </div>
  </div>
  `;
}

const defaultEmailHtml: Record<EmailEvent, (brandName: string) => string> = {
  order_confirmation: (brand) =>
    baseEmailHtml("Order confirmed", ["We have received your order {{orderId}}.", "Total: {{orderTotal}}", "Items: {{orderItems}}"], brand),
  payment_confirmation: (brand) =>
    baseEmailHtml(
      "Payment received",
      ["Payment for order {{orderId}} is confirmed.", "Amount: {{orderTotal}}", "Method: {{paymentMethod}}"],
      brand
    ),
  order_shipped: (brand) =>
    baseEmailHtml(
      "Your order is on the way",
      ["Order {{orderId}} has shipped.", "Tracking: {{trackingLink}}", "Carrier: {{carrierName}}"],
      brand
    ),
  order_delivered: (brand) =>
    baseEmailHtml("Order delivered", ["Order {{orderId}} was delivered.", "If anything is wrong, let us know."], brand),
  order_cancelled: (brand) =>
    baseEmailHtml("Order cancelled", ["Order {{orderId}} has been cancelled.", "Reason: {{reason}}", "Refund: {{refundAmount}}"], brand),
  order_refunded: (brand) =>
    baseEmailHtml(
      "Refund processed",
      ["We processed your refund for order {{orderId}}.", "Amount: {{refundAmount}}", "Method: {{paymentMethod}}"],
      brand
    ),
  abandoned_cart: (brand) =>
    baseEmailHtml(
      "Finish your checkout",
      ["You left items in your cart.", "Total: {{cartTotal}}", "Complete your order: {{checkoutLink}}"],
      brand
    ),
  password_reset: (brand) =>
    baseEmailHtml(
      "Reset your password",
      ["Use the link to reset your password:", "{{resetLink}}", "Expires in {{expiresInMinutes}} minutes."],
      brand
    ),
  account_welcome: (brand) =>
    baseEmailHtml("Welcome to " + brand, ["Hi {{customerName}}, thanks for joining {{brandName}}!", "We’re excited to have you."], brand),
  account_verification: (brand) =>
    baseEmailHtml(
      "Verify your email",
      ["Verify your account for {{brandName}}.", "Link: {{verificationLink}}", "Code: {{verificationCode}}"],
      brand
    ),
  review_request: (brand) =>
    baseEmailHtml("How was your order?", ["Tell us about order {{orderId}}.", "Leave a review: {{reviewLink}}"], brand),
  low_stock_alert: (brand) =>
    baseEmailHtml(
      "Low stock alert",
      ["{{productName}} (SKU {{sku}}) is low.", "Current: {{currentStock}} | Threshold: {{threshold}}"],
      brand
    ),
  admin_new_order_alert: (brand) =>
    baseEmailHtml(
      "New order received",
      ["Order: {{orderId}}", "Customer: {{customerName}}", "Total: {{orderTotal}}", "Date: {{orderDate}}"],
      brand
    ),
};

export function buildDefaultTemplate(event: EmailEvent, tenantId?: string, brand?: BrandEmailMeta): EmailTemplate {
  const now = new Date().toISOString();
  const base = defaultEmailTemplates[event];
  const brandName = brand?.brandName || "Your Store";
  const subject = base.subject.replace(/{{\s*brandName\s*}}/g, brandName);

  return {
    id: `email_template_${event}`,
    tenantId,
    event,
    name: base.name,
    description: base.description,
    subject,
    fromName: brand?.fromName || brandName,
    fromEmail: brand?.fromEmail,
    replyTo: brand?.replyTo || brand?.fromEmail,
    previewText: "",
    design: null,
    html: defaultEmailHtml[event]?.(brandName) || "",
    variables: base.variables,
    enabled: true,
    createdAt: now,
    updatedAt: now,
    lastPublishedAt: undefined,
  };
}
