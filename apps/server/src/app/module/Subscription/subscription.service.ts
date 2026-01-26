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

// Using TenantSubscription instead of TenantSubscription
const getAllSubscriptions = async () => {
  const subscriptions = await prisma.tenantSubscription.findMany({
    include: { plan: true },
    orderBy: { createdAt: "desc" },
  });

  const tenants = await prisma.tenant.findMany();
  const tenantMap = new Map(tenants.map((t) => [t.id, t]));

  return subscriptions.map((sub) => {
    const tenant = tenantMap.get(sub.tenantId);
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
      tenant: tenant ? { name: tenant.name, email: tenant.email } : null, // Keep 'tenant' key for backward compat
    };
  });
};

const getSubscriptionById = async (id: string) => {
  const subscription = await prisma.tenantSubscription.findUnique({
    where: { id },
    include: { plan: true },
  });

  if (!subscription) {
    throw new Error("Subscription not found");
  }

  return subscription;
};

const createSubscription = async (payload: {
  tenantId: string;
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
  const existing = await prisma.tenantSubscription.findFirst({
    where: { tenantId: payload.tenantId },
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
    const updated = await prisma.tenantSubscription.update({
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
  const subscription = await prisma.tenantSubscription.create({
    data: {
      tenantId: payload.tenantId,
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
      tenantId: subscription.tenantId,
      details: {
        subscriptionId: subscription.id,
        tenantId: subscription.tenantId,
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

  const subscription = await prisma.tenantSubscription.update({
    where: { id },
    data: updateData,
    include: { plan: true },
  });

  return subscription;
};

const deleteSubscription = async (id: string) => {
  await prisma.tenantSubscription.delete({ where: { id } });
  return { success: true, message: "Subscription deleted successfully" };
};

const getExpiringSubscriptions = async (daysAhead = 7) => {
  const now = new Date();
  const futureDate = new Date(now);
  futureDate.setDate(futureDate.getDate() + daysAhead);

  const subscriptions = await prisma.tenantSubscription.findMany({
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

  const tenantIds = subscriptions.map((s) => s.tenantId);
  const tenants = await prisma.tenant.findMany({
    where: { id: { in: tenantIds } },
  });
  const tenantMap = new Map(tenants.map((t) => [t.id, t]));

  return subscriptions.map((sub) => {
    const tenant = tenantMap.get(sub.tenantId);
    return {
      ...sub,
      daysUntilExpiry: getDaysUntilExpiry(sub.currentPeriodEnd),
      tenant: tenant ? { name: tenant.name, email: tenant.email } : null, // Keep 'tenant' key for backward compat
    };
  });
};

const renewSubscription = async (
  subscriptionId: string,
  billingCycleMonths?: number,
  paymentAmount?: number
) => {
  const subscription = await prisma.tenantSubscription.findUnique({
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

  await prisma.tenantSubscription.update({
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
      tenantId: subscription.tenantId,
      details: {
        subscriptionId,
        tenantId: subscription.tenantId,
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

const getTenantSubscriptionFromDB = async (tenantId: string) => {
  return prisma.tenantSubscription.findFirst({
    where: { tenantId },
    include: { plan: true },
  });
};

export const SubscriptionServices = {
  getAllSubscriptions,
  getSubscriptionById,
  getTenantSubscriptionFromDB,
  createSubscription,
  updateSubscription,
  deleteSubscription,
  getExpiringSubscriptions,
  renewSubscription,
};
