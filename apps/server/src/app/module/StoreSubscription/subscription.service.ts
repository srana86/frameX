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

// Get current tenant subscription
const getTenantSubscriptionFromDB = async (tenantId: string) => {
  const result = await prisma.tenantSubscription.findFirst({
    where: {
      tenantId,
      status: { in: ["ACTIVE", "TRIAL", "GRACE_PERIOD"] }
    },
    orderBy: { createdAt: "desc" }
  });

  return result;
};

// Get subscription status
const getSubscriptionStatusFromDB = async (tenantId: string) => {
  const subscription = await getTenantSubscriptionFromDB(tenantId);

  return {
    subscription,
    statusDetails: {
      hasActiveSubscription: !!subscription,
      isTrial: subscription?.status === "TRIAL",
      isExpired: subscription?.status === "EXPIRED",
    },
  };
};

// Create subscription for tenant (was tenant)
const createSubscriptionIntoDB = async (
  tenantId: string,
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

  // Check if tenant already has an active subscription
  const existing = await prisma.tenantSubscription.findFirst({
    where: {
      tenantId,
      status: { in: ["ACTIVE", "TRIAL", "GRACE_PERIOD"] }
    }
  });

  if (existing) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      "Tenant already has an active subscription"
    );
  }

  // Calculate period dates
  const now = new Date();
  const billingCycleMonths = plan.billingCycleMonths || 1;
  const periodEnd = new Date(now);
  periodEnd.setMonth(periodEnd.getMonth() + billingCycleMonths);

  // Generate subscription ID
  const subscriptionId = `SUB${Date.now()}${Math.random().toString(36).substr(2, 9)}`;

  const subscription = await prisma.tenantSubscription.create({
    data: {
      id: subscriptionId,
      tenantId,
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
        : null,
      cancelAtPeriodEnd: false,
      autoRenew: true,
    }
  });

  return subscription;
};

// Get store subscription in frontend format
const getStoreSubscriptionFromDB = async (tenantId: string) => {
  const subscription = await prisma.tenantSubscription.findFirst({
    where: {
      tenantId,
      status: { in: ["ACTIVE", "TRIAL", "GRACE_PERIOD"] }
    },
    include: {
      plan: true,
    },
    orderBy: { createdAt: "desc" }
  });

  // Get product and order counts for usage
  const [productCount, orderCount] = await Promise.all([
    prisma.product.count({ where: { tenantId } }),
    prisma.order.count({ where: { tenantId } }),
  ]);

  // Default free tier if no subscription
  if (!subscription) {
    return {
      plan: "FREE",
      status: "ACTIVE",
      features: ["Basic Store", "10 Products", "100 Orders/month"],
      limits: {
        products: 10,
        orders: 100,
        storage: "100MB",
      },
      usage: {
        products: productCount,
        orders: orderCount,
        storage: "0MB",
      },
      billingCycle: null,
      nextBillingDate: null,
      price: 0,
    };
  }

  const plan = subscription.plan;
  const features = (plan?.features as string[]) || [];
  const limits = (plan?.limits as any) || { products: 100, orders: 1000, storage: "1GB" };

  return {
    plan: plan?.name || "PREMIUM",
    status: subscription.status,
    features,
    limits,
    usage: {
      products: productCount,
      orders: orderCount,
      storage: "0MB",
    },
    billingCycle: subscription.billingCycle,
    nextBillingDate: subscription.currentPeriodEnd?.toISOString() || null,
    price: Number(subscription.amount) || 0,
  };
};

export const SubscriptionServices = {
  getActiveSubscriptionPlansFromDB,
  getTenantSubscriptionFromDB,
  getSubscriptionStatusFromDB,
  createSubscriptionIntoDB,
  getStoreSubscriptionFromDB,
  // Alias for controller
  getCurrentTenantSubscriptionFromDB: getTenantSubscriptionFromDB,
};
