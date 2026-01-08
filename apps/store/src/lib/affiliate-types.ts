/**
 * Affiliate System Types
 */

export type AffiliateStatus = "active" | "inactive" | "suspended";

export type WithdrawalStatus = "pending" | "approved" | "rejected" | "completed";

export type CommissionLevel = 1 | 2 | 3 | 4 | 5; // Support up to 5 levels

/**
 * Affiliate Record - User who is an affiliate
 */
export interface Affiliate {
  id: string;
  userId: string; // Reference to users collection
  promoCode: string; // Unique promo code for this affiliate
  status: AffiliateStatus;
  totalEarnings: number; // Total commission earned
  totalWithdrawn: number; // Total amount withdrawn
  availableBalance: number; // Available for withdrawal (totalEarnings - totalWithdrawn)
  totalOrders: number; // Total orders referred
  deliveredOrders: number; // Only successfully delivered orders count
  currentLevel: CommissionLevel; // Current level based on delivered sales
  assignedCouponId?: string; // Coupon assigned to this affiliate
  createdAt: string;
  updatedAt: string;
  merchantId?: string; // For shared database
}

/**
 * Affiliate Settings - Merchant configuration
 */
export interface AffiliateSettings {
  id: string;
  enabled: boolean; // Whether affiliate system is enabled
  minWithdrawalAmount: number; // Minimum amount for withdrawal
  commissionLevels: {
    [key in CommissionLevel]?: {
      percentage: number; // Commission percentage (0-100)
      enabled: boolean;
      requiredSales?: number; // Number of delivered sales required to reach this level (e.g., level 1 = 10, level 2 = 20)
    };
  };
  salesThresholds?: {
    [key in CommissionLevel]?: number; // Number of delivered orders required for this level
  };
  cookieExpiryDays: number; // How long affiliate cookie is valid (default: 30)
  createdAt: string;
  updatedAt: string;
  merchantId?: string; // For shared database
}

/**
 * Affiliate Commission - Commission record for each order
 */
export interface AffiliateCommission {
  id: string;
  affiliateId: string; // Reference to affiliate
  orderId: string; // Reference to order
  level: CommissionLevel; // Which level this commission is for
  orderTotal: number; // Total order amount
  commissionPercentage: number; // Commission percentage applied
  commissionAmount: number; // Calculated commission amount
  status: "pending" | "approved" | "cancelled"; // pending until order delivered, approved after delivery, cancelled if order cancelled
  createdAt: string;
  updatedAt: string;
  merchantId?: string; // For shared database
}

/**
 * Affiliate Withdrawal Request
 */
export interface AffiliateWithdrawal {
  id: string;
  affiliateId: string; // Reference to affiliate
  amount: number; // Withdrawal amount
  status: WithdrawalStatus;
  paymentMethod?: string; // e.g., "bank_transfer", "mobile_banking", etc.
  paymentDetails?: {
    accountName?: string;
    accountNumber?: string;
    bankName?: string;
    mobileNumber?: string;
    [key: string]: any;
  };
  requestedAt: string;
  processedAt?: string;
  processedBy?: string; // Merchant/admin who processed
  notes?: string; // Admin notes
  merchantId?: string; // For shared database
}

/**
 * Affiliate Referral Cookie Data
 */
export interface AffiliateCookieData {
  promoCode: string;
  affiliateId: string;
  timestamp: number; // When cookie was set
  expiry: number; // When cookie expires
}

/**
 * API Response Types
 */
export interface AffiliateDashboardResponse {
  affiliate: Affiliate | null;
  totalEarnings: number;
  availableBalance: number;
  totalWithdrawn: number;
  totalOrders: number;
  recentCommissions: Array<AffiliateCommission & { order: { id: string; total: number; createdAt: string } }>;
  pendingWithdrawals: AffiliateWithdrawal[];
}

export interface AffiliateListResponse {
  affiliates: Array<
    Affiliate & {
      user: {
        id: string;
        fullName: string;
        email?: string;
        phone?: string;
      };
      totalCommissions: number;
      pendingCommissions: number;
      completedCommissions: number;
    }
  >;
  total: number;
}

export interface CommissionDetailsResponse {
  commission: AffiliateCommission;
  affiliate: Affiliate;
  order: {
    id: string;
    total: number;
    status: string;
    createdAt: string;
    customer: {
      fullName: string;
      email?: string;
      phone: string;
    };
  };
}
