// Subscription and billing types

export type SubscriptionStatus = "active" | "trial" | "expired" | "cancelled" | "past_due" | "grace_period";

// Billing cycles: 1 = 1 month, 6 = 6 months, 12 = 1 year
export type BillingCycleMonths = 1 | 6 | 12;
export type BillingCycle = "monthly" | "semi_annual" | "yearly";

// Mapping between cycle names and months
export const BILLING_CYCLE_MONTHS: Record<BillingCycle, BillingCycleMonths> = {
  monthly: 1,
  semi_annual: 6,
  yearly: 12,
};

export const BILLING_CYCLE_NAMES: Record<BillingCycleMonths, string> = {
  1: "Monthly",
  6: "6 Months",
  12: "Yearly",
};

// Discount percentages for longer billing cycles
export const BILLING_CYCLE_DISCOUNTS: Record<BillingCycleMonths, number> = {
  1: 0, // No discount
  6: 10, // 10% discount
  12: 20, // 20% discount
};

export type InvoiceStatus = "pending" | "paid" | "failed" | "cancelled" | "overdue";

export type PaymentStatus = "pending" | "completed" | "failed" | "refunded";

export type FeatureType = "boolean" | "number" | "unlimited";

/**
 * Feature definition - reusable across plans
 */
export interface SubscriptionFeature {
  id: string;
  key: string; // e.g., "max_products", "custom_domain", "api_access"
  name: string;
  description: string;
  type: FeatureType;
  defaultValue: boolean | number | "unlimited";
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Feature limits for a plan
 */
export interface PlanFeatures {
  // Product limits
  max_products: number | "unlimited";

  // Storage
  max_storage_gb: number | "unlimited";

  // Domain & Branding
  custom_domain: boolean;
  remove_branding: boolean;

  // Analytics & Tracking
  advanced_analytics: boolean;
  ads_tracking_platforms: string[]; // ["meta", "tiktok", "gtm", "ga4", etc.]

  // Payment
  payment_gateways: number | "unlimited";

  // Team & Access
  team_members: number | "unlimited";
  api_access: boolean | "limited" | "full";

  // Support
  support_level: "email" | "priority" | "24/7";

  // Additional features
  [key: string]: boolean | number | string | string[] | "unlimited" | "limited" | "full" | "email" | "priority" | "24/7";
}

/**
 * Subscription Plan
 */
export interface SubscriptionPlan {
  id: string;
  name: string;
  description?: string;
  basePrice: number; // Base monthly price in USD
  price: number; // Effective price (for backward compatibility)
  billingCycle: BillingCycle;
  billingCycleMonths: BillingCycleMonths; // 1, 6, or 12 months
  features: PlanFeatures;
  isActive: boolean;
  isPopular?: boolean; // Highlight in UI
  sortOrder?: number;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Calculate price for a billing cycle with discount
 */
export function calculatePlanPrice(baseMonthlyPrice: number, cycleMonths: BillingCycleMonths): number {
  const discount = BILLING_CYCLE_DISCOUNTS[cycleMonths];
  const totalBeforeDiscount = baseMonthlyPrice * cycleMonths;
  const discountAmount = totalBeforeDiscount * (discount / 100);
  return Math.round((totalBeforeDiscount - discountAmount) * 100) / 100;
}

/**
 * Get monthly equivalent price for a billing cycle
 */
export function getMonthlyEquivalent(totalPrice: number, cycleMonths: BillingCycleMonths): number {
  return Math.round((totalPrice / cycleMonths) * 100) / 100;
}

/**
 * Tenant Subscription
 */
export interface TenantSubscription {
  id: string;
  tenantId: string;
  planId: string;
  planName?: string; // Cached for display
  status: SubscriptionStatus;
  billingCycle: BillingCycle;
  billingCycleMonths: BillingCycleMonths; // 1, 6, or 12 months
  amount: number; // Amount charged for this period
  currency: string; // e.g., "USD", "BDT"
  currentPeriodStart: string; // ISO date
  currentPeriodEnd: string; // ISO date
  nextBillingDate?: string; // ISO date - when the next payment is due
  trialEndsAt?: string; // ISO date
  gracePeriodEndsAt?: string; // ISO date - 7 days after expiry
  cancelAtPeriodEnd: boolean;
  cancelledAt?: string; // ISO date
  paymentMethodId?: string; // Reference to payment method
  lastPaymentDate?: string; // ISO date
  lastPaymentId?: string; // Reference to last payment
  autoRenew: boolean; // Whether to auto-renew
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Calculate subscription period end date
 */
export function calculatePeriodEnd(startDate: Date, cycleMonths: BillingCycleMonths): Date {
  const endDate = new Date(startDate);
  endDate.setMonth(endDate.getMonth() + cycleMonths);
  return endDate;
}

/**
 * Calculate grace period end (7 days after subscription ends)
 */
export function calculateGracePeriodEnd(periodEnd: Date): Date {
  const graceEnd = new Date(periodEnd);
  graceEnd.setDate(graceEnd.getDate() + 7);
  return graceEnd;
}

/**
 * Get days until subscription expires
 */
export function getDaysUntilExpiry(periodEnd: string | Date): number {
  const endDate = new Date(periodEnd);
  const now = new Date();
  const diff = endDate.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

/**
 * Check if subscription is in grace period
 */
export function isInGracePeriod(subscription: TenantSubscription): boolean {
  if (!subscription.gracePeriodEndsAt) return false;
  const now = new Date();
  const graceEnd = new Date(subscription.gracePeriodEndsAt);
  const periodEnd = new Date(subscription.currentPeriodEnd);
  return now > periodEnd && now <= graceEnd;
}

/**
 * Get subscription status details
 */
export interface SubscriptionStatusDetails {
  isActive: boolean;
  isExpired: boolean;
  isGracePeriod: boolean;
  isTrial: boolean;
  isPastDue: boolean;
  daysRemaining: number;
  graceDaysRemaining: number;
  showRenewalNotice: boolean; // Show when 7 days or less remaining
  showUrgentNotice: boolean; // Show when 3 days or less remaining
  showExpiredNotice: boolean; // Show when expired
  requiresPayment: boolean;
}

export function getSubscriptionStatusDetails(subscription: TenantSubscription | null): SubscriptionStatusDetails {
  if (!subscription) {
    return {
      isActive: false,
      isExpired: true,
      isGracePeriod: false,
      isTrial: false,
      isPastDue: false,
      daysRemaining: 0,
      graceDaysRemaining: 0,
      showRenewalNotice: false,
      showUrgentNotice: false,
      showExpiredNotice: true,
      requiresPayment: true,
    };
  }

  const now = new Date();
  const periodEnd = new Date(subscription.currentPeriodEnd);
  const graceEnd = subscription.gracePeriodEndsAt ? new Date(subscription.gracePeriodEndsAt) : null;

  const daysRemaining = getDaysUntilExpiry(periodEnd);
  const graceDaysRemaining = graceEnd ? Math.ceil((graceEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : 0;

  const isExpired = now > periodEnd && (!graceEnd || now > graceEnd);
  const isGracePeriod = !!(graceEnd && !isExpired && now > periodEnd && now <= graceEnd);
  const isActive = subscription.status === "active" && now <= periodEnd;
  const isTrial = subscription.status === "trial";
  const isPastDue = subscription.status === "past_due" || isGracePeriod;

  return {
    isActive,
    isExpired,
    isGracePeriod,
    isTrial,
    isPastDue,
    daysRemaining: Math.max(0, daysRemaining),
    graceDaysRemaining: Math.max(0, graceDaysRemaining),
    showRenewalNotice: isActive && daysRemaining <= 7 && daysRemaining > 3,
    showUrgentNotice: isActive && daysRemaining <= 3 && daysRemaining > 0,
    showExpiredNotice: isExpired || isGracePeriod,
    requiresPayment: isExpired || isGracePeriod || subscription.status === "past_due",
  };
}

/**
 * Subscription Usage Tracking
 */
export interface SubscriptionUsage {
  id: string;
  tenantId: string;
  featureKey: string;
  period: string; // YYYY-MM format
  currentUsage: number;
  limit: number | "unlimited";
  resetAt: string; // ISO date
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Invoice
 */
export interface SubscriptionInvoice {
  id: string;
  tenantId: string;
  tenantName?: string;
  tenantEmail?: string;
  subscriptionId: string;
  planId: string;
  planName: string;
  billingCycle: BillingCycle;
  billingCycleMonths: BillingCycleMonths;
  invoiceNumber: string;
  amount: number;
  subtotal: number;
  discount: number;
  tax: number;
  currency: string;
  status: InvoiceStatus;
  periodStart: string; // ISO date - billing period start
  periodEnd: string; // ISO date - billing period end
  dueDate: string; // ISO date
  paidAt?: string; // ISO date
  paymentId?: string; // Reference to payment
  transactionId?: string; // Payment gateway transaction ID
  items: InvoiceItem[];
  notes?: string;
  remindersSent: number; // Number of payment reminders sent
  lastReminderAt?: string; // ISO date
  createdAt?: string;
  updatedAt?: string;
}

export interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  discount?: number;
  total: number;
}

/**
 * Generate invoice number
 */
export function generateInvoiceNumber(tenantId: string): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `INV-${year}${month}-${random}`;
}

/**
 * Payment Record
 */
export interface SubscriptionPayment {
  id: string;
  invoiceId: string;
  tenantId: string;
  amount: number;
  currency: string;
  paymentMethod: string; // "card", "bank_transfer", etc.
  transactionId?: string;
  status: PaymentStatus;
  failureReason?: string;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Base Plan Features (without billing cycle)
 */
export interface BasePlanConfig {
  id: string;
  name: string;
  description: string;
  basePrice: number; // Base monthly price in USD
  features: PlanFeatures;
  isPopular?: boolean;
  sortOrder: number;
}

/**
 * Default Base Plans Configuration (monthly prices)
 */
export const BASE_PLANS: BasePlanConfig[] = [
  {
    id: "starter",
    name: "Starter",
    description: "Perfect for small businesses getting started",
    basePrice: 29,
    isPopular: false,
    sortOrder: 1,
    features: {
      max_products: 50,
      max_storage_gb: 5,
      custom_domain: false,
      remove_branding: false,
      advanced_analytics: false,
      ads_tracking_platforms: ["meta", "gtm"],
      payment_gateways: 1,
      team_members: 1,
      api_access: false,
      support_level: "email",
    },
  },
  {
    id: "professional",
    name: "Professional",
    description: "For growing businesses with advanced needs",
    basePrice: 79,
    isPopular: true,
    sortOrder: 2,
    features: {
      max_products: 500,
      max_storage_gb: 50,
      custom_domain: true,
      remove_branding: false,
      advanced_analytics: true,
      ads_tracking_platforms: ["meta", "tiktok", "gtm", "ga4", "pinterest", "snapchat", "linkedin"],
      payment_gateways: 2,
      team_members: 5,
      api_access: "limited",
      support_level: "priority",
    },
  },
  {
    id: "enterprise",
    name: "Enterprise",
    description: "For large businesses with unlimited needs",
    basePrice: 199,
    isPopular: false,
    sortOrder: 3,
    features: {
      max_products: "unlimited",
      max_storage_gb: 500,
      custom_domain: true,
      remove_branding: true,
      advanced_analytics: true,
      ads_tracking_platforms: ["meta", "tiktok", "gtm", "ga4", "pinterest", "snapchat", "linkedin", "custom"],
      payment_gateways: "unlimited",
      team_members: "unlimited",
      api_access: "full",
      support_level: "24/7",
    },
  },
];

/**
 * Generate plan ID with billing cycle
 */
export function generatePlanId(basePlanId: string, cycleMonths: BillingCycleMonths): string {
  const cycleSuffix = cycleMonths === 1 ? "monthly" : cycleMonths === 6 ? "semi_annual" : "yearly";
  return `${basePlanId}_${cycleSuffix}`;
}

/**
 * Generate all plan variants for a base plan
 */
export function generatePlanVariants(basePlan: BasePlanConfig): SubscriptionPlan[] {
  const cycles: BillingCycleMonths[] = [1, 6, 12];
  const cycleNames: Record<BillingCycleMonths, BillingCycle> = {
    1: "monthly",
    6: "semi_annual",
    12: "yearly",
  };

  return cycles.map((cycleMonths) => ({
    id: generatePlanId(basePlan.id, cycleMonths),
    name: basePlan.name,
    description: basePlan.description,
    basePrice: basePlan.basePrice,
    price: calculatePlanPrice(basePlan.basePrice, cycleMonths),
    billingCycle: cycleNames[cycleMonths],
    billingCycleMonths: cycleMonths,
    features: basePlan.features,
    isActive: true,
    isPopular: basePlan.isPopular && cycleMonths === 12, // Popular plan is yearly variant
    sortOrder: basePlan.sortOrder * 10 + cycleMonths,
  }));
}

/**
 * Generate all subscription plans from base plans
 */
export function generateAllPlans(): SubscriptionPlan[] {
  return BASE_PLANS.flatMap(generatePlanVariants);
}

/**
 * Default Plans Configuration (backward compatibility)
 * Returns monthly plans for existing code
 */
export const DEFAULT_PLANS: SubscriptionPlan[] = BASE_PLANS.map((basePlan) => ({
  id: basePlan.id,
  name: basePlan.name,
  description: basePlan.description,
  basePrice: basePlan.basePrice,
  price: basePlan.basePrice,
  billingCycle: "monthly" as BillingCycle,
  billingCycleMonths: 1 as BillingCycleMonths,
  features: basePlan.features,
  isActive: true,
  isPopular: basePlan.isPopular,
  sortOrder: basePlan.sortOrder,
}));
