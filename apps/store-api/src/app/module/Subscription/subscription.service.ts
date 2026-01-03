/* eslint-disable @typescript-eslint/no-explicit-any */
import AppError from "../../errors/AppError";
import { StatusCodes } from "http-status-codes";
import { SubscriptionPlan, MerchantSubscription } from "./subscription.model";
import {
  TSubscriptionPlan,
  TMerchantSubscription,
} from "./subscription.interface";

// Get active subscription plans
const getActiveSubscriptionPlansFromDB = async () => {
  const result = await SubscriptionPlan.find({ isActive: true }).sort({
    sortOrder: 1,
  });
  return result;
};

// Get current merchant subscription
const getCurrentMerchantSubscriptionFromDB = async (merchantId: string) => {
  const result = await MerchantSubscription.findOne({
    merchantId,
    status: { $in: ["active", "trial", "grace_period"] },
  })
    .sort({ createdAt: -1 })
    .limit(1);

  return result;
};

// Get subscription status
const getSubscriptionStatusFromDB = async (merchantId: string) => {
  const subscription = await getCurrentMerchantSubscriptionFromDB(merchantId);

  return {
    subscription,
    statusDetails: {
      hasActiveSubscription: !!subscription,
      isTrial: subscription?.status === "trial",
      isExpired: subscription?.status === "expired",
    },
  };
};

// Create subscription for merchant
const createSubscriptionIntoDB = async (
  merchantId: string,
  payload: { planId: string; trialDays?: number }
) => {
  // Verify plan exists and is active
  const plan = await SubscriptionPlan.findOne({
    id: payload.planId,
    isActive: true,
  });

  if (!plan) {
    throw new AppError(StatusCodes.NOT_FOUND, "Invalid or inactive plan");
  }

  // Check if merchant already has an active subscription
  const existing = await MerchantSubscription.findOne({
    merchantId,
    status: { $in: ["active", "trial", "grace_period"] },
  });

  if (existing) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      "Merchant already has an active subscription"
    );
  }

  // Calculate period dates
  const now = new Date();
  const billingCycleMonths = plan.billingCycleMonths || 1;
  const periodEnd = new Date(now);
  periodEnd.setMonth(periodEnd.getMonth() + billingCycleMonths);

  // Create subscription
  const subscriptionId = `SUB${Date.now()}${Math.random().toString(36).substr(2, 9)}`;
  const subscription = await MerchantSubscription.create({
    id: subscriptionId,
    merchantId,
    planId: payload.planId,
    status: payload.trialDays ? "trial" : "active",
    billingCycle: plan.billingCycle || "monthly",
    billingCycleMonths,
    amount: plan.price ?? plan.basePrice ?? 0,
    currency: "BDT",
    currentPeriodStart: now,
    currentPeriodEnd: periodEnd,
    trialEndsAt: payload.trialDays
      ? new Date(now.getTime() + payload.trialDays * 24 * 60 * 60 * 1000)
      : undefined,
    cancelAtPeriodEnd: false,
    autoRenew: true,
  });

  return subscription;
};

export const SubscriptionServices = {
  getActiveSubscriptionPlansFromDB,
  getCurrentMerchantSubscriptionFromDB,
  getSubscriptionStatusFromDB,
  createSubscriptionIntoDB,
};
