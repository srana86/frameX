"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  Rocket,
  CreditCard,
  Database,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Activity,
  DollarSign,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Layers,
  ShieldCheck,
  Zap,
  BarChart3,
  PieChart,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend,
} from "recharts";
import { useCurrency } from "@/contexts/SettingsContext";

// Types
interface Merchant {
  id: string;
  name: string;
  email: string;
  status: string;
  createdAt?: string;
}

interface Subscription {
  id: string;
  merchantId: string;
  planId: string;
  status: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  plan?: { name: string; price: number };
}

interface Deployment {
  id: string;
  merchantId: string;
  deploymentStatus: string;
  deploymentUrl?: string;
}

interface Plan {
  id: string;
  name: string;
  price: number;
  isActive: boolean;
}

interface DashboardStats {
  merchants: Merchant[];
  subscriptions: Subscription[];
  deployments: Deployment[];
  plans: Plan[];
  databases: { name: string; sizeOnDisk: number; merchantId?: string }[];
}

// Chart colors
const CHART_COLORS = ["hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))"];

// Stat card component
function StatCard({
  title,
  value,
  description,
  icon: Icon,
  href,
  trend,
  trendValue,
  loading,
}: {
  title: string;
  value: number | string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
  loading?: boolean;
}) {
  return (
    <Card className='relative overflow-hidden transition-all hover:shadow-lg hover:scale-[1.02]'>
      <CardHeader className='flex flex-row items-center justify-between pb-2'>
        <CardTitle className='text-sm font-medium text-muted-foreground'>{title}</CardTitle>
        <div className='rounded-lg bg-primary/10 p-2'>
          <Icon className='h-4 w-4 text-primary' />
        </div>
      </CardHeader>
      <CardContent>
        <div className='text-3xl font-bold'>
          {loading ? <span className='inline-block h-8 w-16 animate-pulse rounded bg-muted' /> : value}
        </div>
        <div className='mt-1 flex items-center justify-between'>
          <p className='text-xs text-muted-foreground'>{description}</p>
          {trend && trendValue && (
            <div
              className={`flex items-center gap-1 text-xs font-medium ${
                trend === "up" ? "text-green-600" : trend === "down" ? "text-red-600" : "text-muted-foreground"
              }`}
            >
              {trend === "up" ? <TrendingUp className='h-3 w-3' /> : trend === "down" ? <TrendingDown className='h-3 w-3' /> : null}
              {trendValue}
            </div>
          )}
        </div>
        <Link href={href} className='mt-3 inline-flex items-center text-sm font-medium text-primary hover:underline'>
          View details <ArrowRight className='ml-1 h-3 w-3' />
        </Link>
      </CardContent>
    </Card>
  );
}

// Activity item component
function ActivityItem({
  icon: Icon,
  title,
  description,
  time,
  status,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  time: string;
  status?: "success" | "warning" | "error" | "info";
}) {
  const statusColors = {
    success: "text-green-600 bg-green-100",
    warning: "text-yellow-600 bg-yellow-100",
    error: "text-red-600 bg-red-100",
    info: "text-blue-600 bg-blue-100",
  };

  return (
    <div className='flex items-start gap-3 rounded-lg p-3 transition-colors hover:bg-muted/50'>
      <div className={`rounded-full p-2 ${status ? statusColors[status] : "bg-muted"}`}>
        <Icon className='h-4 w-4' />
      </div>
      <div className='flex-1 space-y-1'>
        <p className='text-sm font-medium leading-none'>{title}</p>
        <p className='text-xs text-muted-foreground'>{description}</p>
      </div>
      <span className='text-xs text-muted-foreground'>{time}</span>
    </div>
  );
}

export default function DashboardPage() {
  const { formatAmount, currencySymbol } = useCurrency();
  const [data, setData] = useState<DashboardStats>({
    merchants: [],
    subscriptions: [],
    deployments: [],
    plans: [],
    databases: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [merchantsRes, subscriptionsRes, deploymentsRes, plansRes, databasesRes] = await Promise.all([
          fetch("/api/merchants").catch(() => null),
          fetch("/api/subscriptions").catch(() => null),
          fetch("/api/deployments").catch(() => null),
          fetch("/api/plans").catch(() => null),
          fetch("/api/databases").catch(() => null),
        ]);

        const merchants = merchantsRes?.ok ? await merchantsRes.json() : [];
        const subscriptions = subscriptionsRes?.ok ? await subscriptionsRes.json() : [];
        const deployments = deploymentsRes?.ok ? await deploymentsRes.json() : [];
        const plans = plansRes?.ok ? await plansRes.json() : [];
        const databases = databasesRes?.ok ? await databasesRes.json() : [];

        setData({ merchants, subscriptions, deployments, plans, databases });
      } catch (error) {
        console.error("Failed to load dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Computed stats
  const stats = useMemo(() => {
    const activeMerchants = data.merchants.filter((m) => m.status === "active").length;
    const activeSubscriptions = data.subscriptions.filter((s) => s.status === "active").length;
    const activeDeployments = data.deployments.filter((d) => d.deploymentStatus === "active").length;
    const activePlans = data.plans.filter((p) => p.isActive).length;

    const monthlyRevenue = data.subscriptions
      .filter((s) => s.status === "active" && s.plan?.price)
      .reduce((sum, s) => sum + (s.plan?.price || 0), 0);

    const totalStorage = data.databases.reduce((sum, db) => sum + (db.sizeOnDisk || 0), 0);

    return {
      totalMerchants: data.merchants.length,
      activeMerchants,
      totalSubscriptions: data.subscriptions.length,
      activeSubscriptions,
      totalDeployments: data.deployments.length,
      activeDeployments,
      totalPlans: data.plans.length,
      activePlans,
      monthlyRevenue,
      totalStorage,
      totalDatabases: data.databases.filter((db) => db.merchantId).length,
    };
  }, [data]);

  // Subscription status distribution
  const subscriptionStatusData = useMemo(() => {
    const statusCounts: Record<string, number> = {};
    data.subscriptions.forEach((sub) => {
      statusCounts[sub.status] = (statusCounts[sub.status] || 0) + 1;
    });
    return Object.entries(statusCounts).map(([name, value]) => ({ name, value }));
  }, [data.subscriptions]);

  // Merchant status distribution
  const merchantStatusData = useMemo(() => {
    const statusCounts: Record<string, number> = {};
    data.merchants.forEach((m) => {
      statusCounts[m.status] = (statusCounts[m.status] || 0) + 1;
    });
    return Object.entries(statusCounts).map(([name, value]) => ({ name, value }));
  }, [data.merchants]);

  // Plan revenue distribution
  const planRevenueData = useMemo(() => {
    const planRevenue: Record<string, number> = {};
    data.subscriptions
      .filter((s) => s.status === "active" && s.plan)
      .forEach((sub) => {
        const planName = sub.plan?.name || "Unknown";
        planRevenue[planName] = (planRevenue[planName] || 0) + (sub.plan?.price || 0);
      });
    return Object.entries(planRevenue).map(([name, revenue]) => ({ name, revenue }));
  }, [data.subscriptions]);

  // Deployment status distribution
  const deploymentStatusData = useMemo(() => {
    const statusCounts: Record<string, number> = {};
    data.deployments.forEach((d) => {
      statusCounts[d.deploymentStatus] = (statusCounts[d.deploymentStatus] || 0) + 1;
    });
    return Object.entries(statusCounts).map(([name, value]) => ({ name, value }));
  }, [data.deployments]);

  // Recent activity (mock based on data)
  const recentActivity = useMemo(() => {
    const activities: {
      icon: React.ComponentType<{ className?: string }>;
      title: string;
      description: string;
      time: string;
      status: "success" | "warning" | "error" | "info";
    }[] = [];

    // Add recent merchants
    data.merchants.slice(0, 2).forEach((m) => {
      activities.push({
        icon: Users,
        title: "New merchant registered",
        description: m.name,
        time: "Recently",
        status: "success",
      });
    });

    // Add recent subscriptions
    data.subscriptions.slice(0, 2).forEach((s) => {
      activities.push({
        icon: CreditCard,
        title: `Subscription ${s.status}`,
        description: s.plan?.name || "Plan",
        time: "Recently",
        status: s.status === "active" ? "success" : s.status === "cancelled" ? "error" : "info",
      });
    });

    // Add deployment status
    data.deployments.slice(0, 2).forEach((d) => {
      activities.push({
        icon: Rocket,
        title: `Deployment ${d.deploymentStatus}`,
        description: d.deploymentUrl || "Pending URL",
        time: "Recently",
        status: d.deploymentStatus === "active" ? "success" : d.deploymentStatus === "failed" ? "error" : "warning",
      });
    });

    return activities.slice(0, 6);
  }, [data]);

  // Format bytes
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
  };

  return (
    <div className='space-y-8'>
      {/* Header */}
      <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
        <div>
          <h1 className='text-3xl font-bold tracking-tight'>Dashboard</h1>
          <p className='text-muted-foreground'>Welcome back! Here's an overview of your platform.</p>
        </div>
        <div className='flex gap-2'>
          <Link href='/simulate'>
            <Button variant='outline' className='gap-2'>
              <Zap className='h-4 w-4' />
              Flow Simulation
            </Button>
          </Link>
          <Link href='/fraud-check'>
            <Button className='gap-2'>
              <ShieldCheck className='h-4 w-4' />
              Fraud Check
            </Button>
          </Link>
        </div>
      </div>

      {/* Key Metrics */}
      <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
        <StatCard
          title='Total Merchants'
          value={stats.totalMerchants}
          description={`${stats.activeMerchants} active`}
          icon={Users}
          href='/merchants'
          trend='up'
          trendValue='+12%'
          loading={loading}
        />
        <StatCard
          title='Active Subscriptions'
          value={stats.activeSubscriptions}
          description={`of ${stats.totalSubscriptions} total`}
          icon={CreditCard}
          href='/subscriptions'
          trend='up'
          trendValue='+8%'
          loading={loading}
        />
        <StatCard
          title='Monthly Revenue'
          value={loading ? "..." : formatAmount(stats.monthlyRevenue)}
          description='From active subscriptions'
          icon={DollarSign}
          href='/subscriptions'
          trend='up'
          trendValue='+15%'
          loading={loading}
        />
        <StatCard
          title='Active Deployments'
          value={stats.activeDeployments}
          description={`of ${stats.totalDeployments} total`}
          icon={Rocket}
          href='/deployments'
          trend='neutral'
          trendValue='Stable'
          loading={loading}
        />
      </div>

      {/* Secondary Metrics */}
      <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
        <Card className='transition-all hover:shadow-md'>
          <CardHeader className='flex flex-row items-center justify-between pb-2'>
            <CardTitle className='text-sm font-medium text-muted-foreground'>Subscription Plans</CardTitle>
            <Layers className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{loading ? "..." : stats.activePlans}</div>
            <p className='text-xs text-muted-foreground'>{stats.totalPlans} total plans</p>
            <Link href='/plans' className='mt-2 inline-flex items-center text-xs text-primary hover:underline'>
              Manage plans <ArrowRight className='ml-1 h-3 w-3' />
            </Link>
          </CardContent>
        </Card>

        <Card className='transition-all hover:shadow-md'>
          <CardHeader className='flex flex-row items-center justify-between pb-2'>
            <CardTitle className='text-sm font-medium text-muted-foreground'>Total Storage</CardTitle>
            <Database className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{loading ? "..." : formatBytes(stats.totalStorage)}</div>
            <p className='text-xs text-muted-foreground'>{stats.totalDatabases} merchant databases</p>
            <Link href='/database' className='mt-2 inline-flex items-center text-xs text-primary hover:underline'>
              View databases <ArrowRight className='ml-1 h-3 w-3' />
            </Link>
          </CardContent>
        </Card>

        <Card className='transition-all hover:shadow-md'>
          <CardHeader className='flex flex-row items-center justify-between pb-2'>
            <CardTitle className='text-sm font-medium text-muted-foreground'>System Health</CardTitle>
            <Activity className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='flex items-center gap-2'>
              <CheckCircle2 className='h-5 w-5 text-green-600' />
              <span className='text-2xl font-bold'>Healthy</span>
            </div>
            <p className='text-xs text-muted-foreground'>All systems operational</p>
          </CardContent>
        </Card>

        <Card className='transition-all hover:shadow-md'>
          <CardHeader className='flex flex-row items-center justify-between pb-2'>
            <CardTitle className='text-sm font-medium text-muted-foreground'>Pending Actions</CardTitle>
            <Clock className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              {loading ? "..." : data.deployments.filter((d) => d.deploymentStatus === "pending").length}
            </div>
            <p className='text-xs text-muted-foreground'>Deployments pending</p>
            <Link href='/deployments' className='mt-2 inline-flex items-center text-xs text-primary hover:underline'>
              Review <ArrowRight className='ml-1 h-3 w-3' />
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className='grid gap-6 lg:grid-cols-2'>
        {/* Subscription Status Chart */}
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <PieChart className='h-5 w-5' />
              Subscription Distribution
            </CardTitle>
            <CardDescription>Breakdown of subscription statuses</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className='flex h-[250px] items-center justify-center'>
                <div className='h-32 w-32 animate-pulse rounded-full bg-muted' />
              </div>
            ) : subscriptionStatusData.length > 0 ? (
              <ResponsiveContainer width='100%' height={250}>
                <RechartsPieChart>
                  <Pie
                    data={subscriptionStatusData}
                    cx='50%'
                    cy='50%'
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey='value'
                    label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {subscriptionStatusData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </RechartsPieChart>
              </ResponsiveContainer>
            ) : (
              <div className='flex h-[250px] flex-col items-center justify-center text-muted-foreground'>
                <PieChart className='mb-2 h-12 w-12 opacity-50' />
                <p>No subscription data</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Revenue by Plan Chart */}
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <BarChart3 className='h-5 w-5' />
              Revenue by Plan
            </CardTitle>
            <CardDescription>Monthly revenue distribution across plans</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className='flex h-[250px] items-center justify-center'>
                <div className='h-full w-full animate-pulse rounded bg-muted' />
              </div>
            ) : planRevenueData.length > 0 ? (
              <ResponsiveContainer width='100%' height={250}>
                <BarChart data={planRevenueData}>
                  <CartesianGrid strokeDasharray='3 3' className='stroke-muted' />
                  <XAxis dataKey='name' className='text-xs' />
                  <YAxis className='text-xs' tickFormatter={(v) => `${currencySymbol}${v}`} />
                  <Tooltip
                    formatter={(value: number) => [formatAmount(value), "Revenue"]}
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Bar dataKey='revenue' fill='hsl(var(--primary))' radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className='flex h-[250px] flex-col items-center justify-center text-muted-foreground'>
                <BarChart3 className='mb-2 h-12 w-12 opacity-50' />
                <p>No revenue data</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className='grid gap-6 lg:grid-cols-3'>
        {/* Recent Activity */}
        <Card className='lg:col-span-2'>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <Activity className='h-5 w-5' />
              Recent Activity
            </CardTitle>
            <CardDescription>Latest events across the platform</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className='space-y-4'>
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className='flex items-center gap-3'>
                    <div className='h-10 w-10 animate-pulse rounded-full bg-muted' />
                    <div className='flex-1 space-y-2'>
                      <div className='h-4 w-1/3 animate-pulse rounded bg-muted' />
                      <div className='h-3 w-1/2 animate-pulse rounded bg-muted' />
                    </div>
                  </div>
                ))}
              </div>
            ) : recentActivity.length > 0 ? (
              <div className='space-y-1'>
                {recentActivity.map((activity, index) => (
                  <ActivityItem key={index} {...activity} />
                ))}
              </div>
            ) : (
              <div className='flex h-48 flex-col items-center justify-center text-muted-foreground'>
                <Activity className='mb-2 h-12 w-12 opacity-50' />
                <p>No recent activity</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common administrative tasks</CardDescription>
          </CardHeader>
          <CardContent className='space-y-2'>
            <Link href='/merchants' className='block'>
              <Button variant='outline' className='w-full justify-start gap-2'>
                <Users className='h-4 w-4' />
                Manage Merchants
              </Button>
            </Link>
            <Link href='/plans/new' className='block'>
              <Button variant='outline' className='w-full justify-start gap-2'>
                <Layers className='h-4 w-4' />
                Create New Plan
              </Button>
            </Link>
            <Link href='/subscriptions' className='block'>
              <Button variant='outline' className='w-full justify-start gap-2'>
                <CreditCard className='h-4 w-4' />
                View Subscriptions
              </Button>
            </Link>
            <Link href='/deployments' className='block'>
              <Button variant='outline' className='w-full justify-start gap-2'>
                <Rocket className='h-4 w-4' />
                Monitor Deployments
              </Button>
            </Link>
            <Link href='/database' className='block'>
              <Button variant='outline' className='w-full justify-start gap-2'>
                <Database className='h-4 w-4' />
                Database Overview
              </Button>
            </Link>
            <div className='pt-2'>
              <Link href='/simulate' className='block'>
                <Button className='w-full gap-2'>
                  <Zap className='h-4 w-4' />
                  Run Flow Simulation
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Status Overview */}
      <div className='grid gap-6 lg:grid-cols-2'>
        {/* Merchant Status */}
        <Card>
          <CardHeader>
            <CardTitle>Merchant Status Overview</CardTitle>
            <CardDescription>Distribution of merchant account statuses</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className='space-y-3'>
                {[1, 2, 3].map((i) => (
                  <div key={i} className='flex items-center justify-between'>
                    <div className='h-4 w-24 animate-pulse rounded bg-muted' />
                    <div className='h-4 w-16 animate-pulse rounded bg-muted' />
                  </div>
                ))}
              </div>
            ) : merchantStatusData.length > 0 ? (
              <div className='space-y-3'>
                {merchantStatusData.map((item, index) => (
                  <div key={item.name} className='flex items-center justify-between'>
                    <div className='flex items-center gap-2'>
                      <div className='h-3 w-3 rounded-full' style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }} />
                      <span className='text-sm font-medium capitalize'>{item.name}</span>
                    </div>
                    <div className='flex items-center gap-2'>
                      <Badge variant='secondary'>{item.value}</Badge>
                      <span className='text-xs text-muted-foreground'>{((item.value / data.merchants.length) * 100).toFixed(0)}%</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className='text-center text-muted-foreground'>No merchant data</p>
            )}
          </CardContent>
        </Card>

        {/* Deployment Status */}
        <Card>
          <CardHeader>
            <CardTitle>Deployment Status Overview</CardTitle>
            <CardDescription>Distribution of deployment statuses</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className='space-y-3'>
                {[1, 2, 3].map((i) => (
                  <div key={i} className='flex items-center justify-between'>
                    <div className='h-4 w-24 animate-pulse rounded bg-muted' />
                    <div className='h-4 w-16 animate-pulse rounded bg-muted' />
                  </div>
                ))}
              </div>
            ) : deploymentStatusData.length > 0 ? (
              <div className='space-y-3'>
                {deploymentStatusData.map((item, index) => (
                  <div key={item.name} className='flex items-center justify-between'>
                    <div className='flex items-center gap-2'>
                      <div className='h-3 w-3 rounded-full' style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }} />
                      <span className='text-sm font-medium capitalize'>{item.name}</span>
                    </div>
                    <div className='flex items-center gap-2'>
                      <Badge variant={item.name === "active" ? "default" : item.name === "failed" ? "destructive" : "secondary"}>
                        {item.value}
                      </Badge>
                      <span className='text-xs text-muted-foreground'>{((item.value / data.deployments.length) * 100).toFixed(0)}%</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className='text-center text-muted-foreground'>No deployment data</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
