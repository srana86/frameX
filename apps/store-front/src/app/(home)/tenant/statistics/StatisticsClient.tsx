"use client";

import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useCurrencySymbol } from "@/hooks/use-currency";
import { toast } from "sonner";
import {
  DollarSign,
  ShoppingBag,
  Users,
  CreditCard,
  Package,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Calendar,
  BarChart3,
  Tag,
  Layers,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  Truck,
} from "lucide-react";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts";
import { format } from "date-fns";
import { apiRequest } from "@/lib/api-client";

interface StatisticsData {
  orders: {
    total: number;
    byStatus: {
      pending: number;
      processing: number;
      shipped: number;
      delivered: number;
      cancelled: number;
    };
    today: number;
    last7Days: number;
    last30Days: number;
    thisMonth: number;
    lastMonth: number;
    growth: number;
  };
  revenue: {
    total: number;
    paid: number;
    pending: number;
    today: number;
    last7Days: number;
    last30Days: number;
    thisMonth: number;
    lastMonth: number;
    avgOrderValue: number;
    growth: number;
    daily: { date: string; revenue: number; orders: number }[];
  };
  payments: {
    total: number;
    successful: number;
    failed: number;
    successRate: number;
    totalAmount: number;
    today: number;
    last7Days: number;
    last30Days: number;
    methods: {
      cod: number;
      online: number;
    };
  };
  customers: {
    total: number;
    newLast30Days: number;
    repeat: number;
    retentionRate: number;
    avgOrdersPerCustomer: number;
  };
  products: {
    total: number;
    categories: number;
    avgPrice: number;
    withImages: number;
  };
  categories: {
    total: number;
    avgOrder: number;
  };
  inventory: {
    totalStock: number;
    lowStockItems: number;
    outOfStockItems: number;
    lowStockThreshold: number;
  };
  orderTypes: {
    online: number;
    offline: number;
  };
}

interface StatisticsClientProps {
  initialData: StatisticsData;
}

export function StatisticsClient({ initialData }: StatisticsClientProps) {
  const currencySymbol = useCurrencySymbol();
  const [data, setData] = useState<StatisticsData>(initialData);
  const [loading, setLoading] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const newData = await apiRequest<StatisticsData>("GET", "/statistics");
      setData(newData);
      toast.success("Statistics updated");
    } catch (error: any) {
      toast.error(error?.message || "Failed to load statistics");
    } finally {
      setLoading(false);
    }
  };

  const chartData = useMemo(() => {
    return data.revenue.daily.map((item) => ({
      date: format(new Date(item.date), "MMM dd"),
      revenue: parseFloat(item.revenue.toFixed(2)),
      orders: item.orders,
    }));
  }, [data.revenue.daily]);

  const chartConfig = {
    revenue: {
      label: "Revenue",
      color: "rgb(5, 150, 105)",
    },
    orders: {
      label: "Orders",
      color: "rgb(59, 130, 246)",
    },
  };

  return (
    <div className='w-full space-y-6 mt-4'>
      {/* Header */}
      <div className='flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4'>
        <div>
          <h1 className='text-3xl font-bold tracking-tight'>Statistics & Analytics</h1>
          <p className='text-muted-foreground mt-1'>Comprehensive overview of your store's performance</p>
        </div>
        <Button onClick={loadData} variant='outline' size='sm' className='shrink-0' disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Revenue & Orders Overview */}
      <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
        {/* Total Revenue */}
        <div className='group relative flex flex-row items-center justify-between p-6 rounded-xl border-2 border-emerald-200/50 bg-gradient-to-r from-emerald-50/80 to-emerald-100/40 dark:from-emerald-950/20 dark:to-emerald-900/10 dark:border-emerald-800/30 transition-all duration-300 hover:shadow-lg hover:border-emerald-300 dark:hover:border-emerald-700/50'>
          <div className='flex flex-row items-center gap-4'>
            <div className='p-3 rounded-xl bg-emerald-100/80 dark:bg-emerald-900/40 shadow-sm'>
              <DollarSign className='h-6 w-6 text-emerald-600 dark:text-emerald-400' />
            </div>
            <div className='flex flex-col'>
              <span className='text-xs font-semibold text-emerald-700/70 dark:text-emerald-300/70 uppercase tracking-wide mb-1'>
                Total Revenue
              </span>
              <div className='text-2xl font-bold text-emerald-700 dark:text-emerald-300'>
                {currencySymbol}
                {data.revenue.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div className='flex items-center gap-1.5 mt-2'>
                {data.revenue.growth >= 0 ? (
                  <TrendingUp className='h-4 w-4 text-green-600 dark:text-green-400' />
                ) : (
                  <TrendingDown className='h-4 w-4 text-red-600 dark:text-red-400' />
                )}
                <span
                  className={`text-sm font-semibold ${data.revenue.growth >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
                    }`}
                >
                  {data.revenue.growth >= 0 ? "+" : ""}
                  {data.revenue.growth.toFixed(1)}%
                </span>
              </div>
            </div>
          </div>
          <div className='absolute right-2 top-2 opacity-10 group-hover:opacity-20 transition-opacity'>
            <DollarSign className='h-16 w-16 text-emerald-600 dark:text-emerald-400' />
          </div>
        </div>

        {/* Total Orders */}
        <div className='group relative flex flex-row items-center justify-between p-6 rounded-xl border-2 border-blue-200/50 bg-gradient-to-r from-blue-50/80 to-blue-100/40 dark:from-blue-950/20 dark:to-blue-900/10 dark:border-blue-800/30 transition-all duration-300 hover:shadow-lg hover:border-blue-300 dark:hover:border-blue-700/50'>
          <div className='flex flex-row items-center gap-4'>
            <div className='p-3 rounded-xl bg-blue-100/80 dark:bg-blue-900/40 shadow-sm'>
              <ShoppingBag className='h-6 w-6 text-blue-600 dark:text-blue-400' />
            </div>
            <div className='flex flex-col'>
              <span className='text-xs font-semibold text-blue-700/70 dark:text-blue-300/70 uppercase tracking-wide mb-1'>
                Total Orders
              </span>
              <div className='text-2xl font-bold text-blue-700 dark:text-blue-300'>{data.orders.total.toLocaleString()}</div>
              <div className='flex items-center gap-1.5 mt-2'>
                {data.orders.growth >= 0 ? (
                  <TrendingUp className='h-4 w-4 text-green-600 dark:text-green-400' />
                ) : (
                  <TrendingDown className='h-4 w-4 text-red-600 dark:text-red-400' />
                )}
                <span
                  className={`text-sm font-semibold ${data.orders.growth >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
                    }`}
                >
                  {data.orders.growth >= 0 ? "+" : ""}
                  {data.orders.growth.toFixed(1)}%
                </span>
              </div>
            </div>
          </div>
          <div className='absolute right-2 top-2 opacity-10 group-hover:opacity-20 transition-opacity'>
            <ShoppingBag className='h-16 w-16 text-blue-600 dark:text-blue-400' />
          </div>
        </div>

        {/* Total Customers */}
        <div className='group relative flex flex-row items-center justify-between p-6 rounded-xl border-2 border-purple-200/50 bg-gradient-to-r from-purple-50/80 to-purple-100/40 dark:from-purple-950/20 dark:to-purple-900/10 dark:border-purple-800/30 transition-all duration-300 hover:shadow-lg hover:border-purple-300 dark:hover:border-purple-700/50'>
          <div className='flex flex-row items-center gap-4'>
            <div className='p-3 rounded-xl bg-purple-100/80 dark:bg-purple-900/40 shadow-sm'>
              <Users className='h-6 w-6 text-purple-600 dark:text-purple-400' />
            </div>
            <div className='flex flex-col'>
              <span className='text-xs font-semibold text-purple-700/70 dark:text-purple-300/70 uppercase tracking-wide mb-1'>
                Total Customers
              </span>
              <div className='text-2xl font-bold text-purple-700 dark:text-purple-300'>{data.customers.total.toLocaleString()}</div>
              <p className='text-xs text-purple-600/70 dark:text-purple-400/70 mt-1'>
                {data.customers.repeat} repeat ({data.customers.retentionRate.toFixed(1)}%)
              </p>
            </div>
          </div>
          <div className='absolute right-2 top-2 opacity-10 group-hover:opacity-20 transition-opacity'>
            <Users className='h-16 w-16 text-purple-600 dark:text-purple-400' />
          </div>
        </div>

        {/* Avg Order Value */}
        <div className='group relative flex flex-row items-center justify-between p-6 rounded-xl border-2 border-orange-200/50 bg-gradient-to-r from-orange-50/80 to-orange-100/40 dark:from-orange-950/20 dark:to-orange-900/10 dark:border-orange-800/30 transition-all duration-300 hover:shadow-lg hover:border-orange-300 dark:hover:border-orange-700/50'>
          <div className='flex flex-row items-center gap-4'>
            <div className='p-3 rounded-xl bg-orange-100/80 dark:bg-orange-900/40 shadow-sm'>
              <BarChart3 className='h-6 w-6 text-orange-600 dark:text-orange-400' />
            </div>
            <div className='flex flex-col'>
              <span className='text-xs font-semibold text-orange-700/70 dark:text-orange-300/70 uppercase tracking-wide mb-1'>
                Avg Order Value
              </span>
              <div className='text-2xl font-bold text-orange-700 dark:text-orange-300'>
                {currencySymbol}
                {data.revenue.avgOrderValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <p className='text-xs text-orange-600/70 dark:text-orange-400/70 mt-1'>Per order average</p>
            </div>
          </div>
          <div className='absolute right-2 top-2 opacity-10 group-hover:opacity-20 transition-opacity'>
            <BarChart3 className='h-16 w-16 text-orange-600 dark:text-orange-400' />
          </div>
        </div>
      </div>

      {/* Revenue Chart */}
      <Card className='shadow-sm border-2'>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <TrendingUp className='h-5 w-5 text-emerald-600' />
            Revenue Trend (Last 30 Days)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className='h-[300px] w-full'>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id='colorRevenue' x1='0' y1='0' x2='0' y2='1'>
                  <stop offset='5%' stopColor='rgb(5, 150, 105)' stopOpacity={0.9} />
                  <stop offset='50%' stopColor='rgb(5, 150, 105)' stopOpacity={0.5} />
                  <stop offset='95%' stopColor='rgb(5, 150, 105)' stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray='3 3' className='stroke-slate-200 dark:stroke-slate-800' />
              <XAxis dataKey='date' className='text-xs text-slate-600 dark:text-slate-400' />
              <YAxis className='text-xs text-slate-600 dark:text-slate-400' />
              <ChartTooltip content={<ChartTooltipContent className='rounded-lg border bg-white dark:bg-slate-900 shadow-lg' />} />
              <Area type='monotone' dataKey='revenue' stroke='rgb(5, 150, 105)' strokeWidth={3} fill='url(#colorRevenue)' />
            </AreaChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Additional Stats Grid */}
      <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
        {/* Payments Success Rate */}
        <div className='group relative flex flex-row items-center justify-between p-6 rounded-xl border-2 border-green-200/50 bg-gradient-to-r from-green-50/80 to-green-100/40 dark:from-green-950/20 dark:to-green-900/10 dark:border-green-800/30 transition-all duration-300 hover:shadow-lg hover:border-green-300 dark:hover:border-green-700/50'>
          <div className='flex flex-row items-center gap-4'>
            <div className='p-3 rounded-xl bg-green-100/80 dark:bg-green-900/40 shadow-sm'>
              <CheckCircle2 className='h-6 w-6 text-green-600 dark:text-green-400' />
            </div>
            <div className='flex flex-col'>
              <span className='text-xs font-semibold text-green-700/70 dark:text-green-300/70 uppercase tracking-wide mb-1'>
                Payment Success
              </span>
              <div className='text-2xl font-bold text-green-700 dark:text-green-300'>{data.payments.successRate.toFixed(1)}%</div>
              <p className='text-xs text-green-600/70 dark:text-green-400/70 mt-1'>
                {data.payments.successful}/{data.payments.total} successful
              </p>
            </div>
          </div>
          <div className='absolute right-2 top-2 opacity-10 group-hover:opacity-20 transition-opacity'>
            <CheckCircle2 className='h-16 w-16 text-green-600 dark:text-green-400' />
          </div>
        </div>

        {/* Products */}
        <div className='group relative flex flex-row items-center justify-between p-6 rounded-xl border-2 border-cyan-200/50 bg-gradient-to-r from-cyan-50/80 to-cyan-100/40 dark:from-cyan-950/20 dark:to-cyan-900/10 dark:border-cyan-800/30 transition-all duration-300 hover:shadow-lg hover:border-cyan-300 dark:hover:border-cyan-700/50'>
          <div className='flex flex-row items-center gap-4'>
            <div className='p-3 rounded-xl bg-cyan-100/80 dark:bg-cyan-900/40 shadow-sm'>
              <Package className='h-6 w-6 text-cyan-600 dark:text-cyan-400' />
            </div>
            <div className='flex flex-col'>
              <span className='text-xs font-semibold text-cyan-700/70 dark:text-cyan-300/70 uppercase tracking-wide mb-1'>
                Total Products
              </span>
              <div className='text-2xl font-bold text-cyan-700 dark:text-cyan-300'>{data.products.total.toLocaleString()}</div>
              <p className='text-xs text-cyan-600/70 dark:text-cyan-400/70 mt-1'>{data.products.categories} categories</p>
            </div>
          </div>
          <div className='absolute right-2 top-2 opacity-10 group-hover:opacity-20 transition-opacity'>
            <Package className='h-16 w-16 text-cyan-600 dark:text-cyan-400' />
          </div>
        </div>

        {/* Inventory Status */}
        <div className='group relative flex flex-row items-center justify-between p-6 rounded-xl border-2 border-pink-200/50 bg-gradient-to-r from-pink-50/80 to-pink-100/40 dark:from-pink-950/20 dark:to-pink-900/10 dark:border-pink-800/30 transition-all duration-300 hover:shadow-lg hover:border-pink-300 dark:hover:border-pink-700/50'>
          <div className='flex flex-row items-center gap-4'>
            <div className='p-3 rounded-xl bg-pink-100/80 dark:bg-pink-900/40 shadow-sm'>
              <Layers className='h-6 w-6 text-pink-600 dark:text-pink-400' />
            </div>
            <div className='flex flex-col'>
              <span className='text-xs font-semibold text-pink-700/70 dark:text-pink-300/70 uppercase tracking-wide mb-1'>Total Stock</span>
              <div className='text-2xl font-bold text-pink-700 dark:text-pink-300'>{data.inventory.totalStock.toLocaleString()}</div>
              <p className='text-xs text-pink-600/70 dark:text-pink-400/70 mt-1'>
                {data.inventory.lowStockItems} low, {data.inventory.outOfStockItems} out
              </p>
            </div>
          </div>
          <div className='absolute right-2 top-2 opacity-10 group-hover:opacity-20 transition-opacity'>
            <Layers className='h-16 w-16 text-pink-600 dark:text-pink-400' />
          </div>
        </div>

        {/* Paid Revenue */}
        <div className='group relative flex flex-row items-center justify-between p-6 rounded-xl border-2 border-indigo-200/50 bg-gradient-to-r from-indigo-50/80 to-indigo-100/40 dark:from-indigo-950/20 dark:to-indigo-900/10 dark:border-indigo-800/30 transition-all duration-300 hover:shadow-lg hover:border-indigo-300 dark:hover:border-indigo-700/50'>
          <div className='flex flex-row items-center gap-4'>
            <div className='p-3 rounded-xl bg-indigo-100/80 dark:bg-indigo-900/40 shadow-sm'>
              <CreditCard className='h-6 w-6 text-indigo-600 dark:text-indigo-400' />
            </div>
            <div className='flex flex-col'>
              <span className='text-xs font-semibold text-indigo-700/70 dark:text-indigo-300/70 uppercase tracking-wide mb-1'>
                Paid Revenue
              </span>
              <div className='text-2xl font-bold text-indigo-700 dark:text-indigo-300'>
                {currencySymbol}
                {data.revenue.paid.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <p className='text-xs text-indigo-600/70 dark:text-indigo-400/70 mt-1'>
                {currencySymbol}
                {data.revenue.pending.toFixed(2)} pending
              </p>
            </div>
          </div>
          <div className='absolute right-2 top-2 opacity-10 group-hover:opacity-20 transition-opacity'>
            <CreditCard className='h-16 w-16 text-indigo-600 dark:text-indigo-400' />
          </div>
        </div>
      </div>

      {/* Orders by Status */}
      <Card className='shadow-sm border-2'>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <BarChart3 className='h-5 w-5 text-blue-600' />
            Orders by Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='grid gap-4 md:grid-cols-5'>
            <div className='group relative flex flex-row items-center justify-between p-5 rounded-xl border-2 border-yellow-200/50 bg-gradient-to-r from-yellow-50/80 to-yellow-100/40 dark:from-yellow-950/20 dark:to-yellow-900/10 dark:border-yellow-800/30'>
              <div className='flex flex-row items-center gap-3'>
                <div className='p-2.5 rounded-lg bg-yellow-100/60 dark:bg-yellow-900/30'>
                  <Clock className='h-6 w-6 text-yellow-600 dark:text-yellow-400' />
                </div>
                <div className='flex flex-col'>
                  <div className='text-2xl font-bold text-yellow-700 dark:text-yellow-300'>{data.orders.byStatus.pending}</div>
                  <span className='text-xs font-semibold text-yellow-700/70 dark:text-yellow-300/70 uppercase tracking-wide'>Pending</span>
                </div>
              </div>
            </div>

            <div className='group relative flex flex-row items-center justify-between p-5 rounded-xl border-2 border-blue-200/50 bg-gradient-to-r from-blue-50/80 to-blue-100/40 dark:from-blue-950/20 dark:to-blue-900/10 dark:border-blue-800/30'>
              <div className='flex flex-row items-center gap-3'>
                <div className='p-2.5 rounded-lg bg-blue-100/60 dark:bg-blue-900/30'>
                  <Package className='h-6 w-6 text-blue-600 dark:text-blue-400' />
                </div>
                <div className='flex flex-col'>
                  <div className='text-2xl font-bold text-blue-700 dark:text-blue-300'>{data.orders.byStatus.processing}</div>
                  <span className='text-xs font-semibold text-blue-700/70 dark:text-blue-300/70 uppercase tracking-wide'>Processing</span>
                </div>
              </div>
            </div>

            <div className='group relative flex flex-row items-center justify-between p-5 rounded-xl border-2 border-purple-200/50 bg-gradient-to-r from-purple-50/80 to-purple-100/40 dark:from-purple-950/20 dark:to-purple-900/10 dark:border-purple-800/30'>
              <div className='flex flex-row items-center gap-3'>
                <div className='p-2.5 rounded-lg bg-purple-100/60 dark:bg-purple-900/30'>
                  <Truck className='h-6 w-6 text-purple-600 dark:text-purple-400' />
                </div>
                <div className='flex flex-col'>
                  <div className='text-2xl font-bold text-purple-700 dark:text-purple-300'>{data.orders.byStatus.shipped}</div>
                  <span className='text-xs font-semibold text-purple-700/70 dark:text-purple-300/70 uppercase tracking-wide'>Shipped</span>
                </div>
              </div>
            </div>

            <div className='group relative flex flex-row items-center justify-between p-5 rounded-xl border-2 border-green-200/50 bg-gradient-to-r from-green-50/80 to-green-100/40 dark:from-green-950/20 dark:to-green-900/10 dark:border-green-800/30'>
              <div className='flex flex-row items-center gap-3'>
                <div className='p-2.5 rounded-lg bg-green-100/60 dark:bg-green-900/30'>
                  <CheckCircle2 className='h-6 w-6 text-green-600 dark:text-green-400' />
                </div>
                <div className='flex flex-col'>
                  <div className='text-2xl font-bold text-green-700 dark:text-green-300'>{data.orders.byStatus.delivered}</div>
                  <span className='text-xs font-semibold text-green-700/70 dark:text-green-300/70 uppercase tracking-wide'>Delivered</span>
                </div>
              </div>
            </div>

            <div className='group relative flex flex-row items-center justify-between p-5 rounded-xl border-2 border-red-200/50 bg-gradient-to-r from-red-50/80 to-red-100/40 dark:from-red-950/20 dark:to-red-900/10 dark:border-red-800/30'>
              <div className='flex flex-row items-center gap-3'>
                <div className='p-2.5 rounded-lg bg-red-100/60 dark:bg-red-900/30'>
                  <XCircle className='h-6 w-6 text-red-600 dark:text-red-400' />
                </div>
                <div className='flex flex-col'>
                  <div className='text-2xl font-bold text-red-700 dark:text-red-300'>{data.orders.byStatus.cancelled}</div>
                  <span className='text-xs font-semibold text-red-700/70 dark:text-red-300/70 uppercase tracking-wide'>Cancelled</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Time Period Stats */}
      <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
        <Card className='shadow-sm border-2'>
          <CardHeader className='pb-3'>
            <CardTitle className='text-sm font-medium flex items-center gap-2'>
              <Calendar className='h-4 w-4' />
              Today
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='space-y-2'>
              <div className='flex justify-between'>
                <span className='text-sm text-muted-foreground'>Orders</span>
                <span className='font-bold'>{data.orders.today}</span>
              </div>
              <div className='flex justify-between'>
                <span className='text-sm text-muted-foreground'>Revenue</span>
                <span className='font-bold'>
                  {currencySymbol}
                  {data.revenue.today.toFixed(2)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className='shadow-sm border-2'>
          <CardHeader className='pb-3'>
            <CardTitle className='text-sm font-medium flex items-center gap-2'>
              <Calendar className='h-4 w-4' />
              Last 7 Days
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='space-y-2'>
              <div className='flex justify-between'>
                <span className='text-sm text-muted-foreground'>Orders</span>
                <span className='font-bold'>{data.orders.last7Days}</span>
              </div>
              <div className='flex justify-between'>
                <span className='text-sm text-muted-foreground'>Revenue</span>
                <span className='font-bold'>
                  {currencySymbol}
                  {data.revenue.last7Days.toFixed(2)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className='shadow-sm border-2'>
          <CardHeader className='pb-3'>
            <CardTitle className='text-sm font-medium flex items-center gap-2'>
              <Calendar className='h-4 w-4' />
              Last 30 Days
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='space-y-2'>
              <div className='flex justify-between'>
                <span className='text-sm text-muted-foreground'>Orders</span>
                <span className='font-bold'>{data.orders.last30Days}</span>
              </div>
              <div className='flex justify-between'>
                <span className='text-sm text-muted-foreground'>Revenue</span>
                <span className='font-bold'>
                  {currencySymbol}
                  {data.revenue.last30Days.toFixed(2)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className='shadow-sm border-2'>
          <CardHeader className='pb-3'>
            <CardTitle className='text-sm font-medium flex items-center gap-2'>
              <Calendar className='h-4 w-4' />
              This Month
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='space-y-2'>
              <div className='flex justify-between'>
                <span className='text-sm text-muted-foreground'>Orders</span>
                <span className='font-bold'>{data.orders.thisMonth}</span>
              </div>
              <div className='flex justify-between'>
                <span className='text-sm text-muted-foreground'>Revenue</span>
                <span className='font-bold'>
                  {currencySymbol}
                  {data.revenue.thisMonth.toFixed(2)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
