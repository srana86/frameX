import { Schema, model } from "mongoose";
import {
  TAffiliate,
  TAffiliateSettings,
  TAffiliateCommission,
  TAffiliateWithdrawal,
} from "./affiliate.interface";

const affiliateSchema = new Schema<TAffiliate>(
  {
    id: {
      type: String,
      required: true,
      unique: true,
    },
    userId: {
      type: String,
      required: true,
      index: true,
    },
    promoCode: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
    },
    status: {
      type: String,
      enum: ["active", "inactive", "suspended"],
      default: "active",
    },
    totalEarnings: {
      type: Number,
      default: 0,
    },
    totalWithdrawn: {
      type: Number,
      default: 0,
    },
    availableBalance: {
      type: Number,
      default: 0,
    },
    totalOrders: {
      type: Number,
      default: 0,
    },
    deliveredOrders: {
      type: Number,
      default: 0,
    },
    currentLevel: {
      type: Number,
      enum: [1, 2, 3, 4, 5],
      default: 1,
    },
    assignedCouponId: String,
  },
  {
    timestamps: true,
  }
);

const affiliateSettingsSchema = new Schema<TAffiliateSettings>(
  {
    id: {
      type: String,
      required: true,
      unique: true,
      default: "affiliate_settings_v1",
    },
    enabled: {
      type: Boolean,
      default: false,
    },
    minWithdrawalAmount: {
      type: Number,
      default: 500,
    },
    commissionLevels: {
      type: Schema.Types.Mixed,
      default: {},
    },
    salesThresholds: {
      type: Schema.Types.Mixed,
      default: {},
    },
    cookieExpiryDays: {
      type: Number,
      default: 30,
    },
  },
  {
    timestamps: true,
    collection: "affiliate_settings",
  }
);

const affiliateCommissionSchema = new Schema<TAffiliateCommission>(
  {
    id: {
      type: String,
      required: true,
      unique: true,
    },
    affiliateId: {
      type: String,
      required: true,
      index: true,
    },
    orderId: {
      type: String,
      required: true,
      index: true,
    },
    level: {
      type: Number,
      enum: [1, 2, 3, 4, 5],
      required: true,
    },
    orderTotal: {
      type: Number,
      required: true,
    },
    commissionPercentage: {
      type: Number,
      required: true,
    },
    commissionAmount: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "cancelled"],
      default: "pending",
    },
  },
  {
    timestamps: true,
    collection: "affiliate_commissions",
  }
);

const affiliateWithdrawalSchema = new Schema<TAffiliateWithdrawal>(
  {
    id: {
      type: String,
      required: true,
      unique: true,
    },
    affiliateId: {
      type: String,
      required: true,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "completed"],
      default: "pending",
    },
    paymentMethod: String,
    paymentDetails: {
      type: Schema.Types.Mixed,
    },
    requestedAt: {
      type: String,
      default: () => new Date().toISOString(),
    },
    processedAt: String,
    processedBy: String,
    notes: String,
  },
  {
    timestamps: true,
    collection: "affiliate_withdrawals",
  }
);

export const Affiliate = model<TAffiliate>("Affiliate", affiliateSchema);
export const AffiliateSettings = model<TAffiliateSettings>(
  "AffiliateSettings",
  affiliateSettingsSchema
);
export const AffiliateCommission = model<TAffiliateCommission>(
  "AffiliateCommission",
  affiliateCommissionSchema
);
export const AffiliateWithdrawal = model<TAffiliateWithdrawal>(
  "AffiliateWithdrawal",
  affiliateWithdrawalSchema
);
