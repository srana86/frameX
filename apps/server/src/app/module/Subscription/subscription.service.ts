import { prisma, BillingCycle, SubscriptionStatus, Decimal } from "@framex/database";

// Helper functions for date calculations
function calculatePeriodEnd(start: Date, months: number): Date {
  const end = new Date(start);
  end.setMonth(end.getMonth() + months);
  return end;
}

function getDaysUntilExpiry(endDate: Date | string): number {
  const end = new Date(endDate);
  const now = new Date();
  const diff = end.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function isExpiringSoon(endDate: Date | string, days = 7): boolean {
  return getDaysUntilExpiry(endDate) <= days && getDaysUntilExpiry(endDate) > 0;
}

function isPastDue(endDate: Date | string): boolean {
  return new Date(endDate) < new Date();
}

function mapBillingCycle(months: number): BillingCycle {
  if (months === 1) return "MONTHLY";
  if (months === 6) return "SEMI_ANNUAL";
  return "YEARLY";
}

const getAllSubscriptions = async () => {
  const subscriptions = await prisma.merchantSubscription.findMany({
    include: { plan: true },
    orderBy: { createdAt: "desc" },
  });

  const merchants = await prisma.merchant.findMany();
  const merchantMap = new Map(merchants.map((m) => [m.id, m]));

  return subscriptions.map((sub) => {
    const merchant = merchantMap.get(sub.merchantId);
    let dynamicStatus: string = sub.status;

    if (sub.status === "ACTIVE" && sub.currentPeriodEnd) {
      if (isPastDue(sub.currentPeriodEnd)) {
        dynamicStatus = "EXPIRED";
      }
    }

    return {
      ...sub,
      dynamicStatus,
      isExpiringSoon: sub.currentPeriodEnd ? isExpiringSoon(sub.currentPeriodEnd) : false,
      isPastDue: sub.currentPeriodEnd ? isPastDue(sub.currentPeriodEnd) : false,
      daysUntilExpiry: sub.currentPeriodEnd ? getDaysUntilExpiry(sub.currentPeriodEnd) : 0,
      merchant: merchant ? { name: merchant.name, email: merchant.email } : null,
    };
  });
};

const getSubscriptionById = async (id: string) => {
  const subscription = await prisma.merchantSubscription.findUnique({
    where: { id },
    include: { plan: true },
  });

  if (!subscription) {
    throw new Error("Subscription not found");
  }

  return subscription;
};

const createSubscription = async (payload: {
  merchantId: string;
  planId: string;
  planName?: string;
  billingCycleMonths?: number;
  amount?: number;
  currency?: string;
  status?: SubscriptionStatus;
  currentPeriodStart?: string;
  currentPeriodEnd?: string;
  autoRenew?: boolean;
}) => {
  const existing = await prisma.merchantSubscription.findFirst({
    where: { merchantId: payload.merchantId },
  });

  const now = new Date();
  const billingCycleMonths = payload.billingCycleMonths || 1;
  const periodEnd = payload.currentPeriodEnd
    ? new Date(payload.currentPeriodEnd)
    : calculatePeriodEnd(now, billingCycleMonths);
  const gracePeriodEnd = new Date(periodEnd);
  gracePeriodEnd.setDate(gracePeriodEnd.getDate() + 7);

  if (existing) {
    // Update existing subscription
    const updated = await prisma.merchantSubscription.update({
      where: { id: existing.id },
      data: {
        planId: payload.planId,
        planName: payload.planName || existing.planName,
        billingCycleMonths,
        billingCycle: mapBillingCycle(billingCycleMonths),
        amount: payload.amount ? new Decimal(payload.amount) : existing.amount,
        currency: payload.currency || existing.currency,
        status: payload.status || "ACTIVE",
        currentPeriodStart: payload.currentPeriodStart ? new Date(payload.currentPeriodStart) : now,
        currentPeriodEnd: periodEnd,
        gracePeriodEndsAt: gracePeriodEnd,
        nextBillingDate: periodEnd,
        autoRenew: payload.autoRenew !== false,
        totalPaid: existing.totalPaid.add(new Decimal(payload.amount || 0)),
      },
      include: { plan: true },
    });

    return updated;
  }

  // Create new subscription
  const subscription = await prisma.merchantSubscription.create({
    data: {
      merchantId: payload.merchantId,
      planId: payload.planId,
      planName: payload.planName,
      billingCycleMonths,
      billingCycle: mapBillingCycle(billingCycleMonths),
      amount: new Decimal(payload.amount || 0),
      currency: payload.currency || "BDT",
      status: payload.status || "ACTIVE",
      currentPeriodStart: payload.currentPeriodStart ? new Date(payload.currentPeriodStart) : now,
      currentPeriodEnd: periodEnd,
      gracePeriodEndsAt: gracePeriodEnd,
      nextBillingDate: periodEnd,
      autoRenew: payload.autoRenew !== false,
      totalPaid: new Decimal(payload.amount || 0),
    },
    include: { plan: true },
  });

  // Log activity
  await prisma.activityLog.create({
    data: {
      action: "subscription_created",
      resource: "subscription",
      resourceId: subscription.id,
      details: {
        subscriptionId: subscription.id,
        merchantId: subscription.merchantId,
        planId: subscription.planId,
        planName: subscription.planName,
        billingCycleMonths,
        amount: Number(subscription.amount),
      },
    },
  });

  return subscription;
};

const updateSubscription = async (id: string, payload: Record<string, any>) => {
  const { plan, ...updateData } = payload;

  const subscription = await prisma.merchantSubscription.update({
    where: { id },
    data: updateData,
    include: { plan: true },
  });

  return subscription;
};

const deleteSubscription = async (id: string) => {
  await prisma.merchantSubscription.delete({ where: { id } });
  return { success: true, message: "Subscription deleted successfully" };
};

const getExpiringSubscriptions = async (daysAhead = 7) => {
  const now = new Date();
  const futureDate = new Date(now);
  futureDate.setDate(futureDate.getDate() + daysAhead);

  const subscriptions = await prisma.merchantSubscription.findMany({
    where: {
      status: "ACTIVE",
      currentPeriodEnd: {
        gte: now,
        lte: futureDate,
      },
    },
    include: { plan: true },
    orderBy: { currentPeriodEnd: "asc" },
  });

  const merchantIds = subscriptions.map((s) => s.merchantId);
  const merchants = await prisma.merchant.findMany({
    where: { id: { in: merchantIds } },
  });
  const merchantMap = new Map(merchants.map((m) => [m.id, m]));

  return subscriptions.map((sub) => {
    const merchant = merchantMap.get(sub.merchantId);
    return {
      ...sub,
      daysUntilExpiry: getDaysUntilExpiry(sub.currentPeriodEnd),
      merchant: merchant ? { name: merchant.name, email: merchant.email } : null,
    };
  });
};

const renewSubscription = async (
  subscriptionId: string,
  billingCycleMonths?: number,
  paymentAmount?: number
) => {
  const subscription = await prisma.merchantSubscription.findUnique({
    where: { id: subscriptionId },
  });

  if (!subscription) {
    throw new Error("Subscription not found");
  }

  const now = new Date();
  const currentPeriodEnd = subscription.currentPeriodEnd;
  const newPeriodStart = currentPeriodEnd > now ? currentPeriodEnd : now;
  const cycleMonths = billingCycleMonths || subscription.billingCycleMonths || 1;
  const newPeriodEnd = calculatePeriodEnd(newPeriodStart, cycleMonths);

  await prisma.merchantSubscription.update({
    where: { id: subscriptionId },
    data: {
      status: "ACTIVE",
      currentPeriodStart: newPeriodStart,
      currentPeriodEnd: newPeriodEnd,
      billingCycleMonths: cycleMonths,
      lastPaymentDate: now,
      nextBillingDate: newPeriodEnd,
      totalPaid: { increment: paymentAmount || 0 },
      renewalCount: { increment: 1 },
    },
  });

  await prisma.activityLog.create({
    data: {
      action: "subscription_renewed",
      resource: "subscription",
      resourceId: subscriptionId,
      details: {
        subscriptionId,
        merchantId: subscription.merchantId,
        billingCycleMonths: cycleMonths,
        newPeriodEnd: newPeriodEnd.toISOString(),
        paymentAmount,
      },
    },
  });

  return {
    success: true,
    message: "Subscription renewed successfully",
    newPeriodStart: newPeriodStart.toISOString(),
    newPeriodEnd: newPeriodEnd.toISOString(),
  };
};

export const SubscriptionServices = {
  getAllSubscriptions,
  getSubscriptionById,
  createSubscription,
  updateSubscription,
  deleteSubscription,
  getExpiringSubscriptions,
  renewSubscription,
};
