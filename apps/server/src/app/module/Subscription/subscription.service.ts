import { Subscription } from "./subscription.model";
import { Plan } from "../Plan/plan.model";
import { Merchant } from "../Merchant/merchant.model";
import { ActivityLog } from "../ActivityLog/activityLog.model";
import {
  toPlainObjectArray,
  toPlainObject,
  calculatePeriodEnd,
  isExpiringSoon,
  isPastDue,
  getDaysUntilExpiry,
} from "../../utils/mongodb";
import { ISubscription } from "./subscription.interface";

const getAllSubscriptions = async () => {
  const [subscriptions, plans, merchants] = await Promise.all([
    Subscription.find({}).sort({ createdAt: -1 }),
    Plan.find({}),
    Merchant.find({}),
  ]);

  return subscriptions.map((sub) => {
    const plan = plans.find((p) => p.id === sub.planId);
    const merchant = merchants.find((m) => m.id === sub.merchantId);
    const subData = toPlainObject<ISubscription>(sub);

    // Calculate dynamic status (keep original status, add expiring flag)
    let dynamicStatus: string = subData?.status || "active";
    if (subData?.status === "active" && subData?.currentPeriodEnd) {
      if (isPastDue(subData.currentPeriodEnd)) {
        dynamicStatus = "expired";
      }
    }

    return {
      ...subData,
      dynamicStatus,
      isExpiringSoon: subData?.currentPeriodEnd
        ? isExpiringSoon(subData.currentPeriodEnd)
        : false,
      isPastDue: subData?.currentPeriodEnd
        ? isPastDue(subData.currentPeriodEnd)
        : false,
      daysUntilExpiry: subData?.currentPeriodEnd
        ? getDaysUntilExpiry(subData.currentPeriodEnd)
        : 0,
      plan: plan ? toPlainObject(plan) : null,
      merchant: merchant
        ? {
            name: merchant.name,
            email: merchant.email,
          }
        : null,
    };
  });
};

const getSubscriptionById = async (id: string) => {
  const subscription = await Subscription.findOne({ id });
  if (!subscription) {
    throw new Error("Subscription not found");
  }

  const plan = subscription.planId
    ? await Plan.findOne({ id: subscription.planId })
    : null;

  return {
    ...toPlainObject<ISubscription>(subscription),
    plan: plan ? toPlainObject(plan) : null,
  };
};

const createSubscription = async (payload: Partial<ISubscription>) => {
  // Check if subscription already exists
  const existingSub = await Subscription.findOne({
    merchantId: payload.merchantId,
  });
  if (existingSub) {
    // Update existing subscription
    const billingCycleMonths =
      payload.billingCycleMonths || existingSub.billingCycleMonths || 1;
    const now = new Date();
    const periodEnd = payload.currentPeriodEnd
      ? new Date(payload.currentPeriodEnd)
      : calculatePeriodEnd(now, billingCycleMonths);
    const gracePeriodEnd = new Date(periodEnd);
    gracePeriodEnd.setDate(gracePeriodEnd.getDate() + 7);

    const updateData: any = {
      planId: payload.planId!,
      planName: payload.planName || existingSub.planName,
      billingCycleMonths,
      billingCycle:
        payload.billingCycle ||
        (billingCycleMonths === 1
          ? "monthly"
          : billingCycleMonths === 6
            ? "semi_annual"
            : "yearly"),
      amount: payload.amount || existingSub.amount,
      currency: payload.currency || existingSub.currency || "BDT",
      status: payload.status || "active",
      currentPeriodStart: payload.currentPeriodStart || now.toISOString(),
      currentPeriodEnd: periodEnd.toISOString(),
      gracePeriodEndsAt:
        payload.gracePeriodEndsAt || gracePeriodEnd.toISOString(),
      nextBillingDate: payload.nextBillingDate || periodEnd.toISOString(),
      lastPaymentDate: payload.lastPaymentDate || now.toISOString(),
      autoRenew: payload.autoRenew !== false,
      cancelAtPeriodEnd: payload.cancelAtPeriodEnd || false,
      updatedAt: new Date().toISOString(),
    };

    await Subscription.findOneAndUpdate(
      { merchantId: payload.merchantId },
      { $set: updateData }
    );
    if (payload.amount) {
      await Subscription.findOneAndUpdate(
        { merchantId: payload.merchantId },
        { $inc: { totalPaid: payload.amount } }
      );
    }

    const updated = await Subscription.findOne({
      merchantId: payload.merchantId,
    });
    return toPlainObject<ISubscription>(updated!);
  }

  // Create new subscription
  const billingCycleMonths = payload.billingCycleMonths || 1;
  const now = new Date();
  const periodEnd = payload.currentPeriodEnd
    ? new Date(payload.currentPeriodEnd)
    : calculatePeriodEnd(now, billingCycleMonths);
  const gracePeriodEnd = new Date(periodEnd);
  gracePeriodEnd.setDate(gracePeriodEnd.getDate() + 7);

  const subscriptionData: ISubscription = {
    id: payload.id || `sub_${Date.now()}`,
    merchantId: payload.merchantId!,
    planId: payload.planId!,
    planName: payload.planName,
    billingCycleMonths,
    billingCycle:
      payload.billingCycle ||
      (billingCycleMonths === 1
        ? "monthly"
        : billingCycleMonths === 6
          ? "semi_annual"
          : "yearly"),
    amount: payload.amount || 0,
    currency: payload.currency || "BDT",
    status: payload.status || "active",
    currentPeriodStart: payload.currentPeriodStart || now.toISOString(),
    currentPeriodEnd: periodEnd.toISOString(),
    gracePeriodEndsAt: gracePeriodEnd.toISOString(),
    trialEndsAt: payload.trialEndsAt,
    cancelAtPeriodEnd: payload.cancelAtPeriodEnd || false,
    cancelledAt: payload.cancelledAt,
    paymentMethodId: payload.paymentMethodId,
    lastPaymentDate: payload.lastPaymentDate || now.toISOString(),
    nextBillingDate: payload.nextBillingDate || periodEnd.toISOString(),
    totalPaid: payload.totalPaid || payload.amount || 0,
    autoRenew: payload.autoRenew !== false,
    renewalCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const subscription = await Subscription.create(subscriptionData);

  // Log activity
  await ActivityLog.create({
    id: `log_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    type: "subscription",
    action: "subscription_created",
    entityId: subscription.id,
    details: {
      subscriptionId: subscription.id,
      merchantId: subscription.merchantId,
      planId: subscription.planId,
      planName: subscription.planName,
      billingCycleMonths,
      amount: subscription.amount,
    },
    createdAt: new Date().toISOString(),
  });

  return toPlainObject<ISubscription>(subscription);
};

const updateSubscription = async (
  id: string,
  payload: Partial<ISubscription>
) => {
  const updateData: any = {
    ...payload,
    updatedAt: new Date().toISOString(),
  };

  delete updateData.id;
  delete updateData.plan;

  const subscription = await Subscription.findOneAndUpdate(
    { id },
    { $set: updateData },
    { new: true }
  );
  if (!subscription) {
    throw new Error("Subscription not found");
  }
  return toPlainObject<ISubscription>(subscription);
};

const deleteSubscription = async (id: string) => {
  const subscription = await Subscription.findOne({ id });
  if (!subscription) {
    throw new Error("Subscription not found");
  }

  await Subscription.deleteOne({ id });
  return { success: true, message: "Subscription deleted successfully" };
};

const getExpiringSubscriptions = async (daysAhead: number = 7) => {
  const now = new Date();
  const futureDate = new Date(now);
  futureDate.setDate(futureDate.getDate() + daysAhead);

  const [subscriptions, plans, merchants] = await Promise.all([
    Subscription.find({
      status: "active",
      currentPeriodEnd: {
        $gte: now.toISOString(),
        $lte: futureDate.toISOString(),
      },
    }).sort({ currentPeriodEnd: 1 }),
    Plan.find({}),
    Merchant.find({}),
  ]);

  return subscriptions.map((sub) => {
    const plan = plans.find((p) => p.id === sub.planId);
    const merchant = merchants.find((m) => m.id === sub.merchantId);
    const subData = toPlainObject<ISubscription>(sub);
    const daysUntilExpiry = subData?.currentPeriodEnd
      ? getDaysUntilExpiry(subData.currentPeriodEnd)
      : 0;

    return {
      ...subData,
      daysUntilExpiry,
      plan: plan ? { name: plan.name, price: plan.price } : null,
      merchant: merchant
        ? { name: merchant.name, email: merchant.email }
        : null,
    };
  });
};

const renewSubscription = async (
  subscriptionId: string,
  billingCycleMonths?: number,
  paymentAmount?: number,
  paymentMethod?: string,
  transactionId?: string
) => {
  const subscription = await Subscription.findOne({ id: subscriptionId });
  if (!subscription) {
    throw new Error("Subscription not found");
  }

  const now = new Date();
  const currentPeriodEnd = new Date(subscription.currentPeriodEnd);
  const newPeriodStart = currentPeriodEnd > now ? currentPeriodEnd : now;
  const cycleMonths =
    billingCycleMonths || subscription.billingCycleMonths || 1;

  const newPeriodEnd = new Date(newPeriodStart);
  newPeriodEnd.setMonth(newPeriodEnd.getMonth() + cycleMonths);

  await Subscription.findOneAndUpdate(
    { id: subscriptionId },
    {
      $set: {
        status: "active",
        currentPeriodStart: newPeriodStart.toISOString(),
        currentPeriodEnd: newPeriodEnd.toISOString(),
        billingCycleMonths: cycleMonths,
        lastPaymentDate: now.toISOString(),
        nextBillingDate: newPeriodEnd.toISOString(),
        updatedAt: now.toISOString(),
      },
      $inc: {
        totalPaid: paymentAmount || 0,
        renewalCount: 1,
      },
    }
  );

  // Log activity
  await ActivityLog.create({
    id: `log_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    type: "subscription",
    action: "subscription_renewed",
    entityId: subscriptionId,
    details: {
      subscriptionId,
      merchantId: subscription.merchantId,
      billingCycleMonths: cycleMonths,
      newPeriodEnd: newPeriodEnd.toISOString(),
      paymentAmount,
    },
    createdAt: new Date().toISOString(),
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
