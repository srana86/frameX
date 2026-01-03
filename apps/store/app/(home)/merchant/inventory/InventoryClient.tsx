"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import type { Product } from "@/lib/types";
import type { InventoryTransaction, InventoryOverview } from "@/lib/types";
import { getInventoryProducts, getInventoryTransactions, getInventoryOverview, adjustInventoryStock } from "./actions";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Spinner } from "@/components/ui/spinner";
import { Skeleton } from "@/components/ui/skeleton";
import { Pagination } from "@/components/shared/Pagination";
import { toast } from "sonner";
import CloudImage from "@/components/site/CloudImage";
import {
  Package,
  AlertTriangle,
  TrendingDown,
  TrendingUp,
  Plus,
  Minus,
  History,
  Search,
  RefreshCw,
  Upload,
  Download,
  BarChart3,
  FileText,
  Settings,
  ArrowRight,
  Grid3x3,
  List,
  X,
} from "lucide-react";

type PaginationData = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
};

export function InventoryClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Get initial values from URL or use defaults
  const initialViewMode = (searchParams.get("view") as "grid" | "list") || "list";
  const initialStockFilter = (searchParams.get("stockFilter") as "all" | "in-stock" | "low-stock" | "out-of-stock") || "all";
  const initialPage = parseInt(searchParams.get("page") || "1", 10);
  const initialLimit = parseInt(searchParams.get("limit") || "30", 10);
  const initialSearch = searchParams.get("search") || "";
  const initialTxPage = parseInt(searchParams.get("txPage") || "1", 10);
  const initialTxLimit = parseInt(searchParams.get("txLimit") || "30", 10);

  const [products, setProducts] = useState<Product[]>([]);
  const [pagination, setPagination] = useState<PaginationData>({
    page: 1,
    limit: 30,
    total: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPrevPage: false,
  });
  const [overview, setOverview] = useState<InventoryOverview | null>(null);
  const [transactions, setTransactions] = useState<InventoryTransaction[]>([]);
  const [transactionsPagination, setTransactionsPagination] = useState<PaginationData>({
    page: 1,
    limit: 30,
    total: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPrevPage: false,
  });
  const [loading, setLoading] = useState(true);
  const [transactionsLoading, setTransactionsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [stockFilter, setStockFilter] = useState<"all" | "in-stock" | "low-stock" | "out-of-stock">(initialStockFilter);
  const [viewMode, setViewMode] = useState<"grid" | "list">(initialViewMode);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [limit, setLimit] = useState(initialLimit);
  const [txPage, setTxPage] = useState(initialTxPage);
  const [txLimit, setTxLimit] = useState(initialTxLimit);
  const [lowStockThreshold, setLowStockThreshold] = useState(10);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [adjustDialogOpen, setAdjustDialogOpen] = useState(false);
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [adjustmentQty, setAdjustmentQty] = useState("");
  const [adjustmentReason, setAdjustmentReason] = useState("");
  const [adjustmentType, setAdjustmentType] = useState<"adjustment" | "restock">("adjustment");
  const [adjusting, setAdjusting] = useState(false);

  // Update URL when filters change
  const updateURL = useCallback(
    (updates: {
      view?: "grid" | "list";
      stockFilter?: string;
      page?: number;
      limit?: number;
      search?: string;
      txPage?: number;
      txLimit?: number;
    }) => {
      const params = new URLSearchParams(searchParams.toString());

      if (updates.view !== undefined) {
        if (updates.view === "list") {
          params.delete("view");
        } else {
          params.set("view", updates.view);
        }
      }

      if (updates.stockFilter !== undefined) {
        if (updates.stockFilter === "all") {
          params.delete("stockFilter");
        } else {
          params.set("stockFilter", updates.stockFilter);
        }
      }

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

      if (updates.txPage !== undefined) {
        if (updates.txPage === 1) {
          params.delete("txPage");
        } else {
          params.set("txPage", updates.txPage.toString());
        }
      }

      if (updates.txLimit !== undefined) {
        if (updates.txLimit === 30) {
          params.delete("txLimit");
        } else {
          params.set("txLimit", updates.txLimit.toString());
        }
      }

      router.replace(`?${params.toString()}`, { scroll: false });
    },
    [searchParams, router]
  );

  const fetchProducts = useCallback(
    async (page: number = 1, stockFilterValue: string = "all", searchValue: string = "") => {
      setLoading(true);
      try {
        const data = await getInventoryProducts(page, limit, stockFilterValue as any, searchValue, lowStockThreshold);
        setProducts(data.products);
        setPagination(data.pagination);
      } catch (error: any) {
        console.error("Error fetching products:", error);
        toast.error(error?.message || "Failed to load products");
      } finally {
        setLoading(false);
      }
    },
    [limit, lowStockThreshold]
  );

  const loadOverview = useCallback(async () => {
    try {
      const overviewData = await getInventoryOverview(lowStockThreshold);
      setOverview(overviewData);
      setLowStockThreshold(overviewData.lowStockThreshold);
    } catch (error: any) {
      console.error("Failed to load overview:", error);
    }
  }, [lowStockThreshold]);

  const loadTransactions = useCallback(
    async (page: number = 1) => {
      setTransactionsLoading(true);
      try {
        const data = await getInventoryTransactions(page, txLimit);
        setTransactions(data.transactions);
        setTransactionsPagination(data.pagination);
      } catch (error: any) {
        console.error("Failed to load transactions:", error);
        toast.error(error?.message || "Failed to load transactions");
      } finally {
        setTransactionsLoading(false);
      }
    },
    [txLimit]
  );

  // Sync URL params on mount
  useEffect(() => {
    const urlPage = parseInt(searchParams.get("page") || "1", 10);
    const urlStockFilter = (searchParams.get("stockFilter") as "all" | "in-stock" | "low-stock" | "out-of-stock") || "all";
    const urlView = (searchParams.get("view") as "grid" | "list") || "list";
    const urlLimit = parseInt(searchParams.get("limit") || "30", 10);
    const urlSearch = searchParams.get("search") || "";
    const urlTxPage = parseInt(searchParams.get("txPage") || "1", 10);
    const urlTxLimit = parseInt(searchParams.get("txLimit") || "30", 10);

    if (urlPage !== currentPage) setCurrentPage(urlPage);
    if (urlStockFilter !== stockFilter) setStockFilter(urlStockFilter);
    if (urlView !== viewMode) setViewMode(urlView);
    if (urlLimit !== limit) setLimit(urlLimit);
    if (urlSearch !== searchQuery) setSearchQuery(urlSearch);
    if (urlTxPage !== txPage) setTxPage(urlTxPage);
    if (urlTxLimit !== txLimit) setTxLimit(urlTxLimit);
  }, []); // Only run on mount

  useEffect(() => {
    fetchProducts(currentPage, stockFilter, searchQuery);
  }, [currentPage, stockFilter, fetchProducts, searchQuery]);

  useEffect(() => {
    loadOverview();
  }, [loadOverview]);

  useEffect(() => {
    loadTransactions(txPage);
  }, [txPage, loadTransactions]);

  const handleViewModeChange = (mode: "grid" | "list") => {
    setViewMode(mode);
    updateURL({ view: mode });
  };

  const handleStockFilterChange = (filter: "all" | "in-stock" | "low-stock" | "out-of-stock") => {
    setStockFilter(filter);
    setCurrentPage(1);
    updateURL({ stockFilter: filter, page: 1 });
  };

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
    setSearchQuery(value);
    setCurrentPage(1);
    updateURL({ search: value, page: 1 });
  };

  const handleClearFilters = useCallback(() => {
    setViewMode("list");
    setStockFilter("all");
    setSearchQuery("");
    setCurrentPage(1);
    setLimit(30);
    router.replace("?", { scroll: false });
    fetchProducts(1, "all", "");
  }, [router, fetchProducts]);

  const handleTxPageChange = (newPage: number) => {
    setTxPage(newPage);
    updateURL({ txPage: newPage });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleTxLimitChange = (newLimit: number) => {
    setTxLimit(newLimit);
    setTxPage(1);
    updateURL({ txLimit: newLimit, txPage: 1 });
  };

  const handleAdjustStock = async () => {
    if (!selectedProduct || !adjustmentQty) {
      toast.error("Please enter a quantity");
      return;
    }

    const qty = Number(adjustmentQty);
    if (isNaN(qty) || qty === 0) {
      toast.error("Please enter a valid quantity");
      return;
    }

    setAdjusting(true);
    try {
      await adjustInventoryStock(selectedProduct.id, qty, adjustmentReason || undefined, adjustmentType);
      toast.success("Stock adjusted successfully");
      setAdjustDialogOpen(false);
      setAdjustmentQty("");
      setAdjustmentReason("");
      fetchProducts(currentPage, stockFilter, searchQuery);
      loadOverview();
      loadTransactions(txPage);
    } catch (error: any) {
      toast.error(error?.message || "Failed to adjust stock");
    } finally {
      setAdjusting(false);
    }
  };

  const openAdjustDialog = (product: Product) => {
    setSelectedProduct(product);
    setAdjustmentQty("");
    setAdjustmentReason("");
    setAdjustmentType("adjustment");
    setAdjustDialogOpen(true);
  };

  const openHistoryDialog = (product: Product) => {
    setSelectedProduct(product);
    setHistoryDialogOpen(true);
  };

  const productTransactions = useMemo(() => {
    if (!selectedProduct) return [];
    return transactions.filter((t) => t.productId === selectedProduct.id);
  }, [transactions, selectedProduct]);

  const getStockStatusBadge = (stock: number | undefined) => {
    if (stock === undefined || stock === null) {
      return <Badge variant='outline'>Not Tracked</Badge>;
    }
    if (stock === 0) {
      return <Badge variant='destructive'>Out of Stock</Badge>;
    }
    if (stock <= lowStockThreshold) {
      return <Badge className='bg-yellow-500 text-white border-yellow-500'>Low Stock</Badge>;
    }
    return <Badge className='bg-green-500 text-white border-green-500'>In Stock</Badge>;
  };

  if (loading && !overview) {
    return (
      <div className='flex items-center justify-center min-h-[400px]'>
        <Spinner />
      </div>
    );
  }

  return (
    <div className='w-full space-y-6 mt-4'>
      {/* Header */}
      <div className='flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4'>
        <div>
          <h1 className='text-2xl md:text-3xl font-bold tracking-tight'>Inventory Management</h1>
          <p className='text-muted-foreground text-sm md:text-base mt-1'>Manage product stock levels and track inventory</p>
        </div>
        <Button
          onClick={() => {
            fetchProducts(currentPage, stockFilter, searchQuery);
            loadOverview();
            loadTransactions(txPage);
          }}
          variant='outline'
          size='sm'
          className='shrink-0'
        >
          <RefreshCw className='h-4 w-4 mr-2' />
          Refresh
        </Button>
      </div>

      {/* KPI Cards - Enhanced Design */}
      {overview && (
        <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
          {/* Total Products */}
          <div className='group relative flex flex-row items-center justify-between p-4 md:p-5 rounded-xl border-2 border-blue-200/50 bg-gradient-to-r from-blue-50/80 to-blue-100/40 dark:from-blue-950/20 dark:to-blue-900/10 dark:border-blue-800/30 transition-all duration-300 hover:shadow-lg hover:border-blue-300 dark:hover:border-blue-700/50'>
            <div className='flex flex-row items-center gap-4'>
              <div className='p-3 rounded-xl bg-blue-100/80 dark:bg-blue-900/40 shadow-sm'>
                <Package className='h-6 w-6 text-blue-600 dark:text-blue-400' />
              </div>
              <div className='flex flex-col'>
                <span className='text-xs font-semibold text-blue-700/70 dark:text-blue-300/70 uppercase tracking-wide mb-1'>
                  Total Products
                </span>
                <div className='text-2xl font-bold text-blue-700 dark:text-blue-300'>{overview.totalProducts.toLocaleString()}</div>
                <p className='text-xs text-blue-600/70 dark:text-blue-400/70 mt-1'>Products in inventory</p>
              </div>
            </div>
            <div className='absolute right-2 top-2 opacity-10 group-hover:opacity-20 transition-opacity'>
              <Package className='ď hidden md:block text-blue-600 dark:text-blue-400' />
            </div>
          </div>

          {/* Total Stock */}
          <div className='group relative flex flex-row items-center justify-between p-4 md:p-5 rounded-xl border-2 border-green-200/50 bg-gradient-to-r from-green-50/80 to-green-100/40 dark:from-green-950/20 dark:to-green-900/10 dark:border-green-800/30 transition-all duration-300 hover:shadow-lg hover:border-green-300 dark:hover:border-green-700/50'>
            <div className='flex flex-row items-center gap-4'>
              <div className='p-3 rounded-xl bg-green-100/80 dark:bg-green-900/40 shadow-sm'>
                <TrendingUp className='h-6 w-6 text-green-600 dark:text-green-400' />
              </div>
              <div className='flex flex-col'>
                <span className='text-xs font-semibold text-green-700/70 dark:text-green-300/70 uppercase tracking-wide mb-1'>
                  Total Stock
                </span>
                <div className='text-2xl font-bold text-green-700 dark:text-green-300'>{overview.totalStock.toLocaleString()}</div>
                <p className='text-xs text-green-600/70 dark:text-green-400/70 mt-1'>Units in stock</p>
              </div>
            </div>
            <div className='absolute right-2 top-2 opacity-10 group-hover:opacity-20 transition-opacity'>
              <TrendingUp className='ď hidden md:block text-green-600 dark:text-green-400' />
            </div>
          </div>

          {/* Low Stock */}
          <div className='group relative flex flex-row items-center justify-between p-4 md:p-5 rounded-xl border-2 border-orange-200/50 bg-gradient-to-r from-orange-50/80 to-orange-100/40 dark:from-orange-950/20 dark:to-orange-900/10 dark:border-orange-800/30 transition-all duration-300 hover:shadow-lg hover:border-orange-300 dark:hover:border-orange-700/50'>
            <div className='flex flex-row items-center gap-4'>
              <div className='p-3 rounded-xl bg-orange-100/80 dark:bg-orange-900/40 shadow-sm'>
                <AlertTriangle className='h-6 w-6 text-orange-600 dark:text-orange-400' />
              </div>
              <div className='flex flex-col'>
                <span className='text-xs font-semibold text-orange-700/70 dark:text-orange-300/70 uppercase tracking-wide mb-1'>
                  Low Stock
                </span>
                <div className='text-2xl font-bold text-orange-700 dark:text-orange-300'>{overview.lowStockProducts.toLocaleString()}</div>
                <p className='text-xs text-orange-600/70 dark:text-orange-400/70 mt-1'>≤ {overview.lowStockThreshold} units</p>
              </div>
            </div>
            <div className='absolute right-2 top-2 opacity-10 group-hover:opacity-20 transition-opacity'>
              <AlertTriangle className='ď hidden md:block text-orange-600 dark:text-orange-400' />
            </div>
          </div>

          {/* Out of Stock */}
          <div className='group relative flex flex-row items-center justify-between p-4 md:p-5 rounded-xl border-2 border-red-200/50 bg-gradient-to-r from-red-50/80 to-red-100/40 dark:from-red-950/20 dark:to-red-900/10 dark:border-red-800/30 transition-all duration-300 hover:shadow-lg hover:border-red-300 dark:hover:border-red-700/50'>
            <div className='flex flex-row items-center gap-4'>
              <div className='p-3 rounded-xl bg-red-100/80 dark:bg-red-900/40 shadow-sm'>
                <TrendingDown className='h-6 w-6 text-red-600 dark:text-red-400' />
              </div>
              <div className='flex flex-col'>
                <span className='text-xs font-semibold text-red-700/70 dark:text-red-300/70 uppercase tracking-wide mb-1'>
                  Out of Stock
                </span>
                <div className='text-2xl font-bold text-red-700 dark:text-red-300'>{overview.productsOutOfStock.toLocaleString()}</div>
                <p className='text-xs text-red-600/70 dark:text-red-400/70 mt-1'>Need restocking</p>
              </div>
            </div>
            <div className='absolute right-2 top-2 opacity-10 group-hover:opacity-20 transition-opacity'>
              <TrendingDown className='ď hidden md:block text-red-600 dark:text-red-400' />
            </div>
          </div>
        </div>
      )}

      {/* Status Overview Cards */}
      {overview && (
        <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
          {/* Pending Adjustments */}
          <div className='group relative flex flex-row items-center justify-between p-4 md:p-5 rounded-xl border-2 border-purple-200/50 bg-gradient-to-r from-purple-50/80 to-purple-100/40 dark:from-purple-950/20 dark:to-purple-900/10 dark:border-purple-800/30 transition-all duration-300 hover:shadow-lg hover:border-purple-300 dark:hover:border-purple-700/50'>
            <div className='flex flex-row items-center gap-4'>
              <div className='p-3 rounded-xl bg-purple-100/80 dark:bg-purple-900/40 shadow-sm'>
                <Package className='h-6 w-6 text-purple-600 dark:text-purple-400' />
              </div>
              <div className='flex flex-col'>
                <span className='text-xs font-semibold text-purple-700/70 dark:text-purple-300/70 uppercase tracking-wide mb-1'>
                  Pending Adjustments
                </span>
                <div className='text-2xl font-bold text-purple-700 dark:text-purple-300'>0</div>
                <p className='text-xs text-purple-600/70 dark:text-purple-400/70 mt-1'>Awaiting review</p>
              </div>
            </div>
            <div className='absolute right-2 top-2 opacity-10 group-hover:opacity-20 transition-opacity'>
              <Package className='ď hidden md:block text-purple-600 dark:text-purple-400' />
            </div>
          </div>

          {/* Today's Changes */}
          <div className='group relative flex flex-row items-center justify-between p-4 md:p-5 rounded-xl border-2 border-cyan-200/50 bg-gradient-to-r from-cyan-50/80 to-cyan-100/40 dark:from-cyan-950/20 dark:to-cyan-900/10 dark:border-cyan-800/30 transition-all duration-300 hover:shadow-lg hover:border-cyan-300 dark:hover:border-cyan-700/50'>
            <div className='flex flex-row items-center gap-4'>
              <div className='p-3 rounded-xl bg-cyan-100/80 dark:bg-cyan-900/40 shadow-sm'>
                <AlertTriangle className='h-6 w-6 text-cyan-600 dark:text-cyan-400' />
              </div>
              <div className='flex flex-col'>
                <span className='text-xs font-semibold text-cyan-700/70 dark:text-cyan-300/70 uppercase tracking-wide mb-1'>
                  Today's Changes
                </span>
                <div className='text-2xl font-bold text-cyan-700 dark:text-cyan-300'>
                  {
                    transactions.filter((t) => {
                      const today = new Date();
                      const txDate = new Date(t.createdAt || 0);
                      return txDate.toDateString() === today.toDateString();
                    }).length
                  }
                </div>
                <p className='text-xs text-cyan-600/70 dark:text-cyan-400/70 mt-1'>Transactions today</p>
              </div>
            </div>
            <div className='absolute right-2 top-2 opacity-10 group-hover:opacity-20 transition-opacity'>
              <AlertTriangle className='ď hidden md:block text-cyan-600 dark:text-cyan-400' />
            </div>
          </div>

          {/* Latest Returns */}
          <div className='group relative flex flex-row items-center justify-between p-4 md:p-5 rounded-xl border-2 border-pink-200/50 bg-gradient-to-r from-pink-50/80 to-pink-100/40 dark:from-pink-950/20 dark:to-pink-900/10 dark:border-pink-800/30 transition-all duration-300 hover:shadow-lg hover:border-pink-300 dark:hover:border-pink-700/50'>
            <div className='flex flex-row items-center gap-4'>
              <div className='p-3 rounded-xl bg-pink-100/80 dark:bg-pink-900/40 shadow-sm'>
                <TrendingDown className='h-6 w-6 text-pink-600 dark:text-pink-400' />
              </div>
              <div className='flex flex-col'>
                <span className='text-xs font-semibold text-pink-700/70 dark:text-pink-300/70 uppercase tracking-wide mb-1'>
                  Latest Returns
                </span>
                <div className='text-2xl font-bold text-pink-700 dark:text-pink-300'>0</div>
                <p className='text-xs text-pink-600/70 dark:text-pink-400/70 mt-1'>Returned items</p>
              </div>
            </div>
            <div className='absolute right-2 top-2 opacity-10 group-hover:opacity-20 transition-opacity'>
              <TrendingDown className='ď hidden md:block text-pink-600 dark:text-pink-400' />
            </div>
          </div>

          {/* Adjustment Requests */}
          <div className='group relative flex flex-row items-center justify-between p-4 md:p-5 rounded-xl border-2 border-indigo-200/50 bg-gradient-to-r from-indigo-50/80 to-indigo-100/40 dark:from-indigo-950/20 dark:to-indigo-900/10 dark:border-indigo-800/30 transition-all duration-300 hover:shadow-lg hover:border-indigo-300 dark:hover:border-indigo-700/50'>
            <div className='flex flex-row items-center gap-4'>
              <div className='p-3 rounded-xl bg-indigo-100/80 dark:bg-indigo-900/40 shadow-sm'>
                <FileText className='h-6 w-6 text-indigo-600 dark:text-indigo-400' />
              </div>
              <div className='flex flex-col'>
                <span className='text-xs font-semibold text-indigo-700/70 dark:text-indigo-300/70 uppercase tracking-wide mb-1'>
                  Adjustment Requests
                </span>
                <div className='text-2xl font-bold text-indigo-700 dark:text-indigo-300'>0</div>
                <p className='text-xs text-indigo-600/70 dark:text-indigo-400/70 mt-1'>Pending approval</p>
              </div>
            </div>
            <div className='absolute right-2 top-2 opacity-10 group-hover:opacity-20 transition-opacity'>
              <FileText className='ď hidden md:block text-indigo-600 dark:text-indigo-400' />
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <Tabs defaultValue='products' className='w-full'>
        <div className='flex items-center justify-between mb-4'>
          <TabsList>
            <TabsTrigger value='products'>Products</TabsTrigger>
            <TabsTrigger value='transactions'>Recent Transactions</TabsTrigger>
          </TabsList>
          <div className='flex items-center gap-2'>
            <Button variant='outline' size='default' className=''>
              <Settings className='h-4 w-4 md:mr-2' />
              <span className='hidden md:flex'>Settings</span>
            </Button>
          </div>
        </div>

        {/* Products Tab */}
        <TabsContent value='products' className='space-y-4'>
          {/* Filters and View Controls */}
          <Card className='shadow-sm border-2 pt-0 border-slate-200/50 dark:border-slate-800/50 gap-0'>
            <CardHeader className='p-4 sm:p-5 md:p-6 border-b border-slate-200/50 dark:border-slate-800/30'>
              <div className='flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 lg:gap-6'>
                {/* Left Section - Title */}
                <div className='flex items-center gap-3 sm:gap-4 min-w-0 flex-shrink-0'>
                  <div className='flex-shrink-0 p-2 sm:p-2.5 rounded-lg bg-primary/10 dark:bg-primary/20'>
                    <Package className='h-5 w-5 sm:h-6 sm:w-6 text-primary dark:text-primary' />
                  </div>
                  <div className='min-w-0 flex-1'>
                    <CardTitle className='text-lg sm:text-xl md:text-2xl font-bold text-slate-900 dark:text-slate-100 leading-tight'>
                      Product Inventory
                    </CardTitle>
                    <p className='text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1 font-medium'>
                      {pagination.total} {pagination.total === 1 ? "product" : "products"} found
                    </p>
                  </div>
                </div>

                {/* Right Section - Search, Stock Filter, View Toggle */}
                <div className='flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-3 flex-1 lg:flex-initial lg:justify-end'>
                  {/* Search */}
                  <div className='relative flex-1 sm:flex-initial sm:w-48 md:w-56 min-w-0'>
                    <Search className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500 pointer-events-none' />
                    <Input
                      placeholder='Search products...'
                      value={searchQuery}
                      onChange={(e) => handleSearchChange(e.target.value)}
                      className='pl-10 h-9 sm:h-10 text-sm border-slate-300 dark:border-slate-700 focus-visible:ring-primary focus-visible:ring-2'
                    />
                  </div>

                  {/* Stock Filter */}
                  <Select value={stockFilter} onValueChange={(value: any) => handleStockFilterChange(value)}>
                    <SelectTrigger className='w-full sm:w-[140px] md:w-[160px] text-sm border-slate-300 dark:border-slate-700'>
                      <SelectValue placeholder='Filter by stock' />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='all'>All Products</SelectItem>
                      <SelectItem value='in-stock'>In Stock</SelectItem>
                      <SelectItem value='low-stock'>Low Stock</SelectItem>
                      <SelectItem value='out-of-stock'>Out of Stock</SelectItem>
                    </SelectContent>
                  </Select>

                  {/* View Toggle */}
                  <div className='flex items-center gap-0.5 p-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700'>
                    <Button
                      variant={viewMode === "list" ? "default" : "ghost"}
                      size='sm'
                      onClick={() => handleViewModeChange("list")}
                      className={`h-8 sm:h-9 px-2.5 sm:px-3.5 text-xs sm:text-sm font-medium transition-all ${viewMode === "list"
                        ? "bg-primary hover:bg-primary/90 text-white shadow-sm"
                        : "hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300"
                        }`}
                    >
                      <List className='h-4 w-4 mr-1.5' />
                      <span className='hidden sm:inline'>List</span>
                    </Button>
                    <Button
                      variant={viewMode === "grid" ? "default" : "ghost"}
                      size='sm'
                      onClick={() => handleViewModeChange("grid")}
                      className={`h-8 sm:h-9 px-2.5 sm:px-3.5 text-xs sm:text-sm font-medium transition-all ${viewMode === "grid"
                        ? "bg-primary hover:bg-primary/90 text-white shadow-sm"
                        : "hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300"
                        }`}
                    >
                      <Grid3x3 className='h-4 w-4 mr-1.5' />
                      <span className='hidden sm:inline'>Grid</span>
                    </Button>
                  </div>

                  {/* Clear Filters Button */}
                  {(stockFilter !== "all" || currentPage !== 1 || viewMode !== "list" || searchQuery) && (
                    <Button
                      variant='outline'
                      onClick={handleClearFilters}
                      className='h-9 sm:h-10 px-2 sm:px-3 text-xs sm:text-sm border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
                    >
                      <X className='h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1' />
                      <span className='hidden sm:inline'>Clear</span>
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className='p-3 sm:p-4 md:p-5'>
              {/* Skeleton Components */}
              {loading && !products.length ? (
                viewMode === "grid" ? (
                  <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4'>
                    {[...Array(8)].map((_, i) => (
                      <div
                        key={i}
                        className='flex flex-col rounded-lg border-2 border-slate-200/50 dark:border-slate-800/50 overflow-hidden'
                      >
                        <Skeleton className='w-full aspect-square' />
                        <div className='p-3 sm:p-4 space-y-2'>
                          <Skeleton className='h-4 w-3/4' />
                          <Skeleton className='h-3 w-1/2' />
                          <div className='flex justify-between pt-2 border-t border-slate-200 dark:border-slate-800'>
                            <Skeleton className='h-5 w-20' />
                            <Skeleton className='h-3 w-16' />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className='rounded-lg border border-slate-200/50 dark:border-slate-800/50 overflow-hidden'>
                    <div className='overflow-x-auto'>
                      <Table>
                        <TableHeader>
                          <TableRow className='bg-slate-50/50 dark:bg-slate-900/50'>
                            <TableHead className='w-16 sm:w-20'>
                              <Skeleton className='h-4 w-12' />
                            </TableHead>
                            <TableHead>
                              <Skeleton className='h-4 w-24' />
                            </TableHead>
                            <TableHead className='hidden sm:table-cell'>
                              <Skeleton className='h-4 w-16' />
                            </TableHead>
                            <TableHead className='hidden md:table-cell'>
                              <Skeleton className='h-4 w-20' />
                            </TableHead>
                            <TableHead>
                              <Skeleton className='h-4 w-16' />
                            </TableHead>
                            <TableHead>
                              <Skeleton className='h-4 w-20' />
                            </TableHead>
                            <TableHead className='w-24 sm:w-32'>
                              <Skeleton className='h-4 w-16 ml-auto' />
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {[...Array(5)].map((_, i) => (
                            <TableRow key={i}>
                              <TableCell>
                                <Skeleton className='h-12 w-12 rounded-md' />
                              </TableCell>
                              <TableCell>
                                <Skeleton className='h-4 w-32' />
                              </TableCell>
                              <TableCell className='hidden sm:table-cell'>
                                <Skeleton className='h-4 w-20' />
                              </TableCell>
                              <TableCell className='hidden md:table-cell'>
                                <Skeleton className='h-4 w-24' />
                              </TableCell>
                              <TableCell>
                                <Skeleton className='h-4 w-16' />
                              </TableCell>
                              <TableCell>
                                <Skeleton className='h-4 w-24' />
                              </TableCell>
                              <TableCell>
                                <div className='flex justify-end gap-2'>
                                  <Skeleton className='h-7 w-12' />
                                  <Skeleton className='h-7 w-14' />
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )
              ) : products.length === 0 ? (
                <div className='text-center py-12 sm:py-16'>
                  <Package className='h-12 w-12 sm:h-16 sm:w-16 mx-auto text-slate-400 dark:text-slate-500 mb-4' />
                  <p className='text-sm sm:text-base text-slate-600 dark:text-slate-400 font-medium'>No products found</p>
                  <p className='text-xs sm:text-sm text-slate-500 dark:text-slate-500 mt-1'>Try adjusting your filters</p>
                </div>
              ) : viewMode === "grid" ? (
                /* Grid View */
                <>
                  <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4'>
                    {products.map((product) => (
                      <div
                        key={product.id}
                        className='group relative flex flex-col rounded-lg border-2 border-slate-200/50 dark:border-slate-800/50 bg-white dark:bg-slate-900/50 hover:border-primary/30 dark:hover:border-primary/30 transition-all duration-300 hover:shadow-lg overflow-hidden'
                      >
                        {/* Image */}
                        <div className='relative w-full aspect-square overflow-hidden bg-slate-100 dark:bg-slate-800'>
                          {product.images?.[0] && product.images[0] !== "/file.svg" ? (
                            <CloudImage
                              src={product.images[0]}
                              alt={product.name}
                              fill
                              className='object-cover group-hover:scale-105 transition-transform duration-300'
                            />
                          ) : (
                            <div className='w-full h-full flex items-center justify-center'>
                              <Package className='h-12 w-12 text-slate-400 dark:text-slate-600' />
                            </div>
                          )}
                        </div>
                        {/* Content */}
                        <div className='p-3 sm:p-4 flex-1 flex flex-col gap-2'>
                          <div className='flex-1'>
                            <h3 className='font-semibold text-sm sm:text-base text-slate-900 dark:text-slate-100 line-clamp-2 mb-1'>
                              {product.name}
                            </h3>
                            <div className='flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 mb-2'>
                              {product.brand && <span className='truncate'>{product.brand}</span>}
                              {product.brand && product.category && <span>•</span>}
                              {product.category && <span className='truncate'>{product.category}</span>}
                            </div>
                          </div>
                          <div className='flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-800'>
                            <div className='flex flex-col'>
                              <div className='text-xs text-slate-500 dark:text-slate-400'>Stock</div>
                              <div className='text-lg sm:text-xl font-bold text-primary dark:text-primary'>
                                {product.stock !== undefined ? product.stock.toLocaleString() : "N/A"}
                              </div>
                            </div>
                            <div>{getStockStatusBadge(product.stock)}</div>
                          </div>
                          <div className='flex gap-2 pt-2'>
                            <Button variant='outline' size='sm' onClick={() => openAdjustDialog(product)} className='flex-1 text-xs'>
                              <Plus className='h-3 w-3 mr-1' />
                              Adjust
                            </Button>
                            <Button variant='outline' size='sm' onClick={() => openHistoryDialog(product)} className='text-xs'>
                              <History className='h-3 w-3' />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  {/* Pagination for Grid View */}
                  <div className='mt-6'>
                    <Pagination
                      pagination={pagination}
                      currentPage={currentPage}
                      limit={limit}
                      loading={loading}
                      onPageChange={handlePageChange}
                      onLimitChange={handleLimitChange}
                      itemName='products'
                      showLimitSelector={true}
                    />
                  </div>
                </>
              ) : (
                /* List View */
                <div className='rounded-lg border border-slate-200/50 dark:border-slate-800/50 overflow-hidden'>
                  <div className='overflow-x-auto'>
                    <Table className='pt-0'>
                      <TableHeader>
                        <TableRow className='bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800'>
                          <TableHead className='w-16 sm:w-20'>Image</TableHead>
                          <TableHead className='min-w-[150px] sm:min-w-[200px] font-semibold text-xs sm:text-sm text-slate-700 dark:text-slate-300'>
                            Product
                          </TableHead>
                          <TableHead className='hidden sm:table-cell font-semibold text-xs sm:text-sm text-slate-700 dark:text-slate-300'>
                            SKU
                          </TableHead>
                          <TableHead className='hidden md:table-cell font-semibold text-xs sm:text-sm text-slate-700 dark:text-slate-300'>
                            Category
                          </TableHead>
                          <TableHead className='font-semibold text-xs sm:text-sm text-slate-700 dark:text-slate-300'>Stock</TableHead>
                          <TableHead className='font-semibold text-xs sm:text-sm text-slate-700 dark:text-slate-300'>Status</TableHead>
                          <TableHead className='w-24 sm:w-32 text-right font-semibold text-xs sm:text-sm text-slate-700 dark:text-slate-300'>
                            Actions
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {products.map((product) => (
                          <TableRow
                            key={product.id}
                            className='hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors border-b border-slate-100 dark:border-slate-800/50'
                          >
                            <TableCell className='p-2 sm:p-4'>
                              <div className='relative h-10 w-10 sm:h-12 sm:w-12 overflow-hidden rounded-md border bg-accent/30'>
                                {product.images?.[0] && product.images[0] !== "/file.svg" ? (
                                  <CloudImage src={product.images[0]} alt={product.name} fill className='object-cover' />
                                ) : (
                                  <div className='w-full h-full flex items-center justify-center'>
                                    <Package className='h-5 w-5 text-slate-400' />
                                  </div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className='p-2 sm:p-4 font-medium'>
                              <div className='text-xs sm:text-sm text-slate-900 dark:text-slate-100 font-semibold line-clamp-1'>
                                {product.name}
                              </div>
                              <div className='text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5 sm:hidden'>
                                {product.sku && <span>SKU: {product.sku}</span>}
                                {product.sku && product.category && <span> • </span>}
                                {product.category && <span>{product.category}</span>}
                              </div>
                            </TableCell>
                            <TableCell className='hidden sm:table-cell p-2 sm:p-4 text-xs sm:text-sm text-slate-600 dark:text-slate-400'>
                              {product.sku || "-"}
                            </TableCell>
                            <TableCell className='hidden md:table-cell p-2 sm:p-4 text-xs sm:text-sm text-slate-600 dark:text-slate-400'>
                              {product.category || "-"}
                            </TableCell>
                            <TableCell className='p-2 sm:p-4'>
                              <div className='text-sm sm:text-base font-bold text-primary dark:text-primary'>
                                {product.stock !== undefined ? product.stock.toLocaleString() : "N/A"}
                              </div>
                            </TableCell>
                            <TableCell className='p-2 sm:p-4'>{getStockStatusBadge(product.stock)}</TableCell>
                            <TableCell className='p-2 sm:p-4'>
                              <div className='flex justify-end gap-1.5 sm:gap-2'>
                                <Button
                                  variant='outline'
                                  size='sm'
                                  onClick={() => openAdjustDialog(product)}
                                  className='h-7 sm:h-8 px-2 sm:px-3 text-xs'
                                >
                                  <Plus className='h-3 w-3 mr-1' />
                                  <span className='hidden sm:inline'>Adjust</span>
                                </Button>
                                <Button
                                  variant='outline'
                                  size='sm'
                                  onClick={() => openHistoryDialog(product)}
                                  className='h-7 sm:h-8 px-2 sm:px-3 text-xs'
                                >
                                  <History className='h-3 w-3' />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  {/* Pagination for List View */}
                  <div className='pt-4 px-2 pb-2'>
                    <Pagination
                      pagination={pagination}
                      currentPage={currentPage}
                      limit={limit}
                      loading={loading}
                      onPageChange={handlePageChange}
                      onLimitChange={handleLimitChange}
                      itemName='products'
                      showLimitSelector={true}
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Transactions Tab */}
        <TabsContent value='transactions' className='space-y-4'>
          <Card className='shadow-sm border-2 pt-0 border-slate-200/50 dark:border-slate-800/50 gap-0'>
            <CardHeader className='p-4 sm:p-5 md:p-6 border-b border-slate-200/50 dark:border-slate-800/30'>
              <div className='flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4'>
                <div className='min-w-0 flex-1'>
                  <CardTitle className='text-lg sm:text-xl md:text-2xl font-bold text-slate-900 dark:text-slate-100 leading-tight'>
                    Recent Inventory Transactions
                  </CardTitle>
                  <CardDescription className='mt-1 text-xs sm:text-sm'>Track all stock adjustments, orders, and restocks</CardDescription>
                </div>
                <Badge variant='outline' className='text-xs shrink-0'>
                  {transactionsPagination.total} Total
                </Badge>
              </div>
            </CardHeader>
            <CardContent className='p-3 sm:p-4 md:p-5'>
              {transactionsLoading ? (
                /* Skeleton Loading */
                <div className='rounded-lg border border-slate-200/50 dark:border-slate-800/50 overflow-hidden'>
                  <div className='overflow-x-auto'>
                    <Table>
                      <TableHeader>
                        <TableRow className='bg-slate-50/50 dark:bg-slate-900/50'>
                          <TableHead className='w-24 sm:w-32'>
                            <Skeleton className='h-4 w-20' />
                          </TableHead>
                          <TableHead>
                            <Skeleton className='h-4 w-24' />
                          </TableHead>
                          <TableHead className='hidden sm:table-cell'>
                            <Skeleton className='h-4 w-16' />
                          </TableHead>
                          <TableHead className='text-right'>
                            <Skeleton className='h-4 w-16 ml-auto' />
                          </TableHead>
                          <TableHead className='hidden md:table-cell text-right'>
                            <Skeleton className='h-4 w-16 ml-auto' />
                          </TableHead>
                          <TableHead className='hidden lg:table-cell text-right'>
                            <Skeleton className='h-4 w-16 ml-auto' />
                          </TableHead>
                          <TableHead className='hidden xl:table-cell'>
                            <Skeleton className='h-4 w-20' />
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {[...Array(5)].map((_, i) => (
                          <TableRow key={i}>
                            <TableCell>
                              <Skeleton className='h-4 w-20' />
                              <Skeleton className='h-3 w-16 mt-1' />
                            </TableCell>
                            <TableCell>
                              <Skeleton className='h-4 w-32' />
                            </TableCell>
                            <TableCell className='hidden sm:table-cell'>
                              <Skeleton className='h-5 w-20' />
                            </TableCell>
                            <TableCell className='text-right'>
                              <Skeleton className='h-4 w-12 ml-auto' />
                            </TableCell>
                            <TableCell className='hidden md:table-cell text-right'>
                              <Skeleton className='h-4 w-12 ml-auto' />
                            </TableCell>
                            <TableCell className='hidden lg:table-cell text-right'>
                              <Skeleton className='h-4 w-12 ml-auto' />
                            </TableCell>
                            <TableCell className='hidden xl:table-cell'>
                              <Skeleton className='h-4 w-24' />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              ) : transactions.length === 0 ? (
                <div className='text-center py-12 sm:py-16'>
                  <History className='h-12 w-12 sm:h-16 sm:w-16 mx-auto text-slate-400 dark:text-slate-500 mb-4' />
                  <p className='text-sm sm:text-base text-slate-600 dark:text-slate-400 font-medium'>No transactions found</p>
                  <p className='text-xs sm:text-sm text-slate-500 dark:text-slate-500 mt-1'>
                    Transactions will appear here when inventory is adjusted
                  </p>
                </div>
              ) : (
                <>
                  <div className='rounded-lg border border-slate-200/50 dark:border-slate-800/50 overflow-hidden'>
                    <div className='overflow-x-auto'>
                      <Table>
                        <TableHeader>
                          <TableRow className='bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800'>
                            <TableHead className='w-24 sm:w-32 font-semibold text-xs sm:text-sm text-slate-700 dark:text-slate-300'>
                              Date
                            </TableHead>
                            <TableHead className='min-w-[120px] sm:min-w-[150px] font-semibold text-xs sm:text-sm text-slate-700 dark:text-slate-300'>
                              Product
                            </TableHead>
                            <TableHead className='hidden sm:table-cell font-semibold text-xs sm:text-sm text-slate-700 dark:text-slate-300'>
                              Type
                            </TableHead>
                            <TableHead className='text-right font-semibold text-xs sm:text-sm text-slate-700 dark:text-slate-300'>
                              Quantity
                            </TableHead>
                            <TableHead className='hidden md:table-cell text-right font-semibold text-xs sm:text-sm text-slate-700 dark:text-slate-300'>
                              Previous
                            </TableHead>
                            <TableHead className='hidden lg:table-cell text-right font-semibold text-xs sm:text-sm text-slate-700 dark:text-slate-300'>
                              New Stock
                            </TableHead>
                            <TableHead className='hidden xl:table-cell font-semibold text-xs sm:text-sm text-slate-700 dark:text-slate-300'>
                              Reason
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {transactions.map((transaction) => (
                            <TableRow
                              key={transaction.id}
                              className='hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors border-b border-slate-100 dark:border-slate-800/50'
                            >
                              <TableCell className='p-2 sm:p-4'>
                                <div className='text-xs sm:text-sm'>{new Date(transaction.createdAt || 0).toLocaleDateString()}</div>
                                <div className='text-[10px] sm:text-xs text-muted-foreground mt-0.5'>
                                  {new Date(transaction.createdAt || 0).toLocaleTimeString()}
                                </div>
                              </TableCell>
                              <TableCell className='p-2 sm:p-4'>
                                <div className='font-medium text-xs sm:text-sm text-slate-900 dark:text-slate-100 line-clamp-1'>
                                  {transaction.productName}
                                </div>
                                <div className='text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5 sm:hidden'>
                                  <Badge variant='outline' className='text-[10px] px-1.5 py-0'>
                                    {transaction.type}
                                  </Badge>
                                </div>
                              </TableCell>
                              <TableCell className='hidden sm:table-cell p-2 sm:p-4'>
                                <Badge variant='outline' className='text-xs'>
                                  {transaction.type}
                                </Badge>
                              </TableCell>
                              <TableCell
                                className={`p-2 sm:p-4 text-right font-medium text-xs sm:text-sm ${transaction.quantity > 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
                                  }`}
                              >
                                {transaction.quantity > 0 ? "+" : ""}
                                {transaction.quantity}
                              </TableCell>
                              <TableCell className='hidden md:table-cell p-2 sm:p-4 text-right text-xs sm:text-sm text-slate-600 dark:text-slate-400'>
                                {transaction.previousStock}
                              </TableCell>
                              <TableCell className='hidden lg:table-cell p-2 sm:p-4 text-right font-medium text-xs sm:text-sm text-slate-900 dark:text-slate-100'>
                                {transaction.newStock}
                              </TableCell>
                              <TableCell className='hidden xl:table-cell p-2 sm:p-4 text-xs sm:text-sm text-muted-foreground'>
                                {transaction.reason || "-"}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                  {/* Pagination for Transactions */}
                  <div className='pt-4'>
                    <Pagination
                      pagination={transactionsPagination}
                      currentPage={txPage}
                      limit={txLimit}
                      loading={transactionsLoading}
                      onPageChange={handleTxPageChange}
                      onLimitChange={handleTxLimitChange}
                      itemName='transactions'
                      showLimitSelector={true}
                    />
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Adjust Stock Dialog */}
      <Dialog open={adjustDialogOpen} onOpenChange={setAdjustDialogOpen}>
        <DialogContent>
          <DialogHeader className='border-b border-gray-100 pb-2'>
            <DialogTitle>Adjust Stock</DialogTitle>
            <DialogDescription>
              {selectedProduct && (
                <>
                  Adjusting stock for <strong>{selectedProduct.name}</strong>
                  <br />
                  Current stock: <strong>{selectedProduct.stock ?? 0}</strong> units
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className='space-y-4 py-4'>
            <div className='space-y-2'>
              <Label htmlFor='type'>Adjustment Type</Label>
              <Select value={adjustmentType} onValueChange={(value: any) => setAdjustmentType(value)}>
                <SelectTrigger className='w-full'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='adjustment'>Manual Adjustment</SelectItem>
                  <SelectItem value='restock'>Restock</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className='space-y-2'>
              <Label htmlFor='quantity'>
                Quantity <span className='text-muted-foreground'>(positive to add, negative to remove)</span>
              </Label>
              <Input
                id='quantity'
                type='number'
                placeholder='e.g., 10 or -5'
                value={adjustmentQty}
                onChange={(e) => setAdjustmentQty(e.target.value)}
                className='h-10'
              />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='reason'>Reason (Optional)</Label>
              <Textarea
                id='reason'
                placeholder='e.g., Damaged items, Restocked from supplier...'
                value={adjustmentReason}
                onChange={(e) => setAdjustmentReason(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant='outline' onClick={() => setAdjustDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAdjustStock} disabled={adjusting}>
              {adjusting ? <Spinner className='mr-2' /> : null}
              Apply Adjustment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Transaction History Dialog */}
      <Dialog open={historyDialogOpen} onOpenChange={setHistoryDialogOpen}>
        <DialogContent className='max-w-4xl max-h-[80vh] overflow-y-auto'>
          <DialogHeader>
            <DialogTitle>Transaction History</DialogTitle>
            <DialogDescription>{selectedProduct && `Inventory transactions for ${selectedProduct.name}`}</DialogDescription>
          </DialogHeader>
          <div className='rounded-md border'>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className='text-right'>Quantity</TableHead>
                  <TableHead className='text-right'>Previous</TableHead>
                  <TableHead className='text-right'>New Stock</TableHead>
                  <TableHead>Reason</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {productTransactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className='text-center py-8 text-muted-foreground'>
                      No transactions found for this product
                    </TableCell>
                  </TableRow>
                ) : (
                  productTransactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell className='text-sm'>{new Date(transaction.createdAt || 0).toLocaleString()}</TableCell>
                      <TableCell>
                        <Badge variant={transaction.type === "restock" ? "secondary" : "default"}>{transaction.type}</Badge>
                      </TableCell>
                      <TableCell className={`text-right font-medium ${transaction.quantity > 0 ? "text-green-600" : "text-red-600"}`}>
                        {transaction.quantity > 0 ? "+" : ""}
                        {transaction.quantity}
                      </TableCell>
                      <TableCell className='text-right'>{transaction.previousStock}</TableCell>
                      <TableCell className='text-right font-medium'>{transaction.newStock}</TableCell>
                      <TableCell className='text-sm text-muted-foreground'>{transaction.reason || "-"}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
