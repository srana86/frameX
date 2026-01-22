"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CreditCard, CheckCircle2, XCircle, DollarSign, Info, ChevronDown, ChevronUp, Truck, Percent, Receipt } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Order, PaymentStatus } from "@/lib/types";

interface PaymentSummaryCardProps {
  order: Order;
  calculateTotals: {
    subtotal: number;
    discountAmount: number;
    vatTaxAmount: number;
    total: number;
  };
  currencySymbol: string;
  getPaymentStatusColor: (status: PaymentStatus) => string;
  getPaymentStatusLabel: (status: PaymentStatus) => string;
  onUpdateShipping: (shipping: number) => void;
  onUpdatePaidAmount: (paidAmount: number, paymentStatus: PaymentStatus) => void;
}

export function PaymentSummaryCard({
  order,
  calculateTotals,
  currencySymbol,
  getPaymentStatusColor,
  getPaymentStatusLabel,
  onUpdateShipping,
  onUpdatePaidAmount,
}: PaymentSummaryCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const paidAmount = order.paidAmount ?? (order.paymentStatus === "completed" ? order.total : 0);
  const amountDue = Math.max(0, order.total - paidAmount);

  return (
    <Card className='border shadow-md overflow-hidden gap-0 !pt-0'>
      {/* Mobile: Compact Summary */}
      <div className='sm:hidden'>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className='w-full px-3 py-3 flex items-center justify-between hover:bg-muted/30 transition-colors'
        >
          <div className='flex items-center gap-2'>
            <div className='p-1.5 bg-green-500/10 rounded-lg'>
              <CreditCard className='h-4 w-4 text-green-600 dark:text-green-400' />
            </div>
            <div className='text-left'>
              <span className='text-sm font-semibold block'>Payment</span>
              <span className='text-xs text-muted-foreground'>
                {order.paymentStatus === "completed" ? "Paid in full" : `Due: ${currencySymbol}${amountDue.toFixed(0)}`}
              </span>
            </div>
          </div>
          <div className='flex items-center gap-2'>
            <span className='text-lg font-bold text-foreground'>
              {currencySymbol}{order.total.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </span>
            {isExpanded ? (
              <ChevronUp className='h-4 w-4 text-muted-foreground' />
            ) : (
              <ChevronDown className='h-4 w-4 text-muted-foreground' />
            )}
          </div>
        </button>
        
        {isExpanded && (
          <div className='px-3 pb-3 space-y-3'>
            {/* Quick Stats */}
            <div className='grid grid-cols-3 gap-2 text-center'>
              <div className='p-2 bg-muted/30 rounded-lg'>
                <Receipt className='h-3.5 w-3.5 mx-auto text-muted-foreground mb-1' />
                <p className='text-[10px] text-muted-foreground'>Subtotal</p>
                <p className='text-xs font-bold'>{currencySymbol}{calculateTotals.subtotal.toFixed(0)}</p>
              </div>
              <div className='p-2 bg-muted/30 rounded-lg'>
                <Truck className='h-3.5 w-3.5 mx-auto text-muted-foreground mb-1' />
                <p className='text-[10px] text-muted-foreground'>Delivery</p>
                <p className='text-xs font-bold'>{currencySymbol}{(order.shipping || 0).toFixed(0)}</p>
              </div>
              {calculateTotals.discountAmount > 0 && (
                <div className='p-2 bg-green-50 dark:bg-green-950/30 rounded-lg'>
                  <Percent className='h-3.5 w-3.5 mx-auto text-green-600 mb-1' />
                  <p className='text-[10px] text-muted-foreground'>Discount</p>
                  <p className='text-xs font-bold text-green-600'>-{currencySymbol}{calculateTotals.discountAmount.toFixed(0)}</p>
                </div>
              )}
            </div>

            {/* Paid Amount */}
            <div className='space-y-1.5'>
              <Label className='text-xs font-medium'>Paid Amount</Label>
              <div className='flex items-center gap-2'>
                <span className='text-sm font-medium text-muted-foreground'>{currencySymbol}</span>
                <Input
                  type='number'
                  value={paidAmount}
                  onChange={(e) => {
                    const newPaidAmount = parseFloat(e.target.value) || 0;
                    let newPaymentStatus: PaymentStatus = order.paymentStatus || "pending";
                    if (newPaidAmount >= order.total) {
                      newPaymentStatus = "completed";
                    } else if (newPaidAmount > 0) {
                      newPaymentStatus = "pending";
                    }
                    onUpdatePaidAmount(newPaidAmount, newPaymentStatus);
                  }}
                  min={0}
                  max={order.total}
                  step='0.01'
                  className='h-9 text-sm font-semibold flex-1'
                />
              </div>
            </div>

            {/* Edit Delivery Charge */}
            <div className='space-y-1.5'>
              <Label className='text-xs font-medium'>Delivery Charge</Label>
              <div className='flex items-center gap-2'>
                <span className='text-sm font-medium text-muted-foreground'>{currencySymbol}</span>
                <Input
                  type='number'
                  value={order.shipping || 0}
                  onChange={(e) => onUpdateShipping(parseFloat(e.target.value) || 0)}
                  min={0}
                  step='0.01'
                  className='h-9 text-sm font-semibold flex-1'
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Desktop: Original Layout */}
      <CardHeader className='hidden sm:flex sm:pb-4 px-3 sm:px-4 pt-3 sm:pt-4 !pb-4 border-b'>
        <div className='flex flex-col md:flex-row items-start md:items-center justify-between gap-2 md:gap-3'>
          <CardTitle className='flex items-center gap-2 text-base sm:text-lg md:text-xl'>
            <div className='p-1.5 sm:p-2 bg-green-500/10 rounded-lg'>
              <CreditCard className='h-4 w-4 sm:h-5 sm:w-5 text-green-600 dark:text-green-400' />
            </div>
            Payment Summary
          </CardTitle>
          <Badge className={`text-xs border-2 font-semibold shrink-0 ${getPaymentStatusColor(order.paymentStatus || "pending")}`}>
            {order.paymentStatus === "completed" ? (
              <>
                <CheckCircle2 className='h-3 w-3 sm:h-4 sm:w-4 mr-1' />
                <span className='hidden md:inline'>{getPaymentStatusLabel(order.paymentStatus)}</span>
                <span className='md:hidden'>Paid</span>
              </>
            ) : (
              <>
                <XCircle className='h-3 w-3 sm:h-4 sm:w-4 mr-1' />
                <span className='hidden md:inline'>{getPaymentStatusLabel(order.paymentStatus || "pending")}</span>
                <span className='md:hidden'>Pending</span>
              </>
            )}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className='hidden sm:block p-3 sm:p-4 space-y-3'>
        {/* Financial Breakdown - Compact */}
        <div className='space-y-2 bg-muted/30 border rounded-lg p-3'>
          <div className='flex justify-between items-center py-1'>
            <span className='text-xs sm:text-sm font-medium text-muted-foreground'>Subtotal</span>
            <span className='text-sm sm:text-base font-bold'>
              {currencySymbol}
              {calculateTotals.subtotal.toFixed(2)}
            </span>
          </div>
          {(calculateTotals.discountAmount > 0 || order.discountPercentage) && (
            <div className='flex justify-between items-center py-1 border-t border-dashed'>
              <span className='text-xs sm:text-sm font-medium text-muted-foreground'>
                Discount
                {order.discountPercentage && (
                  <span className='ml-1.5 text-[10px] md:text-xs text-muted-foreground/70'>({order.discountPercentage}%)</span>
                )}
              </span>
              <span className='text-sm sm:text-base font-bold text-green-600 dark:text-green-400'>
                -{currencySymbol}
                {calculateTotals.discountAmount.toFixed(2)}
              </span>
            </div>
          )}
          {(calculateTotals.vatTaxAmount > 0 || order.vatTaxPercentage) && (
            <div className='flex justify-between items-center py-1 border-t border-dashed'>
              <span className='text-xs sm:text-sm font-medium text-muted-foreground'>
                VAT/TAX
                {order.vatTaxPercentage && (
                  <span className='ml-1.5 text-[10px] md:text-xs text-muted-foreground/70'>({order.vatTaxPercentage}%)</span>
                )}
              </span>
              <span className='text-sm sm:text-base font-bold'>
                {currencySymbol}
                {calculateTotals.vatTaxAmount.toFixed(2)}
              </span>
            </div>
          )}
          <div className='flex justify-between items-center py-1 border-t border-dashed'>
            <span className='text-xs sm:text-sm font-medium text-muted-foreground'>Delivery Charge</span>
            <div className='flex items-center gap-1.5'>
              <span className='text-sm sm:text-base font-bold'>
                {currencySymbol}
                {(order.shipping || 0).toFixed(2)}
              </span>
              <Button
                variant='ghost'
                size='sm'
                className='h-6 w-6 p-0 hover:bg-primary/10'
                onClick={() => {
                  const newShipping = prompt("Enter new shipping charge:", order.shipping.toString());
                  if (newShipping !== null) {
                    onUpdateShipping(parseFloat(newShipping) || 0);
                  }
                }}
              >
                <Info className='h-3 w-3' />
              </Button>
            </div>
          </div>
        </div>

        <Separator className='my-2' />

        {/* Paid Amount Input - Compact */}
        <div className='space-y-2'>
          <Label className='text-xs sm:text-sm font-semibold flex items-center gap-1.5'>
            <DollarSign className='h-3.5 w-3.5' />
            Paid Amount
          </Label>
          <div className='relative'>
            <span className='absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-semibold'>{currencySymbol}</span>
            <Input
              type='number'
              value={order.paidAmount ?? (order.paymentStatus === "completed" ? order.total : 0)}
              onChange={(e) => {
                const paidAmount = parseFloat(e.target.value) || 0;
                let newPaymentStatus: PaymentStatus = order.paymentStatus || "pending";
                if (paidAmount >= order.total) {
                  newPaymentStatus = "completed";
                } else if (paidAmount > 0) {
                  newPaymentStatus = "pending";
                } else {
                  newPaymentStatus = "pending";
                }
                onUpdatePaidAmount(paidAmount, newPaymentStatus);
              }}
              min={0}
              max={order.total}
              step='0.01'
              className='pl-8 h-9 sm:h-10 text-sm sm:text-base font-semibold border focus-visible:border-primary'
            />
          </div>
        </div>

        {/* Grand Total - Desktop */}
        <Separator className='my-2' />
        <div className='flex justify-between items-center p-3 bg-primary/5 rounded-lg border border-primary/20'>
          <span className='text-sm font-bold text-foreground'>Grand Total</span>
          <span className='text-xl font-bold text-primary'>
            {currencySymbol}{order.total.toFixed(2)}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
