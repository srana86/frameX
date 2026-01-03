"use client";

import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { ProductCategory } from "@/lib/types";
import { apiRequest } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "sonner";
import {
  Plus,
  Edit,
  Trash2,
  ArrowUp,
  ArrowDown,
  GripVertical,
  Save,
  Tag,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  Package,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

type PaginationData = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
};

type InitialData = {
  categories: ProductCategory[];
  pagination: PaginationData;
};

interface CategoriesClientProps {
  initialData: InitialData;
}

export function CategoriesClient({ initialData }: CategoriesClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Get initial values from URL or use defaults
  const initialPage = parseInt(searchParams.get("page") || "1", 10);
  const initialLimit = parseInt(searchParams.get("limit") || "30", 10);

  // Check if initial data matches URL params
  const shouldUseInitialData = initialData.pagination.page === initialPage && initialData.pagination.limit === initialLimit;

  const [categories, setCategories] = useState<ProductCategory[]>(shouldUseInitialData ? initialData.categories : []);
  const [pagination, setPagination] = useState<PaginationData>(
    shouldUseInitialData
      ? initialData.pagination
      : { page: initialPage, limit: initialLimit, total: 0, totalPages: 0, hasNextPage: false, hasPrevPage: false }
  );
  const [loading, setLoading] = useState(!shouldUseInitialData);
  const [saving, setSaving] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ProductCategory | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [categoryName, setCategoryName] = useState("");
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [limit, setLimit] = useState(initialLimit);
  const isInitialMount = useRef(true);

  // Calculate statistics based on total from pagination
  const stats = useMemo(() => {
    return {
      totalCategories: pagination.total,
      averageOrder: categories.length > 0 ? Math.round(categories.reduce((sum, c) => sum + (c.order || 0), 0) / categories.length) : 0,
      highestOrder: categories.length > 0 ? Math.max(...categories.map((c) => c.order || 0)) : 0,
      lowestOrder: categories.length > 0 ? Math.min(...categories.map((c) => c.order || 0)) : 0,
    };
  }, [categories, pagination.total]);

  // Update URL when pagination changes
  const updateURL = useCallback(
    (updates: { page?: number; limit?: number }) => {
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

      router.replace(`?${params.toString()}`, { scroll: false });
    },
    [searchParams, router]
  );

  const fetchCategories = useCallback(async (page: number = 1, limit: number = 30) => {
    setLoading(true);
    try {
      const res: any = await apiRequest("GET", "/products/categories", undefined, {
        page: page.toString(),
        limit: limit.toString(),
      });

      if (res && res.success) {
        setCategories(res.data.categories);
        setPagination({
          page: res.meta.page,
          limit: res.meta.limit,
          total: res.meta.total,
          totalPages: res.meta.totalPage,
          hasNextPage: res.meta.page < res.meta.totalPage,
          hasPrevPage: res.meta.page > 1,
        });
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
      toast.error("Failed to load categories");
    } finally {
      setLoading(false);
    }
  }, []);

  // Sync URL params when they change and fetch if needed
  useEffect(() => {
    const urlPage = parseInt(searchParams.get("page") || "1", 10);
    const urlLimit = parseInt(searchParams.get("limit") || "30", 10);

    // On initial mount, check if we need to fetch
    if (isInitialMount.current) {
      isInitialMount.current = false;
      // If URL params don't match initial data, fetch
      if (urlPage !== initialData.pagination.page || urlLimit !== initialData.pagination.limit) {
        setCurrentPage(urlPage);
        setLimit(urlLimit);
        fetchCategories(urlPage, urlLimit);
      }
      return;
    }

    // Update state if URL changed
    if (urlPage !== currentPage) {
      setCurrentPage(urlPage);
    }
    if (urlLimit !== limit) {
      setLimit(urlLimit);
    }

    // Fetch if URL params don't match current data
    const needsFetch = urlPage !== pagination.page || urlLimit !== pagination.limit;
    if (needsFetch) {
      fetchCategories(urlPage, urlLimit);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]); // Only depend on searchParams to avoid loops

  const handleNewCategory = () => {
    setEditingCategory(null);
    setCategoryName("");
    setIsDialogOpen(true);
  };

  const handleEdit = (category: ProductCategory) => {
    setEditingCategory(category);
    setCategoryName(category.name);
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!categoryName.trim()) {
      toast.error("Please enter a category name");
      return;
    }

    setSaving(true);
    try {
      if (editingCategory) {
        // Update existing category
        await apiRequest("PUT", `/products/categories/${editingCategory.id}`, {
          name: categoryName.trim()
        });
        toast.success("Category updated successfully");
      } else {
        // Create new category
        await apiRequest("POST", "/products/categories", {
          name: categoryName.trim()
        });
        toast.success("Category created successfully");
      }

      setIsDialogOpen(false);
      fetchCategories(currentPage, limit);
    } catch (error: any) {
      toast.error(error.message || "Failed to save category");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    const idToDelete = deleteId;
    if (!idToDelete) return;

    try {
      await apiRequest("DELETE", `/products/categories/${idToDelete}`);

      toast.success("Category deleted successfully");
      setDeleteId(null);
      fetchCategories(currentPage, limit);
    } catch (error) {
      toast.error("Failed to delete category");
      setDeleteId(null);
    }
  };

  const moveCategory = async (index: number, direction: "up" | "down") => {
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= categories.length) return;

    const newCategories = [...categories];
    [newCategories[index], newCategories[newIndex]] = [newCategories[newIndex], newCategories[index]];

    setCategories(newCategories);

    // Update order in database
    try {
      await apiRequest("PUT", "/products/categories", {
        categories: newCategories.map((c, i) => ({ id: c.id, order: i }))
      });

      fetchCategories(currentPage, limit);
    } catch (error) {
      toast.error("Failed to update order");
      fetchCategories(currentPage, limit); // Reload to revert
    }
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverIndex(index);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = async (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    setDragOverIndex(null);

    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      return;
    }

    const newCategories = [...categories];
    const [removed] = newCategories.splice(draggedIndex, 1);
    newCategories.splice(dropIndex, 0, removed);

    setCategories(newCategories);
    setDraggedIndex(null);

    try {
      await apiRequest("PUT", "/products/categories", {
        categories: newCategories.map((c, i) => ({ id: c.id, order: i }))
      });
      fetchCategories(currentPage, limit);
    } catch (error) {
      toast.error("Failed to update order");
      fetchCategories(currentPage, limit); // Reload to revert
    }
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handlePageChange = useCallback(
    (newPage: number) => {
      setCurrentPage(newPage);
      updateURL({ page: newPage });
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    [updateURL]
  );

  const handleLimitChange = useCallback(
    (newLimit: string) => {
      const limitNum = parseInt(newLimit, 10);
      setLimit(limitNum);
      setCurrentPage(1);
      updateURL({ limit: limitNum, page: 1 });
    },
    [updateURL]
  );

  // Skeleton Component
  const ListSkeleton = () => (
    <div className='space-y-2'>
      {[...Array(5)].map((_, i) => (
        <div key={i} className='flex items-center gap-3 rounded-lg border p-3 sm:p-4'>
          <Skeleton className='h-5 w-5' />
          <div className='flex-1 space-y-2'>
            <Skeleton className='h-4 w-32 sm:w-48' />
            <Skeleton className='h-3 w-16 sm:hidden' />
          </div>
          <div className='flex items-center gap-2'>
            <Skeleton className='h-8 w-8' />
            <Skeleton className='h-8 w-8' />
            <Skeleton className='h-8 w-8' />
            <Skeleton className='h-8 w-8' />
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className='w-full space-y-4 sm:space-y-5 md:space-y-6'>
      {/* Header */}
      <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'>
        <div>
          <h2 className='text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100'>Categories</h2>
          <p className='text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1'>Manage product categories and their display order</p>
        </div>
        <Button onClick={handleNewCategory} className='bg-primary hover:bg-primary/90 text-white h-9 sm:h-10 w-full sm:w-auto'>
          <Plus className='w-4 h-4 mr-2' />
          New Category
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className='grid gap-3 sm:gap-4 md:grid-cols-2 lg:grid-cols-4'>
        {/* Total Categories */}
        <div className='group relative flex flex-row items-center justify-between p-3 sm:p-4 md:p-5 rounded-xl border-2 border-blue-200/50 bg-gradient-to-r from-blue-50/80 to-blue-100/40 dark:from-blue-950/20 dark:to-blue-900/10 dark:border-blue-800/30 transition-all duration-300 hover:shadow-lg hover:border-blue-300 dark:hover:border-blue-700/50'>
          <div className='flex flex-row items-center gap-2 sm:gap-3 md:gap-4'>
            <div className='p-2 sm:p-2.5 md:p-3 rounded-xl bg-blue-100/80 dark:bg-blue-900/40 shadow-sm'>
              <Tag className='h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-blue-600 dark:text-blue-400' />
            </div>
            <div className='flex flex-col min-w-0 flex-1'>
              <span className='text-[10px] sm:text-xs font-semibold text-blue-700/70 dark:text-blue-300/70 uppercase tracking-wide mb-0.5 sm:mb-1'>
                Total Categories
              </span>
              <div className='text-lg sm:text-xl md:text-2xl font-bold text-blue-700 dark:text-blue-300'>
                {stats.totalCategories.toLocaleString()}
              </div>
              <p className='text-[10px] sm:text-xs text-blue-600/70 dark:text-blue-400/70 mt-0.5 sm:mt-1'>All categories</p>
            </div>
          </div>
          <div className='absolute right-1 sm:right-2 top-1 sm:top-2 opacity-10 group-hover:opacity-20 transition-opacity hidden sm:block'>
            <Tag className='h-12 w-12 sm:h-16 sm:w-16 text-blue-600 dark:text-blue-400' />
          </div>
        </div>

        {/* Average Order */}
        <div className='group relative flex flex-row items-center justify-between p-3 sm:p-4 md:p-5 rounded-xl border-2 border-purple-200/50 bg-gradient-to-r from-purple-50/80 to-purple-100/40 dark:from-purple-950/20 dark:to-purple-900/10 dark:border-purple-800/30 transition-all duration-300 hover:shadow-lg hover:border-purple-300 dark:hover:border-purple-700/50'>
          <div className='flex flex-row items-center gap-2 sm:gap-3 md:gap-4'>
            <div className='p-2 sm:p-2.5 md:p-3 rounded-xl bg-purple-100/80 dark:bg-purple-900/40 shadow-sm'>
              <TrendingUp className='h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-purple-600 dark:text-purple-400' />
            </div>
            <div className='flex flex-col min-w-0 flex-1'>
              <span className='text-[10px] sm:text-xs font-semibold text-purple-700/70 dark:text-purple-300/70 uppercase tracking-wide mb-0.5 sm:mb-1'>
                Avg. Order
              </span>
              <div className='text-lg sm:text-xl md:text-2xl font-bold text-purple-700 dark:text-purple-300'>
                {stats.averageOrder.toLocaleString()}
              </div>
              <p className='text-[10px] sm:text-xs text-purple-600/70 dark:text-purple-400/70 mt-0.5 sm:mt-1'>Average display order</p>
            </div>
          </div>
          <div className='absolute right-1 sm:right-2 top-1 sm:top-2 opacity-10 group-hover:opacity-20 transition-opacity hidden sm:block'>
            <TrendingUp className='h-12 w-12 sm:h-16 sm:w-16 text-purple-600 dark:text-purple-400' />
          </div>
        </div>

        {/* Highest Order */}
        <div className='group relative flex flex-row items-center justify-between p-3 sm:p-4 md:p-5 rounded-xl border-2 border-green-200/50 bg-gradient-to-r from-green-50/80 to-green-100/40 dark:from-green-950/20 dark:to-green-900/10 dark:border-green-800/30 transition-all duration-300 hover:shadow-lg hover:border-green-300 dark:hover:border-green-700/50'>
          <div className='flex flex-row items-center gap-2 sm:gap-3 md:gap-4'>
            <div className='p-2 sm:p-2.5 md:p-3 rounded-xl bg-green-100/80 dark:bg-green-900/40 shadow-sm'>
              <ArrowUp className='h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-green-600 dark:text-green-400' />
            </div>
            <div className='flex flex-col min-w-0 flex-1'>
              <span className='text-[10px] sm:text-xs font-semibold text-green-700/70 dark:text-green-300/70 uppercase tracking-wide mb-0.5 sm:mb-1'>
                Highest Order
              </span>
              <div className='text-lg sm:text-xl md:text-2xl font-bold text-green-700 dark:text-green-300'>
                {stats.highestOrder.toLocaleString()}
              </div>
              <p className='text-[10px] sm:text-xs text-green-600/70 dark:text-green-400/70 mt-0.5 sm:mt-1'>Top display position</p>
            </div>
          </div>
          <div className='absolute right-1 sm:right-2 top-1 sm:top-2 opacity-10 group-hover:opacity-20 transition-opacity hidden sm:block'>
            <ArrowUp className='h-12 w-12 sm:h-16 sm:w-16 text-green-600 dark:text-green-400' />
          </div>
        </div>

        {/* Lowest Order */}
        <div className='group relative flex flex-row items-center justify-between p-3 sm:p-4 md:p-5 rounded-xl border-2 border-orange-200/50 bg-gradient-to-r from-orange-50/80 to-orange-100/40 dark:from-orange-950/20 dark:to-orange-900/10 dark:border-orange-800/30 transition-all duration-300 hover:shadow-lg hover:border-orange-300 dark:hover:border-orange-700/50'>
          <div className='flex flex-row items-center gap-2 sm:gap-3 md:gap-4'>
            <div className='p-2 sm:p-2.5 md:p-3 rounded-xl bg-orange-100/80 dark:bg-orange-900/40 shadow-sm'>
              <ArrowDown className='h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-orange-600 dark:text-orange-400' />
            </div>
            <div className='flex flex-col min-w-0 flex-1'>
              <span className='text-[10px] sm:text-xs font-semibold text-orange-700/70 dark:text-orange-300/70 uppercase tracking-wide mb-0.5 sm:mb-1'>
                Lowest Order
              </span>
              <div className='text-lg sm:text-xl md:text-2xl font-bold text-orange-700 dark:text-orange-300'>
                {stats.lowestOrder.toLocaleString()}
              </div>
              <p className='text-[10px] sm:text-xs text-orange-600/70 dark:text-orange-400/70 mt-0.5 sm:mt-1'>Bottom display position</p>
            </div>
          </div>
          <div className='absolute right-1 sm:right-2 top-1 sm:top-2 opacity-10 group-hover:opacity-20 transition-opacity hidden sm:block'>
            <ArrowDown className='h-12 w-12 sm:h-16 sm:w-16 text-orange-600 dark:text-orange-400' />
          </div>
        </div>
      </div>

      {/* Category List Card */}
      <Card className='shadow-sm border-2 gap-0 pt-0 border-slate-200/50 dark:border-slate-800/50 bg-gradient-to-br from-slate-50/50 to-white dark:from-slate-950/50 dark:to-slate-900/30 overflow-hidden'>
        <CardHeader className='p-4 sm:p-5 md:p-6 border-b border-slate-200/50 dark:border-slate-800/30 bg-gradient-to-r from-slate-50/80 to-white dark:from-slate-900/40 dark:to-slate-950/20'>
          <div>
            <CardTitle className='text-lg sm:text-xl md:text-2xl font-bold text-slate-900 dark:text-slate-100'>Category List</CardTitle>
            <CardDescription className='text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1'>
              Drag or use arrows to reorder categories. The order affects how they appear on the home page.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className='p-3 sm:p-4 md:p-5'>
          {loading ? (
            <ListSkeleton />
          ) : categories.length === 0 ? (
            <div className='text-center py-12 sm:py-16'>
              <Package className='h-12 w-12 sm:h-16 sm:w-16 mx-auto text-slate-400 dark:text-slate-500 mb-4' />
              <p className='text-sm sm:text-base text-slate-600 dark:text-slate-400 font-medium'>No categories yet</p>
              <p className='text-xs sm:text-sm text-slate-500 dark:text-slate-500 mt-1'>Create your first category to get started</p>
            </div>
          ) : (
            <>
              <div className='space-y-2'>
                {categories.map((category, index) => (
                  <div
                    key={category.id}
                    draggable
                    onDragStart={() => handleDragStart(index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, index)}
                    onDragEnd={handleDragEnd}
                    className={`flex items-center gap-3 rounded-lg border p-3 sm:p-4 transition-all ${draggedIndex === index
                      ? "opacity-50 cursor-grabbing"
                      : dragOverIndex === index
                        ? "border-primary bg-primary/5 scale-[1.02]"
                        : "hover:bg-accent/50 cursor-grab"
                      }`}
                  >
                    <div className='flex items-center gap-2 cursor-grab active:cursor-grabbing' onMouseDown={(e) => e.stopPropagation()}>
                      <GripVertical className='w-4 h-4 sm:w-5 sm:h-5 text-slate-400 dark:text-slate-500' />
                    </div>
                    <div className='flex-1 select-none min-w-0'>
                      <div className='font-medium text-sm sm:text-base text-slate-900 dark:text-slate-100'>{category.name}</div>
                      <div className='text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5'>Order: {category.order}</div>
                    </div>
                    <div className='flex items-center gap-1.5 sm:gap-2' onClick={(e) => e.stopPropagation()}>
                      <Button
                        variant='ghost'
                        size='sm'
                        onClick={(e) => {
                          e.stopPropagation();
                          moveCategory(index, "up");
                        }}
                        disabled={index === 0}
                        className='h-8 w-8 p-0'
                      >
                        <ArrowUp className='w-4 h-4' />
                      </Button>
                      <Button
                        variant='ghost'
                        size='sm'
                        onClick={(e) => {
                          e.stopPropagation();
                          moveCategory(index, "down");
                        }}
                        disabled={index === categories.length - 1}
                        className='h-8 w-8 p-0'
                      >
                        <ArrowDown className='w-4 h-4' />
                      </Button>
                      <Button
                        variant='ghost'
                        size='sm'
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEdit(category);
                        }}
                        className='h-8 w-8 p-0'
                      >
                        <Edit className='w-4 h-4' />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant='ghost'
                            size='sm'
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteId(category.id);
                            }}
                            className='h-8 w-8 p-0 text-destructive hover:text-destructive'
                          >
                            <Trash2 className='w-4 h-4' />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will permanently delete the category "{category.name}". This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel onClick={() => setDeleteId(null)}>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={async () => {
                                if (deleteId) {
                                  await handleDelete();
                                }
                              }}
                              className='bg-destructive text-destructive-foreground'
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className='flex flex-col sm:flex-row items-center justify-between gap-4 mt-4 sm:mt-6 pt-4 border-t border-slate-200 dark:border-slate-800'>
                  <div className='flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4'>
                    <div className='text-xs sm:text-sm text-slate-600 dark:text-slate-400'>
                      Showing {(currentPage - 1) * limit + 1} to {Math.min(currentPage * limit, pagination.total)} of {pagination.total}{" "}
                      categories
                    </div>
                    <Select value={limit.toString()} onValueChange={handleLimitChange}>
                      <SelectTrigger className='h-8 w-[120px] text-xs sm:text-sm border-slate-300 dark:border-slate-700'>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value='10'>10 per page</SelectItem>
                        <SelectItem value='20'>20 per page</SelectItem>
                        <SelectItem value='30'>30 per page</SelectItem>
                        <SelectItem value='50'>50 per page</SelectItem>
                        <SelectItem value='100'>100 per page</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className='flex items-center gap-2'>
                    <Button
                      variant='outline'
                      size='sm'
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={!pagination.hasPrevPage || loading}
                      className='h-8 px-3 text-xs sm:text-sm'
                    >
                      <ChevronLeft className='h-4 w-4 mr-1' />
                      Previous
                    </Button>
                    <div className='flex items-center gap-1'>
                      {[...Array(Math.min(5, pagination.totalPages))].map((_, i) => {
                        let pageNum;
                        if (pagination.totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (currentPage >= pagination.totalPages - 2) {
                          pageNum = pagination.totalPages - 4 + i;
                        } else {
                          pageNum = currentPage - 2 + i;
                        }
                        return (
                          <Button
                            key={pageNum}
                            variant={currentPage === pageNum ? "default" : "outline"}
                            size='sm'
                            onClick={() => handlePageChange(pageNum)}
                            disabled={loading}
                            className={`h-8 w-8 px-0 text-xs sm:text-sm ${currentPage === pageNum ? "bg-primary text-white" : ""}`}
                          >
                            {pageNum}
                          </Button>
                        );
                      })}
                    </div>
                    <Button
                      variant='outline'
                      size='sm'
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={!pagination.hasNextPage || loading}
                      className='h-8 px-3 text-xs sm:text-sm'
                    >
                      Next
                      <ChevronRight className='h-4 w-4 ml-1' />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingCategory ? "Edit Category" : "Create New Category"}</DialogTitle>
            <DialogDescription>{editingCategory ? "Update the category name." : "Create a new product category."}</DialogDescription>
          </DialogHeader>

          <div className='space-y-4 py-4'>
            <div className='space-y-2'>
              <Label htmlFor='categoryName'>Category Name *</Label>
              <Input
                id='categoryName'
                value={categoryName}
                onChange={(e) => setCategoryName(e.target.value)}
                placeholder='e.g., Running Shoes, Casual, Sports'
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleSave();
                  }
                }}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant='outline' onClick={() => setIsDialogOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving} className='bg-primary hover:bg-primary/90'>
              {saving ? (
                <>
                  <Spinner className='w-4 h-4 mr-2' />
                  Saving...
                </>
              ) : (
                <>
                  <Save className='w-4 h-4 mr-2' />
                  Save
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
