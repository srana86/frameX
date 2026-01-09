import { prisma } from "@framex/database";
import { isExpiringSoon } from "../../utils/date-utils";

const getAnalytics = async () => {
  const [merchants, subscriptions, plans, deployments, databases] =
    await Promise.all([
      prisma.merchant.findMany(),
      prisma.merchantSubscription.findMany(),
      prisma.subscriptionPlan.findMany(),
      prisma.deployment.findMany(),
      prisma.databaseInfo.findMany(),
    ]);

  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  // Merchant stats
  const merchantStats = {
    total: merchants.length,
    active: merchants.filter((m) => m.status === "ACTIVE").length,
    trial: merchants.filter((m) => m.status === "TRIAL").length,
    suspended: merchants.filter((m) => m.status === "SUSPENDED").length,
    inactive: merchants.filter((m) => m.status === "INACTIVE").length,
    newLast30Days: merchants.filter(
      (m) => m.createdAt && new Date(m.createdAt) >= thirtyDaysAgo
    ).length,
    newLast7Days: merchants.filter(
      (m) => m.createdAt && new Date(m.createdAt) >= sevenDaysAgo
    ).length,
    withDeployments: merchants.filter((m) => m.deploymentUrl).length,
    withCustomDomain: merchants.filter((m) => m.customDomain).length,
  };

  // Subscription stats
  const activeSubscriptions = subscriptions.filter(
    (s) => s.status === "ACTIVE"
  );
  const trialSubscriptions = subscriptions.filter((s) => s.status === "TRIAL");
  const expiringSubscriptions = subscriptions.filter((s) => {
    if (s.status !== "ACTIVE") return false;
    return s.currentPeriodEnd && isExpiringSoon(s.currentPeriodEnd);
  });

  // Calculate revenue
  const monthlyRevenue = activeSubscriptions.reduce((sum, sub) => {
    const plan = plans.find((p) => p.id === sub.planId);
    return sum + (plan?.price ? Number(plan.price) : 0);
  }, 0);

  const annualRevenue = monthlyRevenue * 12;

  // Revenue by plan
  const revenueByPlan = plans
    .map((plan) => {
      const planSubscribers = activeSubscriptions.filter(
        (s) => s.planId === plan.id
      );
      return {
        planId: plan.id,
        planName: plan.name,
        price: plan.price ? Number(plan.price) : 0,
        subscribers: planSubscribers.length,
        monthlyRevenue: planSubscribers.length * (plan.price ? Number(plan.price) : 0),
      };
    })
    .filter((p) => p.subscribers > 0);

  const subscriptionStats = {
    total: subscriptions.length,
    active: activeSubscriptions.length,
    trial: trialSubscriptions.length,
    pastDue: subscriptions.filter((s) => s.status === "PAST_DUE").length,
    cancelled: subscriptions.filter((s) => s.status === "CANCELLED").length,
    expired: subscriptions.filter((s) => s.status === "EXPIRED").length,
    expiringSoon: expiringSubscriptions.length,
    monthlyRevenue,
    annualRevenue,
    averageRevenuePerUser:
      activeSubscriptions.length > 0
        ? monthlyRevenue / activeSubscriptions.length
        : 0,
    revenueByPlan,
  };

  // Plan stats
  const planStats = {
    total: plans.length,
    active: plans.filter((p) => p.isActive !== false).length,
    inactive: plans.filter((p) => p.isActive === false).length,
    averagePrice:
      plans.length > 0
        ? plans.reduce((sum, p) => sum + (p.price ? Number(p.price) : 0), 0) / plans.length
        : 0,
    mostPopular:
      revenueByPlan.sort((a, b) => b.subscribers - a.subscribers)[0] || null,
    highestRevenue:
      revenueByPlan.sort((a, b) => b.monthlyRevenue - a.monthlyRevenue)[0] ||
      null,
  };

  // Deployment stats
  const deploymentStats = {
    total: deployments.length,
    active: deployments.filter((d) => d.status === "COMPLETED").length,
    pending: deployments.filter((d) => d.status === "PENDING").length,
    failed: deployments.filter((d) => d.status === "FAILED").length,
    inProgress: deployments.filter((d) => d.status === "IN_PROGRESS")
      .length,
    customDomains: deployments.filter(
      (d) => d.domain && d.domain.length > 0
    ).length,
    uptimeRate:
      deployments.length > 0
        ? (deployments.filter((d) => d.status === "COMPLETED").length /
          deployments.length) *
        100
        : 0,
  };

  // Database stats
  const totalStorageBytes = databases.reduce(
    (sum, db) => sum + (db.size ? Number(db.size) : 0),
    0
  );
  const databaseStats = {
    total: databases.length,
    merchantDatabases: databases.filter((db) => db.merchantId).length,
    systemDatabases: databases.filter((db) => !db.merchantId).length,
    totalStorageBytes,
    totalStorageGB: totalStorageBytes / (1024 * 1024 * 1024),
    averageSizeBytes:
      databases.length > 0 ? totalStorageBytes / databases.length : 0,
    active: databases.filter((db) => db.status === "ACTIVE").length,
    inactive: databases.filter((db) => db.status !== "ACTIVE").length,
  };

  // Growth trends (mock data - in production, this would come from historical data)
  const growthTrends = {
    merchantGrowth: "+12%",
    revenueGrowth: "+15%",
    subscriptionGrowth: "+8%",
    deploymentGrowth: "+5%",
  };

  // System health
  const systemHealth = {
    database: "healthy",
    deployments: deploymentStats.failed > 0 ? "warning" : "healthy",
    subscriptions: subscriptionStats.expiringSoon > 5 ? "warning" : "healthy",
    overall:
      deploymentStats.failed > 0 || subscriptionStats.expiringSoon > 5
        ? "warning"
        : "healthy",
  };

  // Recent activity (last 10 items)
  const allItems = [
    ...merchants
      .filter((m) => m.createdAt)
      .map((m) => ({
        type: "merchant",
        action: "created",
        id: m.id,
        name: m.name,
        date: m.createdAt!,
      })),
    ...subscriptions
      .filter((s) => s.createdAt)
      .map((s) => ({
        type: "subscription",
        action: s.status === "ACTIVE" ? "activated" : s.status,
        id: s.id,
        merchantId: s.merchantId,
        date: s.createdAt!,
      })),
    ...deployments
      .filter((d) => d.createdAt)
      .map((d) => ({
        type: "deployment",
        action: d.status,
        id: d.id,
        merchantId: d.merchantId,
        date: d.createdAt!,
      })),
  ]
    .filter((item) => item.date)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 10);

  return {
    success: true,
    timestamp: now.toISOString(),
    merchants: merchantStats,
    subscriptions: subscriptionStats,
    plans: planStats,
    deployments: deploymentStats,
    databases: databaseStats,
    growthTrends,
    systemHealth,
    recentActivity: allItems,
  };
};

export const AnalyticsServices = {
  getAnalytics,
};
