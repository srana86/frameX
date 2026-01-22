"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { ArrowLeft, Download, Save, Printer, ChevronRight, Package, ChevronLeft, ChevronRight as ChevronRightIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface OrderHeaderProps {
  saving: boolean;
  orderId: string;
  customOrderId?: string; // Custom order ID (format: BRD-XXXXXXX)
  orderDate?: string;
  orderStatus?: string;
  prevOrderId?: string | null;
  nextOrderId?: string | null;
  onSave: () => void;
  onDownload: () => void;
  onPrint: () => void;
}

export function OrderHeader({
  saving,
  orderId,
  customOrderId,
  orderDate,
  orderStatus,
  prevOrderId,
  nextOrderId,
  onSave,
  onDownload,
  onPrint,
}: OrderHeaderProps) {
  const router = useRouter();

  // Use custom order ID if available, otherwise fallback to last 7 chars of orderId
  const displayOrderId = customOrderId || orderId.slice(-7).toUpperCase();

  return (
    <div className='bg-background/95 backdrop-blur-xl border-b border-primary/10 sticky top-0 z-40'>
      <div className='w-full'>
        {/* Breadcrumb Navigation - Hidden on mobile */}
        <div className='hidden sm:flex items-center gap-1.5 px-0 pt-3 pb-1 text-xs'>
          <Link href='/tenant' className='text-muted-foreground hover:text-foreground transition-colors duration-200'>
            Dashboard
          </Link>
          <ChevronRight className='h-3 w-3 text-muted-foreground/50' />
          <Link href='/tenant/orders' className='text-muted-foreground hover:text-foreground transition-colors duration-200'>
            Orders
          </Link>
          <ChevronRight className='h-3 w-3 text-muted-foreground/50' />
          <span className='text-foreground font-medium'>{displayOrderId}</span>
        </div>

        <div className='flex flex-col gap-2 sm:gap-3 py-2 sm:py-3'>
          {/* Main Header Row */}
          <div className='flex items-center justify-between gap-2 sm:gap-3'>
            {/* Left Side - Back Button & Order Info */}
            <div className='flex items-center gap-2 sm:gap-3 min-w-0'>
              <Link href='/tenant/orders'>
                <Button
                  variant='ghost'
                  size='sm'
                  className='shrink-0 -ml-1 sm:-ml-2 h-8 sm:h-9 px-2 sm:px-3 hover:bg-primary/5 transition-all duration-200'
                >
                  <ArrowLeft className='h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5' />
                  <span className='hidden md:inline text-xs sm:text-sm'>Orders</span>
                </Button>
              </Link>

              {/* Order Info - Desktop */}
              <div className='hidden sm:flex items-center gap-2 pl-2 border-l border-border/50'>
                <div className='h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center'>
                  <Package className='h-4 w-4 text-primary' />
                </div>
                <div className='flex flex-col'>
                  <span className='text-sm font-semibold text-foreground'>Order {displayOrderId}</span>
                  {orderDate && (
                    <span className='text-[10px] text-muted-foreground'>{format(new Date(orderDate), "MMM dd, yyyy • h:mm a")}</span>
                  )}
                </div>
              </div>

              {/* Order Info - Mobile (inline) */}
              <div className='flex sm:hidden items-center gap-2'>
                <div className='h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center'>
                  <Package className='h-3.5 w-3.5 text-primary' />
                </div>
                <div className='flex flex-col'>
                  <span className='text-xs font-semibold text-foreground'>{displayOrderId}</span>
                  {orderDate && <span className='text-[10px] text-muted-foreground'>{format(new Date(orderDate), "MMM dd")}</span>}
                </div>
              </div>
            </div>

            {/* Right Side - Actions (Desktop only) */}
            <div className='hidden sm:flex items-center gap-1.5 sm:gap-2'>
              {/* Order Navigation - Previous/Next */}
              <div className='hidden md:flex items-center gap-1 mr-2'>
                <Button
                  variant='ghost'
                  size='sm'
                  className={cn("h-8 w-8 p-0 transition-all duration-200", !prevOrderId && "opacity-40 cursor-not-allowed")}
                  onClick={() => prevOrderId && router.push(`/tenant/orders/${prevOrderId}`)}
                  disabled={!prevOrderId}
                  title={prevOrderId ? "Previous Order" : "No previous order"}
                >
                  <ChevronLeft className='h-4 w-4' />
                </Button>
                <Button
                  variant='ghost'
                  size='sm'
                  className={cn("h-8 w-8 p-0 transition-all duration-200", !nextOrderId && "opacity-40 cursor-not-allowed")}
                  onClick={() => nextOrderId && router.push(`/tenant/orders/${nextOrderId}`)}
                  disabled={!nextOrderId}
                  title={nextOrderId ? "Next Order" : "No next order"}
                >
                  <ChevronRightIcon className='h-4 w-4' />
                </Button>
              </div>

              <Button
                variant='outline'
                size='sm'
                onClick={onDownload}
                className='hidden sm:flex h-8 sm:h-9 px-2 sm:px-3 text-xs sm:text-sm hover:bg-primary/5 transition-all duration-200'
              >
                <Download className='h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5' />
                Download
              </Button>
              <Button
                variant='outline'
                size='sm'
                onClick={onSave}
                disabled={saving}
                className='h-8 sm:h-9 px-2 sm:px-3 text-xs sm:text-sm hover:bg-primary/5 transition-all duration-200'
              >
                {saving ? (
                  <>
                    <Spinner className='h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5' />
                    <span className='hidden sm:inline'>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save className='h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5' />
                    <span className='hidden sm:inline'>Save</span>
                  </>
                )}
              </Button>
              <Button
                variant='default'
                size='sm'
                onClick={onPrint}
                className='h-8 sm:h-9 px-2 sm:px-3 text-xs sm:text-sm transition-all duration-200'
              >
                <Printer className='h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5' />
                <span className='hidden sm:inline'>Print</span>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
