"use client";

import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Cell } from "recharts";
import { Clock, TrendingUp, Loader2, AlertCircle, Sun, Moon, Sunrise, Sunset } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { Order } from "@/lib/types";
import { apiRequest } from "@/lib/api-client";

interface OrderTimeAnalyticsProps {
  className?: string;
  orders?: Order[]; // Optional: pass orders directly to avoid fetching
}

interface TimeSlot {
  hour: number;
  label: string;
  fullLabel: string;
  orders: number;
  percentage: number;
}

type TimePeriod = "morning" | "afternoon" | "evening" | "night";

interface PeakTimeInfo {
  period: TimePeriod;
  label: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  hours: string;
}

const peakTimeMap: Record<TimePeriod, Omit<PeakTimeInfo, "period">> = {
  morning: {
    label: "Morning",
    icon: <Sunrise className='h-4 w-4' />,
    color: "text-amber-600 dark:text-amber-400",
    bgColor: "bg-amber-100 dark:bg-amber-900/40",
    hours: "6AM - 12PM",
  },
  afternoon: {
    label: "Afternoon",
    icon: <Sun className='h-4 w-4' />,
    color: "text-orange-600 dark:text-orange-400",
    bgColor: "bg-orange-100 dark:bg-orange-900/40",
    hours: "12PM - 6PM",
  },
  evening: {
    label: "Evening",
    icon: <Sunset className='h-4 w-4' />,
    color: "text-purple-600 dark:text-purple-400",
    bgColor: "bg-purple-100 dark:bg-purple-900/40",
    hours: "6PM - 10PM",
  },
  night: {
    label: "Night",
    icon: <Moon className='h-4 w-4' />,
    color: "text-blue-600 dark:text-blue-400",
    bgColor: "bg-blue-100 dark:bg-blue-900/40",
    hours: "10PM - 6AM",
  },
};

function getTimePeriod(hour: number): TimePeriod {
  if (hour >= 6 && hour < 12) return "morning";
  if (hour >= 12 && hour < 18) return "afternoon";
  if (hour >= 18 && hour < 22) return "evening";
  return "night";
}

function formatHour(hour: number): string {
  if (hour === 0) return "12AM";
  if (hour === 12) return "12PM";
  if (hour < 12) return `${hour}AM`;
  return `${hour - 12}PM`;
}

function formatHourFull(hour: number): string {
  const startHour = hour;
  const endHour = (hour + 1) % 24;

  const formatTime = (h: number): string => {
    if (h === 0) return "12:00 AM";
    if (h === 12) return "12:00 PM";
    if (h < 12) return `${h}:00 AM`;
    return `${h - 12}:00 PM`;
  };

  const formatEndTime = (h: number): string => {
    if (h === 0) return "12:00 AM";
    if (h === 12) return "12:00 PM";
    if (h < 12) return `${h}:00 AM`;
    return `${h - 12}:00 PM`;
  };

  return `${formatTime(startHour)} - ${formatEndTime(endHour)}`;
}

function getBarColor(hour: number): string {
  const period = getTimePeriod(hour);
  switch (period) {
    case "morning":
      return "hsl(38, 92%, 50%)"; // amber
    case "afternoon":
      return "hsl(25, 95%, 53%)"; // orange
    case "evening":
      return "hsl(271, 91%, 65%)"; // purple
    case "night":
      return "hsl(217, 91%, 60%)"; // blue
  }
}

export function OrderTimeAnalytics({ className, orders: propOrders }: OrderTimeAnalyticsProps) {
  const [loading, setLoading] = useState(!propOrders);
  const [error, setError] = useState<string | null>(null);
  const [fetchedOrders, setFetchedOrders] = useState<Order[]>([]);

  // Use prop orders if provided, otherwise use fetched orders
  const orders = propOrders || fetchedOrders;

  useEffect(() => {
    // Only fetch if orders are not provided via props
    if (!propOrders) {
      fetchOrders();
    }
  }, [propOrders]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const data = await apiRequest<any>("GET", "/orders?limit=500");
      setFetchedOrders(data.orders || data || []);
    } catch (err: any) {
      setError(err.message || "Failed to load order data");
    } finally {
      setLoading(false);
    }
  };

  const { hourlyData, peakHour, peakPeriod, totalOrders } = useMemo(() => {
    if (!orders.length) {
      return {
        hourlyData: [],
        peakHour: null,
        peakPeriod: null,
        totalOrders: 0,
      };
    }

    // Count orders by hour
    const hourCounts: Record<number, number> = {};
    for (let i = 0; i < 24; i++) {
      hourCounts[i] = 0;
    }

    orders.forEach((order) => {
      const orderDate = new Date(order.createdAt);
      const hour = orderDate.getHours();
      hourCounts[hour]++;
    });

    const totalOrders = orders.length;

    // Find peak hour
    let maxOrders = 0;
    let peakHourValue = 0;
    Object.entries(hourCounts).forEach(([hour, count]) => {
      if (count > maxOrders) {
        maxOrders = count;
        peakHourValue = parseInt(hour);
      }
    });

    // Create hourly data array - ensure proper sequential order (0-23)
    const hourlyData: TimeSlot[] = Array.from({ length: 24 }, (_, hour) => ({
      hour,
      label: formatHour(hour),
      fullLabel: formatHourFull(hour),
      orders: hourCounts[hour],
      percentage: totalOrders > 0 ? (hourCounts[hour] / totalOrders) * 100 : 0,
    }));

    // Calculate period totals
    const periodCounts: Record<TimePeriod, number> = {
      morning: 0,
      afternoon: 0,
      evening: 0,
      night: 0,
    };

    hourlyData.forEach((slot) => {
      const period = getTimePeriod(slot.hour);
      periodCounts[period] += slot.orders;
    });

    // Find peak period
    let maxPeriodOrders = 0;
    let peakPeriodValue: TimePeriod = "morning";
    (Object.entries(periodCounts) as [TimePeriod, number][]).forEach(([period, count]) => {
      if (count > maxPeriodOrders) {
        maxPeriodOrders = count;
        peakPeriodValue = period;
      }
    });

    return {
      hourlyData,
      peakHour: peakHourValue,
      peakPeriod: peakPeriodValue,
      totalOrders,
    };
  }, [orders]);

  const chartConfig = {
    orders: {
      label: "Orders",
      color: "hsl(var(--primary))",
    },
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Clock className='h-5 w-5' />
            Order Placement Times
          </CardTitle>
          <CardDescription>Analyzing your peak order hours...</CardDescription>
        </CardHeader>
        <CardContent className='flex items-center justify-center py-12'>
          <Loader2 className='h-8 w-8 animate-spin text-muted-foreground' />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Clock className='h-5 w-5' />
            Order Placement Times
          </CardTitle>
        </CardHeader>
        <CardContent className='flex flex-col items-center justify-center py-12 gap-2'>
          <AlertCircle className='h-8 w-8 text-destructive' />
          <p className='text-destructive text-sm'>{error}</p>
          <button onClick={fetchOrders} className='text-primary underline text-sm mt-2'>
            Try again
          </button>
        </CardContent>
      </Card>
    );
  }

  if (totalOrders === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Clock className='h-5 w-5' />
            Order Placement Times
          </CardTitle>
          <CardDescription>See when your customers place orders most often</CardDescription>
        </CardHeader>
        <CardContent className='flex flex-col items-center justify-center py-12 gap-2 text-muted-foreground'>
          <Clock className='h-12 w-12 opacity-50' />
          <p className='text-sm'>No order data available yet</p>
          <p className='text-xs'>Start receiving orders to see your peak hours</p>
        </CardContent>
      </Card>
    );
  }

  const peakInfo = peakPeriod ? peakTimeMap[peakPeriod] : null;

  return (
    <Card className={className}>
      <CardHeader className='pb-2'>
        <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3'>
          <div>
            <CardTitle className='flex items-center gap-2'>
              <Clock className='h-5 w-5' />
              Order Placement Times
            </CardTitle>
            <CardDescription>Hourly distribution of {totalOrders.toLocaleString()} orders</CardDescription>
          </div>
          {peakInfo && (
            <div className='flex items-center gap-2'>
              <Badge variant='outline' className='flex items-center gap-1.5 px-3 py-1'>
                <TrendingUp className='h-3.5 w-3.5' />
                <span className='text-xs font-medium'>Peak Time</span>
              </Badge>
              <div className={`flex items-center gap-1.5 px-3 py-1 rounded-md ${peakInfo.bgColor}`}>
                <span className={peakInfo.color}>{peakInfo.icon}</span>
                <span className={`text-sm font-medium ${peakInfo.color}`}>
                  {peakInfo.label} ({peakInfo.hours})
                </span>
              </div>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {/* Peak Hour Stats */}
        <div className='grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6'>
          {(["morning", "afternoon", "evening", "night"] as TimePeriod[]).map((period) => {
            const info = peakTimeMap[period];
            const periodOrders = hourlyData
              .filter((slot) => getTimePeriod(slot.hour) === period)
              .reduce((sum, slot) => sum + slot.orders, 0);
            const percentage = totalOrders > 0 ? (periodOrders / totalOrders) * 100 : 0;

            return (
              <div
                key={period}
                className={`p-3 rounded-lg border ${period === peakPeriod ? "ring-2 ring-primary/30 border-primary/50" : ""}`}
              >
                <div className='flex items-center gap-2 mb-1'>
                  <div className={`p-1.5 rounded-md ${info.bgColor}`}>
                    <span className={info.color}>{info.icon}</span>
                  </div>
                  <span className='text-xs font-medium text-muted-foreground'>{info.label}</span>
                </div>
                <div className='flex items-baseline gap-1'>
                  <span className='text-xl font-bold'>{periodOrders}</span>
                  <span className='text-xs text-muted-foreground'>({percentage.toFixed(1)}%)</span>
                </div>
                <p className='text-[10px] text-muted-foreground mt-0.5'>{info.hours}</p>
              </div>
            );
          })}
        </div>

        {/* Chart */}
        <ChartContainer config={chartConfig} className='h-[280px] w-full'>
          <BarChart data={hourlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray='3 3' vertical={false} stroke='hsl(var(--border))' />
            <XAxis dataKey='label' tickLine={false} axisLine={false} tick={{ fontSize: 10 }} interval={2} />
            <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 10 }} />
            <ChartTooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload as TimeSlot;
                  return (
                    <div className='rounded-lg border bg-background px-3 py-2 shadow-md'>
                      <p className='font-medium text-sm'>{data.fullLabel}</p>
                      <p className='text-muted-foreground text-xs mt-1'>
                        {data.orders} order{data.orders !== 1 ? "s" : ""} ({data.percentage.toFixed(1)}%)
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Bar dataKey='orders' radius={[4, 4, 0, 0]} maxBarSize={32}>
              {hourlyData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getBarColor(entry.hour)} />
              ))}
            </Bar>
          </BarChart>
        </ChartContainer>

        {/* Legend */}
        <div className='flex flex-wrap items-center justify-center gap-4 mt-4 pt-4 border-t'>
          {(["morning", "afternoon", "evening", "night"] as TimePeriod[]).map((period) => {
            const info = peakTimeMap[period];
            return (
              <div key={period} className='flex items-center gap-1.5'>
                <div
                  className='w-3 h-3 rounded-sm'
                  style={{
                    backgroundColor: getBarColor(period === "morning" ? 9 : period === "afternoon" ? 14 : period === "evening" ? 20 : 2),
                  }}
                />
                <span className='text-xs text-muted-foreground'>{info.label}</span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
