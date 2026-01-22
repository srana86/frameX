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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  RefreshCw,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { createStoreApiClient } from "@/lib/store-api-client";
import { cn } from "@/utils/cn";
import type { StaffPermission } from "@/contexts/StoreContext";

interface ProfitData {
  summary: {
    totalRevenue: number;
    totalCost: number;
    grossProfit: number;
    profitMargin: number;
  };
  byProduct: Array<{
    id: string;
    name: string;
    revenue: number;
    cost: number;
    profit: number;
    margin: number;
  }>;
  byCategory: Array<{
    name: string;
    revenue: number;
    profit: number;
    margin: number;
  }>;
  trend: Array<{
    date: string;
    revenue: number;
    profit: number;
  }>;
}

interface ProfitAnalysisClientProps {
  initialData: ProfitData;
  storeId: string;
  permission: StaffPermission | null;
}

const PERIODS = [
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "90d", label: "Last 90 days" },
  { value: "year", label: "This Year" },
];

/**
 * Profit Analysis Client Component
 */
export function ProfitAnalysisClient({
  initialData,
  storeId,
  permission,
}: ProfitAnalysisClientProps) {
  const [data, setData] = useState<ProfitData>(initialData);
  const [loading, setLoading] = useState(false);
  const [period, setPeriod] = useState("30d");

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  // Refresh data
  const refreshData = async (newPeriod?: string) => {
    setLoading(true);
    const p = newPeriod || period;
    try {
      const storeApi = createStoreApiClient(storeId);
      const result = await storeApi.get(`profit-analysis?period=${p}`);
      setData({ ...data, ...(result as any) });
      if (newPeriod) setPeriod(newPeriod);
    } catch (error) {
      toast.error("Failed to refresh data");
    } finally {
      setLoading(false);
    }
  };

  // Calculate max for charts
  const maxProfit = Math.max(...data.trend.map((t) => t.profit), 1);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Profit Analysis</h1>
          <p className="text-muted-foreground">
            Analyze your store's profitability
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={period} onValueChange={refreshData}>
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
          <Button variant="outline" onClick={() => refreshData()} disabled={loading}>
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(data.summary.totalRevenue)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Cost</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-muted-foreground">
              {formatCurrency(data.summary.totalCost)}
            </div>
          </CardContent>
        </Card>
        <Card className="border-green-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-500" />
              Gross Profit
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(data.summary.grossProfit)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Profit Margin</CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className={cn(
                "text-2xl font-bold",
                data.summary.profitMargin >= 0 ? "text-green-600" : "text-red-600"
              )}
            >
              {data.summary.profitMargin.toFixed(1)}%
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Profit Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Profit Trend</CardTitle>
            <CardDescription>Daily profit over the selected period</CardDescription>
          </CardHeader>
          <CardContent>
            {data.trend.length === 0 ? (
              <div className="flex h-48 items-center justify-center text-muted-foreground">
                No data available
              </div>
            ) : (
              <div className="space-y-2">
                {data.trend.slice(-10).map((item) => (
                  <div key={item.date} className="flex items-center gap-2">
                    <span className="w-20 text-xs text-muted-foreground truncate">
                      {new Date(item.date).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                    <div className="flex-1">
                      <div
                        className={cn(
                          "h-5 rounded transition-all",
                          item.profit >= 0 ? "bg-green-500" : "bg-red-500"
                        )}
                        style={{
                          width: `${Math.abs(item.profit / maxProfit) * 100}%`,
                          minWidth: item.profit !== 0 ? "4px" : "0",
                        }}
                      />
                    </div>
                    <span
                      className={cn(
                        "w-20 text-right text-sm font-medium",
                        item.profit >= 0 ? "text-green-600" : "text-red-600"
                      )}
                    >
                      {formatCurrency(item.profit)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* By Category */}
        <Card>
          <CardHeader>
            <CardTitle>Profit by Category</CardTitle>
            <CardDescription>Profitability breakdown by category</CardDescription>
          </CardHeader>
          <CardContent>
            {data.byCategory.length === 0 ? (
              <div className="flex h-48 items-center justify-center text-muted-foreground">
                No data available
              </div>
            ) : (
              <div className="space-y-4">
                {data.byCategory.slice(0, 5).map((category) => (
                  <div key={category.name} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{category.name}</span>
                      <span
                        className={cn(
                          "font-medium",
                          category.margin >= 0 ? "text-green-600" : "text-red-600"
                        )}
                      >
                        {category.margin.toFixed(1)}% margin
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Revenue: {formatCurrency(category.revenue)}</span>
                      <span>Profit: {formatCurrency(category.profit)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top Products by Profit */}
      <Card>
        <CardHeader>
          <CardTitle>Top Products by Profit</CardTitle>
          <CardDescription>Most profitable products</CardDescription>
        </CardHeader>
        <CardContent>
          {data.byProduct.length === 0 ? (
            <div className="flex py-12 items-center justify-center text-muted-foreground">
              No product data available
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead className="text-right">Revenue</TableHead>
                  <TableHead className="text-right">Cost</TableHead>
                  <TableHead className="text-right">Profit</TableHead>
                  <TableHead className="text-right">Margin</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.byProduct.slice(0, 10).map((product) => (
                  <TableRow key={product.id}>
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(product.revenue)}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {formatCurrency(product.cost)}
                    </TableCell>
                    <TableCell
                      className={cn(
                        "text-right font-medium",
                        product.profit >= 0 ? "text-green-600" : "text-red-600"
                      )}
                    >
                      {formatCurrency(product.profit)}
                    </TableCell>
                    <TableCell
                      className={cn(
                        "text-right",
                        product.margin >= 0 ? "text-green-600" : "text-red-600"
                      )}
                    >
                      {product.margin.toFixed(1)}%
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
