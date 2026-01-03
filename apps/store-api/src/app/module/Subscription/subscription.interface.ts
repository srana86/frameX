export type SubscriptionStatus =
  | "active"
  | "trial"
  | "expired"
  | "cancelled"
  | "past_due"
  | "grace_period";

export type BillingCycleMonths = 1 | 6 | 12;
export type BillingCycle = "monthly" | "semi_annual" | "yearly";

export interface PlanFeatures {
  products?: number | "unlimited";
  orders?: number | "unlimited";
  storage?: number | "unlimited";
  bandwidth?: number | "unlimited";
  support?: string;
  [key: string]: any;
}

export interface TSubscriptionPlan {
  id: string;
  name: string;
  description?: string;
  basePrice: number;
  price: number;
  billingCycle: BillingCycle;
  billingCycleMonths: BillingCycleMonths;
  features: PlanFeatures;
  isActive: boolean;
  isPopular?: boolean;
  sortOrder?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface TMerchantSubscription {
  id: string;
  merchantId: string;
  planId: string;
  planName?: string;
  status: SubscriptionStatus;
  billingCycle: BillingCycle;
  billingCycleMonths: BillingCycleMonths;
  amount: number;
  currency: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  nextBillingDate?: string;
  trialEndsAt?: string;
  gracePeriodEndsAt?: string;
  cancelAtPeriodEnd: boolean;
  cancelledAt?: string;
  autoRenew: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}
