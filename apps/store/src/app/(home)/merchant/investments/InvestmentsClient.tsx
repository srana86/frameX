"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Pagination } from "@/components/shared/Pagination";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
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
import {
  DollarSign,
  Plus,
  Edit,
  Trash2,
  Search,
  Filter,
  Calculator,
  Target,
  AlertTriangle,
  Calendar,
  Wallet,
  BarChart3,
  X,
  RefreshCw,
} from "lucide-react";
import { useCurrencySymbol } from "@/hooks/use-currency";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  getInvestments,
  getBudgets,
  createBudget,
  updateBudget,
  deleteBudget,
  type Investment,
  type Budget as BudgetType,
  updateInvestment,
  createInvestment,
} from "./actions";

// Investment and Budget types are imported from actions

// InvestmentStatistics type matches the one from actions
type InvestmentStatistics = {
  total: number;
  count: number;
  average: number;
  byCategory: Record<string, { total: number; count: number; items: Investment[] }>;
};

type PaginationData = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
};

export function InvestmentsClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currencySymbol = useCurrencySymbol();

  // Get initial values from URL or use defaults
  const initialPage = parseInt(searchParams.get("page") || "1", 10);
  const initialLimit = parseInt(searchParams.get("limit") || "30", 10);
  const initialSearch = searchParams.get("search") || "";
  const initialCategory = searchParams.get("category") || "all";
  const initialBudgetPage = parseInt(searchParams.get("budgetPage") || "1", 10);
  const initialBudgetLimit = parseInt(searchParams.get("budgetLimit") || "30", 10);
  const initialBudgetSearch = searchParams.get("budgetSearch") || "";
  const initialBudgetCategory = searchParams.get("budgetCategory") || "all";
  const initialBudgetActive = searchParams.get("budgetActive") || "all";

  const [investments, setInvestments] = useState<Investment[]>([]);
  const [budgets, setBudgets] = useState<BudgetType[]>([]);
  const [statistics, setStatistics] = useState<InvestmentStatistics | null>(null);
  const [pagination, setPagination] = useState<PaginationData>({
    page: 1,
    limit: 30,
    total: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPrevPage: false,
  });
  const [budgetPagination, setBudgetPagination] = useState<PaginationData>({
    page: 1,
    limit: 30,
    total: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPrevPage: false,
  });
  const [loading, setLoading] = useState(true);
  const [budgetLoading, setBudgetLoading] = useState(true);
  const [searchInput, setSearchInput] = useState(initialSearch);
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [categoryFilter, setCategoryFilter] = useState<string>(initialCategory);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [limit, setLimit] = useState(initialLimit);
  const [budgetSearchInput, setBudgetSearchInput] = useState(initialBudgetSearch);
  const [budgetSearchQuery, setBudgetSearchQuery] = useState(initialBudgetSearch);
  const [budgetCategoryFilter, setBudgetCategoryFilter] = useState<string>(initialBudgetCategory);
  const [budgetActiveFilter, setBudgetActiveFilter] = useState<string>(initialBudgetActive);
  const [budgetCurrentPage, setBudgetCurrentPage] = useState(initialBudgetPage);
  const [budgetLimit, setBudgetLimit] = useState(initialBudgetLimit);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isBudgetDialogOpen, setIsBudgetDialogOpen] = useState(false);
  const [editingInvestment, setEditingInvestment] = useState<Investment | null>(null);
  const [editingBudget, setEditingBudget] = useState<BudgetType | null>(null);
  const [deleteInvestment, setDeleteInvestment] = useState<Investment | null>(null);
  const [budgetToDelete, setBudgetToDelete] = useState<BudgetType | null>(null);
  const [categoryInputOpen, setCategoryInputOpen] = useState(false);
  const [budgetCategoryInputOpen, setBudgetCategoryInputOpen] = useState(false);

  // Investment form state
  const [formData, setFormData] = useState({
    key: "",
    value: "",
    category: "",
    notes: "",
  });

  // Budget form state
  const [budgetFormData, setBudgetFormData] = useState({
    name: "",
    category: "",
    amount: "",
    period: "monthly" as "monthly" | "quarterly" | "yearly" | "custom",
    startDate: new Date().toISOString().split("T")[0],
    endDate: "",
    isActive: true,
  });

  // Update URL when filters change
  const updateURL = useCallback(
    (updates: { page?: number; limit?: number; search?: string; category?: string }) => {
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

      if (updates.category !== undefined) {
        if (updates.category === "all") {
          params.delete("category");
        } else {
          params.set("category", updates.category);
        }
      }

      router.replace(`?${params.toString()}`, { scroll: false });
    },
    [searchParams, router]
  );

  const loadInvestments = useCallback(async (page: number = 1, pageLimit: number = 30, search: string = "", category: string = "all") => {
    try {
      setLoading(true);
      const data = await getInvestments(page, pageLimit, category !== "all" ? category : undefined, search.trim() || undefined);
      setInvestments(data.investments);
      setStatistics(data.statistics);
      setPagination(data.pagination);
    } catch (error: any) {
      console.error("Failed to load investments:", error);
      toast.error(error?.message || "Failed to load investments");
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
    const urlCategory = searchParams.get("category") || "all";

    if (urlPage !== currentPage) setCurrentPage(urlPage);
    if (urlLimit !== limit) setLimit(urlLimit);
    if (urlSearch !== searchQuery) {
      setSearchQuery(urlSearch);
      setSearchInput(urlSearch);
    }
    if (urlCategory !== categoryFilter) setCategoryFilter(urlCategory);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]); // Sync when URL params change

  useEffect(() => {
    loadInvestments(currentPage, limit, searchQuery, categoryFilter);
    loadBudgets();
  }, [currentPage, limit, searchQuery, categoryFilter, loadInvestments]);

  const loadBudgets = useCallback(
    async (page: number = 1, pageLimit: number = 30, search: string = "", category: string = "all", isActive: string = "all") => {
      try {
        setBudgetLoading(true);
        const data = await getBudgets(
          page,
          pageLimit,
          category !== "all" ? category : undefined,
          search.trim() || undefined,
          isActive !== "all" ? isActive === "active" : undefined
        );
        setBudgets(data.budgets);
        setBudgetPagination(data.pagination);
      } catch (error: any) {
        console.error("Failed to load budgets:", error);
        toast.error(error?.message || "Failed to load budgets");
      } finally {
        setBudgetLoading(false);
      }
    },
    []
  );

  // Update URL for budget filters
  const updateBudgetURL = useCallback(
    (updates: { budgetPage?: number; budgetLimit?: number; budgetSearch?: string; budgetCategory?: string; budgetActive?: string }) => {
      const params = new URLSearchParams(searchParams.toString());

      if (updates.budgetPage !== undefined) {
        if (updates.budgetPage === 1) {
          params.delete("budgetPage");
        } else {
          params.set("budgetPage", updates.budgetPage.toString());
        }
      }

      if (updates.budgetLimit !== undefined) {
        if (updates.budgetLimit === 30) {
          params.delete("budgetLimit");
        } else {
          params.set("budgetLimit", updates.budgetLimit.toString());
        }
      }

      if (updates.budgetSearch !== undefined) {
        if (updates.budgetSearch === "") {
          params.delete("budgetSearch");
        } else {
          params.set("budgetSearch", updates.budgetSearch);
        }
      }

      if (updates.budgetCategory !== undefined) {
        if (updates.budgetCategory === "all") {
          params.delete("budgetCategory");
        } else {
          params.set("budgetCategory", updates.budgetCategory);
        }
      }

      if (updates.budgetActive !== undefined) {
        if (updates.budgetActive === "all") {
          params.delete("budgetActive");
        } else {
          params.set("budgetActive", updates.budgetActive);
        }
      }

      router.replace(`?${params.toString()}`, { scroll: false });
    },
    [searchParams, router]
  );

  // Debounce budget search input
  useEffect(() => {
    const timer = setTimeout(() => {
      if (budgetSearchInput !== budgetSearchQuery) {
        setBudgetSearchQuery(budgetSearchInput);
        setBudgetCurrentPage(1);
        updateBudgetURL({ budgetSearch: budgetSearchInput, budgetPage: 1 });
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [budgetSearchInput, budgetSearchQuery, updateBudgetURL]);

  // Sync budget URL params when they change
  useEffect(() => {
    const urlBudgetPage = parseInt(searchParams.get("budgetPage") || "1", 10);
    const urlBudgetLimit = parseInt(searchParams.get("budgetLimit") || "30", 10);
    const urlBudgetSearch = searchParams.get("budgetSearch") || "";
    const urlBudgetCategory = searchParams.get("budgetCategory") || "all";
    const urlBudgetActive = searchParams.get("budgetActive") || "all";

    if (urlBudgetPage !== budgetCurrentPage) setBudgetCurrentPage(urlBudgetPage);
    if (urlBudgetLimit !== budgetLimit) setBudgetLimit(urlBudgetLimit);
    if (urlBudgetSearch !== budgetSearchQuery) {
      setBudgetSearchQuery(urlBudgetSearch);
      setBudgetSearchInput(urlBudgetSearch);
    }
    if (urlBudgetCategory !== budgetCategoryFilter) setBudgetCategoryFilter(urlBudgetCategory);
    if (urlBudgetActive !== budgetActiveFilter) setBudgetActiveFilter(urlBudgetActive);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  useEffect(() => {
    loadBudgets(budgetCurrentPage, budgetLimit, budgetSearchQuery, budgetCategoryFilter, budgetActiveFilter);
  }, [budgetCurrentPage, budgetLimit, budgetSearchQuery, budgetCategoryFilter, budgetActiveFilter, loadBudgets]);

  const handleBudgetPageChange = (newPage: number) => {
    setBudgetCurrentPage(newPage);
    updateBudgetURL({ budgetPage: newPage });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleBudgetLimitChange = (newLimit: number) => {
    setBudgetLimit(newLimit);
    setBudgetCurrentPage(1);
    updateBudgetURL({ budgetLimit: newLimit, budgetPage: 1 });
  };

  const handleBudgetSearchChange = (value: string) => {
    setBudgetSearchInput(value);
  };

  const handleBudgetCategoryChange = (category: string) => {
    setBudgetCategoryFilter(category);
    setBudgetCurrentPage(1);
    updateBudgetURL({ budgetCategory: category, budgetPage: 1 });
  };

  const handleBudgetActiveChange = (active: string) => {
    setBudgetActiveFilter(active);
    setBudgetCurrentPage(1);
    updateBudgetURL({ budgetActive: active, budgetPage: 1 });
  };

  const handleOpenDialog = (investment?: Investment) => {
    if (investment) {
      setEditingInvestment(investment);
      setFormData({
        key: investment.key,
        value: investment.value.toString(),
        category: investment.category || "",
        notes: investment.notes || "",
      });
    } else {
      setEditingInvestment(null);
      setFormData({
        key: "",
        value: "",
        category: "",
        notes: "",
      });
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingInvestment(null);
    setFormData({
      key: "",
      value: "",
      category: "",
      notes: "",
    });
  };

  const handleOpenBudgetDialog = (budget?: BudgetType) => {
    if (budget) {
      setEditingBudget(budget);
      setBudgetFormData({
        name: budget.name,
        category: budget.category || "",
        amount: budget.amount.toString(),
        period: budget.period,
        startDate: budget.startDate.split("T")[0],
        endDate: budget.endDate ? budget.endDate.split("T")[0] : "",
        isActive: budget.isActive,
      });
    } else {
      setEditingBudget(null);
      setBudgetFormData({
        name: "",
        category: "",
        amount: "",
        period: "monthly",
        startDate: new Date().toISOString().split("T")[0],
        endDate: "",
        isActive: true,
      });
    }
    setIsBudgetDialogOpen(true);
  };

  const handleCloseBudgetDialog = () => {
    setIsBudgetDialogOpen(false);
    setEditingBudget(null);
    setBudgetFormData({
      name: "",
      category: "",
      amount: "",
      period: "monthly",
      startDate: new Date().toISOString().split("T")[0],
      endDate: "",
      isActive: true,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.key.trim() || !formData.value.trim()) {
      toast.error("Please fill in all required fields");
      return;
    }

    const value = parseFloat(formData.value);
    if (isNaN(value) || value < 0) {
      toast.error("Please enter a valid positive number");
      return;
    }

    try {
      if (editingInvestment) {
        await updateInvestment(editingInvestment._id!, {
          key: formData.key.trim(),
          value,
          category: formData.category.trim() || undefined,
          notes: formData.notes.trim() || undefined,
        });
      } else {
        await createInvestment({
          key: formData.key.trim(),
          value,
          category: formData.category.trim() || undefined,
          notes: formData.notes.trim() || undefined,
        });
      }

      toast.success(editingInvestment ? "Investment updated successfully" : "Investment added successfully");
      handleCloseDialog();
      loadInvestments(currentPage, limit, searchQuery, categoryFilter);
      loadBudgets(budgetCurrentPage, budgetLimit, budgetSearchQuery, budgetCategoryFilter, budgetActiveFilter); // Reload budgets to update spending
    } catch (error: any) {
      toast.error(error.message || "Failed to save investment");
    }
  };

  const handleBudgetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!budgetFormData.name.trim() || !budgetFormData.amount.trim() || !budgetFormData.startDate) {
      toast.error("Please fill in all required fields");
      return;
    }

    const amount = parseFloat(budgetFormData.amount);
    if (isNaN(amount) || amount < 0) {
      toast.error("Please enter a valid positive number");
      return;
    }

    if (budgetFormData.period === "custom" && !budgetFormData.endDate) {
      toast.error("End date is required for custom period");
      return;
    }

    try {
      if (editingBudget) {
        await updateBudget(editingBudget._id!, {
          name: budgetFormData.name.trim(),
          category: budgetFormData.category.trim() || undefined,
          amount,
          period: budgetFormData.period,
          startDate: new Date(budgetFormData.startDate).toISOString(),
          endDate: budgetFormData.endDate ? new Date(budgetFormData.endDate).toISOString() : undefined,
          isActive: budgetFormData.isActive,
        });
      } else {
        await createBudget({
          name: budgetFormData.name.trim(),
          category: budgetFormData.category.trim() || undefined,
          amount,
          period: budgetFormData.period,
          startDate: new Date(budgetFormData.startDate).toISOString(),
          endDate: budgetFormData.endDate ? new Date(budgetFormData.endDate).toISOString() : undefined,
          isActive: budgetFormData.isActive,
        });
      }

      toast.success(editingBudget ? "Budget updated successfully" : "Budget created successfully");
      handleCloseBudgetDialog();
      loadBudgets(budgetCurrentPage, budgetLimit, budgetSearchQuery, budgetCategoryFilter, budgetActiveFilter);
    } catch (error: any) {
      toast.error(error.message || "Failed to save budget");
    }
  };

  const handleDelete = async () => {
    if (!deleteInvestment) return;

    try {
      const res = await fetch(`/api/investments/${deleteInvestment._id}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to delete investment");

      toast.success("Investment deleted successfully");
      setDeleteInvestment(null);
      loadInvestments(currentPage, limit, searchQuery, categoryFilter);
      loadBudgets();
    } catch (error) {
      toast.error("Failed to delete investment");
    }
  };

  const handleDeleteBudget = async () => {
    if (!budgetToDelete || !budgetToDelete._id) return;

    try {
      await deleteBudget(budgetToDelete._id);
      toast.success("Budget deleted successfully");
      setBudgetToDelete(null);
      loadBudgets(budgetCurrentPage, budgetLimit, budgetSearchQuery, budgetCategoryFilter, budgetActiveFilter);
    } catch (error: any) {
      toast.error(error.message || "Failed to delete budget");
    }
  };

  // Active budgets
  const activeBudgets = useMemo(() => {
    return budgets.filter((b) => b.isActive);
  }, [budgets]);

  // Get unique categories from both investments and budgets
  const categories = useMemo(() => {
    const cats = new Set<string>();
    investments.forEach((inv) => {
      if (inv.category) cats.add(inv.category);
    });
    budgets.forEach((budget) => {
      if (budget.category) cats.add(budget.category);
    });
    return Array.from(cats).sort();
  }, [investments, budgets]);

  // Category-based budget vs investment analysis
  const categoryAnalysis = useMemo(() => {
    const analysis: Record<
      string,
      {
        totalBudget: number;
        totalSpent: number;
        remaining: number;
        percentageUsed: number;
        investmentCount: number;
        budgetCount: number;
        isOverBudget: boolean;
        isNearLimit: boolean;
      }
    > = {};

    categories.forEach((category) => {
      const categoryBudgets = activeBudgets.filter((b) => b.category === category);
      const categoryInvestments = investments.filter((inv) => inv.category === category);

      const totalBudget = categoryBudgets.reduce((sum, b) => sum + b.amount, 0);
      const totalSpent = categoryInvestments.reduce((sum, inv) => sum + inv.value, 0);
      const remaining = totalBudget - totalSpent;
      const percentageUsed = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

      analysis[category] = {
        totalBudget,
        totalSpent,
        remaining,
        percentageUsed: Math.round(percentageUsed * 100) / 100,
        investmentCount: categoryInvestments.length,
        budgetCount: categoryBudgets.length,
        isOverBudget: totalSpent > totalBudget,
        isNearLimit: percentageUsed >= 80 && percentageUsed < 100,
      };
    });

    return analysis;
  }, [categories, activeBudgets, investments]);

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

  const handleCategoryChange = (category: string) => {
    setCategoryFilter(category);
    setCurrentPage(1);
    updateURL({ category, page: 1 });
  };

  // Budget alerts
  const budgetAlerts = useMemo(() => {
    return budgets.filter((b) => b.isActive && (b.isOverBudget || b.isNearLimit));
  }, [budgets]);

  return (
    <div className='w-full space-y-4 sm:space-y-6'>
      {/* Budget Alerts */}
      {budgetAlerts.length > 0 && (
        <Card className='border-orange-200 dark:border-orange-800 bg-orange-50/50 dark:bg-orange-950/20'>
          <CardHeader>
            <CardTitle className='flex items-center gap-2 text-orange-700 dark:text-orange-300'>
              <AlertTriangle className='h-5 w-5' />
              Budget Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='space-y-3'>
              {budgetAlerts.map((budget) => (
                <div
                  key={budget._id}
                  className='p-3 rounded-lg border border-orange-200 dark:border-orange-800 bg-white dark:bg-orange-950/10'
                >
                  <div className='flex items-center justify-between'>
                    <div>
                      <div className='font-semibold'>{budget.name}</div>
                      <div className='text-sm text-muted-foreground'>
                        {budget.category && <Badge variant='outline'>{budget.category}</Badge>}
                      </div>
                    </div>
                    <div className='text-right'>
                      {budget.isOverBudget ? (
                        <Badge variant='destructive' className='mb-2'>
                          Over Budget
                        </Badge>
                      ) : (
                        <Badge variant='outline' className='mb-2 bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300'>
                          Near Limit
                        </Badge>
                      )}
                      <div className='text-sm'>
                        <span className='text-muted-foreground'>Spent: </span>
                        <span className='font-semibold'>
                          {currencySymbol}
                          {budget.actualSpending?.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </span>
                        <span className='text-muted-foreground'> / </span>
                        <span>
                          {currencySymbol}
                          {budget.amount.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </span>
                      </div>
                      <div className='text-xs text-muted-foreground'>{budget.percentageUsed?.toFixed(1)}% used</div>
                    </div>
                  </div>
                  <Progress
                    value={Math.min(budget.percentageUsed || 0, 100)}
                    className='mt-2 h-2'
                    style={{
                      backgroundColor: budget.isOverBudget ? "rgb(239 68 68 / 0.2)" : "rgb(251 146 60 / 0.2)",
                    }}
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Statistics Cards */}
      {loading && !statistics ? (
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
      ) : statistics ? (
        <div className='grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'>
          {/* Total Investments */}
          <div className='group relative flex flex-row items-center justify-between p-4 sm:p-6 rounded-xl border-2 border-blue-200/50 bg-gradient-to-r from-blue-50/80 to-blue-100/40 dark:from-blue-950/20 dark:to-blue-900/10 dark:border-blue-800/30 transition-all duration-300 hover:shadow-lg hover:border-blue-300 dark:hover:border-blue-700/50'>
            <div className='flex flex-row items-center gap-3 sm:gap-4'>
              <div className='p-2 sm:p-3 rounded-xl bg-blue-100/80 dark:bg-blue-900/40 shadow-sm'>
                <DollarSign className='h-5 w-5 sm:h-6 sm:w-6 text-blue-600 dark:text-blue-400' />
              </div>
              <div className='flex flex-col'>
                <span className='text-[10px] sm:text-xs font-semibold text-blue-700/70 dark:text-blue-300/70 uppercase tracking-wide mb-1'>
                  Total Investments
                </span>
                <div className='text-xl sm:text-2xl font-bold text-blue-700 dark:text-blue-300'>
                  {currencySymbol}
                  {statistics?.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || "0.00"}
                </div>
                <p className='text-[10px] sm:text-xs text-blue-600/70 dark:text-blue-400/70 mt-1'>
                  {statistics?.count || 0} {statistics?.count === 1 ? "investment" : "investments"}
                </p>
              </div>
            </div>
            <div className='absolute right-2 top-2 opacity-10 group-hover:opacity-20 transition-opacity hidden sm:block'>
              <DollarSign className='h-12 w-12 sm:h-16 sm:w-16 text-blue-600 dark:text-blue-400' />
            </div>
          </div>

          {/* Average Investment */}
          <div className='group relative flex flex-row items-center justify-between p-4 sm:p-6 rounded-xl border-2 border-green-200/50 bg-gradient-to-r from-green-50/80 to-green-100/40 dark:from-green-950/20 dark:to-green-900/10 dark:border-green-800/30 transition-all duration-300 hover:shadow-lg hover:border-green-300 dark:hover:border-green-700/50'>
            <div className='flex flex-row items-center gap-3 sm:gap-4'>
              <div className='p-2 sm:p-3 rounded-xl bg-green-100/80 dark:bg-green-900/40 shadow-sm'>
                <Calculator className='h-5 w-5 sm:h-6 sm:w-6 text-green-600 dark:text-green-400' />
              </div>
              <div className='flex flex-col'>
                <span className='text-[10px] sm:text-xs font-semibold text-green-700/70 dark:text-green-300/70 uppercase tracking-wide mb-1'>
                  Average
                </span>
                <div className='text-xl sm:text-2xl font-bold text-green-700 dark:text-green-300'>
                  {currencySymbol}
                  {statistics?.average.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || "0.00"}
                </div>
                <p className='text-[10px] sm:text-xs text-green-600/70 dark:text-green-400/70 mt-1'>Per investment</p>
              </div>
            </div>
            <div className='absolute right-2 top-2 opacity-10 group-hover:opacity-20 transition-opacity hidden sm:block'>
              <Calculator className='h-12 w-12 sm:h-16 sm:w-16 text-green-600 dark:text-green-400' />
            </div>
          </div>

          {/* Total Budgets */}
          <div className='group relative flex flex-row items-center justify-between p-4 sm:p-6 rounded-xl border-2 border-indigo-200/50 bg-gradient-to-r from-indigo-50/80 to-indigo-100/40 dark:from-indigo-950/20 dark:to-indigo-900/10 dark:border-indigo-800/30 transition-all duration-300 hover:shadow-lg hover:border-indigo-300 dark:hover:border-indigo-700/50'>
            <div className='flex flex-row items-center gap-3 sm:gap-4'>
              <div className='p-2 sm:p-3 rounded-xl bg-indigo-100/80 dark:bg-indigo-900/40 shadow-sm'>
                <Target className='h-5 w-5 sm:h-6 sm:w-6 text-indigo-600 dark:text-indigo-400' />
              </div>
              <div className='flex flex-col'>
                <span className='text-[10px] sm:text-xs font-semibold text-indigo-700/70 dark:text-indigo-300/70 uppercase tracking-wide mb-1'>
                  Total Budgets
                </span>
                <div className='text-xl sm:text-2xl font-bold text-indigo-700 dark:text-indigo-300'>
                  {currencySymbol}
                  {activeBudgets
                    .reduce((sum, b) => sum + b.amount, 0)
                    .toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                </div>
                <p className='text-[10px] sm:text-xs text-indigo-600/70 dark:text-indigo-400/70 mt-1'>
                  {activeBudgets.length} {activeBudgets.length === 1 ? "budget" : "budgets"}
                </p>
              </div>
            </div>
            <div className='absolute right-2 top-2 opacity-10 group-hover:opacity-20 transition-opacity hidden sm:block'>
              <Target className='h-12 w-12 sm:h-16 sm:w-16 text-indigo-600 dark:text-indigo-400' />
            </div>
          </div>

          {/* Budget vs Actual */}
          <div className='group relative flex flex-row items-center justify-between p-4 sm:p-6 rounded-xl border-2 border-purple-200/50 bg-gradient-to-r from-purple-50/80 to-purple-100/40 dark:from-purple-950/20 dark:to-purple-900/10 dark:border-purple-800/30 transition-all duration-300 hover:shadow-lg hover:border-purple-300 dark:hover:border-purple-700/50'>
            <div className='flex flex-row items-center gap-3 sm:gap-4'>
              <div className='p-2 sm:p-3 rounded-xl bg-purple-100/80 dark:bg-purple-900/40 shadow-sm'>
                <Wallet className='h-5 w-5 sm:h-6 sm:w-6 text-purple-600 dark:text-purple-400' />
              </div>
              <div className='flex flex-col'>
                <span className='text-[10px] sm:text-xs font-semibold text-purple-700/70 dark:text-purple-300/70 uppercase tracking-wide mb-1'>
                  Budget Used
                </span>
                <div className='text-xl sm:text-2xl font-bold text-purple-700 dark:text-purple-300'>
                  {activeBudgets.length > 0
                    ? (
                        (activeBudgets.reduce((sum, b) => sum + (b.actualSpending || 0), 0) /
                          activeBudgets.reduce((sum, b) => sum + b.amount, 0)) *
                        100
                      ).toFixed(1)
                    : "0.0"}
                  %
                </div>
                <p className='text-[10px] sm:text-xs text-purple-600/70 dark:text-purple-400/70 mt-1'>Of total budgets</p>
              </div>
            </div>
            <div className='absolute right-2 top-2 opacity-10 group-hover:opacity-20 transition-opacity hidden sm:block'>
              <Wallet className='h-12 w-12 sm:h-16 sm:w-16 text-purple-600 dark:text-purple-400' />
            </div>
          </div>
        </div>
      ) : null}

      {/* Tabs for Investments and Budgets */}
      <Tabs defaultValue='investments' className='space-y-4'>
        <TabsList>
          <TabsTrigger value='investments'>Investments</TabsTrigger>
          <TabsTrigger value='budgets'>Budget Management</TabsTrigger>
        </TabsList>

        <TabsContent value='investments' className='space-y-4'>
          {/* Category-Based Budget vs Investment Visualization */}
          {Object.keys(categoryAnalysis).length > 0 && (
            <Card className='gap-0 p-3 md:p-4'>
              <CardHeader className='pb-3 p-0'>
                <CardTitle className='flex items-center gap-2 text-base sm:text-lg'>
                  <BarChart3 className='h-4 w-4 sm:h-5 sm:w-5' />
                  Budget vs Investment by Category
                </CardTitle>
              </CardHeader>
              <CardContent className='p-0'>
                <div className='grid gap-2 sm:gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'>
                  {Object.entries(categoryAnalysis).map(([category, data]) => (
                    <div
                      key={category}
                      className={`p-3 rounded-lg border transition-colors ${
                        data.isOverBudget
                          ? "border-destructive/50 bg-destructive/5"
                          : data.isNearLimit
                          ? "border-orange-200/50 dark:border-orange-800/50 bg-orange-50/30 dark:bg-orange-950/10"
                          : "bg-card hover:bg-accent/50"
                      }`}
                    >
                      <div className='flex items-center justify-between mb-2'>
                        <span className='font-semibold text-sm sm:text-base truncate flex-1'>{category}</span>
                        {data.isOverBudget ? (
                          <Badge variant='destructive' className='text-[10px] sm:text-xs ml-2 shrink-0'>
                            Over
                          </Badge>
                        ) : data.isNearLimit ? (
                          <Badge
                            variant='outline'
                            className='text-[10px] sm:text-xs bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300 ml-2 shrink-0'
                          >
                            Near
                          </Badge>
                        ) : (
                          <Badge variant='outline' className='text-[10px] sm:text-xs ml-2 shrink-0'>
                            OK
                          </Badge>
                        )}
                      </div>

                      <div className='space-y-1.5'>
                        <div className='flex items-center justify-between text-xs'>
                          <span className='text-muted-foreground'>Budget</span>
                          <span className='font-semibold'>
                            {currencySymbol}
                            {data.totalBudget.toLocaleString(undefined, {
                              minimumFractionDigits: 0,
                              maximumFractionDigits: 0,
                            })}
                          </span>
                        </div>
                        <div className='flex items-center justify-between text-xs'>
                          <span className='text-muted-foreground'>Spent</span>
                          <span className={`font-semibold ${data.isOverBudget ? "text-destructive" : "text-primary"}`}>
                            {currencySymbol}
                            {data.totalSpent.toLocaleString(undefined, {
                              minimumFractionDigits: 0,
                              maximumFractionDigits: 0,
                            })}
                          </span>
                        </div>
                        <div className='flex items-center justify-between text-xs'>
                          <span className='text-muted-foreground'>Remaining</span>
                          <span
                            className={`font-semibold ${data.remaining < 0 ? "text-destructive" : "text-green-600 dark:text-green-400"}`}
                          >
                            {currencySymbol}
                            {data.remaining.toLocaleString(undefined, {
                              minimumFractionDigits: 0,
                              maximumFractionDigits: 0,
                            })}
                          </span>
                        </div>
                        <Progress
                          value={Math.min(data.percentageUsed, 100)}
                          className='h-1.5 mt-1.5'
                          style={{
                            backgroundColor: data.isOverBudget
                              ? "rgb(239 68 68 / 0.2)"
                              : data.isNearLimit
                              ? "rgb(251 146 60 / 0.2)"
                              : "rgb(34 197 94 / 0.2)",
                          }}
                        />
                        <div className='flex items-center justify-between text-[10px] sm:text-xs text-muted-foreground mt-0.5'>
                          <span>{data.percentageUsed.toFixed(0)}%</span>
                          <span className='truncate ml-2'>
                            {data.investmentCount} inv / {data.budgetCount} bud
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Category Breakdown */}
          {statistics && Object.keys(statistics.byCategory).length > 0 && (
            <Card className='gap-0 p-3 md:p-4'>
              <CardHeader className='pb-3 p-0'>
                <CardTitle className='text-base sm:text-lg'>Investment by Category</CardTitle>
              </CardHeader>
              <CardContent className='p-0'>
                <div className='grid gap-2 sm:gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4'>
                  {Object.entries(statistics.byCategory).map(([category, data]) => (
                    <div key={category} className='p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors'>
                      <div className='flex items-center justify-between mb-1.5'>
                        <span className='font-semibold text-xs sm:text-sm truncate flex-1'>{category}</span>
                        <Badge variant='outline' className='text-[10px] sm:text-xs ml-2 shrink-0'>
                          {data.count}
                        </Badge>
                      </div>
                      <div className='text-base sm:text-lg font-bold text-primary'>
                        {currencySymbol}
                        {data.total.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                      </div>
                      <div className='text-[10px] sm:text-xs text-muted-foreground mt-0.5'>
                        Avg: {currencySymbol}
                        {(data.total / data.count).toLocaleString(undefined, {
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 0,
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Investments Table */}
          <Card className='shadow-sm border-2 p-3 md:p-4 gap-0'>
            <CardHeader className='p-0'>
              <div className='flex flex-col gap-3 sm:gap-4 mb-4'>
                <div className='flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4'>
                  <div>
                    <CardTitle className='text-base sm:text-lg font-bold'>All Investments</CardTitle>
                    <CardDescription className='mt-0.5 text-xs sm:text-sm'>
                      {loading ? "Loading..." : `${pagination.total} investment${pagination.total !== 1 ? "s" : ""} found`}
                    </CardDescription>
                  </div>
                  <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                      <Button onClick={() => handleOpenDialog()} className='w-full sm:w-auto h-9 sm:h-10'>
                        <Plus className='h-4 w-4 mr-2' />
                        <span className='hidden sm:inline'>Add Investment</span>
                        <span className='sm:hidden'>Add</span>
                      </Button>
                    </DialogTrigger>
                    <DialogContent className='max-w-2xl'>
                      <DialogHeader>
                        <DialogTitle>{editingInvestment ? "Edit Investment" : "Add New Investment"}</DialogTitle>
                      </DialogHeader>
                      <form onSubmit={handleSubmit} className='space-y-4 mt-4'>
                        <div className='space-y-2'>
                          <Label htmlFor='key'>
                            Reason/Description <span className='text-destructive'>*</span>
                          </Label>
                          <Input
                            id='key'
                            placeholder='e.g., Marketing campaign, Equipment purchase, etc.'
                            value={formData.key}
                            onChange={(e) => setFormData({ ...formData, key: e.target.value })}
                            required
                          />
                        </div>
                        <div className='grid grid-cols-2 gap-4'>
                          <div className='space-y-2'>
                            <Label htmlFor='value'>
                              Amount <span className='text-destructive'>*</span>
                            </Label>
                            <Input
                              id='value'
                              type='number'
                              step='0.01'
                              min='0'
                              placeholder='0.00'
                              value={formData.value}
                              onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                              required
                            />
                          </div>
                          <div className='space-y-2'>
                            <Label htmlFor='category'>Category (Optional)</Label>
                            <Input
                              id='category'
                              placeholder='e.g., Marketing, Operations, etc.'
                              value={formData.category}
                              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                            />
                          </div>
                        </div>
                        <div className='space-y-2'>
                          <Label htmlFor='notes'>Notes (Optional)</Label>
                          <Textarea
                            id='notes'
                            placeholder='Additional details about this investment...'
                            value={formData.notes}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            rows={3}
                          />
                        </div>
                        <DialogFooter>
                          <Button type='button' variant='outline' onClick={handleCloseDialog}>
                            Cancel
                          </Button>
                          <Button type='submit'>{editingInvestment ? "Update" : "Add"} Investment</Button>
                        </DialogFooter>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
              <div className='flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3'>
                <div className='relative flex-1 min-w-0'>
                  <Search className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none' />
                  <Input
                    placeholder='Search by reason, category, or notes...'
                    value={searchInput}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    className='pl-10 h-10 text-sm'
                  />
                </div>
                <Select value={categoryFilter} onValueChange={handleCategoryChange}>
                  <SelectTrigger className='h-10 w-full sm:w-[180px]'>
                    <Filter className='mr-2 h-4 w-4' />
                    <SelectValue placeholder='Filter by category' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='all'>All Categories</SelectItem>
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent className='p-0'>
              <div className='rounded-md overflow-x-auto'>
                {loading ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className='font-semibold'>Reason/Description</TableHead>
                        <TableHead className='font-semibold hidden sm:table-cell'>Category</TableHead>
                        <TableHead className='font-semibold'>Amount</TableHead>
                        <TableHead className='font-semibold hidden md:table-cell'>Date</TableHead>
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
                            <Skeleton className='h-6 w-20' />
                          </TableCell>
                          <TableCell>
                            <Skeleton className='h-4 w-16' />
                          </TableCell>
                          <TableCell className='hidden md:table-cell'>
                            <Skeleton className='h-4 w-20' />
                          </TableCell>
                          <TableCell className='text-right'>
                            <Skeleton className='h-8 w-16 ml-auto' />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : investments.length === 0 ? (
                  <div className='text-sm text-muted-foreground py-8 text-center'>
                    No investments yet. Click 'Add Investment' to get started.
                  </div>
                ) : (
                  <>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className='font-semibold'>Reason/Description</TableHead>
                          <TableHead className='font-semibold hidden sm:table-cell'>Category</TableHead>
                          <TableHead className='font-semibold'>Amount</TableHead>
                          <TableHead className='font-semibold hidden md:table-cell'>Date</TableHead>
                          <TableHead className='font-semibold text-right'>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {investments.map((investment) => (
                          <TableRow key={investment._id} className='hover:bg-accent/50'>
                            <TableCell>
                              <div className='flex flex-col gap-1'>
                                <div className='font-medium text-sm sm:text-base'>{investment.key}</div>
                                {investment.notes && <div className='text-xs text-muted-foreground sm:hidden'>{investment.notes}</div>}
                                <div className='flex items-center gap-2 text-xs text-muted-foreground sm:hidden'>
                                  {investment.category && (
                                    <>
                                      <Badge variant='outline' className='text-xs'>
                                        {investment.category}
                                      </Badge>
                                      <span>•</span>
                                    </>
                                  )}
                                  <span>{new Date(investment.createdAt).toLocaleDateString()}</span>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className='hidden sm:table-cell'>
                              {investment.category ? (
                                <Badge variant='outline'>{investment.category}</Badge>
                              ) : (
                                <span className='text-muted-foreground text-sm'>-</span>
                              )}
                            </TableCell>
                            <TableCell className='font-semibold'>
                              <div className='flex flex-col items-start gap-0.5'>
                                <span className='text-sm sm:text-base'>
                                  {currencySymbol}
                                  {investment.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                                <span className='text-xs text-muted-foreground sm:hidden'>Amount</span>
                              </div>
                            </TableCell>
                            <TableCell className='text-sm text-muted-foreground hidden md:table-cell'>
                              {new Date(investment.createdAt).toLocaleDateString()}
                            </TableCell>
                            <TableCell className='text-right'>
                              <div className='flex items-center gap-2 justify-end'>
                                <Button variant='ghost' size='sm' onClick={() => handleOpenDialog(investment)} className='h-8 w-8 p-0'>
                                  <Edit className='h-4 w-4' />
                                </Button>
                                <Button
                                  variant='ghost'
                                  size='sm'
                                  onClick={() => setDeleteInvestment(investment)}
                                  className='h-8 w-8 p-0 text-destructive hover:text-destructive'
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
                        itemName='investments'
                      />
                    )}
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value='budgets' className='space-y-4'>
          {/* Budgets Overview */}
          <Card className='shadow-sm border-2 p-3 md:p-4 gap-0'>
            <CardHeader className='p-0'>
              <div className='flex flex-col gap-3 sm:gap-4 mb-4'>
                <div className='flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4'>
                  <div>
                    <CardTitle className='text-base sm:text-lg font-bold'>Budget Management</CardTitle>
                    <CardDescription className='mt-0.5 text-xs sm:text-sm'>
                      {budgetLoading ? "Loading..." : `${budgetPagination.total} budget${budgetPagination.total !== 1 ? "s" : ""} found`}
                    </CardDescription>
                  </div>
                  <div className='flex items-center gap-2'>
                    <Button
                      variant='outline'
                      size='sm'
                      onClick={() =>
                        loadBudgets(budgetCurrentPage, budgetLimit, budgetSearchQuery, budgetCategoryFilter, budgetActiveFilter)
                      }
                      className='h-10'
                    >
                      <RefreshCw className='h-4 w-4' />
                    </Button>
                    <Dialog open={isBudgetDialogOpen} onOpenChange={setIsBudgetDialogOpen}>
                      <DialogTrigger asChild>
                        <Button onClick={() => handleOpenBudgetDialog()} className='h-10'>
                          <Plus className='h-4 w-4 mr-2' />
                          <span className='hidden sm:inline'>Create Budget</span>
                          <span className='sm:hidden'>Create</span>
                        </Button>
                      </DialogTrigger>
                      <DialogContent className='max-w-2xl'>
                        <DialogHeader>
                          <DialogTitle>{editingBudget ? "Edit Budget" : "Create New Budget"}</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleBudgetSubmit} className='space-y-4 mt-4'>
                          <div className='space-y-2'>
                            <Label htmlFor='budget-name'>
                              Budget Name <span className='text-destructive'>*</span>
                            </Label>
                            <Input
                              id='budget-name'
                              placeholder='e.g., Q1 Marketing Budget, Monthly Operations, etc.'
                              value={budgetFormData.name}
                              onChange={(e) => setBudgetFormData({ ...budgetFormData, name: e.target.value })}
                              required
                            />
                          </div>
                          <div className='grid grid-cols-2 gap-4'>
                            <div className='space-y-2'>
                              <Label htmlFor='budget-amount'>
                                Budget Amount <span className='text-destructive'>*</span>
                              </Label>
                              <Input
                                id='budget-amount'
                                type='number'
                                step='0.01'
                                min='0'
                                placeholder='0.00'
                                value={budgetFormData.amount}
                                onChange={(e) => setBudgetFormData({ ...budgetFormData, amount: e.target.value })}
                                required
                              />
                            </div>
                            <div className='space-y-2'>
                              <Label htmlFor='budget-category'>Category (Optional)</Label>
                              <Popover open={budgetCategoryInputOpen} onOpenChange={setBudgetCategoryInputOpen}>
                                <PopoverTrigger asChild>
                                  <Button
                                    variant='outline'
                                    role='combobox'
                                    className='w-full justify-between'
                                    onClick={(e) => {
                                      e.preventDefault();
                                      setBudgetCategoryInputOpen(true);
                                    }}
                                  >
                                    {budgetFormData.category || "Select or type category..."}
                                    <Filter className='ml-2 h-4 w-4 shrink-0 opacity-50' />
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent className='w-full p-0' align='start'>
                                  <Command>
                                    <CommandInput
                                      placeholder='Search or create category...'
                                      value={budgetFormData.category}
                                      onValueChange={(value) => setBudgetFormData({ ...budgetFormData, category: value })}
                                    />
                                    <CommandList>
                                      <CommandEmpty>
                                        <div className='p-2'>
                                          <Button
                                            variant='ghost'
                                            size='sm'
                                            className='w-full'
                                            onClick={() => {
                                              if (budgetFormData.category.trim()) {
                                                setBudgetCategoryInputOpen(false);
                                              }
                                            }}
                                          >
                                            Use "{budgetFormData.category}"
                                          </Button>
                                        </div>
                                      </CommandEmpty>
                                      <CommandGroup>
                                        {categories.map((category) => (
                                          <CommandItem
                                            key={category}
                                            value={category}
                                            onSelect={() => {
                                              setBudgetFormData({ ...budgetFormData, category });
                                              setBudgetCategoryInputOpen(false);
                                            }}
                                          >
                                            {category}
                                          </CommandItem>
                                        ))}
                                      </CommandGroup>
                                    </CommandList>
                                  </Command>
                                </PopoverContent>
                              </Popover>
                              {budgetFormData.category && (
                                <div className='flex items-center gap-2'>
                                  <Badge variant='secondary' className='flex items-center gap-1'>
                                    {budgetFormData.category}
                                    <X
                                      className='h-3 w-3 cursor-pointer'
                                      onClick={() => setBudgetFormData({ ...budgetFormData, category: "" })}
                                    />
                                  </Badge>
                                </div>
                              )}
                            </div>
                          </div>
                          <div className='grid grid-cols-2 gap-4'>
                            <div className='space-y-2'>
                              <Label htmlFor='budget-period'>
                                Period <span className='text-destructive'>*</span>
                              </Label>
                              <Select
                                value={budgetFormData.period}
                                onValueChange={(value: any) => setBudgetFormData({ ...budgetFormData, period: value })}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value='monthly'>Monthly</SelectItem>
                                  <SelectItem value='quarterly'>Quarterly</SelectItem>
                                  <SelectItem value='yearly'>Yearly</SelectItem>
                                  <SelectItem value='custom'>Custom</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className='space-y-2'>
                              <Label htmlFor='budget-start-date'>
                                Start Date <span className='text-destructive'>*</span>
                              </Label>
                              <Input
                                id='budget-start-date'
                                type='date'
                                value={budgetFormData.startDate}
                                onChange={(e) => setBudgetFormData({ ...budgetFormData, startDate: e.target.value })}
                                required
                              />
                            </div>
                          </div>
                          {budgetFormData.period === "custom" && (
                            <div className='space-y-2'>
                              <Label htmlFor='budget-end-date'>
                                End Date <span className='text-destructive'>*</span>
                              </Label>
                              <Input
                                id='budget-end-date'
                                type='date'
                                value={budgetFormData.endDate}
                                onChange={(e) => setBudgetFormData({ ...budgetFormData, endDate: e.target.value })}
                                required
                              />
                            </div>
                          )}
                          <div className='flex items-center space-x-2'>
                            <input
                              type='checkbox'
                              id='budget-active'
                              checked={budgetFormData.isActive}
                              onChange={(e) => setBudgetFormData({ ...budgetFormData, isActive: e.target.checked })}
                              className='rounded border-gray-300'
                            />
                            <Label htmlFor='budget-active' className='font-normal cursor-pointer'>
                              Active Budget
                            </Label>
                          </div>
                          <DialogFooter>
                            <Button type='button' variant='outline' onClick={handleCloseBudgetDialog}>
                              Cancel
                            </Button>
                            <Button type='submit'>{editingBudget ? "Update" : "Create"} Budget</Button>
                          </DialogFooter>
                        </form>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
                <div className='flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3'>
                  <div className='relative flex-1 min-w-0'>
                    <Search className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none' />
                    <Input
                      placeholder='Search by name or category...'
                      value={budgetSearchInput}
                      onChange={(e) => handleBudgetSearchChange(e.target.value)}
                      className='pl-10 h-10 text-sm'
                    />
                  </div>
                  <Select value={budgetCategoryFilter} onValueChange={handleBudgetCategoryChange}>
                    <SelectTrigger className='h-10 w-full sm:w-[140px]'>
                      <Filter className='mr-2 h-4 w-4' />
                      <SelectValue placeholder='Category' />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='all'>All Categories</SelectItem>
                      {categories.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={budgetActiveFilter} onValueChange={handleBudgetActiveChange}>
                    <SelectTrigger className='h-10 w-full sm:w-40'>
                      <SelectValue placeholder='Status' />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='all'>All Status</SelectItem>
                      <SelectItem value='active'>Active</SelectItem>
                      <SelectItem value='inactive'>Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent className='p-0'>
              <div className='rounded-md overflow-x-auto'>
                {budgetLoading ? (
                  <div className='space-y-3 p-4'>
                    {Array.from({ length: budgetLimit }).map((_, i) => (
                      <div key={i} className='p-3 rounded-lg border bg-card'>
                        <div className='flex items-start justify-between mb-2'>
                          <Skeleton className='h-5 w-32' />
                          <Skeleton className='h-6 w-16' />
                        </div>
                        <Skeleton className='h-4 w-24 mb-2' />
                        <Skeleton className='h-2 w-full mb-2' />
                        <div className='grid grid-cols-3 gap-2'>
                          <Skeleton className='h-4 w-16' />
                          <Skeleton className='h-4 w-16' />
                          <Skeleton className='h-4 w-16' />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : budgets.length === 0 ? (
                  <div className='text-sm text-muted-foreground py-8 text-center'>
                    No budgets found. Click 'Create Budget' to get started.
                  </div>
                ) : (
                  <>
                    <div className='space-y-2 p-4'>
                      {budgets.map((budget) => (
                        <div
                          key={budget._id}
                          className={`p-3 rounded-lg border transition-colors ${
                            budget.isOverBudget
                              ? "border-destructive/50 bg-destructive/5"
                              : budget.isNearLimit
                              ? "border-orange-200/50 dark:border-orange-800/50 bg-orange-50/30 dark:bg-orange-950/10"
                              : "bg-card hover:bg-accent/50"
                          }`}
                        >
                          <div className='flex items-start justify-between mb-2'>
                            <div className='flex-1 min-w-0'>
                              <div className='flex items-center gap-2 mb-1 flex-wrap'>
                                <h3 className='font-semibold text-sm sm:text-base truncate'>{budget.name}</h3>
                                {budget.isActive ? (
                                  <Badge
                                    variant='outline'
                                    className='text-[10px] sm:text-xs bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 shrink-0'
                                  >
                                    Active
                                  </Badge>
                                ) : (
                                  <Badge variant='outline' className='text-[10px] sm:text-xs shrink-0'>
                                    Inactive
                                  </Badge>
                                )}
                                {budget.category && (
                                  <Badge variant='secondary' className='text-[10px] sm:text-xs shrink-0'>
                                    {budget.category}
                                  </Badge>
                                )}
                              </div>
                              <div className='flex items-center gap-3 text-xs text-muted-foreground flex-wrap'>
                                <div className='flex items-center gap-1'>
                                  <Calendar className='h-3 w-3' />
                                  <span className='truncate'>
                                    {new Date(budget.startDate).toLocaleDateString()} -{" "}
                                    {budget.endDate ? new Date(budget.endDate).toLocaleDateString() : "Ongoing"}
                                  </span>
                                </div>
                                <div className='flex items-center gap-1'>
                                  <Target className='h-3 w-3' />
                                  <span className='capitalize'>{budget.period}</span>
                                </div>
                              </div>
                            </div>
                            <div className='flex items-center gap-1 ml-2 shrink-0'>
                              <Button variant='ghost' size='sm' onClick={() => handleOpenBudgetDialog(budget)} className='h-7 w-7 p-0'>
                                <Edit className='h-3.5 w-3.5' />
                              </Button>
                              <Button
                                variant='ghost'
                                size='sm'
                                onClick={() => setBudgetToDelete(budget)}
                                className='h-7 w-7 p-0 text-destructive hover:text-destructive'
                              >
                                <Trash2 className='h-3.5 w-3.5' />
                              </Button>
                            </div>
                          </div>
                          <div className='space-y-1.5'>
                            <div className='flex items-center justify-between text-xs'>
                              <span className='text-muted-foreground'>Budget vs Actual</span>
                              <span className='font-semibold'>{budget.percentageUsed?.toFixed(0)}% used</span>
                            </div>
                            <Progress
                              value={Math.min(budget.percentageUsed || 0, 100)}
                              className='h-1.5'
                              style={{
                                backgroundColor: budget.isOverBudget
                                  ? "rgb(239 68 68 / 0.2)"
                                  : budget.isNearLimit
                                  ? "rgb(251 146 60 / 0.2)"
                                  : "rgb(34 197 94 / 0.2)",
                              }}
                            />
                            <div className='grid grid-cols-3 gap-2 text-xs'>
                              <div>
                                <div className='text-muted-foreground text-[10px]'>Budget</div>
                                <div className='font-semibold'>
                                  {currencySymbol}
                                  {budget.amount.toLocaleString(undefined, {
                                    minimumFractionDigits: 0,
                                    maximumFractionDigits: 0,
                                  })}
                                </div>
                              </div>
                              <div>
                                <div className='text-muted-foreground text-[10px]'>Spent</div>
                                <div className={`font-semibold ${budget.isOverBudget ? "text-destructive" : "text-primary"}`}>
                                  {currencySymbol}
                                  {budget.actualSpending?.toLocaleString(undefined, {
                                    minimumFractionDigits: 0,
                                    maximumFractionDigits: 0,
                                  }) || "0"}
                                </div>
                              </div>
                              <div>
                                <div className='text-muted-foreground text-[10px]'>Remaining</div>
                                <div
                                  className={`font-semibold ${
                                    budget.remaining && budget.remaining < 0 ? "text-destructive" : "text-green-600 dark:text-green-400"
                                  }`}
                                >
                                  {currencySymbol}
                                  {budget.remaining?.toLocaleString(undefined, {
                                    minimumFractionDigits: 0,
                                    maximumFractionDigits: 0,
                                  }) ||
                                    budget.amount.toLocaleString(undefined, {
                                      minimumFractionDigits: 0,
                                      maximumFractionDigits: 0,
                                    })}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    {budgetPagination.totalPages > 1 && (
                      <Pagination
                        pagination={budgetPagination}
                        currentPage={budgetCurrentPage}
                        limit={budgetLimit}
                        onPageChange={handleBudgetPageChange}
                        onLimitChange={handleBudgetLimitChange}
                        loading={budgetLoading}
                        itemName='budgets'
                      />
                    )}
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Delete Confirmation Dialogs */}
      <AlertDialog open={!!deleteInvestment} onOpenChange={(open) => !open && setDeleteInvestment(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Investment</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this investment? This action cannot be undone.
              {deleteInvestment && (
                <div className='mt-2 p-2 bg-muted rounded'>
                  <div className='font-medium'>{deleteInvestment.key}</div>
                  <div className='text-sm'>
                    {currencySymbol}
                    {deleteInvestment.value.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </div>
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

      <AlertDialog open={!!budgetToDelete} onOpenChange={(open) => !open && setBudgetToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Budget</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this budget? This action cannot be undone.
              {budgetToDelete && (
                <div className='mt-2 p-2 bg-muted rounded'>
                  <div className='font-medium'>{budgetToDelete.name}</div>
                  <div className='text-sm'>
                    Budget: {currencySymbol}
                    {budgetToDelete.amount.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </div>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteBudget} className='bg-destructive text-destructive-foreground'>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
