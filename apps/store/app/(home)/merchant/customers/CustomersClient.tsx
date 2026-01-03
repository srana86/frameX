"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { useCurrencySymbol } from "@/hooks/use-currency";
import { Pagination } from "@/components/shared/Pagination";
import {
  Users,
  UserPlus,
  Repeat,
  DollarSign,
  ShoppingCart,
  TrendingUp,
  Search,
  RefreshCw,
  Mail,
  Phone,
  MapPin,
  Calendar,
} from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { getCustomers, type Customer, type CustomerStats } from "./actions";

type PaginationData = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
};

export function CustomersClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currencySymbol = useCurrencySymbol();

  // Get initial values from URL or use defaults
  const initialPage = parseInt(searchParams.get("page") || "1", 10);
  const initialLimit = parseInt(searchParams.get("limit") || "30", 10);
  const initialSearch = searchParams.get("search") || "";

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [stats, setStats] = useState<CustomerStats | null>(null);
  const [pagination, setPagination] = useState<PaginationData>({
    page: 1,
    limit: 30,
    total: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPrevPage: false,
  });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [limit, setLimit] = useState(initialLimit);
  const [searchInput, setSearchInput] = useState(initialSearch); // Separate state for input to allow debouncing

  // Update URL when filters change
  const updateURL = useCallback(
    (updates: { page?: number; limit?: number; search?: string }) => {
      const params = new URLSearchParams(searchParams.toString());

      if (updates.page !== undefined) {
        if (updates.page === 1) {
          params.delete("page");
        } else {
          params.set("page", updates.page.toString());
        }
      }

      if (updates.limit !== undefined) {
        if (updates.limit === 30) {
          params.delete("limit");
        } else {
          params.set("limit", updates.limit.toString());
        }
      }

      if (updates.search !== undefined) {
        if (updates.search === "") {
          params.delete("search");
        } else {
          params.set("search", updates.search);
        }
      }

      router.replace(`?${params.toString()}`, { scroll: false });
    },
    [searchParams, router]
  );

  const loadData = useCallback(async (page: number = 1, pageLimit: number = 30, search: string = "") => {
    try {
      setLoading(true);
      const data = await getCustomers(page, pageLimit, search.trim() || undefined);
      setCustomers(data.customers);
      setStats(data.stats);
      setPagination(data.pagination);
    } catch (error: any) {
      console.error("Failed to load customers:", error);
      toast.error(error?.message || "Failed to load customers");
    } finally {
      setLoading(false);
    }
  }, []);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== searchQuery) {
        setSearchQuery(searchInput);
        setCurrentPage(1);
        updateURL({ search: searchInput, page: 1 });
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchInput, searchQuery, updateURL]);

  // Sync URL params when they change (e.g., browser back/forward)
  useEffect(() => {
    const urlPage = parseInt(searchParams.get("page") || "1", 10);
    const urlLimit = parseInt(searchParams.get("limit") || "30", 10);
    const urlSearch = searchParams.get("search") || "";

    if (urlPage !== currentPage) setCurrentPage(urlPage);
    if (urlLimit !== limit) setLimit(urlLimit);
    if (urlSearch !== searchQuery) {
      setSearchQuery(urlSearch);
      setSearchInput(urlSearch);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]); // Sync when URL params change

  useEffect(() => {
    loadData(currentPage, limit, searchQuery);
  }, [currentPage, limit, searchQuery, loadData]);

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    updateURL({ page: newPage });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleLimitChange = (newLimit: number) => {
    setLimit(newLimit);
    setCurrentPage(1);
    updateURL({ limit: newLimit, page: 1 });
  };

  const handleSearchChange = (value: string) => {
    setSearchInput(value); // Update input immediately for better UX
    // URL update and search query update will happen via debounce effect
  };

  const handleRefresh = () => {
    loadData(currentPage, limit, searchQuery);
  };

  const getCustomerTypeBadge = (customer: Customer) => {
    if (customer.totalOrders === 1) {
      return (
        <Badge variant='outline' className='text-xs'>
          New
        </Badge>
      );
    }
    if (customer.totalOrders >= 5) {
      return <Badge className='bg-purple-500 text-white border-purple-500 text-xs'>VIP</Badge>;
    }
    return <Badge className='bg-green-500 text-white border-green-500 text-xs'>Repeat</Badge>;
  };

  return (
    <div className='w-full space-y-4 sm:space-y-6 my-4'>
      {/* Header */}
      <div className='flex flex-row items-center justify-between gap-3 sm:gap-4'>
        <div>
          <h1 className='text-xl sm:text-2xl md:text-3xl font-bold tracking-tight'>Customers</h1>
          <p className='text-sm sm:text-base text-muted-foreground mt-1'>Manage and view customer information</p>
        </div>
        <Button onClick={handleRefresh} variant='outline' size='sm' className='shrink-0 h-9 sm:h-10'>
          <RefreshCw className='h-4 w-4 md:mr-2' />
          <span className='hidden sm:inline'>Refresh</span>
        </Button>
      </div>

      {/* Stats Cards */}
      {loading && !stats ? (
        <>
          <div className='grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'>
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className='group relative flex flex-row items-center justify-between p-4 sm:p-6 rounded-xl border-2 border-slate-200/50 dark:border-slate-800/30 bg-slate-50/50 dark:bg-slate-900/20'
              >
                <div className='flex flex-row items-center gap-3 sm:gap-4'>
                  <Skeleton className='h-10 w-10 sm:h-12 sm:w-12 rounded-xl' />
                  <div className='flex flex-col gap-2'>
                    <Skeleton className='h-3 w-20 sm:w-24' />
                    <Skeleton className='h-6 w-16 sm:h-8 sm:w-20' />
                    <Skeleton className='h-3 w-16 sm:w-20' />
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className='grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'>
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className='group relative flex flex-row items-center justify-between p-4 sm:p-6 rounded-xl border-2 border-slate-200/50 dark:border-slate-800/30 bg-slate-50/50 dark:bg-slate-900/20'
              >
                <div className='flex flex-row items-center gap-3 sm:gap-4'>
                  <Skeleton className='h-10 w-10 sm:h-12 sm:w-12 rounded-xl' />
                  <div className='flex flex-col gap-2'>
                    <Skeleton className='h-3 w-20 sm:w-24' />
                    <Skeleton className='h-6 w-16 sm:h-8 sm:w-20' />
                    <Skeleton className='h-3 w-16 sm:w-20' />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      ) : stats ? (
        <>
          <div className='grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'>
            {/* Total Customers */}
            <div className='group relative flex flex-row items-center justify-between p-4 sm:p-6 rounded-xl border-2 border-blue-200/50 bg-gradient-to-r from-blue-50/80 to-blue-100/40 dark:from-blue-950/20 dark:to-blue-900/10 dark:border-blue-800/30 transition-all duration-300 hover:shadow-lg hover:border-blue-300 dark:hover:border-blue-700/50'>
              <div className='flex flex-row items-center gap-3 sm:gap-4'>
                <div className='p-2 sm:p-3 rounded-xl bg-blue-100/80 dark:bg-blue-900/40 shadow-sm'>
                  <Users className='h-5 w-5 sm:h-6 sm:w-6 text-blue-600 dark:text-blue-400' />
                </div>
                <div className='flex flex-col'>
                  <span className='text-[10px] sm:text-xs font-semibold text-blue-700/70 dark:text-blue-300/70 uppercase tracking-wide mb-1'>
                    Total Customers
                  </span>
                  <div className='text-xl sm:text-2xl font-bold text-blue-700 dark:text-blue-300'>
                    {stats.totalCustomers.toLocaleString()}
                  </div>
                  <p className='text-[10px] sm:text-xs text-blue-600/70 dark:text-blue-400/70 mt-1'>All customers</p>
                </div>
              </div>
              <div className='absolute right-2 top-2 opacity-10 group-hover:opacity-20 transition-opacity hidden sm:block'>
                <Users className='h-12 w-12 sm:h-16 sm:w-16 text-blue-600 dark:text-blue-400' />
              </div>
            </div>

            {/* New Customers */}
            <div className='group relative flex flex-row items-center justify-between p-4 sm:p-6 rounded-xl border-2 border-green-200/50 bg-gradient-to-r from-green-50/80 to-green-100/40 dark:from-green-950/20 dark:to-green-900/10 dark:border-green-800/30 transition-all duration-300 hover:shadow-lg hover:border-green-300 dark:hover:border-green-700/50'>
              <div className='flex flex-row items-center gap-3 sm:gap-4'>
                <div className='p-2 sm:p-3 rounded-xl bg-green-100/80 dark:bg-green-900/40 shadow-sm'>
                  <UserPlus className='h-5 w-5 sm:h-6 sm:w-6 text-green-600 dark:text-green-400' />
                </div>
                <div className='flex flex-col'>
                  <span className='text-[10px] sm:text-xs font-semibold text-green-700/70 dark:text-green-300/70 uppercase tracking-wide mb-1'>
                    New Customers
                  </span>
                  <div className='text-xl sm:text-2xl font-bold text-green-700 dark:text-green-300'>
                    {stats.newCustomersLast30Days.toLocaleString()}
                  </div>
                  <p className='text-[10px] sm:text-xs text-green-600/70 dark:text-green-400/70 mt-1'>Last 30 days</p>
                </div>
              </div>
              <div className='absolute right-2 top-2 opacity-10 group-hover:opacity-20 transition-opacity hidden sm:block'>
                <UserPlus className='h-12 w-12 sm:h-16 sm:w-16 text-green-600 dark:text-green-400' />
              </div>
            </div>

            {/* Repeat Customers */}
            <div className='group relative flex flex-row items-center justify-between p-4 sm:p-6 rounded-xl border-2 border-orange-200/50 bg-gradient-to-r from-orange-50/80 to-orange-100/40 dark:from-orange-950/20 dark:to-orange-900/10 dark:border-orange-800/30 transition-all duration-300 hover:shadow-lg hover:border-orange-300 dark:hover:border-orange-700/50'>
              <div className='flex flex-row items-center gap-3 sm:gap-4'>
                <div className='p-2 sm:p-3 rounded-xl bg-orange-100/80 dark:bg-orange-900/40 shadow-sm'>
                  <Repeat className='h-5 w-5 sm:h-6 sm:w-6 text-orange-600 dark:text-orange-400' />
                </div>
                <div className='flex flex-col'>
                  <span className='text-[10px] sm:text-xs font-semibold text-orange-700/70 dark:text-orange-300/70 uppercase tracking-wide mb-1'>
                    Repeat Customers
                  </span>
                  <div className='text-xl sm:text-2xl font-bold text-orange-700 dark:text-orange-300'>
                    {stats.repeatCustomers.toLocaleString()}
                  </div>
                  <p className='text-[10px] sm:text-xs text-orange-600/70 dark:text-orange-400/70 mt-1'>Multiple orders</p>
                </div>
              </div>
              <div className='absolute right-2 top-2 opacity-10 group-hover:opacity-20 transition-opacity hidden sm:block'>
                <Repeat className='h-12 w-12 sm:h-16 sm:w-16 text-orange-600 dark:text-orange-400' />
              </div>
            </div>

            {/* Total Revenue */}
            <div className='group relative flex flex-row items-center justify-between p-4 sm:p-6 rounded-xl border-2 border-purple-200/50 bg-gradient-to-r from-purple-50/80 to-purple-100/40 dark:from-purple-950/20 dark:to-purple-900/10 dark:border-purple-800/30 transition-all duration-300 hover:shadow-lg hover:border-purple-300 dark:hover:border-purple-700/50'>
              <div className='flex flex-row items-center gap-3 sm:gap-4'>
                <div className='p-2 sm:p-3 rounded-xl bg-purple-100/80 dark:bg-purple-900/40 shadow-sm'>
                  <DollarSign className='h-5 w-5 sm:h-6 sm:w-6 text-purple-600 dark:text-purple-400' />
                </div>
                <div className='flex flex-col'>
                  <span className='text-[10px] sm:text-xs font-semibold text-purple-700/70 dark:text-purple-300/70 uppercase tracking-wide mb-1'>
                    Total Revenue
                  </span>
                  <div className='text-lg sm:text-xl md:text-2xl font-bold text-purple-700 dark:text-purple-300'>
                    {currencySymbol}
                    {stats.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                  <p className='text-[10px] sm:text-xs text-purple-600/70 dark:text-purple-400/70 mt-1'>From all customers</p>
                </div>
              </div>
              <div className='absolute right-2 top-2 opacity-10 group-hover:opacity-20 transition-opacity hidden sm:block'>
                <DollarSign className='h-12 w-12 sm:h-16 sm:w-16 text-purple-600 dark:text-purple-400' />
              </div>
            </div>
          </div>

          {/* Additional Stats */}
          <div className='grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'>
            {/* Avg Orders/Customer */}
            <div className='group relative flex flex-row items-center justify-between p-4 sm:p-6 rounded-xl border-2 border-cyan-200/50 bg-gradient-to-r from-cyan-50/80 to-cyan-100/40 dark:from-cyan-950/20 dark:to-cyan-900/10 dark:border-cyan-800/30 transition-all duration-300 hover:shadow-lg hover:border-cyan-300 dark:hover:border-cyan-700/50'>
              <div className='flex flex-row items-center gap-3 sm:gap-4'>
                <div className='p-2 sm:p-3 rounded-xl bg-cyan-100/80 dark:bg-cyan-900/40 shadow-sm'>
                  <ShoppingCart className='h-5 w-5 sm:h-6 sm:w-6 text-cyan-600 dark:text-cyan-400' />
                </div>
                <div className='flex flex-col'>
                  <span className='text-[10px] sm:text-xs font-semibold text-cyan-700/70 dark:text-cyan-300/70 uppercase tracking-wide mb-1'>
                    Avg Orders/Customer
                  </span>
                  <div className='text-xl sm:text-2xl font-bold text-cyan-700 dark:text-cyan-300'>
                    {stats.averageOrdersPerCustomer.toFixed(1)}
                  </div>
                  <p className='text-[10px] sm:text-xs text-cyan-600/70 dark:text-cyan-400/70 mt-1'>Orders per customer</p>
                </div>
              </div>
              <div className='absolute right-2 top-2 opacity-10 group-hover:opacity-20 transition-opacity hidden sm:block'>
                <ShoppingCart className='h-12 w-12 sm:h-16 sm:w-16 text-cyan-600 dark:text-cyan-400' />
              </div>
            </div>

            {/* Avg Order Value */}
            <div className='group relative flex flex-row items-center justify-between p-4 sm:p-6 rounded-xl border-2 border-pink-200/50 bg-gradient-to-r from-pink-50/80 to-pink-100/40 dark:from-pink-950/20 dark:to-pink-900/10 dark:border-pink-800/30 transition-all duration-300 hover:shadow-lg hover:border-pink-300 dark:hover:border-pink-700/50'>
              <div className='flex flex-row items-center gap-3 sm:gap-4'>
                <div className='p-2 sm:p-3 rounded-xl bg-pink-100/80 dark:bg-pink-900/40 shadow-sm'>
                  <TrendingUp className='h-5 w-5 sm:h-6 sm:w-6 text-pink-600 dark:text-pink-400' />
                </div>
                <div className='flex flex-col'>
                  <span className='text-[10px] sm:text-xs font-semibold text-pink-700/70 dark:text-pink-300/70 uppercase tracking-wide mb-1'>
                    Avg Order Value
                  </span>
                  <div className='text-lg sm:text-xl md:text-2xl font-bold text-pink-700 dark:text-pink-300'>
                    {currencySymbol}
                    {stats.averageOrderValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                  <p className='text-[10px] sm:text-xs text-pink-600/70 dark:text-pink-400/70 mt-1'>Per order</p>
                </div>
              </div>
              <div className='absolute right-2 top-2 opacity-10 group-hover:opacity-20 transition-opacity hidden sm:block'>
                <TrendingUp className='h-12 w-12 sm:h-16 sm:w-16 text-pink-600 dark:text-pink-400' />
              </div>
            </div>

            {/* Top Customers */}
            <div className='group relative flex flex-row items-center justify-between p-4 sm:p-6 rounded-xl border-2 border-indigo-200/50 bg-gradient-to-r from-indigo-50/80 to-indigo-100/40 dark:from-indigo-950/20 dark:to-indigo-900/10 dark:border-indigo-800/30 transition-all duration-300 hover:shadow-lg hover:border-indigo-300 dark:hover:border-indigo-700/50'>
              <div className='flex flex-row items-center gap-3 sm:gap-4'>
                <div className='p-2 sm:p-3 rounded-xl bg-indigo-100/80 dark:bg-indigo-900/40 shadow-sm'>
                  <Users className='h-5 w-5 sm:h-6 sm:w-6 text-indigo-600 dark:text-indigo-400' />
                </div>
                <div className='flex flex-col'>
                  <span className='text-[10px] sm:text-xs font-semibold text-indigo-700/70 dark:text-indigo-300/70 uppercase tracking-wide mb-1'>
                    Top Customers
                  </span>
                  <div className='text-xl sm:text-2xl font-bold text-indigo-700 dark:text-indigo-300'>{stats.topCustomers.length}</div>
                  <p className='text-[10px] sm:text-xs text-indigo-600/70 dark:text-indigo-400/70 mt-1'>Highest spenders</p>
                </div>
              </div>
              <div className='absolute right-2 top-2 opacity-10 group-hover:opacity-20 transition-opacity hidden sm:block'>
                <Users className='h-12 w-12 sm:h-16 sm:w-16 text-indigo-600 dark:text-indigo-400' />
              </div>
            </div>

            {/* Customer Retention */}
            <div className='group relative flex flex-row items-center justify-between p-4 sm:p-6 rounded-xl border-2 border-teal-200/50 bg-gradient-to-r from-teal-50/80 to-teal-100/40 dark:from-teal-950/20 dark:to-teal-900/10 dark:border-teal-800/30 transition-all duration-300 hover:shadow-lg hover:border-teal-300 dark:hover:border-teal-700/50'>
              <div className='flex flex-row items-center gap-3 sm:gap-4'>
                <div className='p-2 sm:p-3 rounded-xl bg-teal-100/80 dark:bg-teal-900/40 shadow-sm'>
                  <Calendar className='h-5 w-5 sm:h-6 sm:w-6 text-teal-600 dark:text-teal-400' />
                </div>
                <div className='flex flex-col'>
                  <span className='text-[10px] sm:text-xs font-semibold text-teal-700/70 dark:text-teal-300/70 uppercase tracking-wide mb-1'>
                    Customer Retention
                  </span>
                  <div className='text-xl sm:text-2xl font-bold text-teal-700 dark:text-teal-300'>
                    {stats.totalCustomers > 0 ? ((stats.repeatCustomers / stats.totalCustomers) * 100).toFixed(1) : 0}%
                  </div>
                  <p className='text-[10px] sm:text-xs text-teal-600/70 dark:text-teal-400/70 mt-1'>Repeat rate</p>
                </div>
              </div>
              <div className='absolute right-2 top-2 opacity-10 group-hover:opacity-20 transition-opacity hidden sm:block'>
                <Calendar className='h-12 w-12 sm:h-16 sm:w-16 text-teal-600 dark:text-teal-400' />
              </div>
            </div>
          </div>
        </>
      ) : null}

      {/* Customers Table */}
      <Card className='shadow-sm border-2 p-3 md:p-4 gap-0'>
        <CardHeader className='p-0'>
          <div className='flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 mb-4'>
            <div>
              <CardTitle className='text-base sm:text-lg font-bold'>Customer List</CardTitle>
              <CardDescription className='mt-0.5 text-xs sm:text-sm'>
                {loading ? "Loading..." : `${pagination.total} customer${pagination.total !== 1 ? "s" : ""} found`}
              </CardDescription>
            </div>
            <div className='w-full sm:w-auto sm:flex-1 sm:max-w-sm'>
              <div className='relative'>
                <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground' />
                <Input
                  placeholder='Search by name, email, phone, or city...'
                  value={searchInput}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className='pl-10 h-10 text-sm'
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className='p-0'>
          <div className='rounded-md overflow-x-auto'>
            {loading ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className='font-semibold'>Customer</TableHead>
                    <TableHead className='font-semibold hidden sm:table-cell'>Contact</TableHead>
                    <TableHead className='font-semibold hidden md:table-cell'>Location</TableHead>
                    <TableHead className='text-right font-semibold hidden lg:table-cell'>Orders</TableHead>
                    <TableHead className='text-right font-semibold'>Total Spent</TableHead>
                    <TableHead className='text-right font-semibold hidden md:table-cell'>Last Order</TableHead>
                    <TableHead className='text-right font-semibold hidden sm:table-cell'>Type</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Array.from({ length: limit }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell>
                        <Skeleton className='h-4 w-32' />
                      </TableCell>
                      <TableCell className='hidden sm:table-cell'>
                        <Skeleton className='h-4 w-24' />
                      </TableCell>
                      <TableCell className='hidden md:table-cell'>
                        <Skeleton className='h-4 w-20' />
                      </TableCell>
                      <TableCell className='text-right hidden lg:table-cell'>
                        <Skeleton className='h-4 w-12 ml-auto' />
                      </TableCell>
                      <TableCell className='text-right'>
                        <Skeleton className='h-4 w-16 ml-auto' />
                      </TableCell>
                      <TableCell className='text-right hidden md:table-cell'>
                        <Skeleton className='h-4 w-20 ml-auto' />
                      </TableCell>
                      <TableCell className='text-right hidden sm:table-cell'>
                        <Skeleton className='h-4 w-16 ml-auto' />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : customers.length === 0 ? (
              <div className='text-sm text-muted-foreground py-8 text-center'>No customers found.</div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className='font-semibold'>Customer</TableHead>
                      <TableHead className='font-semibold hidden sm:table-cell'>Contact</TableHead>
                      <TableHead className='font-semibold hidden md:table-cell'>Location</TableHead>
                      <TableHead className='text-right font-semibold hidden lg:table-cell'>Orders</TableHead>
                      <TableHead className='text-right font-semibold'>Total Spent</TableHead>
                      <TableHead className='text-right font-semibold hidden md:table-cell'>Last Order</TableHead>
                      <TableHead className='text-right font-semibold hidden sm:table-cell'>Type</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {customers.map((customer) => (
                      <TableRow key={customer.id} className='hover:bg-accent/50'>
                        <TableCell>
                          <div className='flex flex-col gap-1'>
                            <div className='font-medium text-sm sm:text-base'>{customer.fullName}</div>
                            {customer.notes && <div className='text-xs text-muted-foreground sm:hidden'>{customer.notes}</div>}
                            <div className='flex items-center gap-2 text-xs text-muted-foreground sm:hidden'>
                              {customer.email && (
                                <div className='flex items-center gap-1'>
                                  <Mail className='h-3 w-3' />
                                  <span className='truncate max-w-[150px]'>{customer.email}</span>
                                </div>
                              )}
                              {customer.phone && (
                                <div className='flex items-center gap-1'>
                                  <Phone className='h-3 w-3' />
                                  <span>{customer.phone}</span>
                                </div>
                              )}
                            </div>
                            <div className='flex items-center gap-1 text-xs text-muted-foreground sm:hidden'>
                              <MapPin className='h-3 w-3' />
                              <span>
                                {customer.city}
                                {customer.postalCode && `, ${customer.postalCode}`}
                              </span>
                            </div>
                            <div className='flex items-center gap-2 sm:hidden flex-wrap'>
                              <Link
                                href={`/merchant/orders?search=${encodeURIComponent(customer.phone || customer.email || "")}`}
                                className='text-xs font-medium hover:text-primary transition-colors'
                              >
                                {customer.totalOrders} orders
                              </Link>
                              <span className='text-xs text-muted-foreground'>•</span>
                              <span className='text-xs text-muted-foreground'>
                                {format(new Date(customer.lastOrderDate), "MMM d, yyyy")}
                              </span>
                              <span className='text-xs text-muted-foreground'>•</span>
                              {getCustomerTypeBadge(customer)}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className='hidden sm:table-cell'>
                          <div className='space-y-1'>
                            {customer.email && (
                              <div className='flex items-center gap-1.5 text-sm'>
                                <Mail className='h-3 w-3 text-muted-foreground' />
                                <span className='text-xs'>{customer.email}</span>
                              </div>
                            )}
                            {customer.phone && (
                              <div className='flex items-center gap-1.5 text-sm'>
                                <Phone className='h-3 w-3 text-muted-foreground' />
                                <span className='text-xs'>{customer.phone}</span>
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className='hidden md:table-cell'>
                          <div className='flex items-center gap-1.5 text-sm'>
                            <MapPin className='h-3 w-3 text-muted-foreground' />
                            <span className='text-xs'>
                              {customer.city}
                              {customer.postalCode && `, ${customer.postalCode}`}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className='text-right hidden lg:table-cell'>
                          <Link
                            href={`/merchant/orders?search=${encodeURIComponent(customer.phone || customer.email || "")}`}
                            className='font-medium hover:text-primary transition-colors'
                          >
                            {customer.totalOrders}
                          </Link>
                        </TableCell>
                        <TableCell className='text-right font-medium'>
                          <div className='flex flex-col items-end gap-0.5'>
                            <span className='text-sm sm:text-base'>
                              {currencySymbol}
                              {customer.totalSpent.toFixed(2)}
                            </span>
                            <span className='text-xs text-muted-foreground sm:hidden'>Total Spent</span>
                          </div>
                        </TableCell>
                        <TableCell className='text-right text-sm text-muted-foreground hidden md:table-cell'>
                          {format(new Date(customer.lastOrderDate), "MMM d, yyyy")}
                        </TableCell>
                        <TableCell className='text-right hidden sm:table-cell'>{getCustomerTypeBadge(customer)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {pagination.totalPages > 1 && (
                  <Pagination
                    pagination={pagination}
                    currentPage={currentPage}
                    limit={limit}
                    onPageChange={handlePageChange}
                    onLimitChange={handleLimitChange}
                    loading={loading}
                    itemName='customers'
                  />
                )}
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
