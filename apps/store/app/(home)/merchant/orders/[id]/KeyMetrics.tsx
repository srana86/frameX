"use client";

import { DollarSign, CheckCircle2, AlertTriangle, Package, Clock, CreditCard, Truck } from "lucide-react";
import { format } from "date-fns";
import type { Order, OrderStatus, PaymentStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

interface KeyMetricsProps {
  order: Order;
  calculateTotals: {
    total: number;
  };
  currencySymbol: string;
}

export function KeyMetrics({ order, calculateTotals, currencySymbol }: KeyMetricsProps) {
  const paidAmount = order.paidAmount ?? (order.paymentStatus === "completed" ? order.total : 0);
  const amountDue = Math.max(0, calculateTotals.total - paidAmount);
  const orderDate = new Date(order.createdAt);

  const getStatusColor = (status: OrderStatus) => {
    const colors: Record<OrderStatus, string> = {
      pending: "bg-amber-500",
      waiting_for_confirmation: "bg-yellow-500",
      confirmed: "bg-cyan-500",
      processing: "bg-blue-500",
      restocking: "bg-orange-500",
      packed: "bg-purple-500",
      sent_to_logistics: "bg-indigo-500",
      shipped: "bg-violet-500",
      delivered: "bg-emerald-500",
      cancelled: "bg-red-500",
    };
    return colors[status] || "bg-gray-500";
  };

  const getPaymentColor = (status: PaymentStatus) => {
    const colors: Record<PaymentStatus, string> = {
      pending: "text-amber-600 bg-amber-50",
      completed: "text-emerald-600 bg-emerald-50",
      failed: "text-red-600 bg-red-50",
      cancelled: "text-red-600 bg-red-50",
      refunded: "text-orange-600 bg-orange-50",
    };
    return colors[status] || "text-gray-600 bg-gray-50";
  };

  return (
    <>
      {/* Mobile Summary Strip */}
      <div className="sm:hidden mb-4">
        <div className="bg-card border rounded-2xl p-4 shadow-sm">
          {/* Top Row - Total & Status */}
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">Total Amount</p>
              <p className="text-2xl font-bold text-foreground">
                {currencySymbol}{calculateTotals.total.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </p>
            </div>
            <div className="text-right">
              <div className={cn(
                "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase",
                getStatusColor(order.status),
                "text-white"
              )}>
                <span className="w-1.5 h-1.5 rounded-full bg-white/80 animate-pulse" />
                {order.status.replace(/_/g, " ")}
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="h-px bg-border mb-3" />

          {/* Bottom Row - Quick Stats */}
          <div className="flex items-center justify-between gap-3">
            {/* Items */}
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center">
                <Package className="h-4 w-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground">Items</p>
                <p className="text-sm font-semibold text-foreground">{order.items.length}</p>
              </div>
            </div>

            {/* Payment */}
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center">
                <CreditCard className="h-4 w-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground">Payment</p>
                <p className={cn(
                  "text-[10px] font-semibold px-1.5 py-0.5 rounded",
                  order.paymentStatus === "completed" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" : 
                  order.paymentStatus === "pending" ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" : 
                  "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                )}>
                  {order.paymentStatus === "completed" ? "Paid" : order.paymentStatus}
                </p>
              </div>
            </div>

            {/* Due */}
            {amountDue > 0 && (
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                  <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground">Due</p>
                  <p className="text-sm font-semibold text-red-600 dark:text-red-400">
                    {currencySymbol}{amountDue.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                  </p>
                </div>
              </div>
            )}

            {/* Courier Status */}
            {order.courier?.deliveryStatus && (
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center">
                  <Truck className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground">Courier</p>
                  <p className="text-[10px] font-medium text-foreground truncate max-w-[60px]">
                    {order.courier.deliveryStatus}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Desktop Grid Stats */}
      <div className='hidden sm:grid grid-cols-2 lg:grid-cols-5 gap-2.5 sm:gap-3 mb-4 sm:mb-6'>
        {/* Order Placed Time */}
        <div className='flex flex-col xl:flex-row xl:items-center xl:justify-between gap-1.5 xl:gap-3 p-3 sm:p-4 rounded-lg border bg-card hover:shadow-sm transition-shadow'>
          <div className='flex items-center gap-2'>
            <div className='p-1.5 rounded-md bg-blue-100/80 dark:bg-blue-900/40 shrink-0'>
              <Clock className='h-4 w-4 sm:h-4 sm:w-4 text-blue-600 dark:text-blue-400' />
            </div>
            <p className='text-[10px] sm:text-xs font-medium text-blue-700/80 dark:text-blue-300/80 uppercase tracking-wide'>Placed At</p>
          </div>
          <div className='flex flex-col items-start xl:items-end'>
            <div className='text-sm sm:text-base font-bold text-foreground'>{format(orderDate, "hh:mm a")}</div>
            <div className='text-[10px] sm:text-xs text-muted-foreground'>{format(orderDate, "MMM dd, yyyy")}</div>
          </div>
        </div>

        {/* Grand Total */}
        <div className='flex flex-col xl:flex-row xl:items-center xl:justify-between gap-1.5 xl:gap-3 p-3 sm:p-4 rounded-lg border bg-card hover:shadow-sm transition-shadow'>
          <div className='flex items-center gap-2'>
            <div className='p-1.5 rounded-md bg-primary/10 shrink-0'>
              <DollarSign className='h-4 w-4 sm:h-4 sm:w-4 text-primary' />
            </div>
            <p className='text-[10px] sm:text-xs font-medium text-primary/80 uppercase tracking-wide'>Grand Total</p>
          </div>
          <div className='text-base sm:text-lg md:text-xl font-bold text-foreground truncate'>
            {currencySymbol}
            {calculateTotals.total.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
          </div>
        </div>

        {/* Paid Amount */}
        <div className='flex flex-col xl:flex-row xl:items-center xl:justify-between gap-1.5 xl:gap-3 p-3 sm:p-4 rounded-lg border bg-card hover:shadow-sm transition-shadow'>
          <div className='flex items-center gap-2'>
            <div className='p-1.5 rounded-md bg-green-100/80 dark:bg-green-900/40 shrink-0'>
              <CheckCircle2 className='h-4 w-4 sm:h-4 sm:w-4 text-green-600 dark:text-green-400' />
            </div>
            <p className='text-[10px] sm:text-xs font-medium text-green-700/80 dark:text-green-300/80 uppercase tracking-wide'>Paid</p>
          </div>
          <div className='text-base sm:text-lg md:text-xl font-bold text-foreground truncate'>
            {currencySymbol}
            {paidAmount.toLocaleString(undefined, {
              minimumFractionDigits: 0,
              maximumFractionDigits: 2,
            })}
          </div>
        </div>

        {/* Amount Due */}
        <div className='flex flex-col xl:flex-row xl:items-center xl:justify-between gap-1.5 xl:gap-3 p-3 sm:p-4 rounded-lg border bg-card hover:shadow-sm transition-shadow'>
          <div className='flex items-center gap-2'>
            <div className='p-1.5 rounded-md bg-destructive/10 shrink-0'>
              <AlertTriangle className='h-4 w-4 sm:h-4 sm:w-4 text-destructive' />
            </div>
            <p className='text-[10px] sm:text-xs font-medium text-destructive/80 uppercase tracking-wide'>Due</p>
          </div>
          <div className='text-base sm:text-lg md:text-xl font-bold text-foreground truncate'>
            {currencySymbol}
            {amountDue.toLocaleString(undefined, {
              minimumFractionDigits: 0,
              maximumFractionDigits: 2,
            })}
          </div>
        </div>

        {/* Items */}
        <div className='flex flex-col xl:flex-row xl:items-center xl:justify-between gap-1.5 xl:gap-3 p-3 sm:p-4 rounded-lg border bg-card hover:shadow-sm transition-shadow'>
          <div className='flex items-center gap-2'>
            <div className='p-1.5 rounded-md bg-muted shrink-0'>
              <Package className='h-4 w-4 sm:h-4 sm:w-4 text-muted-foreground' />
            </div>
            <p className='text-[10px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wide'>Items</p>
          </div>
          <div className='text-base sm:text-lg md:text-xl font-bold text-foreground'>{order.items.length.toLocaleString()}</div>
        </div>
      </div>
    </>
  );
}
