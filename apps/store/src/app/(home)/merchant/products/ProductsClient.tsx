"use client";

import { useCurrencySymbol } from "@/hooks/use-currency";
import { apiRequest } from "@/lib/api-client";
import { useSearchParams, useRouter } from "next/navigation";

import { useEffect, useMemo, useState, useCallback } from "react";
import type { Product } from "@/lib/types";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Pagination } from "@/components/shared/Pagination";
import CloudImage from "@/components/site/CloudImage";
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
import { toast } from "sonner";
import Link from "next/link";
import { ArrowUp, ArrowDown, Package, Tag, DollarSign, Layers, Grid3x3, List, Plus, Search, X } from "lucide-react";

type PaginationData = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
};

type InitialData = {
  products: Product[];
  pagination: PaginationData;
  categories: string[];
};

type Draft = {
  id?: string;
  name: string;
  slug: string;
  brand: string;
  category: string;
  description: string;
  price: string;
  images: string[];
  sizes: string;
};

interface ProductsClientProps {
  initialData: InitialData;
}

// Regex pattern for MongoDB ObjectId (24 hex characters)
const OBJECT_ID_PATTERN = "^[a-f0-9]{24}$";

// Helper function to check if ID is MongoDB ObjectId format
const isObjectId = (id: string) => {
  const objectIdRegex = new RegExp(OBJECT_ID_PATTERN, "i");
  return objectIdRegex.test(id);
};

export default function ProductsClient({ initialData }: ProductsClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currencySymbol = useCurrencySymbol();

  // Get initial values from URL or use defaults
  const initialViewMode = (searchParams.get("view") as "grid" | "list") || "list";
  const initialCategory = searchParams.get("category") || "all";
  const initialPage = parseInt(searchParams.get("page") || "1", 10);
  const initialLimit = parseInt(searchParams.get("limit") || "30", 10);

  const [products, setProducts] = useState<Product[]>(initialData.products);
  const [categories, setCategories] = useState<string[]>(initialData.categories);
  const [pagination, setPagination] = useState<PaginationData>(initialData.pagination);
  const [loading, setLoading] = useState(false);
  const [draft, setDraft] = useState<Draft>({
    name: "",
    slug: "",
    brand: "",
    category: "",
    description: "",
    price: "",
    images: ["/file.svg"],
    sizes: "7,8,9,10,11",
  });

  const [viewMode, setViewMode] = useState<"grid" | "list">(initialViewMode);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [limit] = useState(initialLimit);
  const [isFiltering, setIsFiltering] = useState(false);

  // Update URL when filters change
  const updateURL = useCallback(
    (updates: { view?: "grid" | "list"; category?: string; page?: number; limit?: number }) => {
      const params = new URLSearchParams(searchParams.toString());

      if (updates.view !== undefined) {
        if (updates.view === "list") {
          params.delete("view"); // list is default, so remove from URL
        } else {
          params.set("view", updates.view); // set to grid
        }
      }

      if (updates.category !== undefined) {
        if (updates.category === "all") {
          params.delete("category");
        } else {
          params.set("category", updates.category);
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

      router.replace(`?${params.toString()}`, { scroll: false });
    },
    [searchParams, router]
  );

  const fetchProducts = useCallback(
    async (page: number = 1, category: string = "all") => {
      setLoading(true);
      try {
        const params: any = {
          page: page.toString(),
          limit: limit.toString(),
        };
        if (category !== "all") {
          params.category = category;
        }

        const res: any = await apiRequest("GET", "/products", undefined, params);

        if (res && res.success) {
          setProducts(res.data.products);
          setPagination({
            page: res.meta.page,
            limit: res.meta.limit,
            total: res.meta.total,
            totalPages: res.meta.totalPage,
            hasNextPage: res.meta.page < res.meta.totalPage,
            hasPrevPage: res.meta.page > 1,
          });
          setCategories(res.data.categories || []);
        }
      } catch (error) {
        console.error("Error fetching products:", error);
        toast.error("Failed to load products");
      } finally {
        setLoading(false);
      }
    },
    [limit]
  );

  // Sync URL params on mount
  useEffect(() => {
    const urlPage = parseInt(searchParams.get("page") || "1", 10);
    const urlCategory = searchParams.get("category") || "all";
    const urlView = (searchParams.get("view") as "grid" | "list") || "list";

    if (urlPage !== currentPage) setCurrentPage(urlPage);
    if (urlCategory !== selectedCategory) setSelectedCategory(urlCategory);
    if (urlView !== viewMode) setViewMode(urlView);
  }, []); // Only run on mount

  useEffect(() => {
    fetchProducts(currentPage, selectedCategory);
  }, [currentPage, selectedCategory, fetchProducts]);

  // Client-side search filtering
  const filteredProducts = useMemo<Product[]>(() => {
    if (!searchQuery.trim()) return products;
    const query = searchQuery.toLowerCase();
    return products.filter(
      (p) =>
        p.name?.toLowerCase().includes(query) ||
        p.brand?.toLowerCase().includes(query) ||
        p.category?.toLowerCase().includes(query) ||
        p.slug?.toLowerCase().includes(query)
    );
  }, [products, searchQuery]);

  // Calculate statistics
  const stats = useMemo(() => {
    const totalProducts = pagination.total;
    const uniqueCategories = categories.length;
    const totalPrice = products.reduce((sum, p) => sum + (p.price || 0), 0);
    const avgPrice = products.length > 0 ? totalPrice / products.length : 0;
    const productsWithImages = products.filter((p) => p.images && p.images.length > 0 && p.images[0] !== "/file.svg").length;

    return {
      totalProducts,
      uniqueCategories,
      avgPrice,
      productsWithImages,
    };
  }, [products, pagination.total, categories.length]);

  const resetDraft = () => {
    setDraft({ name: "", slug: "", brand: "", category: "", description: "", price: "", images: ["/file.svg"], sizes: "7,8,9,10,11" });
  };

  const onCreateNew = () => {
    resetDraft();
  };

  const onDelete = async (idOrSlug: string) => {
    try {
      await apiRequest("DELETE", `/products/${idOrSlug}`);
      toast.success("Product deleted successfully");
      // Refresh products
      fetchProducts(currentPage, selectedCategory);
    } catch {
      toast.error("Failed to delete product");
    }
  };

  const handleViewModeChange = (mode: "grid" | "list") => {
    setViewMode(mode);
    updateURL({ view: mode }); // Update URL (will delete if list, set if grid)
  };

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    setCurrentPage(1); // Reset to first page when category changes
    updateURL({ category, page: 1 });
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    updateURL({ page: newPage });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Clear all filters
  const handleClearFilters = useCallback(() => {
    setViewMode("list");
    setSelectedCategory("all");
    setSearchQuery("");
    setCurrentPage(1);
    router.replace("?", { scroll: false });
    fetchProducts(1, "all");
  }, [router, fetchProducts]);

  const moveProduct = async (index: number, direction: "up" | "down") => {
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= filteredProducts.length) return;

    const newProducts = [...filteredProducts];
    [newProducts[index], newProducts[newIndex]] = [newProducts[newIndex], newProducts[index]];

    setProducts(newProducts);

    // Update order in database silently
    try {
      const product = filteredProducts[index];
      await apiRequest("PUT", `/products/${product.id}/order`, {
        order: newIndex // Use the new index as the order
      });

      // Refresh products silently
      fetchProducts(currentPage, selectedCategory);
    } catch (error) {
      // Only show error toast if update fails
      toast.error("Failed to update order");
      // Reload to revert
      fetchProducts(currentPage, selectedCategory);
    }
  };

  // Skeleton Components
  const GridSkeleton = () => (
    <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4'>
      {[...Array(8)].map((_, i) => (
        <div key={i} className='flex flex-col rounded-lg border-2 border-slate-200/50 dark:border-slate-800/50 overflow-hidden'>
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
  );

  const ListSkeleton = () => (
    <div className='rounded-lg border border-slate-200/50 dark:border-slate-800/50 overflow-hidden'>
      <div className='overflow-x-auto'>
        <Table>
          <TableHeader>
            <TableRow className='bg-slate-50/50 dark:bg-slate-900/50'>
              <TableHead className='w-12 sm:w-16'>
                <Skeleton className='h-4 w-8 mx-auto' />
              </TableHead>
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
              <TableHead className='hidden lg:table-cell'>
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
                  <Skeleton className='h-12 w-8 mx-auto' />
                </TableCell>
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
                <TableCell className='hidden lg:table-cell'>
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
  );

  return (
    <div className='w-full space-y-4 sm:space-y-6'>
      {/* Stats Cards - Cool Icon Design */}
      <div className='grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3 mb-4 sm:mb-6'>
        {/* Total Products - Primary Blue */}
        <div className='flex flex-col gap-1.5 xl:gap-3 p-3 sm:p-4 rounded-lg border bg-card hover:shadow-sm transition-shadow'>
          <div className='flex items-center gap-2'>
            <div className='p-2 rounded-full border shrink-0 bg-transparent'>
              <Package className='size-4 md:size-5 text-primary' />
            </div>
            <p className='text-[10px] sm:text-base font-medium text-foreground tracking-wide'>Total Products</p>
          </div>
          <div className='text-base sm:text-lg md:text-xl font-bold text-foreground truncate'>{stats.totalProducts.toLocaleString()}</div>
        </div>

        {/* Categories - Sky Blue */}
        <div className='flex flex-col gap-1.5 xl:gap-3 p-3 sm:p-4 rounded-lg border bg-card hover:shadow-sm transition-shadow'>
          <div className='flex items-center gap-2'>
            <div className='p-2 rounded-full border shrink-0 bg-transparent'>
              <Tag className='size-4 md:size-5 text-sky-600 dark:text-sky-400' />
            </div>
            <p className='text-[10px] sm:text-base font-medium text-foreground tracking-wide'>Categories</p>
          </div>
          <div className='text-base sm:text-lg md:text-xl font-bold text-foreground'>{stats.uniqueCategories.toLocaleString()}</div>
        </div>

        {/* Average Price - Indigo */}
        <div className='flex flex-col gap-1.5 xl:gap-3 p-3 sm:p-4 rounded-lg border bg-card hover:shadow-sm transition-shadow'>
          <div className='flex items-center gap-2'>
            <div className='p-2 rounded-full border shrink-0 bg-transparent'>
              <DollarSign className='size-4 md:size-5 text-indigo-600 dark:text-indigo-400' />
            </div>
            <p className='text-[10px] sm:text-base font-medium text-foreground tracking-wide'>Avg. Price</p>
          </div>
          <div className='text-base sm:text-lg md:text-xl font-bold text-foreground truncate'>
            {currencySymbol}
            {stats.avgPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>

        {/* Products with Images - Green */}
        <div className='flex flex-col gap-1.5 xl:gap-3 p-3 sm:p-4 rounded-lg border bg-card hover:shadow-sm transition-shadow'>
          <div className='flex items-center gap-2'>
            <div className='p-2 rounded-full border shrink-0 bg-transparent'>
              <Layers className='size-4 md:size-5 text-green-600 dark:text-green-400' />
            </div>
            <p className='text-[10px] sm:text-base font-medium text-foreground tracking-wide'>With Images</p>
          </div>
          <div className='text-base sm:text-lg md:text-xl font-bold text-foreground'>{stats.productsWithImages.toLocaleString()}</div>
        </div>
      </div>

      {/* Products List/Grid */}
      <div className='rounded-xl border border-slate-200/50 overflow-hidden'>
        <div className='p-3 sm:p-4 border-b border-slate-200/50 dark:border-slate-800/30 bg-gradient-to-r from-slate-50/80 to-white dark:from-slate-900/40 dark:to-slate-950/20'>
          <div className='flex flex-col md:flex-row md:items-center md:justify-between gap-3 sm:gap-4'>
            <div className='flex items-center gap-2 md:gap-3'>
              <div>
                <h3 className='text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100'>Product List</h3>
                <p className='text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-0.5'>
                  {searchQuery ? filteredProducts.length : pagination.total}{" "}
                  {searchQuery ? (filteredProducts.length === 1 ? "result" : "results") : pagination.total === 1 ? "product" : "products"}
                </p>
              </div>
            </div>
            <div className='flex items-center gap-2'>
              <Button asChild size='default' className='h-10 flex-1 sm:flex-none'>
                <Link href='/merchant/products/new'>
                  <Plus className='h-4 w-4 mr-1.5' />
                  <span className='hidden sm:inline'>Add Product</span>
                  <span className='sm:hidden'>Add</span>
                </Link>
              </Button>
            </div>
          </div>
          <div className='flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 mt-3 sm:mt-4'>
            {/* Search */}
            <div className='relative flex-1 sm:flex-initial sm:w-48 md:w-56 min-w-0'>
              <Search className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500 pointer-events-none' />
              <Input
                placeholder='Search products...'
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setIsFiltering(true);
                  setTimeout(() => setIsFiltering(false), 300);
                }}
                className='pl-10 h-9 sm:h-10 text-sm border-slate-300 dark:border-slate-700 focus-visible:ring-primary focus-visible:ring-2'
              />
            </div>

            {/* Category Filter */}
            <Select value={selectedCategory} onValueChange={handleCategoryChange}>
              <SelectTrigger className='w-full sm:w-[140px] md:w-[160px] text-sm border-slate-300 dark:border-slate-700'>
                <SelectValue placeholder='All Categories' />
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
            {(selectedCategory !== "all" || currentPage !== 1 || viewMode !== "list" || searchQuery) && (
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
      </div>
      <div className='p-3 sm:p-4 md:p-5'>
        {loading || isFiltering ? (
          viewMode === "grid" ? (
            <GridSkeleton />
          ) : (
            <ListSkeleton />
          )
        ) : filteredProducts.length === 0 ? (
          <div className='text-center py-12 sm:py-16'>
            <Package className='h-12 w-12 sm:h-16 sm:w-16 mx-auto text-slate-400 dark:text-slate-500 mb-4' />
            <p className='text-sm sm:text-base text-slate-600 dark:text-slate-400 font-medium'>
              {searchQuery ? "No products found" : "No products yet"}
            </p>
            <p className='text-xs sm:text-sm text-slate-500 dark:text-slate-500 mt-1'>
              {searchQuery ? "Try a different search term" : "Create your first product to get started"}
            </p>
          </div>
        ) : viewMode === "grid" ? (
          /* Grid View */
          <>
            <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4'>
              {filteredProducts.map((p, index) => (
                <div
                  key={p.id}
                  className='group relative flex flex-col rounded-lg border-2 border-slate-200/50 dark:border-slate-800/50 bg-white dark:bg-slate-900/50 hover:border-primary/30 dark:hover:border-primary/30 transition-all duration-300 hover:shadow-lg overflow-hidden'
                >
                  {/* Image */}
                  <div className='relative w-full aspect-square overflow-hidden bg-slate-100 dark:bg-slate-800'>
                    {p.images?.[0] && p.images[0] !== "/file.svg" ? (
                      <CloudImage
                        src={p.images[0]}
                        alt={p.name}
                        fill
                        className='object-cover group-hover:scale-105 transition-transform duration-300'
                      />
                    ) : (
                      <div className='w-full h-full flex items-center justify-center'>
                        <Package className='h-12 w-12 text-slate-400 dark:text-slate-600' />
                      </div>
                    )}
                    {/* Order Controls */}
                    <div className='absolute top-2 left-2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity'>
                      <Button
                        variant='secondary'
                        size='sm'
                        className='h-6 w-6 p-0 bg-white/90 dark:bg-slate-800/90 hover:bg-white dark:hover:bg-slate-800'
                        onClick={() => moveProduct(index, "up")}
                        disabled={index === 0}
                      >
                        <ArrowUp className='h-3 w-3' />
                      </Button>
                      <Button
                        variant='secondary'
                        size='sm'
                        className='h-6 w-6 p-0 bg-white/90 dark:bg-slate-800/90 hover:bg-white dark:hover:bg-slate-800'
                        onClick={() => moveProduct(index, "down")}
                        disabled={index === filteredProducts.length - 1}
                      >
                        <ArrowDown className='h-3 w-3' />
                      </Button>
                    </div>
                    {/* Actions Overlay */}
                    <div className='absolute top-2 right-2 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity'>
                      <Button
                        asChild
                        variant='secondary'
                        size='sm'
                        className='h-7 px-2 bg-white/90 dark:bg-slate-800/90 hover:bg-white dark:hover:bg-slate-800 text-xs'
                      >
                        <Link href={`/merchant/products/${encodeURIComponent(isObjectId(p.id) ? p.id : p.slug)}/edit`}>Edit</Link>
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant='destructive' size='sm' className='h-7 px-2 text-xs'>
                            Delete
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete product?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This action cannot be undone. This will permanently delete {p.name}.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => onDelete(isObjectId(p.id) ? p.id : p.slug)}>Delete</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                  {/* Content */}
                  <div className='p-3 sm:p-4 flex-1 flex flex-col gap-2'>
                    <div className='flex-1'>
                      <h3 className='font-semibold text-sm sm:text-base text-slate-900 dark:text-slate-100 line-clamp-2 mb-1'>{p.name}</h3>
                      <div className='flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 mb-2'>
                        {p.brand && <span className='truncate'>{p.brand}</span>}
                        {p.brand && p.category && <span>•</span>}
                        {p.category && <span className='truncate'>{p.category}</span>}
                      </div>
                    </div>
                    <div className='flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-800'>
                      <div>
                        <p className='text-lg sm:text-xl font-bold text-primary dark:text-primary'>
                          {currencySymbol}
                          {p.price?.toFixed(2) || "0.00"}
                        </p>
                      </div>
                      <div className='text-xs text-slate-500 dark:text-slate-400 truncate max-w-[100px]' title={p.slug}>
                        {p.slug}
                      </div>
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
                itemName='products'
                showLimitSelector={false}
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
                    <TableHead className='w-12 sm:w-16 text-center'>Order</TableHead>
                    <TableHead className='w-16 sm:w-20'>Image</TableHead>
                    <TableHead className='min-w-[150px] sm:min-w-[200px] font-semibold text-xs sm:text-sm text-slate-700 dark:text-slate-300'>
                      Name
                    </TableHead>
                    <TableHead className='hidden sm:table-cell font-semibold text-xs sm:text-sm text-slate-700 dark:text-slate-300'>
                      Brand
                    </TableHead>
                    <TableHead className='hidden md:table-cell font-semibold text-xs sm:text-sm text-slate-700 dark:text-slate-300'>
                      Category
                    </TableHead>
                    <TableHead className='font-semibold text-xs sm:text-sm text-slate-700 dark:text-slate-300'>Price</TableHead>
                    <TableHead className='hidden lg:table-cell font-semibold text-xs sm:text-sm text-slate-700 dark:text-slate-300'>
                      Slug
                    </TableHead>
                    <TableHead className='w-24 sm:w-32 text-right font-semibold text-xs sm:text-sm text-slate-700 dark:text-slate-300'>
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.map((p, index) => (
                    <TableRow
                      key={p.id}
                      className='hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors border-b border-slate-100 dark:border-slate-800/50'
                    >
                      <TableCell className='p-2 sm:p-4'>
                        <div className='flex flex-col gap-1 items-center'>
                          <Button
                            variant='ghost'
                            size='sm'
                            className='h-6 w-6 p-0'
                            onClick={() => moveProduct(index, "up")}
                            disabled={index === 0}
                          >
                            <ArrowUp className='h-3 w-3' />
                          </Button>
                          <Button
                            variant='ghost'
                            size='sm'
                            className='h-6 w-6 p-0'
                            onClick={() => moveProduct(index, "down")}
                            disabled={index === filteredProducts.length - 1}
                          >
                            <ArrowDown className='h-3 w-3' />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell className='p-2 sm:p-4'>
                        <div className='relative h-10 w-10 sm:h-12 sm:w-12 overflow-hidden rounded-md border bg-accent/30'>
                          {p.images?.[0] && p.images[0] !== "/file.svg" ? (
                            <CloudImage src={p.images[0]} alt={p.name} fill className='object-cover' />
                          ) : (
                            <div className='w-full h-full flex items-center justify-center'>
                              <Package className='h-5 w-5 text-slate-400' />
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className='p-2 sm:p-4 font-medium'>
                        <div className='text-xs sm:text-sm text-slate-900 dark:text-slate-100 font-semibold line-clamp-1'>{p.name}</div>
                        <div className='text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5 sm:hidden'>
                          {p.brand && <span>{p.brand}</span>}
                          {p.brand && p.category && <span> • </span>}
                          {p.category && <span>{p.category}</span>}
                        </div>
                      </TableCell>
                      <TableCell className='hidden sm:table-cell p-2 sm:p-4 text-xs sm:text-sm text-slate-600 dark:text-slate-400'>
                        {p.brand || "-"}
                      </TableCell>
                      <TableCell className='hidden md:table-cell p-2 sm:p-4 text-xs sm:text-sm text-slate-600 dark:text-slate-400'>
                        {p.category || "-"}
                      </TableCell>
                      <TableCell className='p-2 sm:p-4'>
                        <div className='text-sm sm:text-base font-bold text-primary dark:text-primary'>
                          {currencySymbol}
                          {p.price?.toFixed(2) || "0.00"}
                        </div>
                      </TableCell>
                      <TableCell className='hidden lg:table-cell p-2 sm:p-4 text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 truncate max-w-[120px]'>
                        {p.slug}
                      </TableCell>
                      <TableCell className='p-2 sm:p-4'>
                        <div className='flex justify-end gap-1.5 sm:gap-2'>
                          <Button asChild variant='outline' size='sm' className='h-7 sm:h-8 px-2 sm:px-3 text-xs'>
                            <Link href={`/merchant/products/${encodeURIComponent(isObjectId(p.id) ? p.id : p.slug)}/edit`}>
                              <span className='hidden sm:inline'>Edit</span>
                              <span className='sm:hidden'>E</span>
                            </Link>
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant='destructive' size='sm' className='h-7 sm:h-8 px-2 sm:px-3 text-xs'>
                                <span className='hidden sm:inline'>Delete</span>
                                <span className='sm:hidden'>D</span>
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete product?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This action cannot be undone. This will permanently delete {p.name}.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => onDelete(isObjectId(p.id) ? p.id : p.slug)}>Delete</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
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
                itemName='products'
                showLimitSelector={false}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
