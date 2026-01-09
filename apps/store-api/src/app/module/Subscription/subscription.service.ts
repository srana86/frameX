/* eslint-disable @typescript-eslint/no-explicit-any */
import { prisma } from "@framex/database";
import AppError from "../../errors/AppError";
import { StatusCodes } from "http-status-codes";

// Get active subscription plans
const getActiveSubscriptionPlansFromDB = async () => {
  const result = await prisma.subscriptionPlan.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" }
  });
  return result;
};

// Get current merchant subscription
const getCurrentMerchantSubscriptionFromDB = async (merchantId: string) => {
  // Status check: 'active', 'trial', 'grace_period'
  // using findFirst with sort desc by createdAt to get latest
  const result = await prisma.merchantSubscription.findFirst({
    where: {
      merchantId,
      status: { in: ["ACTIVE", "TRIAL", "GRACE_PERIOD"] }
    },
    orderBy: { createdAt: "desc" }
  });

  return result;
};

// Get subscription status
const getSubscriptionStatusFromDB = async (merchantId: string) => {
  const subscription = await getCurrentMerchantSubscriptionFromDB(merchantId);

  return {
    subscription,
    statusDetails: {
      hasActiveSubscription: !!subscription,
      isTrial: subscription?.status === "TRIAL",
      isExpired: subscription?.status === "EXPIRED",
    },
  };
};

// Create subscription for merchant
const createSubscriptionIntoDB = async (
  merchantId: string,
  payload: { planId: string; trialDays?: number }
) => {
  // Verify plan exists and is active
  const plan = await prisma.subscriptionPlan.findFirst({
    where: {
      id: payload.planId,
      isActive: true
    }
  });

  if (!plan) {
    throw new AppError(StatusCodes.NOT_FOUND, "Invalid or inactive plan");
  }

  // Check if merchant already has an active subscription
  const existing = await prisma.merchantSubscription.findFirst({
    where: {
      merchantId,
      status: { in: ["ACTIVE", "TRIAL", "GRACE_PERIOD"] }
    }
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
  // Generating ID manually or letting Prisma/DB handle it? 
  // Mongoose version generated `SUB...`
  // If ID is string @id, we can generate it.
  const subscriptionId = `SUB${Date.now()}${Math.random().toString(36).substr(2, 9)}`;

  const subscription = await prisma.merchantSubscription.create({
    data: {
      id: subscriptionId,
      merchantId,
      planId: payload.planId,
      status: payload.trialDays ? "TRIAL" : "ACTIVE",
      billingCycle: plan.billingCycle || "MONTHLY",
      billingCycleMonths,
      amount: plan.price ?? plan.basePrice ?? 0,
      currency: "BDT",
      currentPeriodStart: now,
      currentPeriodEnd: periodEnd,
      trialEndsAt: payload.trialDays
        ? new Date(now.getTime() + payload.trialDays * 24 * 60 * 60 * 1000)
        : null, // Prisma uses null for optional dates usually
      cancelAtPeriodEnd: false,
      autoRenew: true,
    }
  });

  return subscription;
};

export const SubscriptionServices = {
  getActiveSubscriptionPlansFromDB,
  getCurrentMerchantSubscriptionFromDB,
  getSubscriptionStatusFromDB,
  createSubscriptionIntoDB,
};
