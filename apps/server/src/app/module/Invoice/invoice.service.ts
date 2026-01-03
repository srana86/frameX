import { Invoice } from "./invoice.model";
import { CheckoutSession } from "../Checkout/checkout.model";
import { ICheckoutSession } from "../Checkout/checkout.interface";
import { ActivityLog } from "../ActivityLog/activityLog.model";
import { toPlainObjectArray, toPlainObject } from "../../utils/mongodb";
import { IInvoice } from "./invoice.interface";

// Generate invoice number
function generateInvoiceNumber(): string {
  const prefix = "INV";
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
}

const getAllInvoices = async (
  status?: string,
  merchantId?: string,
  limit: number = 100
) => {
  const query: any = {};
  if (status && status !== "all") {
    query.status = status;
  }
  if (merchantId) {
    query.merchantId = merchantId;
  }

  // Fetch manual invoices
  const invoices = await Invoice.find(query)
    .sort({ createdAt: -1 })
    .limit(limit);

  // Also fetch from checkout_sessions to include successful payments as invoices
  const checkoutQuery: any = { status: "completed" };
  if (merchantId) {
    checkoutQuery.merchantId = merchantId;
  }
  const completedPayments = await CheckoutSession.find(checkoutQuery)
    .sort({ createdAt: -1 })
    .limit(limit);

  // Transform completed payments to invoice format
  const paymentInvoices = completedPayments
    .map((p) => {
      const data = toPlainObject<ICheckoutSession>(p);
      if (!data) return null;
      return {
        id: (p as any)._id?.toString(),
        invoiceNumber: `PAY-${data.tranId}`,
        merchantId: data.merchantId,
        merchantName: data.merchantName,
        merchantEmail: data.merchantEmail,
        subscriptionId: data.merchantId, // Can be derived
        planId: data.planId,
        planName: data.planName,
        billingCycle:
          data.billingCycle === "1"
            ? "1 Month"
            : data.billingCycle === "6"
              ? "6 Months"
              : "1 Year",
        amount: data.planPrice || 0,
        currency: "BDT", // Default currency
        status: "paid" as const,
        dueDate: data.createdAt,
        paidAt: data.updatedAt || data.createdAt,
        createdAt: data.createdAt,
        items: [
          {
            description: `${data.planName || "Plan"} - ${
              data.billingCycle === "1"
                ? "Monthly"
                : data.billingCycle === "6"
                  ? "6 Months"
                  : "Yearly"
            } Subscription`,
            quantity: 1,
            unitPrice: data.planPrice || 0,
            total: data.planPrice || 0,
          },
        ],
      };
    })
    .filter(Boolean) as any[];

  // Transform manual invoices
  const manualInvoices = invoices.map((i) => toPlainObject<IInvoice>(i));

  // Combine and sort by creation date
  const allInvoices = [...manualInvoices, ...paymentInvoices].sort((a, b) => {
    const aDate = a?.createdAt ? new Date(a.createdAt).getTime() : 0;
    const bDate = b?.createdAt ? new Date(b.createdAt).getTime() : 0;
    return bDate - aDate;
  });

  return allInvoices;
};

const getInvoiceById = async (id: string) => {
  // Try to find by invoiceNumber first, then by MongoDB _id
  let invoice = await Invoice.findOne({ invoiceNumber: id });
  if (!invoice) {
    // Try MongoDB ObjectId
    try {
      const { default: mongoose } = await import("mongoose");
      if (mongoose.Types.ObjectId.isValid(id)) {
        invoice = await Invoice.findById(id);
      }
    } catch (e) {
      // Ignore
    }
  }
  if (!invoice) {
    throw new Error("Invoice not found");
  }
  return toPlainObject<IInvoice>(invoice);
};

const createInvoice = async (payload: Partial<IInvoice>) => {
  if (
    !payload.merchantId ||
    !payload.merchantName ||
    !payload.merchantEmail ||
    !payload.amount
  ) {
    throw new Error("Missing required fields");
  }

  const invoiceData: IInvoice = {
    invoiceNumber: generateInvoiceNumber(),
    merchantId: payload.merchantId,
    merchantName: payload.merchantName,
    merchantEmail: payload.merchantEmail,
    subscriptionId: payload.subscriptionId,
    planId: payload.planId,
    planName: payload.planName,
    billingCycle: payload.billingCycle,
    amount: payload.amount,
    currency: payload.currency || "BDT",
    status: payload.status || "draft",
    dueDate:
      payload.dueDate ||
      new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    paidAt: payload.paidAt,
    items: payload.items || [
      {
        description: `${payload.planName || "Plan"} - ${payload.billingCycle || "Monthly"} Subscription`,
        quantity: 1,
        unitPrice: payload.amount,
        total: payload.amount,
      },
    ],
    notes: payload.notes,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const invoice = await Invoice.create(invoiceData);

  // Log activity
  await ActivityLog.create({
    id: `log_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    type: "system",
    action: "invoice_created",
    entityId: invoice.invoiceNumber,
    details: {
      invoiceNumber: invoice.invoiceNumber,
      merchantId: invoice.merchantId,
      amount: invoice.amount,
    },
    createdAt: new Date().toISOString(),
  });

  return {
    success: true,
    id: (invoice as any)._id?.toString(),
    invoiceNumber: invoice.invoiceNumber,
    invoice: toPlainObject<IInvoice>(invoice),
  };
};

const updateInvoice = async (id: string, payload: Partial<IInvoice>) => {
  const updateData: any = {
    ...payload,
    updatedAt: new Date().toISOString(),
  };

  delete updateData.id;
  delete updateData.invoiceNumber; // Don't allow updating invoice number

  // Try to find by invoiceNumber first, then by MongoDB _id
  let invoice = await Invoice.findOneAndUpdate(
    { invoiceNumber: id },
    { $set: updateData },
    { new: true }
  );
  if (!invoice) {
    try {
      const { default: mongoose } = await import("mongoose");
      if (mongoose.Types.ObjectId.isValid(id)) {
        invoice = await Invoice.findByIdAndUpdate(
          id,
          { $set: updateData },
          { new: true }
        );
      }
    } catch (e) {
      // Ignore
    }
  }
  if (!invoice) {
    throw new Error("Invoice not found");
  }
  return toPlainObject<IInvoice>(invoice);
};

const deleteInvoice = async (id: string) => {
  // Try to find by invoiceNumber first, then by MongoDB _id
  let invoice = await Invoice.findOne({ invoiceNumber: id });
  if (!invoice) {
    try {
      const { default: mongoose } = await import("mongoose");
      if (mongoose.Types.ObjectId.isValid(id)) {
        invoice = await Invoice.findById(id);
      }
    } catch (e) {
      // Ignore
    }
  }
  if (!invoice) {
    throw new Error("Invoice not found");
  }

  // Only allow deleting draft invoices
  if (invoice.status !== "draft") {
    throw new Error("Only draft invoices can be deleted");
  }

  await Invoice.deleteOne({ _id: (invoice as any)._id });
  return { success: true, message: "Invoice deleted successfully" };
};

const sendInvoice = async (id: string) => {
  // Try to find by invoiceNumber first, then by MongoDB _id
  let invoice = await Invoice.findOne({ invoiceNumber: id });
  if (!invoice) {
    try {
      const { default: mongoose } = await import("mongoose");
      if (mongoose.Types.ObjectId.isValid(id)) {
        invoice = await Invoice.findById(id);
      }
    } catch (e) {
      // Ignore
    }
  }
  if (!invoice) {
    throw new Error("Invoice not found");
  }

  if (invoice.status === "paid") {
    throw new Error("Invoice is already paid");
  }

  // TODO: Implement actual email sending
  // For now, just update the sent status
  const query =
    invoice.invoiceNumber === id
      ? { invoiceNumber: id }
      : { _id: (invoice as any)._id };
  await Invoice.findOneAndUpdate(query, {
    $set: {
      status: "sent",
      sentAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  });

  // Log activity
  await ActivityLog.create({
    id: `log_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    type: "system",
    action: "invoice_sent",
    entityId: invoice.invoiceNumber,
    details: {
      invoiceNumber: invoice.invoiceNumber,
      merchantId: invoice.merchantId,
      merchantEmail: invoice.merchantEmail,
    },
    createdAt: new Date().toISOString(),
  });

  return {
    success: true,
    message: "Invoice sent successfully",
    invoiceNumber: invoice.invoiceNumber,
  };
};

export const InvoiceServices = {
  getAllInvoices,
  getInvoiceById,
  createInvoice,
  updateInvoice,
  deleteInvoice,
  sendInvoice,
};
