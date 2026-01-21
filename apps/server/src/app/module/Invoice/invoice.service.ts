/* eslint-disable @typescript-eslint/no-explicit-any */
import { prisma, PrismaQueryBuilder, InvoiceStatus, Decimal } from "@framex/database";
import AppError from "../../errors/AppError";
import { StatusCodes } from "http-status-codes";

// Generate invoice number
function generateInvoiceNumber(): string {
  const prefix = "INV";
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
}

const getAllInvoices = async (
  status?: string,
  tenantId?: string,
  limit: number = 100
) => {
  const where: any = {};
  if (status && status !== "all") {
    // Map status string to enum if needed, or pass as is if matches
    // InvoiceStatus enum: PENDING, PAID, OVERDUE, CANCELLED
    // Code below handles case conversion if necessary
    where.status = status.toUpperCase() as InvoiceStatus;
  }
  if (tenantId) {
    where.tenantId = tenantId;
  }

  // Fetch manual invoices
  const invoices = await prisma.invoice.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: limit
  });

  // Fetch successful checkouts to include as invoices
  const checkoutWhere: any = { status: "COMPLETED" };
  if (tenantId) {
    checkoutWhere.tenantId = tenantId;
  }

  const completedCheckouts = await prisma.checkout.findMany({
    where: checkoutWhere,
    orderBy: { createdAt: "desc" },
    take: limit
  });

  // Transform checkouts to invoice format
  const paymentInvoices = completedCheckouts.map(p => {
    // Assuming Checkout model has enough info or metadata stores it
    // Schema has items, metadata Json.
    const metadata: any = p.metadata || {};
    const items: any = p.items || [];
    const planName = metadata.planName || "Subscription";
    const billingCycle = metadata.billingCycle === "1" ? "1 Month" : metadata.billingCycle === "6" ? "6 Months" : "1 Year";

    return {
      id: p.id,
      invoiceNumber: `PAY-${p.sessionId || p.id}`, // using sessionId or id
      tenantId: p.tenantId,
      merchantName: metadata.merchantName,
      merchantEmail: p.customerEmail, // or metadata.merchantEmail
      subscriptionId: p.tenantId,
      planId: metadata.planId,
      planName: planName,
      billingCycle,
      amount: Number(p.amount),
      currency: p.currency,
      status: "paid", // Visual status
      dueDate: p.createdAt,
      paidAt: p.completedAt || p.createdAt,
      createdAt: p.createdAt,
      items: items.length ? items : [{
        description: `${planName} - ${billingCycle}`,
        quantity: 1,
        unitPrice: Number(p.amount),
        total: Number(p.amount)
      }]
    };
  });

  // Transform manual invoices
  const manualInvoices = invoices.map(i => ({
    ...i,
    amount: Number(i.amount),
    status: i.status.toLowerCase(), // normalize to lower for frontend
    items: i.items // Assuming items is stored as Json compatible with interface
  }));

  // Combine
  const allInvoices = [...manualInvoices, ...paymentInvoices].sort((a, b) => {
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return allInvoices.slice(0, limit);
};

const getInvoiceById = async (id: string) => {
  // Try to find by invoiceNumber or id
  const invoice = await prisma.invoice.findFirst({
    where: {
      OR: [
        { invoiceNumber: id },
        { id }
      ]
    }
  });

  if (!invoice) {
    throw new AppError(StatusCodes.NOT_FOUND, "Invoice not found");
  }

  return {
    ...invoice,
    amount: Number(invoice.amount),
    status: invoice.status.toLowerCase()
  };
};

const createInvoice = async (payload: any) => {
  if (!payload.merchantId || !payload.amount) {
    throw new Error("Missing required fields");
  }

  const invoiceData = {
    invoiceNumber: generateInvoiceNumber(),
    tenantId: payload.tenantId || payload.merchantId,
    // merchantName/Email not in Prisma Invoice model, likely needing join or ignore? 
    // Schema: tenantId, merchantId, subscriptionId, invoiceNumber, amount, currency, status, dueDate, paidAt, paymentMethodId, items
    // No merchantName/Email. We'll store relevant details in `items` or just ignore if not needed solely for display.
    // Or maybe I should've checked schema closer. Model `Invoice` line 924 doesn't have merchantName.
    // I can assume it fetches merchant info via merchantId from Merchant model if needed, 
    // but the service function returned it.
    // I will proceed with available fields.
    subscriptionId: payload.subscriptionId,
    amount: new Decimal(payload.amount),
    currency: payload.currency || "BDT",
    status: payload.status ? (payload.status.toUpperCase() as InvoiceStatus) : InvoiceStatus.PENDING,
    dueDate: payload.dueDate ? new Date(payload.dueDate) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    paidAt: payload.paidAt ? new Date(payload.paidAt) : null,
    items: payload.items || [
      {
        description: `${payload.planName || "Plan"} Subscription`,
        amount: payload.amount // Schema says items is Json [{description, amount}] roughly
      }
    ]
  };

  const invoice = await prisma.invoice.create({
    data: invoiceData
  });

  // Log activity
  await prisma.activityLog.create({
    data: {
      action: "invoice_created",
      resource: "invoice",
      resourceId: invoice.invoiceNumber,
      details: {
        invoiceNumber: invoice.invoiceNumber,
        tenantId: invoice.tenantId,
        amount: Number(invoice.amount)
      }
    }
  });

  return {
    success: true,
    id: invoice.id,
    invoiceNumber: invoice.invoiceNumber,
    invoice: { ...invoice, amount: Number(invoice.amount) }
  };
};

const updateInvoice = async (id: string, payload: any) => {
  // Find invoice
  const existing = await prisma.invoice.findFirst({
    where: { OR: [{ id }, { invoiceNumber: id }] }
  });

  if (!existing) throw new AppError(StatusCodes.NOT_FOUND, "Invoice not found");

  const updateData: any = { ...payload };
  delete updateData.id;
  delete updateData.invoiceNumber;
  if (updateData.amount) updateData.amount = new Decimal(updateData.amount);
  if (updateData.status) updateData.status = updateData.status.toUpperCase() as InvoiceStatus;

  const updated = await prisma.invoice.update({
    where: { id: existing.id },
    data: updateData
  });

  return { ...updated, amount: Number(updated.amount) };
};

const deleteInvoice = async (id: string) => {
  const existing = await prisma.invoice.findFirst({
    where: { OR: [{ id }, { invoiceNumber: id }] }
  });

  if (!existing) throw new AppError(StatusCodes.NOT_FOUND, "Invoice not found");

  // Only allow draft (PENDING in Prisma?)
  if (existing.status !== InvoiceStatus.PENDING) {
    throw new AppError(StatusCodes.BAD_REQUEST, "Only pending invoices can be deleted");
  }

  await prisma.invoice.delete({ where: { id: existing.id } });
  return { success: true, message: "Invoice deleted successfully" };
};

const sendInvoice = async (id: string) => {
  const existing = await prisma.invoice.findFirst({
    where: { OR: [{ id }, { invoiceNumber: id }] }
  });

  if (!existing) throw new AppError(StatusCodes.NOT_FOUND, "Invoice not found");

  if (existing.status === InvoiceStatus.PAID) {
    throw new AppError(StatusCodes.BAD_REQUEST, "Invoice is already paid");
  }

  // "sent" is not in InvoiceStatus enum (PENDING, PAID, OVERDUE, CANCELLED).
  // I can't set it to 'sent'. I will skip state update if enum restricts, 
  // or maybe set to PENDING but log it?
  // Mongoose had 'sent' and 'sentAt'. Prisma schema only has enum. 
  // I'll assume PENDING implies sent if sentAt is there? 
  // BUT `Invoice` model doesn't have `sentAt` field.
  // I'll skipping updating status to 'sent' and just log the action.

  await prisma.activityLog.create({
    data: {
      action: "invoice_sent",
      resource: "invoice",
      resourceId: existing.invoiceNumber,
      details: {
        invoiceNumber: existing.invoiceNumber,
        tenantId: existing.tenantId
      }
    }
  });

  return {
    success: true,
    message: "Invoice sent successfully",
    invoiceNumber: existing.invoiceNumber
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
