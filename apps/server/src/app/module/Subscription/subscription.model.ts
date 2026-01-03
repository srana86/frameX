import { Schema, model } from "mongoose";
import {
  ISubscription,
  SubscriptionStatus,
  BillingCycle,
} from "./subscription.interface";

const subscriptionSchema = new Schema<ISubscription>(
  {
    id: {
      type: String,
      required: true,
      unique: true,
    },
    merchantId: {
      type: String,
      required: true,
    },
    planId: {
      type: String,
      required: true,
    },
    planName: String,
    billingCycleMonths: {
      type: Number,
      required: true,
      enum: [1, 6, 12],
      default: 1,
    },
    billingCycle: {
      type: String,
      enum: ["monthly", "semi_annual", "yearly"],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      default: 0,
    },
    currency: {
      type: String,
      default: "BDT",
    },
    status: {
      type: String,
      enum: ["active", "trial", "past_due", "cancelled", "expired"],
      default: "active",
    },
    currentPeriodStart: {
      type: String,
      required: true,
    },
    currentPeriodEnd: {
      type: String,
      required: true,
    },
    gracePeriodEndsAt: String,
    trialEndsAt: String,
    cancelAtPeriodEnd: {
      type: Boolean,
      default: false,
    },
    cancelledAt: String,
    paymentMethodId: String,
    lastPaymentDate: String,
    nextBillingDate: String,
    totalPaid: {
      type: Number,
      default: 0,
    },
    autoRenew: {
      type: Boolean,
      default: true,
    },
    renewalCount: {
      type: Number,
      default: 0,
    },
    createdAt: {
      type: String,
      default: () => new Date().toISOString(),
    },
    updatedAt: {
      type: String,
      default: () => new Date().toISOString(),
    },
  },
  {
    timestamps: false,
    toJSON: {
      transform: function (doc, ret) {
        delete (ret as any)._id;
        delete (ret as any).__v;
        return ret;
      },
    },
  }
);

subscriptionSchema.index({ merchantId: 1 });
subscriptionSchema.index({ planId: 1 });
subscriptionSchema.index({ status: 1 });
subscriptionSchema.index({ currentPeriodEnd: 1 });
subscriptionSchema.index({ createdAt: -1 });

export const Subscription = model<ISubscription>(
  "merchant_subscriptions",
  subscriptionSchema
);
