export type SubscriptionStatus =
  | "active"
  | "trial"
  | "past_due"
  | "cancelled"
  | "expired";
export type BillingCycle = "monthly" | "semi_annual" | "yearly";

export interface ISubscription {
  id: string;
  merchantId: string;
  planId: string;
  planName?: string;
  billingCycleMonths: number; // 1, 6, or 12
  billingCycle: BillingCycle;
  amount: number;
  currency: string;
  status: SubscriptionStatus;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  gracePeriodEndsAt?: string;
  trialEndsAt?: string;
  cancelAtPeriodEnd: boolean;
  cancelledAt?: string;
  paymentMethodId?: string;
  lastPaymentDate?: string;
  nextBillingDate?: string;
  totalPaid: number;
  autoRenew: boolean;
  renewalCount: number;
  createdAt?: string;
  updatedAt?: string;
}
