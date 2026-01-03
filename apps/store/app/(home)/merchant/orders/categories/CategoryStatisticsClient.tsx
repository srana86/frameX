"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3 } from "lucide-react";
import { useCurrencySymbol } from "@/hooks/use-currency";
import { Pagination } from "@/components/shared/Pagination";
import { getCategoryStatistics } from "./actions";

type CategoryStat = {
  name: string;
  orders: number;
  revenue: number;
  items: number;
  quantity: number;
};

type PaginationData = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
};

export function CategoryStatisticsClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currencySymbol = useCurrencySymbol();

  // Get initial values from URL or use defaults
  const initialPage = parseInt(searchParams.get("page") || "1", 10);
  const initialLimit = parseInt(searchParams.get("limit") || "30", 10);

  const [categoryStats, setCategoryStats] = useState<CategoryStat[]>([]);
  const [pagination, setPagination] = useState<PaginationData>({
    page: 1,
    limit: 30,
    total: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPrevPage: false,
  });
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [limit, setLimit] = useState(initialLimit);

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

  const loadStatistics = useCallback(async (page: number = 1, pageLimit: number = 30) => {
    try {
      setLoading(true);
      const data = await getCategoryStatistics(page, pageLimit);
      setCategoryStats(data.stats);
      setPagination(data.pagination);
    } catch (error: any) {
      console.error("Error loading category statistics:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Sync URL params when they change (e.g., browser back/forward)
  useEffect(() => {
    const urlPage = parseInt(searchParams.get("page") || "1", 10);
    const urlLimit = parseInt(searchParams.get("limit") || "30", 10);

    if (urlPage !== currentPage) setCurrentPage(urlPage);
    if (urlLimit !== limit) setLimit(urlLimit);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]); // Sync when URL params change

  useEffect(() => {
    loadStatistics(currentPage, limit);
  }, [currentPage, limit, loadStatistics]);

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

  return (
    <Card className='p-3 md:p-4'>
      <CardHeader className='p-0'>
        <div className='flex items-center gap-2'>
          <BarChart3 className='h-5 w-5 text-primary' />
          <CardTitle>Category Statistics</CardTitle>
        </div>
        <CardDescription>Sales performance by product category</CardDescription>
      </CardHeader>
      <CardContent className='p-0'>
        {loading ? (
          <div className='space-y-4'>
            <div className='rounded-lg border overflow-x-auto'>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Category</TableHead>
                    <TableHead className='hidden sm:table-cell'>Orders</TableHead>
                    <TableHead className='hidden md:table-cell'>Items Sold</TableHead>
                    <TableHead className='hidden lg:table-cell'>Total Quantity</TableHead>
                    <TableHead className='text-right'>Revenue</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Array.from({ length: limit }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell>
                        <Skeleton className='h-4 w-32' />
                      </TableCell>
                      <TableCell className='hidden sm:table-cell'>
                        <Skeleton className='h-4 w-16' />
                      </TableCell>
                      <TableCell className='hidden md:table-cell'>
                        <Skeleton className='h-4 w-20' />
                      </TableCell>
                      <TableCell className='hidden lg:table-cell'>
                        <Skeleton className='h-4 w-24' />
                      </TableCell>
                      <TableCell className='text-right'>
                        <Skeleton className='h-4 w-20 ml-auto' />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        ) : categoryStats.length > 0 ? (
          <>
            <div className='rounded-lg border overflow-x-auto'>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Category</TableHead>
                    <TableHead className='hidden sm:table-cell'>Orders</TableHead>
                    <TableHead className='hidden md:table-cell'>Items Sold</TableHead>
                    <TableHead className='hidden lg:table-cell'>Total Quantity</TableHead>
                    <TableHead className='text-right'>Revenue</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categoryStats.map((stat) => (
                    <TableRow key={stat.name} className='hover:bg-accent/50'>
                      <TableCell className='font-medium'>
                        <div className='flex flex-col gap-1'>
                          <span>{stat.name}</span>
                          <div className='flex items-center gap-3 text-xs text-muted-foreground sm:hidden'>
                            <span>{stat.orders} orders</span>
                            <span>•</span>
                            <span>{stat.items} items</span>
                            <span>•</span>
                            <span>{stat.quantity} qty</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className='hidden sm:table-cell'>{stat.orders}</TableCell>
                      <TableCell className='hidden md:table-cell'>{stat.items}</TableCell>
                      <TableCell className='hidden lg:table-cell'>{stat.quantity}</TableCell>
                      <TableCell className='text-right font-medium'>
                        <div className='flex flex-col items-end gap-0.5'>
                          <span>
                            {currencySymbol}
                            {stat.revenue.toFixed(2)}
                          </span>
                          <span className='text-xs text-muted-foreground sm:hidden'>Revenue</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {pagination.totalPages > 0 && (
              <Pagination
                pagination={pagination}
                currentPage={currentPage}
                limit={limit}
                onPageChange={handlePageChange}
                onLimitChange={handleLimitChange}
                loading={loading}
                itemName='categories'
              />
            )}
          </>
        ) : (
          <div className='text-sm text-muted-foreground py-8 text-center'>No category statistics available.</div>
        )}
      </CardContent>
    </Card>
  );
}
