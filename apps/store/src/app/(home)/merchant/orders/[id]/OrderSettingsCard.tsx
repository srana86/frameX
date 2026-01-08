"use client";

import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ShoppingBag, Gift, Globe, BarChart3, ExternalLink, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Order, OrderStatus, OrderType, PaymentStatus } from "@/lib/types";

interface OrderSettingsCardProps {
  order: Order;
  currencySymbol: string;
  orderStatusOptions: OrderStatus[];
  orderTypeOptions: OrderType[];
  paymentStatusOptions: PaymentStatus[];
  getStatusLabel: (status: OrderStatus) => string;
  onUpdateOrderType: (orderType: OrderType) => void;
  onUpdateOrderStatus: (status: OrderStatus) => void;
  onUpdatePaymentStatus: (status: PaymentStatus, paidAmount: number) => void;
}

// Quick status options for mobile
const quickStatusOptions: { status: OrderStatus; label: string; color: string }[] = [
  { status: "confirmed", label: "Confirmed", color: "bg-cyan-100 text-cyan-700 border-cyan-300" },
  { status: "processing", label: "Processing", color: "bg-blue-100 text-blue-700 border-blue-300" },
  { status: "packed", label: "Packed", color: "bg-purple-100 text-purple-700 border-purple-300" },
  { status: "shipped", label: "Shipped", color: "bg-violet-100 text-violet-700 border-violet-300" },
  { status: "delivered", label: "Delivered", color: "bg-emerald-100 text-emerald-700 border-emerald-300" },
  { status: "cancelled", label: "Cancelled", color: "bg-red-100 text-red-700 border-red-300" },
];

export function OrderSettingsCard({
  order,
  currencySymbol,
  orderStatusOptions,
  orderTypeOptions,
  paymentStatusOptions,
  getStatusLabel,
  onUpdateOrderType,
  onUpdateOrderStatus,
  onUpdatePaymentStatus,
}: OrderSettingsCardProps) {
  return (
    <Card className='border shadow-md overflow-hidden gap-0 !pt-0'>
      <CardHeader className='sm:pb-4 px-3 sm:px-4 pt-3 sm:pt-4 !pb-4 border-b'>
        <CardTitle className='flex items-center gap-2 text-base sm:text-lg'>
          <div className='p-1.5 bg-primary/10 rounded-lg'>
            <ShoppingBag className='h-4 w-4 text-primary' />
          </div>
          Order Settings
        </CardTitle>
      </CardHeader>
      <CardContent className='p-3 sm:p-4 space-y-3'>
        {/* Mobile: Quick Status Pills */}
        <div className='sm:hidden space-y-2'>
          <Label className='text-xs font-semibold'>Quick Status Change</Label>
          <div className='flex flex-wrap gap-1.5'>
            {quickStatusOptions.map((opt) => (
              <button
                key={opt.status}
                onClick={() => onUpdateOrderStatus(opt.status)}
                className={cn(
                  "px-2.5 py-1.5 rounded-full text-[11px] font-medium border transition-all active:scale-95",
                  order.status === opt.status
                    ? `${opt.color} ring-2 ring-offset-1 ring-current`
                    : "bg-muted/50 text-muted-foreground border-border hover:bg-muted"
                )}
              >
                {order.status === opt.status && <CheckCircle2 className='h-3 w-3 inline mr-1' />}
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Mobile: Payment Status Toggle */}
        <div className='sm:hidden space-y-2'>
          <Label className='text-xs font-semibold'>Payment</Label>
          <div className='flex gap-2'>
            <button
              onClick={() => onUpdatePaymentStatus("pending", 0)}
              className={cn(
                "flex-1 py-2 rounded-lg text-xs font-medium border transition-all active:scale-95",
                order.paymentStatus === "pending" || !order.paymentStatus
                  ? "bg-amber-100 text-amber-700 border-amber-300"
                  : "bg-muted/50 text-muted-foreground border-border"
              )}
            >
              Pending
            </button>
            <button
              onClick={() => onUpdatePaymentStatus("completed", order.total)}
              className={cn(
                "flex-1 py-2 rounded-lg text-xs font-medium border transition-all active:scale-95",
                order.paymentStatus === "completed"
                  ? "bg-emerald-100 text-emerald-700 border-emerald-300"
                  : "bg-muted/50 text-muted-foreground border-border"
              )}
            >
              ✓ Paid
            </button>
          </div>
        </div>

        {/* Desktop: Original Selects */}
        <div className='hidden sm:block space-y-1.5'>
          <Label className='text-xs sm:text-sm font-semibold'>Order Type</Label>
          <Select value={order.orderType || "online"} onValueChange={(value) => onUpdateOrderType(value as OrderType)}>
            <SelectTrigger className='w-full h-9 text-sm border'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {orderTypeOptions.map((type) => (
                <SelectItem key={type} value={type}>
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className='hidden sm:block space-y-1.5'>
          <Label className='text-xs sm:text-sm font-semibold'>Order Status</Label>
          <Select value={order.status} onValueChange={(value) => onUpdateOrderStatus(value as OrderStatus)}>
            <SelectTrigger className='w-full h-9 text-sm border'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {orderStatusOptions.map((status) => (
                <SelectItem key={status} value={status}>
                  {getStatusLabel(status)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className='hidden sm:block space-y-1.5'>
          <Label className='text-xs sm:text-sm font-semibold'>
            Payment Status
            {order.orderType === "offline" && (
              <Badge className='ml-2 bg-purple-50 text-purple-700 dark:bg-purple-950/50 dark:text-purple-400 border-purple-200 dark:border-purple-800 text-[10px] font-medium'>
                Offline
              </Badge>
            )}
          </Label>
          <Select
            value={order.paymentStatus || "pending"}
            onValueChange={(value) => {
              const newStatus = value as PaymentStatus;
              const newPaidAmount = newStatus === "completed" ? order.total : order.paidAmount ?? 0;
              onUpdatePaymentStatus(newStatus, newPaidAmount);
            }}
          >
            <SelectTrigger className='w-full h-9 text-sm border'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {paymentStatusOptions.map((status) => (
                <SelectItem key={status} value={status}>
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {order.orderType === "offline" && (
            <p className='text-[10px] text-muted-foreground'>
              For offline orders, payment status can be updated manually when payment is received.
            </p>
          )}
        </div>

        {/* Affiliate Information */}
        {(order.affiliateCode || order.affiliateId) && (
          <>
            <Separator className='my-3' />
            <div className='space-y-2'>
              <Label className='text-xs sm:text-sm font-semibold flex items-center gap-1.5'>
                <Gift className='h-3.5 w-3.5 text-green-600 dark:text-green-400' />
                Affiliate Information
              </Label>
              <div className='p-3 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-800 space-y-2'>
                {order.affiliateCode && (
                  <div className='flex items-center justify-between'>
                    <span className='text-xs text-muted-foreground'>Promo Code:</span>
                    <code className='text-xs font-mono font-semibold text-green-700 dark:text-green-400'>{order.affiliateCode}</code>
                  </div>
                )}
                {order.affiliateCommission && (
                  <div className='flex items-center justify-between'>
                    <span className='text-xs text-muted-foreground'>Commission:</span>
                    <span className='text-xs font-semibold text-green-700 dark:text-green-400'>
                      {currencySymbol}
                      {order.affiliateCommission.toFixed(2)}
                    </span>
                  </div>
                )}
                {order.affiliateId && (
                  <div className='flex items-center justify-between'>
                    <span className='text-xs text-muted-foreground'>Affiliate ID:</span>
                    <code className='text-xs font-mono text-muted-foreground'>{order.affiliateId.slice(-8)}</code>
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {/* Source Tracking / Analytics Information */}
        {order.sourceTracking && (
          <>
            <Separator className='my-3' />
            <div className='space-y-2'>
              <Label className='text-xs sm:text-sm font-semibold flex items-center gap-1.5'>
                <BarChart3 className='h-3.5 w-3.5 text-blue-600 dark:text-blue-400' />
                Traffic Source & Analytics
              </Label>
              <div className='p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800 space-y-2'>
                {order.sourceTracking.fbclid && (
                  <div className='flex items-center justify-between'>
                    <span className='text-xs text-muted-foreground flex items-center gap-1'>
                      <Globe className='h-3 w-3' />
                      Facebook Click ID:
                    </span>
                    <code className='text-xs font-mono text-blue-700 dark:text-blue-400 max-w-[200px] truncate'>
                      {order.sourceTracking.fbclid}
                    </code>
                  </div>
                )}
                {order.sourceTracking.gclid && (
                  <div className='flex items-center justify-between'>
                    <span className='text-xs text-muted-foreground flex items-center gap-1'>
                      <Globe className='h-3 w-3' />
                      Google Click ID:
                    </span>
                    <code className='text-xs font-mono text-blue-700 dark:text-blue-400 max-w-[200px] truncate'>
                      {order.sourceTracking.gclid}
                    </code>
                  </div>
                )}
                {order.sourceTracking.utm_source && (
                  <div className='flex items-center justify-between'>
                    <span className='text-xs text-muted-foreground'>UTM Source:</span>
                    <Badge
                      variant='outline'
                      className='text-xs font-semibold text-blue-700 dark:text-blue-400 border-blue-300 dark:border-blue-700'
                    >
                      {order.sourceTracking.utm_source}
                    </Badge>
                  </div>
                )}
                {order.sourceTracking.utm_medium && (
                  <div className='flex items-center justify-between'>
                    <span className='text-xs text-muted-foreground'>UTM Medium:</span>
                    <Badge
                      variant='outline'
                      className='text-xs font-semibold text-blue-700 dark:text-blue-400 border-blue-300 dark:border-blue-700'
                    >
                      {order.sourceTracking.utm_medium}
                    </Badge>
                  </div>
                )}
                {order.sourceTracking.utm_campaign && (
                  <div className='flex items-center justify-between'>
                    <span className='text-xs text-muted-foreground'>UTM Campaign:</span>
                    <Badge
                      variant='outline'
                      className='text-xs font-semibold text-blue-700 dark:text-blue-400 border-blue-300 dark:border-blue-700'
                    >
                      {order.sourceTracking.utm_campaign}
                    </Badge>
                  </div>
                )}
                {order.sourceTracking.utm_term && (
                  <div className='flex items-center justify-between'>
                    <span className='text-xs text-muted-foreground'>UTM Term:</span>
                    <span className='text-xs font-medium text-blue-700 dark:text-blue-400'>{order.sourceTracking.utm_term}</span>
                  </div>
                )}
                {order.sourceTracking.utm_content && (
                  <div className='flex items-center justify-between'>
                    <span className='text-xs text-muted-foreground'>UTM Content:</span>
                    <span className='text-xs font-medium text-blue-700 dark:text-blue-400'>{order.sourceTracking.utm_content}</span>
                  </div>
                )}
                {order.sourceTracking.ref && (
                  <div className='flex items-center justify-between'>
                    <span className='text-xs text-muted-foreground'>Referrer:</span>
                    <span className='text-xs font-medium text-blue-700 dark:text-blue-400 max-w-[200px] truncate'>
                      {order.sourceTracking.ref}
                    </span>
                  </div>
                )}
                {order.sourceTracking.landingPage && (
                  <div className='flex items-start justify-between gap-2 pt-2 border-t border-blue-200 dark:border-blue-800'>
                    <span className='text-xs text-muted-foreground flex-shrink-0'>Landing Page:</span>
                    <a
                      href={order.sourceTracking.landingPage}
                      target='_blank'
                      rel='noopener noreferrer'
                      className='text-xs font-medium text-blue-700 dark:text-blue-400 hover:underline flex items-center gap-1 max-w-[250px] truncate'
                    >
                      {order.sourceTracking.landingPage}
                      <ExternalLink className='h-3 w-3 flex-shrink-0' />
                    </a>
                  </div>
                )}
                {order.sourceTracking.firstSeenAt && (
                  <div className='flex items-center justify-between pt-2 border-t border-blue-200 dark:border-blue-800'>
                    <span className='text-xs text-muted-foreground'>First Seen:</span>
                    <span className='text-xs font-medium text-blue-700 dark:text-blue-400'>
                      {format(new Date(order.sourceTracking.firstSeenAt), "MMM dd, yyyy 'at' h:mm a")}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
