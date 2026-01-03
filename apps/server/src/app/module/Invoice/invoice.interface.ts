export type InvoiceStatus = "draft" | "sent" | "paid" | "overdue" | "cancelled";

export interface IInvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface IInvoice {
  id?: string;
  invoiceNumber: string;
  merchantId: string;
  merchantName: string;
  merchantEmail: string;
  subscriptionId?: string;
  planId?: string;
  planName?: string;
  billingCycle?: string;
  amount: number;
  currency: string;
  status: InvoiceStatus;
  dueDate: string;
  paidAt?: string;
  items: IInvoiceItem[];
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}
