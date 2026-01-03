import { NextResponse } from "next/server";
import { getCollection } from "@/lib/mongodb";

export async function GET() {
  try {
    // Fetch all data in parallel
    const [merchants, subscriptions, plans, deployments, databases] = await Promise.all([
      getCollection("merchants").then((col) => col.find({}).toArray()),
      getCollection("merchant_subscriptions").then((col) => col.find({}).toArray()),
      getCollection("subscription_plans").then((col) => col.find({}).toArray()),
      getCollection("merchant_deployments").then((col) => col.find({}).toArray()),
      getCollection("merchant_databases").then((col) => col.find({}).toArray()),
    ]);

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Merchant stats
    const merchantStats = {
      total: merchants.length,
      active: merchants.filter((m: any) => m.status === "active").length,
      trial: merchants.filter((m: any) => m.status === "trial").length,
      suspended: merchants.filter((m: any) => m.status === "suspended").length,
      inactive: merchants.filter((m: any) => m.status === "inactive").length,
      newLast30Days: merchants.filter((m: any) => new Date(m.createdAt) >= thirtyDaysAgo).length,
      newLast7Days: merchants.filter((m: any) => new Date(m.createdAt) >= sevenDaysAgo).length,
      withDeployments: merchants.filter((m: any) => m.deploymentUrl).length,
      withCustomDomain: merchants.filter((m: any) => m.customDomain).length,
    };

    // Subscription stats
    const activeSubscriptions = subscriptions.filter((s: any) => s.status === "active");
    const trialSubscriptions = subscriptions.filter((s: any) => s.status === "trial");
    const expiringSubscriptions = subscriptions.filter((s: any) => {
      if (s.status !== "active") return false;
      const endDate = new Date(s.currentPeriodEnd);
      const daysLeft = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return daysLeft <= 7 && daysLeft > 0;
    });

    // Calculate revenue
    const monthlyRevenue = activeSubscriptions.reduce((sum: number, sub: any) => {
      const plan = plans.find((p: any) => p.id === sub.planId);
      return sum + (plan?.price || 0);
    }, 0);

    const annualRevenue = monthlyRevenue * 12;

    // Revenue by plan
    const revenueByPlan = plans
      .map((plan: any) => {
        const planSubscribers = activeSubscriptions.filter((s: any) => s.planId === plan.id);
        return {
          planId: plan.id,
          planName: plan.name,
          price: plan.price,
          subscribers: planSubscribers.length,
          monthlyRevenue: planSubscribers.length * (plan.price || 0),
        };
      })
      .filter((p: any) => p.subscribers > 0);

    const subscriptionStats = {
      total: subscriptions.length,
      active: activeSubscriptions.length,
      trial: trialSubscriptions.length,
      pastDue: subscriptions.filter((s: any) => s.status === "past_due").length,
      cancelled: subscriptions.filter((s: any) => s.status === "cancelled").length,
      expired: subscriptions.filter((s: any) => s.status === "expired").length,
      expiringSoon: expiringSubscriptions.length,
      monthlyRevenue,
      annualRevenue,
      averageRevenuePerUser: activeSubscriptions.length > 0 ? monthlyRevenue / activeSubscriptions.length : 0,
      revenueByPlan,
    };

    // Plan stats
    const planStats = {
      total: plans.length,
      active: plans.filter((p: any) => p.isActive !== false).length,
      inactive: plans.filter((p: any) => p.isActive === false).length,
      averagePrice: plans.length > 0 ? plans.reduce((sum: number, p: any) => sum + (p.price || 0), 0) / plans.length : 0,
      mostPopular: revenueByPlan.sort((a, b) => b.subscribers - a.subscribers)[0] || null,
      highestRevenue: revenueByPlan.sort((a, b) => b.monthlyRevenue - a.monthlyRevenue)[0] || null,
    };

    // Deployment stats
    const deploymentStats = {
      total: deployments.length,
      active: deployments.filter((d: any) => d.deploymentStatus === "active").length,
      pending: deployments.filter((d: any) => d.deploymentStatus === "pending").length,
      failed: deployments.filter((d: any) => d.deploymentStatus === "failed").length,
      inactive: deployments.filter((d: any) => d.deploymentStatus === "inactive").length,
      customDomains: deployments.filter((d: any) => d.deploymentType === "custom_domain").length,
      subdomains: deployments.filter((d: any) => d.deploymentType === "subdomain").length,
      byProvider: deployments.reduce((acc: any, d: any) => {
        const provider = d.deploymentProvider || "unknown";
        acc[provider] = (acc[provider] || 0) + 1;
        return acc;
      }, {}),
      uptimeRate:
        deployments.length > 0 ? (deployments.filter((d: any) => d.deploymentStatus === "active").length / deployments.length) * 100 : 0,
    };

    // Database stats
    const totalStorageBytes = databases.reduce((sum: number, db: any) => sum + (db.sizeOnDisk || 0), 0);
    const databaseStats = {
      total: databases.length,
      merchantDatabases: databases.filter((db: any) => db.merchantId).length,
      systemDatabases: databases.filter((db: any) => !db.merchantId).length,
      totalStorageBytes,
      totalStorageGB: totalStorageBytes / (1024 * 1024 * 1024),
      averageSizeBytes: databases.length > 0 ? totalStorageBytes / databases.length : 0,
      active: databases.filter((db: any) => !db.empty).length,
      empty: databases.filter((db: any) => db.empty).length,
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
      overall: deploymentStats.failed > 0 || subscriptionStats.expiringSoon > 5 ? "warning" : "healthy",
    };

    // Recent activity (last 10 items)
    const allItems = [
      ...merchants.map((m: any) => ({
        type: "merchant",
        action: "created",
        id: m.id,
        name: m.name,
        date: m.createdAt,
      })),
      ...subscriptions.map((s: any) => ({
        type: "subscription",
        action: s.status === "active" ? "activated" : s.status,
        id: s.id,
        merchantId: s.merchantId,
        date: s.createdAt,
      })),
      ...deployments.map((d: any) => ({
        type: "deployment",
        action: d.deploymentStatus,
        id: d.id,
        merchantId: d.merchantId,
        date: d.createdAt,
      })),
    ]
      .filter((item) => item.date)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 10);

    return NextResponse.json({
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
    });
  } catch (error: any) {
    console.error("GET /api/analytics error:", error);
    return NextResponse.json({ error: error?.message || "Failed to get analytics" }, { status: 500 });
  }
}
