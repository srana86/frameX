"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CreditCard, DollarSign, TrendingUp, Calendar, Eye, Search, Filter, RefreshCw } from "lucide-react";
import { useCurrencySymbol } from "@/hooks/use-currency";
import { toast } from "sonner";
import { Pagination } from "@/components/shared/Pagination";
import Link from "next/link";
import { getPayments, type PaymentTransaction } from "./actions";

type PaginationData = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
};

export function PaymentsClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currencySymbol = useCurrencySymbol();

  // Get initial values from URL or use defaults
  const initialPage = parseInt(searchParams.get("page") || "1", 10);
  const initialLimit = parseInt(searchParams.get("limit") || "30", 10);
  const initialSearch = searchParams.get("search") || "";
  const initialStatus = searchParams.get("status") || "all";

  const [payments, setPayments] = useState<PaymentTransaction[]>([]);
  const [stats, setStats] = useState<{ total: number; completed: number; failed: number; totalAmount: number } | null>(null);
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
  const [selectedPayment, setSelectedPayment] = useState<PaymentTransaction | null>(null);

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
      const data = await getPayments(page, pageLimit, status !== "all" ? status : undefined, search.trim() || undefined);
      setPayments(data.payments);
      setStats(data.stats);
      setPagination(data.pagination);
    } catch (error: any) {
      console.error("Failed to load payments:", error);
      toast.error(error?.message || "Failed to load payment history");
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
  }, [searchParams]); // Sync when URL params change

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
    setSearchInput(value); // Update input immediately for better UX
    // URL update and search query update will happen via debounce effect
  };

  const handleStatusChange = (status: string) => {
    setStatusFilter(status);
    setCurrentPage(1);
    updateURL({ status, page: 1 });
  };

  const handleRefresh = () => {
    loadData(currentPage, limit, searchQuery, statusFilter);
  };

  const getStatusBadge = (status: string) => {
    const statusLower = status.toLowerCase();
    if (statusLower === "valid" || statusLower === "completed") {
      return <Badge className='bg-green-500'>Completed</Badge>;
    } else if (statusLower === "failed") {
      return <Badge variant='destructive'>Failed</Badge>;
    } else if (statusLower === "cancelled") {
      return <Badge variant='secondary'>Cancelled</Badge>;
    } else {
      return <Badge variant='outline'>Pending</Badge>;
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
          {/* Total Payments */}
          <div className='group relative flex flex-row items-center justify-between p-4 sm:p-6 rounded-xl border-2 border-blue-200/50 bg-gradient-to-r from-blue-50/80 to-blue-100/40 dark:from-blue-950/20 dark:to-blue-900/10 dark:border-blue-800/30 transition-all duration-300 hover:shadow-lg hover:border-blue-300 dark:hover:border-blue-700/50'>
            <div className='flex flex-row items-center gap-3 sm:gap-4'>
              <div className='p-2 sm:p-3 rounded-xl bg-blue-100/80 dark:bg-blue-900/40 shadow-sm'>
                <CreditCard className='h-5 w-5 sm:h-6 sm:w-6 text-blue-600 dark:text-blue-400' />
              </div>
              <div className='flex flex-col'>
                <span className='text-[10px] sm:text-xs font-semibold text-blue-700/70 dark:text-blue-300/70 uppercase tracking-wide mb-1'>
                  Total Payments
                </span>
                <div className='text-xl sm:text-2xl font-bold text-blue-700 dark:text-blue-300'>{stats.total.toLocaleString()}</div>
                <p className='text-[10px] sm:text-xs text-blue-600/70 dark:text-blue-400/70 mt-1'>All payment transactions</p>
              </div>
            </div>
            <div className='absolute right-2 top-2 opacity-10 group-hover:opacity-20 transition-opacity hidden sm:block'>
              <CreditCard className='h-12 w-12 sm:h-16 sm:w-16 text-blue-600 dark:text-blue-400' />
            </div>
          </div>

          {/* Successful */}
          <div className='group relative flex flex-row items-center justify-between p-4 sm:p-6 rounded-xl border-2 border-green-200/50 bg-gradient-to-r from-green-50/80 to-green-100/40 dark:from-green-950/20 dark:to-green-900/10 dark:border-green-800/30 transition-all duration-300 hover:shadow-lg hover:border-green-300 dark:hover:border-green-700/50'>
            <div className='flex flex-row items-center gap-3 sm:gap-4'>
              <div className='p-2 sm:p-3 rounded-xl bg-green-100/80 dark:bg-green-900/40 shadow-sm'>
                <TrendingUp className='h-5 w-5 sm:h-6 sm:w-6 text-green-600 dark:text-green-400' />
              </div>
              <div className='flex flex-col'>
                <span className='text-[10px] sm:text-xs font-semibold text-green-700/70 dark:text-green-300/70 uppercase tracking-wide mb-1'>
                  Successful
                </span>
                <div className='text-xl sm:text-2xl font-bold text-green-700 dark:text-green-300'>{stats.completed.toLocaleString()}</div>
                <p className='text-[10px] sm:text-xs text-green-600/70 dark:text-green-400/70 mt-1'>Completed payments</p>
              </div>
            </div>
            <div className='absolute right-2 top-2 opacity-10 group-hover:opacity-20 transition-opacity hidden sm:block'>
              <TrendingUp className='h-12 w-12 sm:h-16 sm:w-16 text-green-600 dark:text-green-400' />
            </div>
          </div>

          {/* Failed */}
          <div className='group relative flex flex-row items-center justify-between p-4 sm:p-6 rounded-xl border-2 border-red-200/50 bg-gradient-to-r from-red-50/80 to-red-100/40 dark:from-red-950/20 dark:to-red-900/10 dark:border-red-800/30 transition-all duration-300 hover:shadow-lg hover:border-red-300 dark:hover:border-red-700/50'>
            <div className='flex flex-row items-center gap-3 sm:gap-4'>
              <div className='p-2 sm:p-3 rounded-xl bg-red-100/80 dark:bg-red-900/40 shadow-sm'>
                <TrendingUp className='h-5 w-5 sm:h-6 sm:w-6 text-red-600 dark:text-red-400' />
              </div>
              <div className='flex flex-col'>
                <span className='text-[10px] sm:text-xs font-semibold text-red-700/70 dark:text-red-300/70 uppercase tracking-wide mb-1'>
                  Failed
                </span>
                <div className='text-xl sm:text-2xl font-bold text-red-700 dark:text-red-300'>{stats.failed.toLocaleString()}</div>
                <p className='text-[10px] sm:text-xs text-red-600/70 dark:text-red-400/70 mt-1'>Failed payments</p>
              </div>
            </div>
            <div className='absolute right-2 top-2 opacity-10 group-hover:opacity-20 transition-opacity hidden sm:block'>
              <TrendingUp className='h-12 w-12 sm:h-16 sm:w-16 text-red-600 dark:text-red-400' />
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
                  {stats.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <p className='text-[10px] sm:text-xs text-purple-600/70 dark:text-purple-400/70 mt-1'>From successful payments</p>
              </div>
            </div>
            <div className='absolute right-2 top-2 opacity-10 group-hover:opacity-20 transition-opacity hidden sm:block'>
              <DollarSign className='h-12 w-12 sm:h-16 sm:w-16 text-purple-600 dark:text-purple-400' />
            </div>
          </div>
        </div>
      ) : null}

      {/* Filters and Table */}
      <Card className='shadow-sm border-2 px-3 md:px-0 py-3 md:py-4 gap-0'>
        <CardHeader className='p-0'>
          <div className='flex flex-col gap-3 sm:gap-4 mb-4'>
            <div className='flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4'>
              <div>
                <CardTitle className='text-base sm:text-lg font-bold'>Payment Transactions</CardTitle>
                <CardDescription className='mt-0.5 text-xs sm:text-sm'>
                  {loading ? "Loading..." : `${pagination.total} transaction${pagination.total !== 1 ? "s" : ""} found`}
                </CardDescription>
              </div>
              <Button onClick={handleRefresh} variant='outline' size='sm' className='shrink-0 h-9 sm:h-10 w-full sm:w-auto'>
                <RefreshCw className='h-4 w-4 mr-2' />
                <span className='hidden sm:inline'>Refresh</span>
              </Button>
            </div>
            <div className='flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3'>
              <div className='relative flex-1 min-w-0'>
                <Search className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none' />
                <Input
                  placeholder='Search by transaction ID, order ID...'
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
                  <SelectItem value='valid'>Completed</SelectItem>
                  <SelectItem value='failed'>Failed</SelectItem>
                  <SelectItem value='cancelled'>Cancelled</SelectItem>
                  <SelectItem value='pending'>Pending</SelectItem>
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
                    <TableHead className='font-semibold'>Transaction ID</TableHead>
                    <TableHead className='font-semibold hidden sm:table-cell'>Order ID</TableHead>
                    <TableHead className='font-semibold hidden md:table-cell'>Customer</TableHead>
                    <TableHead className='font-semibold'>Amount</TableHead>
                    <TableHead className='font-semibold hidden lg:table-cell'>Status</TableHead>
                    <TableHead className='font-semibold hidden md:table-cell'>Payment Method</TableHead>
                    <TableHead className='font-semibold hidden lg:table-cell'>Date</TableHead>
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
                      <TableCell className='hidden md:table-cell'>
                        <Skeleton className='h-4 w-20' />
                      </TableCell>
                      <TableCell>
                        <Skeleton className='h-4 w-16' />
                      </TableCell>
                      <TableCell className='hidden lg:table-cell'>
                        <Skeleton className='h-6 w-20' />
                      </TableCell>
                      <TableCell className='hidden md:table-cell'>
                        <Skeleton className='h-6 w-24' />
                      </TableCell>
                      <TableCell className='hidden lg:table-cell'>
                        <Skeleton className='h-4 w-20' />
                      </TableCell>
                      <TableCell className='text-right'>
                        <Skeleton className='h-8 w-8 ml-auto' />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : payments.length === 0 ? (
              <div className='text-sm text-muted-foreground py-8 text-center'>No payment transactions found.</div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className='font-semibold'>Transaction ID</TableHead>
                      <TableHead className='font-semibold hidden sm:table-cell'>Order ID</TableHead>
                      <TableHead className='font-semibold hidden md:table-cell'>Customer</TableHead>
                      <TableHead className='font-semibold'>Amount</TableHead>
                      <TableHead className='font-semibold hidden lg:table-cell'>Status</TableHead>
                      <TableHead className='font-semibold hidden md:table-cell'>Payment Method</TableHead>
                      <TableHead className='font-semibold hidden lg:table-cell'>Date</TableHead>
                      <TableHead className='font-semibold text-right'>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payments.map((payment) => (
                      <TableRow key={payment._id || payment.transactionId} className='hover:bg-accent/50'>
                        <TableCell>
                          <div className='flex flex-col gap-1'>
                            <div className='font-mono text-xs sm:text-sm'>{payment.transactionId}</div>
                            <div className='flex items-center gap-2 text-xs text-muted-foreground sm:hidden'>
                              <Link href={`/merchant/orders/${payment.orderId}`} className='text-primary hover:underline font-mono'>
                                Order: {payment.orderId.substring(0, 8)}...
                              </Link>
                            </div>
                            <div className='flex items-center gap-2 text-xs text-muted-foreground sm:hidden'>
                              {payment.order?.customer?.fullName && <span>{payment.order.customer.fullName}</span>}
                              {payment.order?.customer?.phone && (
                                <>
                                  <span>•</span>
                                  <span>{payment.order.customer.phone}</span>
                                </>
                              )}
                            </div>
                            <div className='flex items-center gap-2 sm:hidden flex-wrap'>
                              {getStatusBadge(payment.status)}
                              {payment.paymentMethod && (
                                <>
                                  <span className='text-xs text-muted-foreground'>•</span>
                                  <Badge variant='outline' className='text-xs'>
                                    {payment.paymentMethod}
                                  </Badge>
                                </>
                              )}
                              <span className='text-xs text-muted-foreground'>•</span>
                              <span className='text-xs text-muted-foreground'>{new Date(payment.createdAt).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className='hidden sm:table-cell'>
                          <Link href={`/merchant/orders/${payment.orderId}`} className='text-primary hover:underline font-mono text-sm'>
                            {payment.orderId.substring(0, 8)}...
                          </Link>
                        </TableCell>
                        <TableCell className='hidden md:table-cell'>
                          <div className='flex flex-col gap-0.5'>
                            <span className='text-sm'>{payment.order?.customer?.fullName || "N/A"}</span>
                            {payment.order?.customer?.phone && (
                              <span className='text-xs text-muted-foreground'>{payment.order.customer.phone}</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className='font-semibold'>
                          <div className='flex flex-col items-start gap-0.5'>
                            <span className='text-sm sm:text-base'>
                              {currencySymbol}
                              {payment.amount?.toFixed(2) || "0.00"}
                            </span>
                            <span className='text-xs text-muted-foreground sm:hidden'>Amount</span>
                          </div>
                        </TableCell>
                        <TableCell className='hidden lg:table-cell'>{getStatusBadge(payment.status)}</TableCell>
                        <TableCell className='hidden md:table-cell'>
                          {payment.paymentMethod && <Badge variant='outline'>{payment.paymentMethod}</Badge>}
                        </TableCell>
                        <TableCell className='hidden lg:table-cell'>
                          <div className='flex items-center gap-1 text-sm text-muted-foreground'>
                            <Calendar className='h-3 w-3' />
                            {new Date(payment.createdAt).toLocaleDateString()}
                          </div>
                        </TableCell>
                        <TableCell className='text-right'>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant='ghost' size='sm' className='h-8 w-8 p-0' onClick={() => setSelectedPayment(payment)}>
                                <Eye className='h-4 w-4' />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className='max-w-2xl max-h-[80vh] overflow-y-auto'>
                              <DialogHeader>
                                <DialogTitle>Payment Details</DialogTitle>
                              </DialogHeader>
                              {selectedPayment && (
                                <div className='space-y-4'>
                                  <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                                    <div>
                                      <label className='text-sm font-medium text-muted-foreground'>Transaction ID</label>
                                      <p className='font-mono text-sm'>{selectedPayment.transactionId}</p>
                                    </div>
                                    <div>
                                      <label className='text-sm font-medium text-muted-foreground'>Order ID</label>
                                      <p className='font-mono text-sm'>{selectedPayment.orderId}</p>
                                    </div>
                                    <div>
                                      <label className='text-sm font-medium text-muted-foreground'>Amount</label>
                                      <p className='font-semibold'>
                                        {currencySymbol}
                                        {selectedPayment.amount?.toFixed(2)}
                                      </p>
                                    </div>
                                    <div>
                                      <label className='text-sm font-medium text-muted-foreground'>Status</label>
                                      <div>{getStatusBadge(selectedPayment.status)}</div>
                                    </div>
                                    {selectedPayment.bankTranId && (
                                      <div>
                                        <label className='text-sm font-medium text-muted-foreground'>Bank Transaction ID</label>
                                        <p className='font-mono text-sm'>{selectedPayment.bankTranId}</p>
                                      </div>
                                    )}
                                    {selectedPayment.cardType && (
                                      <div>
                                        <label className='text-sm font-medium text-muted-foreground'>Card Type</label>
                                        <p>{selectedPayment.cardType}</p>
                                      </div>
                                    )}
                                    {selectedPayment.cardBrand && (
                                      <div>
                                        <label className='text-sm font-medium text-muted-foreground'>Card Brand</label>
                                        <p>{selectedPayment.cardBrand}</p>
                                      </div>
                                    )}
                                    {selectedPayment.cardIssuer && (
                                      <div>
                                        <label className='text-sm font-medium text-muted-foreground'>Card Issuer</label>
                                        <p>{selectedPayment.cardIssuer}</p>
                                      </div>
                                    )}
                                    <div>
                                      <label className='text-sm font-medium text-muted-foreground'>Date</label>
                                      <p>{new Date(selectedPayment.createdAt).toLocaleString()}</p>
                                    </div>
                                  </div>
                                  {selectedPayment.order && (
                                    <div className='border-t pt-4'>
                                      <h4 className='font-semibold mb-2'>Order Information</h4>
                                      <div className='space-y-2 text-sm'>
                                        <p>
                                          <span className='text-muted-foreground'>Customer:</span> {selectedPayment.order.customer.fullName}
                                        </p>
                                        <p>
                                          <span className='text-muted-foreground'>Order Status:</span> {selectedPayment.order.status}
                                        </p>
                                        <p>
                                          <span className='text-muted-foreground'>Total:</span> {currencySymbol}
                                          {selectedPayment.order.total.toFixed(2)}
                                        </p>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}
                            </DialogContent>
                          </Dialog>
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
                    itemName='transactions'
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
