"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useCurrencySymbol } from "@/hooks/use-currency";
import type { Coupon, CouponType, CouponStatus } from "@/lib/coupon-types";
import { couponTypeLabels } from "@/lib/coupon-types";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Pagination } from "@/components/shared/Pagination";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  Tag,
  Percent,
  DollarSign,
  Truck,
  Gift,
  Star,
  Copy,
  Calendar,
  Users,
  TrendingUp,
  BarChart3,
  RefreshCw,
  Filter,
} from "lucide-react";
import { getCoupons, deleteCoupon } from "./actions";

type PaginationData = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
};

type CouponStatistics = {
  total: number;
  active: number;
  totalRevenue: number;
  totalUsage: number;
};

export default function CouponsClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currencySymbol = useCurrencySymbol();

  // Get initial values from URL or use defaults
  const initialPage = parseInt(searchParams.get("page") || "1", 10);
  const initialLimit = parseInt(searchParams.get("limit") || "30", 10);
  const initialSearch = searchParams.get("search") || "";
  const initialStatus = searchParams.get("status") || "all";

  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [stats, setStats] = useState<CouponStatistics | null>(null);
  const [pagination, setPagination] = useState<PaginationData>({
    page: 1,
    limit: 30,
    total: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPrevPage: false,
  });
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState(initialSearch);
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [statusFilter, setStatusFilter] = useState<string>(initialStatus);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [limit, setLimit] = useState(initialLimit);
  const [couponToDelete, setCouponToDelete] = useState<Coupon | null>(null);

  // Update URL when filters change
  const updateURL = useCallback(
    (updates: { page?: number; limit?: number; search?: string; status?: string }) => {
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

      if (updates.status !== undefined) {
        if (updates.status === "all") {
          params.delete("status");
        } else {
          params.set("status", updates.status);
        }
      }

      router.replace(`?${params.toString()}`, { scroll: false });
    },
    [searchParams, router]
  );

  const loadData = useCallback(async (page: number = 1, pageLimit: number = 30, search: string = "", status: string = "all") => {
    try {
      setLoading(true);
      const data = await getCoupons(page, pageLimit, status !== "all" ? status : undefined, search.trim() || undefined);
      setCoupons(data.coupons);
      setStats(data.statistics);
      setPagination(data.pagination);
    } catch (error: any) {
      console.error("Failed to load coupons:", error);
      toast.error(error?.message || "Failed to load coupons");
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
    const urlStatus = searchParams.get("status") || "all";

    if (urlPage !== currentPage) setCurrentPage(urlPage);
    if (urlLimit !== limit) setLimit(urlLimit);
    if (urlSearch !== searchQuery) {
      setSearchQuery(urlSearch);
      setSearchInput(urlSearch);
    }
    if (urlStatus !== statusFilter) setStatusFilter(urlStatus);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  useEffect(() => {
    loadData(currentPage, limit, searchQuery, statusFilter);
  }, [currentPage, limit, searchQuery, statusFilter, loadData]);

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
    setSearchInput(value);
  };

  const handleStatusChange = (status: string) => {
    setStatusFilter(status);
    setCurrentPage(1);
    updateURL({ status, page: 1 });
  };

  const handleRefresh = () => {
    loadData(currentPage, limit, searchQuery, statusFilter);
  };

  const handleDelete = async () => {
    if (!couponToDelete || !couponToDelete.id) return;

    try {
      await deleteCoupon(couponToDelete.id);
      toast.success("Coupon deleted successfully");
      setCouponToDelete(null);
      loadData(currentPage, limit, searchQuery, statusFilter);
    } catch (error: any) {
      toast.error(error.message || "Failed to delete coupon");
    }
  };

  // Copy coupon code
  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success(`Copied: ${code}`);
  };

  // Get type icon
  const getTypeIcon = (type: CouponType) => {
    switch (type) {
      case "percentage":
        return <Percent className='h-4 w-4' />;
      case "fixed_amount":
        return <DollarSign className='h-4 w-4' />;
      case "free_shipping":
        return <Truck className='h-4 w-4' />;
      case "buy_x_get_y":
        return <Gift className='h-4 w-4' />;
      case "first_order":
        return <Star className='h-4 w-4' />;
      default:
        return <Tag className='h-4 w-4' />;
    }
  };

  // Get status badge variant
  const getStatusBadge = (status: CouponStatus) => {
    switch (status) {
      case "active":
        return <Badge className='bg-green-500/10 text-green-600 border-green-500/20'>Active</Badge>;
      case "inactive":
        return <Badge variant='secondary'>Inactive</Badge>;
      case "expired":
        return <Badge variant='destructive'>Expired</Badge>;
      case "scheduled":
        return <Badge className='bg-blue-500/10 text-blue-600 border-blue-500/20'>Scheduled</Badge>;
      default:
        return <Badge variant='outline'>{status}</Badge>;
    }
  };

  // Format discount display
  const formatDiscount = (coupon: Coupon) => {
    switch (coupon.type) {
      case "percentage":
        return `${coupon.discountValue}% off`;
      case "fixed_amount":
        return `${currencySymbol}${coupon.discountValue} off`;
      case "free_shipping":
        return "Free Shipping";
      case "buy_x_get_y":
        return `Buy ${coupon.buyXGetY?.buyQuantity || 2} Get ${coupon.buyXGetY?.getQuantity || 1}`;
      case "first_order":
        return `${coupon.discountValue}% (First Order)`;
      default:
        return `${coupon.discountValue}`;
    }
  };

  return (
    <div className='w-full space-y-4 sm:space-y-6'>
      {/* Statistics Cards */}
      {loading && !stats ? (
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
      ) : stats ? (
        <div className='grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'>
          {/* Total Coupons */}
          <div className='group relative flex flex-row items-center justify-between p-4 sm:p-6 rounded-xl border-2 border-blue-200/50 bg-gradient-to-r from-blue-50/80 to-blue-100/40 dark:from-blue-950/20 dark:to-blue-900/10 dark:border-blue-800/30 transition-all duration-300 hover:shadow-lg hover:border-blue-300 dark:hover:border-blue-700/50'>
            <div className='flex flex-row items-center gap-3 sm:gap-4'>
              <div className='p-2 sm:p-3 rounded-xl bg-blue-100/80 dark:bg-blue-900/40 shadow-sm'>
                <Tag className='h-5 w-5 sm:h-6 sm:w-6 text-blue-600 dark:text-blue-400' />
              </div>
              <div className='flex flex-col'>
                <span className='text-[10px] sm:text-xs font-semibold text-blue-700/70 dark:text-blue-300/70 uppercase tracking-wide mb-1'>
                  Total Coupons
                </span>
                <div className='text-xl sm:text-2xl font-bold text-blue-700 dark:text-blue-300'>{stats.total.toLocaleString()}</div>
                <p className='text-[10px] sm:text-xs text-blue-600/70 dark:text-blue-400/70 mt-1'>All coupon codes</p>
              </div>
            </div>
            <div className='absolute right-2 top-2 opacity-10 group-hover:opacity-20 transition-opacity hidden sm:block'>
              <Tag className='h-12 w-12 sm:h-16 sm:w-16 text-blue-600 dark:text-blue-400' />
            </div>
          </div>

          {/* Active Coupons */}
          <div className='group relative flex flex-row items-center justify-between p-4 sm:p-6 rounded-xl border-2 border-green-200/50 bg-gradient-to-r from-green-50/80 to-green-100/40 dark:from-green-950/20 dark:to-green-900/10 dark:border-green-800/30 transition-all duration-300 hover:shadow-lg hover:border-green-300 dark:hover:border-green-700/50'>
            <div className='flex flex-row items-center gap-3 sm:gap-4'>
              <div className='p-2 sm:p-3 rounded-xl bg-green-100/80 dark:bg-green-900/40 shadow-sm'>
                <TrendingUp className='h-5 w-5 sm:h-6 sm:w-6 text-green-600 dark:text-green-400' />
              </div>
              <div className='flex flex-col'>
                <span className='text-[10px] sm:text-xs font-semibold text-green-700/70 dark:text-green-300/70 uppercase tracking-wide mb-1'>
                  Active
                </span>
                <div className='text-xl sm:text-2xl font-bold text-green-700 dark:text-green-300'>{stats.active.toLocaleString()}</div>
                <p className='text-[10px] sm:text-xs text-green-600/70 dark:text-green-400/70 mt-1'>Active coupons</p>
              </div>
            </div>
            <div className='absolute right-2 top-2 opacity-10 group-hover:opacity-20 transition-opacity hidden sm:block'>
              <TrendingUp className='h-12 w-12 sm:h-16 sm:w-16 text-green-600 dark:text-green-400' />
            </div>
          </div>

          {/* Total Uses */}
          <div className='group relative flex flex-row items-center justify-between p-4 sm:p-6 rounded-xl border-2 border-indigo-200/50 bg-gradient-to-r from-indigo-50/80 to-indigo-100/40 dark:from-indigo-950/20 dark:to-indigo-900/10 dark:border-indigo-800/30 transition-all duration-300 hover:shadow-lg hover:border-indigo-300 dark:hover:border-indigo-700/50'>
            <div className='flex flex-row items-center gap-3 sm:gap-4'>
              <div className='p-2 sm:p-3 rounded-xl bg-indigo-100/80 dark:bg-indigo-900/40 shadow-sm'>
                <Users className='h-5 w-5 sm:h-6 sm:w-6 text-indigo-600 dark:text-indigo-400' />
              </div>
              <div className='flex flex-col'>
                <span className='text-[10px] sm:text-xs font-semibold text-indigo-700/70 dark:text-indigo-300/70 uppercase tracking-wide mb-1'>
                  Total Uses
                </span>
                <div className='text-xl sm:text-2xl font-bold text-indigo-700 dark:text-indigo-300'>
                  {stats.totalUsage.toLocaleString()}
                </div>
                <p className='text-[10px] sm:text-xs text-indigo-600/70 dark:text-indigo-400/70 mt-1'>Times redeemed</p>
              </div>
            </div>
            <div className='absolute right-2 top-2 opacity-10 group-hover:opacity-20 transition-opacity hidden sm:block'>
              <Users className='h-12 w-12 sm:h-16 sm:w-16 text-indigo-600 dark:text-indigo-400' />
            </div>
          </div>

          {/* Revenue Generated */}
          <div className='group relative flex flex-row items-center justify-between p-4 sm:p-6 rounded-xl border-2 border-purple-200/50 bg-gradient-to-r from-purple-50/80 to-purple-100/40 dark:from-purple-950/20 dark:to-purple-900/10 dark:border-purple-800/30 transition-all duration-300 hover:shadow-lg hover:border-purple-300 dark:hover:border-purple-700/50'>
            <div className='flex flex-row items-center gap-3 sm:gap-4'>
              <div className='p-2 sm:p-3 rounded-xl bg-purple-100/80 dark:bg-purple-900/40 shadow-sm'>
                <BarChart3 className='h-5 w-5 sm:h-6 sm:w-6 text-purple-600 dark:text-purple-400' />
              </div>
              <div className='flex flex-col'>
                <span className='text-[10px] sm:text-xs font-semibold text-purple-700/70 dark:text-purple-300/70 uppercase tracking-wide mb-1'>
                  Revenue Generated
                </span>
                <div className='text-lg sm:text-xl md:text-2xl font-bold text-purple-700 dark:text-purple-300'>
                  {currencySymbol}
                  {stats.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <p className='text-[10px] sm:text-xs text-purple-600/70 dark:text-purple-400/70 mt-1'>From coupon usage</p>
              </div>
            </div>
            <div className='absolute right-2 top-2 opacity-10 group-hover:opacity-20 transition-opacity hidden sm:block'>
              <BarChart3 className='h-12 w-12 sm:h-16 sm:w-16 text-purple-600 dark:text-purple-400' />
            </div>
          </div>
        </div>
      ) : null}

      {/* Filters and Table */}
      <Card className='shadow-sm border-2 p-3 md:p-4 gap-0'>
        <CardHeader className='p-0'>
          <div className='flex flex-col gap-3 sm:gap-4 mb-4'>
            <div className='flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4'>
              <div>
                <CardTitle className='text-base sm:text-lg font-bold'>Coupon Management</CardTitle>
                <CardDescription className='mt-0.5 text-xs sm:text-sm'>
                  {loading ? "Loading..." : `${pagination.total} coupon${pagination.total !== 1 ? "s" : ""} found`}
                </CardDescription>
              </div>
              <div className='flex items-center gap-2'>
                <Button variant='outline' size='sm' onClick={handleRefresh} className='h-10 shrink-0'>
                  <RefreshCw className='h-4 w-4' />
                </Button>
                <Button asChild className='h-10'>
                  <Link href='/merchant/coupons/new'>
                    <Plus className='h-4 w-4 mr-2' />
                    <span className='inline'>Create Coupon</span>
                  </Link>
                </Button>
              </div>
            </div>
            <div className='flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3'>
              <div className='relative flex-1 min-w-0'>
                <Search className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none' />
                <Input
                  placeholder='Search by code or name...'
                  value={searchInput}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className='pl-10 h-10 text-sm'
                />
              </div>
              <Select value={statusFilter} onValueChange={handleStatusChange}>
                <SelectTrigger className='h-10 w-full sm:w-[180px]'>
                  <Filter className='mr-2 h-4 w-4' />
                  <SelectValue placeholder='Filter by status' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>All Status</SelectItem>
                  <SelectItem value='active'>Active</SelectItem>
                  <SelectItem value='inactive'>Inactive</SelectItem>
                  <SelectItem value='scheduled'>Scheduled</SelectItem>
                  <SelectItem value='expired'>Expired</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className='p-0'>
          <div className='rounded-md overflow-x-auto'>
            {loading ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className='font-semibold'>Code</TableHead>
                    <TableHead className='font-semibold hidden sm:table-cell'>Type</TableHead>
                    <TableHead className='font-semibold'>Discount</TableHead>
                    <TableHead className='font-semibold hidden md:table-cell'>Usage</TableHead>
                    <TableHead className='font-semibold hidden lg:table-cell'>Valid Until</TableHead>
                    <TableHead className='font-semibold hidden md:table-cell'>Status</TableHead>
                    <TableHead className='font-semibold text-right'>Actions</TableHead>
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
                      <TableCell>
                        <Skeleton className='h-4 w-16' />
                      </TableCell>
                      <TableCell className='hidden md:table-cell'>
                        <Skeleton className='h-4 w-20' />
                      </TableCell>
                      <TableCell className='hidden lg:table-cell'>
                        <Skeleton className='h-4 w-20' />
                      </TableCell>
                      <TableCell className='hidden md:table-cell'>
                        <Skeleton className='h-6 w-20' />
                      </TableCell>
                      <TableCell className='text-right'>
                        <Skeleton className='h-8 w-16 ml-auto' />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : coupons.length === 0 ? (
              <div className='text-sm text-muted-foreground py-8 text-center'>
                {searchQuery || statusFilter !== "all" ? "No coupons match your filters" : "No coupons yet. Create your first coupon!"}
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className='font-semibold'>Code</TableHead>
                      <TableHead className='font-semibold hidden sm:table-cell'>Type</TableHead>
                      <TableHead className='font-semibold'>Discount</TableHead>
                      <TableHead className='font-semibold hidden md:table-cell'>Usage</TableHead>
                      <TableHead className='font-semibold hidden lg:table-cell'>Valid Until</TableHead>
                      <TableHead className='font-semibold hidden md:table-cell'>Status</TableHead>
                      <TableHead className='font-semibold text-right'>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {coupons.map((coupon) => (
                      <TableRow key={coupon.id} className='hover:bg-accent/50'>
                        <TableCell>
                          <div className='flex flex-col gap-1'>
                            <div className='flex items-center gap-2'>
                              <code className='font-mono font-bold text-sm sm:text-base text-primary bg-primary/10 px-2 py-1 rounded'>
                                {coupon.code}
                              </code>
                              <Button variant='ghost' size='icon' className='h-6 w-6' onClick={() => copyCode(coupon.code)}>
                                <Copy className='h-3 w-3' />
                              </Button>
                            </div>
                            <p className='text-xs sm:text-sm text-muted-foreground'>{coupon.name}</p>
                            <div className='flex items-center gap-2 text-xs text-muted-foreground sm:hidden flex-wrap'>
                              <div className='flex items-center gap-1'>
                                {getTypeIcon(coupon.type)}
                                <span>{couponTypeLabels[coupon.type]}</span>
                              </div>
                              <span>•</span>
                              <span>{coupon.usageLimit.currentUses}</span>
                              {coupon.usageLimit.totalUses && <span>/{coupon.usageLimit.totalUses}</span>}
                              <span>•</span>
                              <div className='flex items-center gap-1'>
                                <Calendar className='h-3 w-3' />
                                {new Date(coupon.endDate).toLocaleDateString()}
                              </div>
                              <span>•</span>
                              {getStatusBadge(coupon.status)}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className='hidden sm:table-cell'>
                          <div className='flex items-center gap-2'>
                            {getTypeIcon(coupon.type)}
                            <span className='text-sm'>{couponTypeLabels[coupon.type]}</span>
                          </div>
                        </TableCell>
                        <TableCell className='font-medium'>
                          <div className='flex flex-col items-start gap-0.5'>
                            <span className='text-sm sm:text-base'>{formatDiscount(coupon)}</span>
                            {(coupon.conditions.minOrderValue ?? 0) > 0 && (
                              <p className='text-xs text-muted-foreground sm:hidden'>
                                Min: {currencySymbol}
                                {coupon.conditions.minOrderValue}
                              </p>
                            )}
                            {(coupon.conditions.minOrderValue ?? 0) > 0 && (
                              <p className='text-xs text-muted-foreground hidden sm:block'>
                                Min: {currencySymbol}
                                {coupon.conditions.minOrderValue}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className='hidden md:table-cell'>
                          <span className='font-medium'>{coupon.usageLimit.currentUses}</span>
                          {coupon.usageLimit.totalUses && <span className='text-muted-foreground'>/{coupon.usageLimit.totalUses}</span>}
                        </TableCell>
                        <TableCell className='hidden lg:table-cell'>
                          <div className='flex items-center gap-1 text-sm'>
                            <Calendar className='h-3 w-3' />
                            {new Date(coupon.endDate).toLocaleDateString()}
                          </div>
                        </TableCell>
                        <TableCell className='hidden md:table-cell'>{getStatusBadge(coupon.status)}</TableCell>
                        <TableCell className='text-right'>
                          <div className='flex items-center gap-1 justify-end'>
                            <Button variant='ghost' size='icon' className='h-8 w-8' asChild>
                              <Link href={`/merchant/coupons/${coupon.id}/edit`}>
                                <Pencil className='h-4 w-4' />
                              </Link>
                            </Button>
                            <Button
                              variant='ghost'
                              size='icon'
                              className='h-8 w-8 text-destructive hover:text-destructive'
                              onClick={() => setCouponToDelete(coupon)}
                            >
                              <Trash2 className='h-4 w-4' />
                            </Button>
                          </div>
                        </TableCell>
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
                    itemName='coupons'
                  />
                )}
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!couponToDelete} onOpenChange={(open) => !open && setCouponToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Coupon</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the coupon <strong>{couponToDelete?.code}</strong>? This action cannot be undone.
              {couponToDelete && (
                <div className='mt-2 p-2 bg-muted rounded'>
                  <div className='font-medium'>{couponToDelete.name}</div>
                  <div className='text-sm text-muted-foreground'>{formatDiscount(couponToDelete)}</div>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className='bg-destructive text-destructive-foreground'>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
