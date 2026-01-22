"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DollarSign,
  ShoppingCart,
  Users,
  TrendingUp,
  Package,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { createStoreApiClient } from "@/lib/store-api-client";
import { cn } from "@/utils/cn";
import type { StaffPermission } from "@/contexts/StoreContext";

interface StoreStatistics {
  overview: {
    totalRevenue: number;
    totalOrders: number;
    totalCustomers: number;
    averageOrderValue: number;
  };
  revenueByPeriod: { date: string; revenue: number }[];
  ordersByStatus: { status: string; count: number }[];
  topProducts: { id: string; name: string; sales: number; revenue: number }[];
}

interface StatisticsClientProps {
  initialStats: StoreStatistics;
  storeId: string;
  permission: StaffPermission | null;
}

const PERIODS = [
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "90d", label: "Last 90 days" },
  { value: "year", label: "This Year" },
];

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-yellow-500",
  PROCESSING: "bg-blue-500",
  SHIPPED: "bg-purple-500",
  DELIVERED: "bg-green-500",
  CANCELLED: "bg-red-500",
};

/**
 * Statistics Client Component
 * Display store analytics and metrics
 */
export function StatisticsClient({
  initialStats,
  storeId,
  permission,
}: StatisticsClientProps) {
  const [stats, setStats] = useState<StoreStatistics>(initialStats);
  const [loading, setLoading] = useState(false);
  const [period, setPeriod] = useState("30d");

  // Refresh statistics
  const refreshStats = async () => {
    setLoading(true);
    try {
      const storeApi = createStoreApiClient(storeId);
      const result = await storeApi.get(`statistics?period=${period}`);
      setStats({ ...stats, ...(result as any) });
      toast.success("Statistics refreshed");
    } catch (error) {
      toast.error("Failed to refresh statistics");
    } finally {
      setLoading(false);
    }
  };

  // Handle period change
  const handlePeriodChange = async (newPeriod: string) => {
    setPeriod(newPeriod);
    setLoading(true);
    try {
      const storeApi = createStoreApiClient(storeId);
      const result = await storeApi.get(`statistics?period=${newPeriod}`);
      setStats({ ...stats, ...(result as any) });
    } catch (error) {
      toast.error("Failed to load statistics");
    } finally {
      setLoading(false);
    }
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  // Calculate max revenue for chart
  const maxRevenue = Math.max(...stats.revenueByPeriod.map((r) => r.revenue), 1);

  // Calculate total orders for status chart
  const totalOrders = stats.ordersByStatus.reduce((acc, s) => acc + s.count, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Statistics</h1>
          <p className="text-muted-foreground">
            Store performance and analytics
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={period} onValueChange={handlePeriodChange}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PERIODS.map((p) => (
                <SelectItem key={p.value} value={p.value}>
                  {p.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={refreshStats} disabled={loading}>
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(stats.overview.totalRevenue)}
            </div>
            <p className="text-xs text-muted-foreground">
              +12.5% from last period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.overview.totalOrders}</div>
            <p className="text-xs text-muted-foreground">
              +8.2% from last period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.overview.totalCustomers}</div>
            <p className="text-xs text-muted-foreground">
              +5.1% from last period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Avg Order Value</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(stats.overview.averageOrderValue)}
            </div>
            <p className="text-xs text-muted-foreground">
              +3.2% from last period
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Revenue Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue Over Time</CardTitle>
            <CardDescription>Daily revenue for the selected period</CardDescription>
          </CardHeader>
          <CardContent>
            {stats.revenueByPeriod.length === 0 ? (
              <div className="flex h-64 items-center justify-center text-muted-foreground">
                No revenue data available
              </div>
            ) : (
              <div className="space-y-2">
                {stats.revenueByPeriod.slice(-10).map((item) => (
                  <div key={item.date} className="flex items-center gap-2">
                    <span className="w-20 text-xs text-muted-foreground truncate">
                      {new Date(item.date).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                    <div className="flex-1">
                      <div
                        className="h-6 rounded bg-primary transition-all"
                        style={{
                          width: `${(item.revenue / maxRevenue) * 100}%`,
                          minWidth: item.revenue > 0 ? "4px" : "0",
                        }}
                      />
                    </div>
                    <span className="w-20 text-right text-sm font-medium">
                      {formatCurrency(item.revenue)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Orders by Status */}
        <Card>
          <CardHeader>
            <CardTitle>Orders by Status</CardTitle>
            <CardDescription>Distribution of order statuses</CardDescription>
          </CardHeader>
          <CardContent>
            {stats.ordersByStatus.length === 0 ? (
              <div className="flex h-64 items-center justify-center text-muted-foreground">
                No order data available
              </div>
            ) : (
              <div className="space-y-4">
                {stats.ordersByStatus.map((item) => {
                  const percentage =
                    totalOrders > 0 ? (item.count / totalOrders) * 100 : 0;
                  return (
                    <div key={item.status} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-2">
                          <span
                            className={cn(
                              "h-3 w-3 rounded-full",
                              STATUS_COLORS[item.status] || "bg-gray-400"
                            )}
                          />
                          {item.status}
                        </span>
                        <span className="font-medium">
                          {item.count} ({percentage.toFixed(1)}%)
                        </span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-muted">
                        <div
                          className={cn(
                            "h-full rounded-full transition-all",
                            STATUS_COLORS[item.status] || "bg-gray-400"
                          )}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top Products */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Top Products
          </CardTitle>
          <CardDescription>Best selling products by revenue</CardDescription>
        </CardHeader>
        <CardContent>
          {stats.topProducts.length === 0 ? (
            <div className="flex py-12 items-center justify-center text-muted-foreground">
              No product data available
            </div>
          ) : (
            <div className="space-y-4">
              {stats.topProducts.slice(0, 5).map((product, index) => (
                <div
                  key={product.id}
                  className="flex items-center justify-between rounded-lg border p-4"
                >
                  <div className="flex items-center gap-4">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                      #{index + 1}
                    </span>
                    <div>
                      <p className="font-medium">{product.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {product.sales} sales
                      </p>
                    </div>
                  </div>
                  <p className="text-lg font-bold">
                    {formatCurrency(product.revenue)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
