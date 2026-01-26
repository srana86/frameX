/**
 * Affiliate System Interfaces
 */

export type AffiliateStatus = "ACTIVE" | "INACTIVE" | "SUSPENDED";
export type WithdrawalStatus =
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | "COMPLETED";
export type CommissionLevel = 1 | 2 | 3 | 4 | 5;

export interface TAffiliate {
  id: string;
  userId: string;
  promoCode: string;
  status: AffiliateStatus;
  totalEarnings: number;
  totalWithdrawn: number;
  availableBalance: number;
  totalOrders: number;
  deliveredOrders: number;
  currentLevel: CommissionLevel;
  assignedCouponId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface TAffiliateSettings {
  id: string;
  enabled: boolean;
  minWithdrawalAmount: number;
  commissionLevels: {
    [key: string]: {
      percentage: number;
      enabled: boolean;
      requiredSales?: number;
    };
  };
  salesThresholds?: {
    [key: string]: number;
  };
  cookieExpiryDays: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface TAffiliateCommission {
  id: string;
  affiliateId: string;
  orderId: string;
  level: CommissionLevel;
  orderTotal: number;
  commissionPercentage: number;
  commissionAmount: number;
  status: "PENDING" | "APPROVED" | "CANCELLED";
  createdAt?: string;
  updatedAt?: string;
}

export interface TAffiliateWithdrawal {
  id: string;
  affiliateId: string;
  amount: number;
  status: WithdrawalStatus;
  paymentMethod?: string;
  paymentDetails?: {
    accountName?: string;
    accountNumber?: string;
    bankName?: string;
    mobileNumber?: string;
    [key: string]: any;
  };
  requestedAt?: string;
  processedAt?: string;
  processedBy?: string;
  notes?: string;
}

export interface TAffiliateSettingsUpdatePayload {
  enabled?: boolean;
  minWithdrawalAmount?: number;
  commissionLevels?: TAffiliateSettings["commissionLevels"];
  salesThresholds?: TAffiliateSettings["salesThresholds"];
  cookieExpiryDays?: number;
  updatedAt?: string;
}

export interface TWithdrawalRequestPayload {
  amount: number;
  paymentMethod: string;
  paymentDetails: TAffiliateWithdrawal["paymentDetails"];
}
