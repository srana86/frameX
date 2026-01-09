/* eslint-disable @typescript-eslint/no-explicit-any */
import { prisma } from "@framex/database";
import config from "../../../config/index";

interface HealthCheck {
  name: string;
  status: "healthy" | "degraded" | "unhealthy";
  latency?: number;
  message?: string;
  details?: Record<string, any>;
  lastChecked: string;
}

const isExpiringSoon = (date: Date) => {
  const diff = new Date(date).getTime() - Date.now();
  return diff > 0 && diff < 7 * 24 * 60 * 60 * 1000;
};
const isPastDue = (date: Date) => new Date(date).getTime() < Date.now();


const getSystemHealth = async () => {
  const checks: HealthCheck[] = [];
  const startTime = Date.now();

  // 1. Database Connection Check (Prisma)
  const dbStart = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`; // Simple query to check connection
    const dbLatency = Date.now() - dbStart;
    checks.push({
      name: "Database (PostgreSQL)",
      status: dbLatency < 1000 ? "healthy" : "degraded",
      latency: dbLatency,
      message: `Connected successfully (${dbLatency}ms)`,
      lastChecked: new Date().toISOString(),
    });
  } catch (error: any) {
    checks.push({
      name: "Database (PostgreSQL)",
      status: "unhealthy",
      latency: Date.now() - dbStart,
      message: error.message || "Connection failed",
      lastChecked: new Date().toISOString(),
    });
  }

  // 2. Collections/Tables Health Check
  try {
    const tableStats: Record<string, number> = {};

    tableStats["merchants"] = await prisma.merchant.count();
    tableStats["subscriptions"] = await prisma.subscription.count();
    tableStats["plans"] = await prisma.plan.count();
    tableStats["deployments"] = await prisma.deployment.count();
    tableStats["databases"] = await prisma.databaseInfo.count();

    checks.push({
      name: "Database Tables",
      status: "healthy",
      message: "All critical tables accessible",
      details: tableStats,
      lastChecked: new Date().toISOString(),
    });
  } catch (error: any) {
    checks.push({
      name: "Database Tables",
      status: "unhealthy",
      message: error.message || "Failed to check tables",
      lastChecked: new Date().toISOString(),
    });
  }

  // 3. Deployment Health
  try {
    const deployments = await prisma.deployment.findMany(); // optimizing by grouping if possible, but finding all for now matching old logic

    const active = deployments.filter(d => d.status === "COMPLETED").length; // Mapping status
    const pending = deployments.filter(d => d.status === "PENDING" || d.status === "IN_PROGRESS").length;
    const failed = deployments.filter(d => d.status === "FAILED").length;
    const total = deployments.length;

    let status: "healthy" | "degraded" | "unhealthy" = "healthy";
    if (failed > 0) status = "degraded";
    if (failed > total * 0.2 && total > 0) status = "unhealthy";

    checks.push({
      name: "Deployments",
      status,
      message: `${active} active, ${pending} pending, ${failed} failed of ${total} total`,
      details: { active, pending, failed, total },
      lastChecked: new Date().toISOString(),
    });
  } catch (error: any) {
    checks.push({
      name: "Deployments",
      status: "unhealthy",
      message: error.message,
      lastChecked: new Date().toISOString(),
    });
  }

  // 4. Subscription Health
  try {
    const subscriptions = await prisma.subscription.findMany();

    const active = subscriptions.filter(s => s.status === "ACTIVE").length;
    const pastDue = subscriptions.filter(s => {
      if (s.status !== "ACTIVE") return false;
      return isPastDue(s.currentPeriodEnd);
    }).length;
    const expiringSoon = subscriptions.filter(s => {
      if (s.status !== "ACTIVE") return false;
      return isExpiringSoon(s.currentPeriodEnd);
    }).length;
    const total = subscriptions.length;

    let status: "healthy" | "degraded" | "unhealthy" = "healthy";
    if (pastDue > 0 || expiringSoon > 5) status = "degraded";
    if (pastDue > total * 0.1 && total > 0) status = "unhealthy";

    checks.push({
      name: "Subscriptions",
      status,
      message: `${active} active, ${pastDue} past due, ${expiringSoon} expiring soon`,
      details: { active, pastDue, expiringSoon, total },
      lastChecked: new Date().toISOString()
    });
  } catch (error: any) {
    checks.push({
      name: "Subscriptions",
      status: "unhealthy",
      message: error.message,
      lastChecked: new Date().toISOString()
    });
  }

  // 5. Vercel API Check
  try {
    const vercelToken = config.vercel_token;
    if (!vercelToken) {
      checks.push({
        name: "Vercel API",
        status: "degraded",
        message: "VERCEL_TOKEN not configured",
        lastChecked: new Date().toISOString(),
      });
    } else {
      const vercelStart = Date.now();
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        const response = await fetch("https://api.vercel.com/v9/projects", {
          headers: { Authorization: `Bearer ${vercelToken}` },
          signal: controller.signal,
        });

        clearTimeout(timeoutId);
        const vercelLatency = Date.now() - vercelStart;

        if (response.ok) {
          checks.push({
            name: "Vercel API",
            status: vercelLatency < 2000 ? "healthy" : "degraded",
            latency: vercelLatency,
            message: `Connected successfully (${vercelLatency}ms)`,
            lastChecked: new Date().toISOString(),
          });
        } else {
          checks.push({
            name: "Vercel API",
            status: "degraded",
            latency: vercelLatency,
            message: `API returned ${response.status}`,
            lastChecked: new Date().toISOString(),
          });
        }
      } catch (fetchError: any) {
        const vercelLatency = Date.now() - vercelStart;
        checks.push({
          name: "Vercel API",
          status: "degraded",
          latency: vercelLatency,
          message: fetchError.message || "Connection failed",
          lastChecked: new Date().toISOString(),
        });
      }
    }
  } catch (error: any) {
    checks.push({
      name: "Vercel API",
      status: "degraded",
      message: error.message,
      lastChecked: new Date().toISOString(),
    });
  }

  // 6. FraudShield API Check
  try {
    const fraudshieldKey = config.fraudshield_api_key;
    if (!fraudshieldKey) {
      checks.push({
        name: "FraudShield API",
        status: "degraded",
        message: "FRAUDSHIELD_API_KEY not configured",
        lastChecked: new Date().toISOString(),
      });
    } else {
      checks.push({
        name: "FraudShield API",
        status: "healthy",
        message: "API key configured",
        lastChecked: new Date().toISOString(),
      });
    }
  } catch (error: any) {
    checks.push({
      name: "FraudShield API",
      status: "degraded",
      message: error.message,
      lastChecked: new Date().toISOString(),
    });
  }

  // Calculate overall status
  const unhealthyCount = checks.filter((c) => c.status === "unhealthy").length;
  const degradedCount = checks.filter((c) => c.status === "degraded").length;

  let overallStatus: "healthy" | "degraded" | "unhealthy" = "healthy";
  if (degradedCount > 0) overallStatus = "degraded";
  if (unhealthyCount > 0) overallStatus = "unhealthy";

  const totalLatency = Date.now() - startTime;

  return {
    success: true,
    status: overallStatus,
    message: overallStatus === "healthy" ? "All systems operational" : "Issues detected",
    totalCheckTime: totalLatency,
    checks,
    summary: {
      healthy: checks.filter((c) => c.status === "healthy").length,
      degraded: degradedCount,
      unhealthy: unhealthyCount,
      total: checks.length,
    },
    timestamp: new Date().toISOString(),
  };
};

export const SystemHealthServices = {
  getSystemHealth,
};
