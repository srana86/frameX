"use client";

import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronLeft, ChevronRight } from "lucide-react";

type PaginationData = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
};

interface PaginationProps {
  pagination: PaginationData;
  currentPage: number;
  limit: number;
  loading?: boolean;
  onPageChange: (page: number) => void;
  onLimitChange?: (limit: number) => void;
  itemName?: string; // e.g., "products", "transactions"
  showLimitSelector?: boolean;
}

export function Pagination({
  pagination,
  currentPage,
  limit,
  loading = false,
  onPageChange,
  onLimitChange,
  itemName = "items",
  showLimitSelector = true,
}: PaginationProps) {
  if (pagination.totalPages <= 1) return null;

  const startItem = (currentPage - 1) * limit + 1;
  const endItem = Math.min(currentPage * limit, pagination.total);
  const total = pagination.total;

  // Calculate page numbers to show
  const getPageNumbers = () => {
    const pages: (number | "ellipsis")[] = [];
    const totalPages = pagination.totalPages;

    if (totalPages <= 7) {
      // Show all pages if 7 or fewer
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);

      if (currentPage <= 4) {
        // Near the start
        for (let i = 2; i <= 5; i++) {
          pages.push(i);
        }
        pages.push("ellipsis");
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 3) {
        // Near the end
        pages.push("ellipsis");
        for (let i = totalPages - 4; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        // In the middle
        pages.push("ellipsis");
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push("ellipsis");
        pages.push(totalPages);
      }
    }

    return pages;
  };

  const pageNumbers = getPageNumbers();

  return (
    <div className='flex flex-col gap-3 sm:gap-4 items-stretch sm:items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800'>
      {/* Top Section - Limit Selector and Info */}
      <div className='flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-2 w-full sm:w-auto'>
        {showLimitSelector && onLimitChange && (
          <div className='flex items-center justify-center md:justify-start gap-2'>
            <span className='text-xs sm:text-sm text-slate-600 dark:text-slate-400 whitespace-nowrap'>Items per page:</span>
            <Select value={limit.toString()} onValueChange={(value) => onLimitChange(parseInt(value, 10))}>
              <SelectTrigger className='w-20 !h-8 text-xs sm:text-sm'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='10'>10</SelectItem>
                <SelectItem value='30'>30</SelectItem>
                <SelectItem value='50'>50</SelectItem>
                <SelectItem value='100'>100</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
        <div className='text-xs sm:text-sm text-slate-600 dark:text-slate-400 text-center sm:text-left'>
          Showing <span className='font-medium'>{startItem.toLocaleString()}</span> to{" "}
          <span className='font-medium'>{endItem.toLocaleString()}</span> of <span className='font-medium'>{total.toLocaleString()}</span>{" "}
          {itemName}
        </div>
      </div>

      {/* Bottom Section - Page Navigation */}
      <div className='flex items-center justify-center gap-1 sm:gap-2 w-full sm:w-auto'>
        {/* Previous Button */}
        <Button
          variant='outline'
          size='sm'
          onClick={() => onPageChange(currentPage - 1)}
          disabled={!pagination.hasPrevPage || loading}
          className='h-8 sm:h-9 px-2 sm:px-3 text-xs sm:text-sm shrink-0'
        >
          <ChevronLeft className='h-3 w-3 sm:h-4 sm:w-4 mr-1' />
          <span className='hidden sm:inline'>Previous</span>
          <span className='sm:hidden'>Prev</span>
        </Button>

        {/* Page Numbers */}
        <div className='flex items-center gap-0.5 sm:gap-1 overflow-x-auto max-w-full [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]'>
          {pageNumbers.map((page, index) => {
            if (page === "ellipsis") {
              return (
                <span key={`ellipsis-${index}`} className='px-1 sm:px-2 text-xs sm:text-sm text-slate-500 dark:text-slate-400'>
                  ...
                </span>
              );
            }

            const isActive = currentPage === page;
            return (
              <Button
                key={page}
                variant={isActive ? "default" : "outline"}
                size='sm'
                onClick={() => onPageChange(page)}
                disabled={loading}
                className={`h-8 sm:h-9 w-8 sm:w-9 px-0 text-xs sm:text-sm font-medium shrink-0 ${
                  isActive ? "bg-primary text-primary-foreground" : ""
                }`}
              >
                {page}
              </Button>
            );
          })}
        </div>

        {/* Next Button */}
        <Button
          variant='outline'
          size='sm'
          onClick={() => onPageChange(currentPage + 1)}
          disabled={!pagination.hasNextPage || loading}
          className='h-8 sm:h-9 px-2 sm:px-3 text-xs sm:text-sm shrink-0'
        >
          <span className='hidden sm:inline'>Next</span>
          <span className='sm:hidden'>Next</span>
          <ChevronRight className='h-3 w-3 sm:h-4 sm:w-4 ml-1' />
        </Button>
      </div>
    </div>
  );
}
