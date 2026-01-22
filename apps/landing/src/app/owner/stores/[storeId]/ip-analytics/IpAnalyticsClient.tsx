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
  BarChart3,
  Globe,
  Users,
  Eye,
  RefreshCw,
  Loader2,
  Monitor,
  Smartphone,
  Tablet,
} from "lucide-react";
import { toast } from "sonner";
import { createStoreApiClient } from "@/lib/store-api-client";
import { cn } from "@/utils/cn";
import type { StaffPermission } from "@/contexts/StoreContext";

interface IpAnalyticsData {
  summary: {
    totalVisitors: number;
    uniqueVisitors: number;
    pageViews: number;
    bounceRate: number;
  };
  byCountry: Array<{
    country: string;
    visitors: number;
    percentage: number;
  }>;
  byDevice: Array<{
    device: string;
    count: number;
    percentage: number;
  }>;
  recentVisitors: Array<{
    id: string;
    ip: string;
    country: string;
    device: string;
    lastVisit: string;
    pageViews: number;
  }>;
}

interface IpAnalyticsClientProps {
  initialData: IpAnalyticsData;
  storeId: string;
  permission: StaffPermission | null;
}

const PERIODS = [
  { value: "today", label: "Today" },
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "90d", label: "Last 90 days" },
];

const DEVICE_ICONS: Record<string, any> = {
  desktop: Monitor,
  mobile: Smartphone,
  tablet: Tablet,
};

/**
 * IP Analytics Client Component
 */
export function IpAnalyticsClient({
  initialData,
  storeId,
  permission,
}: IpAnalyticsClientProps) {
  const [data, setData] = useState<IpAnalyticsData>(initialData);
  const [loading, setLoading] = useState(false);
  const [period, setPeriod] = useState("30d");

  // Refresh data
  const refreshData = async (newPeriod?: string) => {
    setLoading(true);
    const p = newPeriod || period;
    try {
      const storeApi = createStoreApiClient(storeId);
      const result = await storeApi.get(`ip-analytics?period=${p}`);
      setData({ ...data, ...(result as any) });
      if (newPeriod) setPeriod(newPeriod);
    } catch (error) {
      toast.error("Failed to refresh data");
    } finally {
      setLoading(false);
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Mask IP for privacy
  const maskIp = (ip: string) => {
    const parts = ip.split(".");
    if (parts.length === 4) {
      return `${parts[0]}.${parts[1]}.***.***`;
    }
    return ip.slice(0, 10) + "...";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">IP Analytics</h1>
          <p className="text-muted-foreground">
            Monitor visitor traffic and patterns
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
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              Total Visitors
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.summary.totalVisitors.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              Unique Visitors
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.summary.uniqueVisitors.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Eye className="h-4 w-4 text-muted-foreground" />
              Page Views
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.summary.pageViews.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
              Bounce Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.summary.bounceRate.toFixed(1)}%</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* By Country */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Visitors by Country
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.byCountry.length === 0 ? (
              <div className="flex h-40 items-center justify-center text-muted-foreground">
                No data available
              </div>
            ) : (
              <div className="space-y-3">
                {data.byCountry.slice(0, 8).map((item) => (
                  <div key={item.country} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span>{item.country}</span>
                      <span className="text-muted-foreground">
                        {item.visitors.toLocaleString()} ({item.percentage.toFixed(1)}%)
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{ width: `${item.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* By Device */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Monitor className="h-5 w-5" />
              Visitors by Device
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.byDevice.length === 0 ? (
              <div className="flex h-40 items-center justify-center text-muted-foreground">
                No data available
              </div>
            ) : (
              <div className="space-y-4">
                {data.byDevice.map((item) => {
                  const Icon = DEVICE_ICONS[item.device.toLowerCase()] || Monitor;
                  return (
                    <div key={item.device} className="flex items-center gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                        <Icon className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-medium capitalize">{item.device}</span>
                          <span className="text-muted-foreground">
                            {item.count.toLocaleString()} ({item.percentage.toFixed(1)}%)
                          </span>
                        </div>
                        <div className="mt-1 h-2 w-full rounded-full bg-muted">
                          <div
                            className="h-full rounded-full bg-primary"
                            style={{ width: `${item.percentage}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Visitors */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Visitors</CardTitle>
          <CardDescription>Latest store visitors</CardDescription>
        </CardHeader>
        <CardContent>
          {data.recentVisitors.length === 0 ? (
            <div className="flex py-12 items-center justify-center text-muted-foreground">
              No visitor data available
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>IP Address</TableHead>
                  <TableHead>Country</TableHead>
                  <TableHead>Device</TableHead>
                  <TableHead className="text-center">Page Views</TableHead>
                  <TableHead>Last Visit</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.recentVisitors.slice(0, 10).map((visitor) => {
                  const DeviceIcon = DEVICE_ICONS[visitor.device.toLowerCase()] || Monitor;
                  return (
                    <TableRow key={visitor.id}>
                      <TableCell className="font-mono text-sm">
                        {maskIp(visitor.ip)}
                      </TableCell>
                      <TableCell>{visitor.country}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <DeviceIcon className="h-4 w-4 text-muted-foreground" />
                          <span className="capitalize">{visitor.device}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">{visitor.pageViews}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDate(visitor.lastVisit)}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
