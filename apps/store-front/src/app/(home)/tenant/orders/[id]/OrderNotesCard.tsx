"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { FileText, ChevronDown, ChevronUp, StickyNote } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Order } from "@/lib/types";

interface OrderNotesCardProps {
  order: Order;
  onUpdateNotes: (notes: string) => void;
}

export function OrderNotesCard({ order, onUpdateNotes }: OrderNotesCardProps) {
  const [isExpanded, setIsExpanded] = useState(!!order.customer.notes);
  const hasNotes = !!order.customer.notes && order.customer.notes.trim().length > 0;

  return (
    <Card className='border shadow-md overflow-hidden gap-0 !pt-0'>
      {/* Mobile: Compact Header with Expand Toggle */}
      <div className='sm:hidden'>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className='w-full px-3 py-3 flex items-center justify-between hover:bg-muted/30 transition-colors'
        >
          <div className='flex items-center gap-2'>
            <div className='p-1.5 bg-amber-500/10 rounded-lg'>
              <FileText className='h-4 w-4 text-amber-600 dark:text-amber-400' />
            </div>
            <span className='text-sm font-semibold'>Order Notes</span>
            {hasNotes && (
              <span className='px-1.5 py-0.5 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 text-[10px] rounded-full font-medium'>
                {order.customer.notes!.length > 50 ? "..." : order.customer.notes!.slice(0, 20)}
              </span>
            )}
          </div>
          {isExpanded ? (
            <ChevronUp className='h-4 w-4 text-muted-foreground' />
          ) : (
            <ChevronDown className='h-4 w-4 text-muted-foreground' />
          )}
        </button>
        {isExpanded && (
          <div className='px-3 pb-3'>
            <Textarea
              placeholder='Add internal notes...'
              value={order.customer.notes || ""}
              onChange={(e) => onUpdateNotes(e.target.value)}
              className='min-h-[80px] text-sm border focus-visible:border-amber-500 resize-none'
            />
          </div>
        )}
      </div>

      {/* Desktop: Full Card */}
      <CardHeader className='hidden sm:flex sm:pb-4 px-3 sm:px-4 pt-3 sm:pt-4 !pb-4 border-b'>
        <CardTitle className='flex items-center gap-2 text-base sm:text-lg'>
          <div className='p-1.5 bg-amber-500/10 rounded-lg'>
            <FileText className='h-4 w-4 text-amber-600 dark:text-amber-400' />
          </div>
          Order Notes
        </CardTitle>
      </CardHeader>
      <CardContent className='hidden sm:block p-3 sm:p-4'>
        <Textarea
          placeholder='Add internal notes about this order...'
          value={order.customer.notes || ""}
          onChange={(e) => onUpdateNotes(e.target.value)}
          className='min-h-[100px] text-sm border focus-visible:border-amber-500 resize-none'
        />
      </CardContent>
    </Card>
  );
}
