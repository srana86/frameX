export type CheckoutStatus = "pending" | "completed" | "failed" | "cancelled";

export interface ICheckoutSession {
  tranId: string;
  planId: string;
  planName?: string;
  planPrice: number;
  billingCycle?: string;
  merchantName?: string;
  merchantEmail?: string;
  merchantPhone?: string;
  merchantId?: string;
  customSubdomain?: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  customerAddress?: string;
  customerCity?: string;
  customerState?: string;
  customerPostcode?: string;
  customerCountry?: string;
  status: CheckoutStatus;
  sessionkey?: string;
  card_type?: string;
  card_no?: string;
  bank_tran_id?: string;
  val_id?: string;
  paymentMethod?: string;
  error?: string;
  completedAt?: string;
  failedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}
