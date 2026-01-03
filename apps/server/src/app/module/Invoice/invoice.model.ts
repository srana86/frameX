import { Schema, model } from "mongoose";
import { IInvoice, InvoiceStatus, IInvoiceItem } from "./invoice.interface";

const invoiceItemSchema = new Schema<IInvoiceItem>({
  description: { type: String, required: true },
  quantity: { type: Number, required: true, default: 1 },
  unitPrice: { type: Number, required: true },
  total: { type: Number, required: true },
});

const invoiceSchema = new Schema<IInvoice>(
  {
    id: {
      type: String,
    },
    invoiceNumber: {
      type: String,
      required: true,
      unique: true,
    },
    merchantId: {
      type: String,
      required: true,
    },
    merchantName: {
      type: String,
      required: true,
    },
    merchantEmail: {
      type: String,
      required: true,
    },
    subscriptionId: String,
    planId: String,
    planName: String,
    billingCycle: String,
    amount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      default: "BDT",
    },
    status: {
      type: String,
      enum: ["draft", "sent", "paid", "overdue", "cancelled"],
      default: "draft",
    },
    dueDate: {
      type: String,
      required: true,
    },
    paidAt: String,
    items: {
      type: [invoiceItemSchema],
      default: [],
    },
    notes: String,
    createdAt: {
      type: String,
      default: () => new Date().toISOString(),
    },
    updatedAt: {
      type: String,
      default: () => new Date().toISOString(),
    },
  },
  {
    timestamps: false,
    toJSON: {
      transform: function (doc, ret) {
        delete (ret as any)._id;
        delete (ret as any).__v;
        return ret;
      },
    },
  }
);

invoiceSchema.index({ merchantId: 1 });
invoiceSchema.index({ status: 1 });
invoiceSchema.index({ createdAt: -1 });

export const Invoice = model<IInvoice>("invoices", invoiceSchema);
