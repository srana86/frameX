import { Merchant } from "../Merchant/merchant.model";
import { Subscription } from "../Subscription/subscription.model";
import { Deployment } from "../Deployment/deployment.model";
import { MongoClient } from "mongodb";
import { isExpiringSoon, isPastDue } from "../../utils/mongodb";
import config from "../../../config/index";

interface HealthCheck {
  name: string;
  status: "healthy" | "degraded" | "unhealthy";
  latency?: number;
  message?: string;
  details?: Record<string, any>;
  lastChecked: string;
}

const getSystemHealth = async () => {
  const checks: HealthCheck[] = [];
  const startTime = Date.now();

  // 1. MongoDB Connection Check
  const mongoStart = Date.now();
  try {
    const uri = config.database_url;
    if (!uri) {
      checks.push({
        name: "MongoDB",
        status: "unhealthy",
        message: "MONGODB_URI not configured",
        lastChecked: new Date().toISOString(),
      });
    } else {
      const client = new MongoClient(uri, {
        serverSelectionTimeoutMS: 5000,
        connectTimeoutMS: 5000,
      });
      await client.connect();
      await client.db().admin().ping();
      const mongoLatency = Date.now() - mongoStart;
      await client.close();

      checks.push({
        name: "MongoDB",
        status: mongoLatency < 1000 ? "healthy" : "degraded",
        latency: mongoLatency,
        message: `Connected successfully (${mongoLatency}ms)`,
        lastChecked: new Date().toISOString(),
      });
    }
  } catch (error: any) {
    checks.push({
      name: "MongoDB",
      status: "unhealthy",
      latency: Date.now() - mongoStart,
      message: error.message || "Connection failed",
      lastChecked: new Date().toISOString(),
    });
  }

  // 2. Collections Health Check
  try {
    const collections = [
      "merchants",
      "merchant_subscriptions",
      "subscription_plans",
      "merchant_deployments",
      "merchant_databases",
    ];

    const collectionStats: Record<string, number> = {};
    for (const colName of collections) {
      try {
        let count = 0;
        switch (colName) {
          case "merchants":
            count = await Merchant.countDocuments({});
            break;
          case "merchant_subscriptions":
            count = await Subscription.countDocuments({});
            break;
          case "subscription_plans":
            const { Plan } = await import("../Plan/plan.model");
            count = await Plan.countDocuments({});
            break;
          case "merchant_deployments":
            count = await Deployment.countDocuments({});
            break;
          case "merchant_databases":
            const { Database } = await import("../Database/database.model");
            count = await Database.countDocuments({});
            break;
        }
        collectionStats[colName] = count;
      } catch {
        collectionStats[colName] = -1;
      }
    }

    const failedCollections = Object.entries(collectionStats).filter(
      ([, v]) => v === -1
    );

    checks.push({
      name: "Database Collections",
      status:
        failedCollections.length === 0
          ? "healthy"
          : failedCollections.length < 3
            ? "degraded"
            : "unhealthy",
      message:
        failedCollections.length === 0
          ? "All collections accessible"
          : `${failedCollections.length} collections inaccessible`,
      details: collectionStats,
      lastChecked: new Date().toISOString(),
    });
  } catch (error: any) {
    checks.push({
      name: "Database Collections",
      status: "unhealthy",
      message: error.message || "Failed to check collections",
      lastChecked: new Date().toISOString(),
    });
  }

  // 3. Deployment Health
  try {
    const deployments = await Deployment.find({});

    const active = deployments.filter(
      (d) => d.deploymentStatus === "active"
    ).length;
    const pending = deployments.filter(
      (d) => d.deploymentStatus === "pending"
    ).length;
    const failed = deployments.filter(
      (d) => d.deploymentStatus === "failed"
    ).length;
    const total = deployments.length;

    let status: "healthy" | "degraded" | "unhealthy" = "healthy";
    if (failed > 0) status = "degraded";
    if (failed > total * 0.2) status = "unhealthy";

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
      message: error.message || "Failed to check deployments",
      lastChecked: new Date().toISOString(),
    });
  }

  // 4. Subscription Health
  try {
    const subscriptions = await Subscription.find({});

    const now = new Date();
    const active = subscriptions.filter((s) => s.status === "active").length;
    const pastDue = subscriptions.filter((s) => {
      if (s.status !== "active") return false;
      return isPastDue(s.currentPeriodEnd);
    }).length;
    const expiringSoon = subscriptions.filter((s) => {
      if (s.status !== "active") return false;
      return isExpiringSoon(s.currentPeriodEnd);
    }).length;
    const total = subscriptions.length;

    let status: "healthy" | "degraded" | "unhealthy" = "healthy";
    if (pastDue > 0 || expiringSoon > 5) status = "degraded";
    if (pastDue > total * 0.1) status = "unhealthy";

    checks.push({
      name: "Subscriptions",
      status,
      message: `${active} active, ${pastDue} past due, ${expiringSoon} expiring soon`,
      details: { active, pastDue, expiringSoon, total },
      lastChecked: new Date().toISOString(),
    });
  } catch (error: any) {
    checks.push({
      name: "Subscriptions",
      status: "unhealthy",
      message: error.message || "Failed to check subscriptions",
      lastChecked: new Date().toISOString(),
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
        const errorMessage =
          fetchError?.cause?.code === "ECONNREFUSED" ||
          fetchError?.code === "ECONNREFUSED"
            ? "Connection refused - service may be unavailable"
            : fetchError?.name === "AbortError"
              ? "Request timed out"
              : fetchError?.message || "Connection failed";

        checks.push({
          name: "Vercel API",
          status: "degraded",
          latency: vercelLatency,
          message: errorMessage,
          lastChecked: new Date().toISOString(),
        });
      }
    }
  } catch (error: any) {
    checks.push({
      name: "Vercel API",
      status: "degraded",
      message:
        error?.cause?.code === "ECONNREFUSED"
          ? "Service unavailable"
          : error.message || "Connection failed",
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
      message: error.message || "Check failed",
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
    message:
      overallStatus === "healthy"
        ? "All systems operational"
        : overallStatus === "degraded"
          ? "Some systems degraded"
          : "Critical issues detected",
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
