"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  RefreshCw,
  Activity,
  Database,
  Server,
  Globe,
  Shield,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  Zap,
  HardDrive,
  Rocket,
  CreditCard,
} from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api-client";

interface HealthCheck {
  name: string;
  status: "healthy" | "degraded" | "unhealthy";
  latency?: number;
  message?: string;
  details?: Record<string, any>;
  lastChecked: string;
}

interface SystemHealth {
  success: boolean;
  status: "healthy" | "degraded" | "unhealthy";
  message: string;
  totalCheckTime: number;
  checks: HealthCheck[];
  summary: {
    healthy: number;
    degraded: number;
    unhealthy: number;
    total: number;
  };
  timestamp: string;
}

function StatusIcon({ status }: { status: string }) {
  switch (status) {
    case "healthy":
      return <CheckCircle2 className="h-5 w-5 text-green-500" />;
    case "degraded":
      return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
    case "unhealthy":
      return <XCircle className="h-5 w-5 text-red-500" />;
    default:
      return <Clock className="h-5 w-5 text-gray-500" />;
  }
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    healthy: "bg-green-500",
    degraded: "bg-yellow-500",
    unhealthy: "bg-red-500",
  };

  return (
    <Badge className={`${colors[status] || "bg-gray-500"} gap-1`}>
      <StatusIcon status={status} />
      <span className="capitalize">{status}</span>
    </Badge>
  );
}

function ServiceIcon({ name }: { name: string }) {
  const icons: Record<string, React.ReactNode> = {
    MongoDB: <Database className="h-5 w-5" />,
    "Database Collections": <HardDrive className="h-5 w-5" />,
    Deployments: <Rocket className="h-5 w-5" />,
    Subscriptions: <CreditCard className="h-5 w-5" />,
    "Vercel API": <Globe className="h-5 w-5" />,
    "FraudShield API": <Shield className="h-5 w-5" />,
  };

  return icons[name] || <Server className="h-5 w-5" />;
}

function HealthCheckCard({ check }: { check: HealthCheck }) {
  return (
    <Card
      className={`transition-all ${
        check.status === "unhealthy"
          ? "border-red-500/50"
          : check.status === "degraded"
          ? "border-yellow-500/50"
          : ""
      }`}
    >
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`rounded-lg p-2 ${
                check.status === "healthy"
                  ? "bg-green-500/10"
                  : check.status === "degraded"
                  ? "bg-yellow-500/10"
                  : "bg-red-500/10"
              }`}
            >
              <ServiceIcon name={check.name} />
            </div>
            <div>
              <h3 className="font-semibold">{check.name}</h3>
              <p className="text-sm text-muted-foreground">{check.message}</p>
            </div>
          </div>
          <StatusBadge status={check.status} />
        </div>

        {check.latency !== undefined && (
          <div className="mt-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Latency</span>
              <span
                className={
                  check.latency > 1000 ? "text-yellow-600" : "text-green-600"
                }
              >
                {check.latency}ms
              </span>
            </div>
            <Progress
              value={Math.min(100, (check.latency / 2000) * 100)}
              className={`mt-1 h-1 ${
                check.latency > 1000
                  ? "[&>div]:bg-yellow-500"
                  : "[&>div]:bg-green-500"
              }`}
            />
          </div>
        )}

        {check.details && Object.keys(check.details).length > 0 && (
          <div className="mt-4 rounded-lg bg-muted/50 p-3">
            <p className="mb-2 text-xs font-medium text-muted-foreground">
              Details
            </p>
            <div className="grid gap-1">
              {Object.entries(check.details).map(([key, value]) => (
                <div
                  key={key}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="capitalize text-muted-foreground">
                    {key.replace(/_/g, " ")}
                  </span>
                  <span className="font-mono">
                    {typeof value === "number"
                      ? value.toLocaleString()
                      : String(value)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <p className="mt-3 text-xs text-muted-foreground">
          Last checked: {new Date(check.lastChecked).toLocaleTimeString()}
        </p>
      </CardContent>
    </Card>
  );
}

export default function SystemHealthPage() {
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(false);

  const loadHealth = async () => {
    setLoading(true);
    try {
      const data = await api.get<any>("system-health");
      setHealth(data);
    } catch (error) {
      console.error("Failed to check system health:", error);
      toast.error("Failed to check system health");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHealth();
  }, []);

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(loadHealth, 30000); // Refresh every 30 seconds
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const overallStatusColor =
    health?.status === "healthy"
      ? "text-green-500"
      : health?.status === "degraded"
      ? "text-yellow-500"
      : "text-red-500";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">System Health</h1>
          <p className="text-muted-foreground">
            Monitor the health and status of all system components
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={autoRefresh ? "default" : "outline"}
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            <Zap
              className={`h-4 w-4 mr-2 ${autoRefresh ? "animate-pulse" : ""}`}
            />
            {autoRefresh ? "Auto-Refresh On" : "Auto-Refresh Off"}
          </Button>
          <Button variant="outline" onClick={loadHealth} disabled={loading}>
            <RefreshCw
              className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
        </div>
      </div>

      {/* Overall Status */}
      <Card
        className={`${
          health?.status === "unhealthy"
            ? "border-red-500/50 bg-red-500/5"
            : health?.status === "degraded"
            ? "border-yellow-500/50 bg-yellow-500/5"
            : "border-green-500/50 bg-green-500/5"
        }`}
      >
        <CardContent className="pt-6">
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row sm:justify-between">
            <div className="flex items-center gap-4">
              <div
                className={`rounded-full p-4 ${
                  health?.status === "healthy"
                    ? "bg-green-500/20"
                    : health?.status === "degraded"
                    ? "bg-yellow-500/20"
                    : "bg-red-500/20"
                }`}
              >
                <Activity className={`h-8 w-8 ${overallStatusColor}`} />
              </div>
              <div>
                <h2 className={`text-2xl font-bold ${overallStatusColor}`}>
                  {loading ? "Checking..." : health?.message || "Unknown"}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {health?.timestamp
                    ? `Last updated: ${new Date(
                        health.timestamp
                      ).toLocaleString()}`
                    : ""}
                </p>
              </div>
            </div>

            {health?.summary && (
              <div className="flex gap-6">
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-500">
                    {health.summary.healthy}
                  </p>
                  <p className="text-xs text-muted-foreground">Healthy</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-yellow-500">
                    {health.summary.degraded}
                  </p>
                  <p className="text-xs text-muted-foreground">Degraded</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-red-500">
                    {health.summary.unhealthy}
                  </p>
                  <p className="text-xs text-muted-foreground">Unhealthy</p>
                </div>
              </div>
            )}

            {health?.totalCheckTime !== undefined && (
              <div className="text-center">
                <p className="text-2xl font-bold">{health.totalCheckTime}ms</p>
                <p className="text-xs text-muted-foreground">
                  Total Check Time
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Health Checks Grid */}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 animate-pulse rounded-lg bg-muted" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-24 animate-pulse rounded bg-muted" />
                    <div className="h-3 w-32 animate-pulse rounded bg-muted" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : health?.checks && health.checks.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {health.checks.map((check) => (
            <HealthCheckCard key={check.name} check={check} />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Activity className="mb-4 h-12 w-12 text-muted-foreground" />
            <p className="text-muted-foreground">
              No health check data available
            </p>
            <Button className="mt-4" onClick={loadHealth}>
              Run Health Check
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common system maintenance tasks</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Button
            variant="outline"
            className="justify-start"
            onClick={loadHealth}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Run Full Health Check
          </Button>
          <Button variant="outline" className="justify-start" asChild>
            <a href="/api/analytics" target="_blank" rel="noopener noreferrer">
              <Activity className="mr-2 h-4 w-4" />
              View Analytics API
            </a>
          </Button>
          <Button variant="outline" className="justify-start" asChild>
            <a
              href="/api/system-health"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Shield className="mr-2 h-4 w-4" />
              View Health API
            </a>
          </Button>
          <Button variant="outline" className="justify-start" asChild>
            <a href="/database" rel="noopener noreferrer">
              <Database className="mr-2 h-4 w-4" />
              Database Management
            </a>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
