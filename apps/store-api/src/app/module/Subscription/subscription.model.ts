import { Schema, model } from "mongoose";
import {
  TSubscriptionPlan,
  TMerchantSubscription,
} from "./subscription.interface";

const subscriptionPlanSchema = new Schema<TSubscriptionPlan>(
  {
    id: {
      type: String,
      required: true,
      unique: true,
    },
    name: {
      type: String,
      required: true,
    },
    description: String,
    basePrice: {
      type: Number,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    billingCycle: {
      type: String,
      enum: ["monthly", "semi_annual", "yearly"],
      required: true,
    },
    billingCycleMonths: {
      type: Number,
      enum: [1, 6, 12],
      required: true,
    },
    features: {
      type: Schema.Types.Mixed,
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isPopular: {
      type: Boolean,
      default: false,
    },
    sortOrder: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

const merchantSubscriptionSchema = new Schema<TMerchantSubscription>(
  {
    id: {
      type: String,
      required: true,
      unique: true,
    },
    merchantId: {
      type: String,
      required: true,
      index: true,
    },
    planId: {
      type: String,
      required: true,
    },
    planName: String,
    status: {
      type: String,
      enum: [
        "active",
        "trial",
        "expired",
        "cancelled",
        "past_due",
        "grace_period",
      ],
      required: true,
    },
    billingCycle: {
      type: String,
      enum: ["monthly", "semi_annual", "yearly"],
      required: true,
    },
    billingCycleMonths: {
      type: Number,
      enum: [1, 6, 12],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      default: "BDT",
    },
    currentPeriodStart: {
      type: String,
      required: true,
    },
    currentPeriodEnd: {
      type: String,
      required: true,
    },
    nextBillingDate: String,
    trialEndsAt: String,
    gracePeriodEndsAt: String,
    cancelAtPeriodEnd: {
      type: Boolean,
      default: false,
    },
    cancelledAt: String,
    autoRenew: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

export const SubscriptionPlan = model<TSubscriptionPlan>(
  "SubscriptionPlan",
  subscriptionPlanSchema
);
export const MerchantSubscription = model<TMerchantSubscription>(
  "MerchantSubscription",
  merchantSubscriptionSchema
);
