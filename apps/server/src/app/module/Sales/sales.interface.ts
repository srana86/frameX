export type SaleStatus = "completed" | "pending" | "failed" | "refunded";
export type SaleType = "new" | "renewal" | "upgrade" | "downgrade";

export interface ISale {
  id: string;
  merchantId: string;
  merchantName?: string;
  merchantEmail?: string;
  subscriptionId?: string;
  planId: string;
  planName: string;
  amount: number;
  currency: string;
  billingCycleMonths: number;
  paymentMethod: string;
  transactionId?: string;
  status: SaleStatus;
  type: SaleType;
  metadata?: Record<string, any>;
  createdAt?: string;
  updatedAt?: string;
}
