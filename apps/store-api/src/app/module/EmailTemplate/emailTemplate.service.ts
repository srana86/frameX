/* eslint-disable @typescript-eslint/no-explicit-any */
import { StatusCodes } from "http-status-codes";
import AppError from "../../errors/AppError";
import { EmailTemplate } from "./emailTemplate.model";
import {
  EmailTemplate as TEmailTemplate,
  EmailEvent,
} from "./emailTemplate.interface";

// Default email templates
const defaultEmailTemplates: Record<
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
    subject: "Your order {{orderId}} is confirmed",
    description: "Order summary and confirmation",
    variables: ["orderId", "customerName", "orderTotal", "orderDate"],
  },
  payment_confirmation: {
    name: "Payment Confirmation",
    subject: "Payment received for order {{orderId}}",
    description: "Payment receipt details",
    variables: ["orderId", "customerName", "orderTotal", "paymentMethod"],
  },
  order_shipped: {
    name: "Order Shipped",
    subject: "Your order {{orderId}} is on the way",
    description: "Shipping notification with tracking",
    variables: ["orderId", "trackingLink", "trackingId", "carrierName"],
  },
  order_delivered: {
    name: "Order Delivered",
    subject: "Order {{orderId}} was delivered",
    description: "Delivery confirmation",
    variables: ["orderId", "customerName"],
  },
  order_cancelled: {
    name: "Order Cancelled",
    subject: "Order {{orderId}} has been cancelled",
    description: "Cancellation notice",
    variables: ["orderId", "reason"],
  },
  order_refunded: {
    name: "Order Refunded",
    subject: "Refund processed for order {{orderId}}",
    description: "Refund confirmation",
    variables: ["orderId", "refundAmount", "paymentMethod"],
  },
  abandoned_cart: {
    name: "Abandoned Cart",
    subject: "Complete your order",
    description: "Reminder to finish checkout",
    variables: ["customerName", "cartItems", "cartTotal", "checkoutLink"],
  },
  password_reset: {
    name: "Password Reset",
    subject: "Reset your password",
    description: "Password reset link",
    variables: ["customerName", "resetLink", "expiresInMinutes"],
  },
  account_welcome: {
    name: "Welcome",
    subject: "Welcome to {{brandName}}",
    description: "Welcome email for new accounts",
    variables: ["customerName", "brandName"],
  },
  account_verification: {
    name: "Account Verification",
    subject: "Verify your account",
    description: "Email verification link",
    variables: ["customerName", "verificationLink"],
  },
  review_request: {
    name: "Review Request",
    subject: "How was your order?",
    description: "Request for product review",
    variables: ["customerName", "orderId", "productName", "reviewLink"],
  },
  low_stock_alert: {
    name: "Low Stock Alert",
    subject: "Low stock alert for {{productName}}",
    description: "Inventory alert for merchants",
    variables: ["productName", "currentStock", "minStock"],
  },
  admin_new_order_alert: {
    name: "New Order Alert",
    subject: "New order #{{orderId}}",
    description: "New order notification for admins",
    variables: ["orderId", "customerName", "orderTotal"],
  },
};

// Get email templates
const getEmailTemplatesFromDB = async (
  merchantId?: string,
  event?: EmailEvent
): Promise<{ templates: TEmailTemplate[] } | TEmailTemplate> => {
  const query: any = {};
  if (merchantId) {
    query.merchantId = merchantId;
  }
  if (event) {
    query.event = event;
  }

  if (event) {
    // Return single template
    let template = await EmailTemplate.findOne(query);
    if (!template) {
      // Return default template
      const defaults = defaultEmailTemplates[event];
      return {
        id: `email_template_${event}`,
        merchantId: merchantId || undefined,
        event,
        name: defaults.name,
        subject: defaults.subject,
        description: defaults.description,
        variables: defaults.variables,
        enabled: true,
        html: "",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }
    return template.toObject();
  }

  // Return all templates
  let templates = await EmailTemplate.find(query).sort({ event: 1 });

  if (templates.length === 0) {
    // Create default templates
    const defaultTemplatesData = Object.entries(defaultEmailTemplates).map(
      ([event, defaults]) => ({
        id: `email_template_${event}`,
        merchantId: merchantId || undefined,
        event: event as EmailEvent,
        name: defaults.name,
        subject: defaults.subject,
        description: defaults.description,
        variables: defaults.variables,
        enabled: true,
        html: "",
      })
    );
    templates = await EmailTemplate.insertMany(defaultTemplatesData);
  }

  return { templates: templates.map((t) => t.toObject()) };
};

// Update email template
const updateEmailTemplateFromDB = async (
  event: EmailEvent,
  payload: Partial<TEmailTemplate>,
  merchantId?: string
): Promise<TEmailTemplate> => {
  const query: any = { event };
  if (merchantId) {
    query.merchantId = merchantId;
  }

  const existing = await EmailTemplate.findOne(query);

  const updateData: any = {
    ...payload,
    updatedAt: new Date(),
  };

  if (!existing) {
    const defaults = defaultEmailTemplates[event];
    updateData.id = `email_template_${event}`;
    updateData.merchantId = merchantId || undefined;
    updateData.event = event;
    updateData.name = payload.name || defaults.name;
    updateData.subject = payload.subject || defaults.subject;
    updateData.description = payload.description || defaults.description;
    updateData.variables = payload.variables || defaults.variables;
    updateData.enabled = payload.enabled ?? true;
    updateData.html = payload.html || "";
    updateData.createdAt = new Date();
  }

  const result = await EmailTemplate.findOneAndUpdate(
    query,
    { $set: updateData },
    { new: true, upsert: true, runValidators: true }
  );

  if (!result) {
    throw new AppError(
      StatusCodes.INTERNAL_SERVER_ERROR,
      "Failed to update email template"
    );
  }

  return result.toObject();
};

// Create email template
const createEmailTemplateFromDB = async (
  payload: TEmailTemplate,
  merchantId?: string
): Promise<TEmailTemplate> => {
  const templateData: any = {
    ...payload,
    merchantId: merchantId || payload.merchantId,
  };

  if (!templateData.id) {
    templateData.id = `email_template_${payload.event}_${Date.now()}`;
  }

  const template = await EmailTemplate.create(templateData);
  return template.toObject();
};

export const EmailTemplateServices = {
  getEmailTemplatesFromDB,
  updateEmailTemplateFromDB,
  createEmailTemplateFromDB,
};
