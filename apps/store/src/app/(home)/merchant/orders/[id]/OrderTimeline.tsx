"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { OrderTimelineEvent, OrderStatus } from "@/lib/types";
import { format, formatDistanceToNow } from "date-fns";
import { CheckCircle2, Clock, Package, Truck, XCircle, RotateCcw, Box, Send, Hourglass, CheckCircle, ChevronDown, ChevronUp, History } from "lucide-react";
import { cn } from "@/lib/utils";

interface OrderTimelineProps {
  timeline: OrderTimelineEvent[];
  currentStatus: OrderStatus;
  createdAt: string;
}

const statusConfig: Record<OrderStatus, { label: string; icon: React.ReactNode; color: string; bgColor: string }> = {
  pending: {
    label: "Order Placed",
    icon: <Clock className='w-4 h-4' />,
    color: "text-amber-600 dark:text-amber-400",
    bgColor: "bg-amber-100 dark:bg-amber-900/30 border-amber-200 dark:border-amber-800",
  },
  waiting_for_confirmation: {
    label: "Waiting for Confirmation",
    icon: <Hourglass className='w-4 h-4' />,
    color: "text-yellow-600 dark:text-yellow-400",
    bgColor: "bg-yellow-100 dark:bg-yellow-900/30 border-yellow-200 dark:border-yellow-800",
  },
  confirmed: {
    label: "Confirmed",
    icon: <CheckCircle className='w-4 h-4' />,
    color: "text-cyan-600 dark:text-cyan-400",
    bgColor: "bg-cyan-100 dark:bg-cyan-900/30 border-cyan-200 dark:border-cyan-800",
  },
  processing: {
    label: "Processing",
    icon: <Package className='w-4 h-4' />,
    color: "text-blue-600 dark:text-blue-400",
    bgColor: "bg-blue-100 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800",
  },
  restocking: {
    label: "Restocking",
    icon: <RotateCcw className='w-4 h-4' />,
    color: "text-orange-600 dark:text-orange-400",
    bgColor: "bg-orange-100 dark:bg-orange-900/30 border-orange-200 dark:border-orange-800",
  },
  packed: {
    label: "Packed",
    icon: <Box className='w-4 h-4' />,
    color: "text-purple-600 dark:text-purple-400",
    bgColor: "bg-purple-100 dark:bg-purple-900/30 border-purple-200 dark:border-purple-800",
  },
  sent_to_logistics: {
    label: "Sent to Logistics",
    icon: <Send className='w-4 h-4' />,
    color: "text-indigo-600 dark:text-indigo-400",
    bgColor: "bg-indigo-100 dark:bg-indigo-900/30 border-indigo-200 dark:border-indigo-800",
  },
  shipped: {
    label: "Shipped",
    icon: <Truck className='w-4 h-4' />,
    color: "text-violet-600 dark:text-violet-400",
    bgColor: "bg-violet-100 dark:bg-violet-900/30 border-violet-200 dark:border-violet-800",
  },
  delivered: {
    label: "Delivered",
    icon: <CheckCircle2 className='w-4 h-4' />,
    color: "text-green-600 dark:text-green-400",
    bgColor: "bg-green-100 dark:bg-green-900/30 border-green-200 dark:border-green-800",
  },
  cancelled: {
    label: "Cancelled",
    icon: <XCircle className='w-4 h-4' />,
    color: "text-red-600 dark:text-red-400",
    bgColor: "bg-red-100 dark:bg-red-900/30 border-red-200 dark:border-red-800",
  },
};

export function OrderTimeline({ timeline, currentStatus, createdAt }: OrderTimelineProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Build complete timeline including initial order creation
  const completeTimeline: OrderTimelineEvent[] = [
    {
      status: "pending" as OrderStatus,
      timestamp: createdAt,
    },
    ...(timeline || []),
  ];

  // Remove duplicates and sort by timestamp
  const uniqueTimeline = Array.from(new Map(completeTimeline.map((item) => [item.status, item])).values()).sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  if (uniqueTimeline.length === 0) {
    return null;
  }

  const currentConfig = statusConfig[currentStatus] || statusConfig.pending;
  const latestEvent = uniqueTimeline[uniqueTimeline.length - 1];
  const latestDate = new Date(latestEvent.timestamp);

  return (
    <Card className='border shadow-md overflow-hidden gap-0 !pt-0'>
      {/* Mobile: Compact Collapsible */}
      <div className='sm:hidden'>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className='w-full px-3 py-3 flex items-center justify-between hover:bg-muted/30 transition-colors'
        >
          <div className='flex items-center gap-2'>
            <div className={cn('p-1.5 rounded-lg', currentConfig.bgColor)}>
              <History className={cn('h-4 w-4', currentConfig.color)} />
            </div>
            <div className='text-left'>
              <span className='text-sm font-semibold block'>Timeline</span>
              <span className='text-xs text-muted-foreground'>
                {uniqueTimeline.length} events • {formatDistanceToNow(latestDate, { addSuffix: true })}
              </span>
            </div>
          </div>
          <div className='flex items-center gap-2'>
            <Badge className={cn(currentConfig.bgColor, currentConfig.color, 'text-[10px] border-current')}>
              {currentConfig.label}
            </Badge>
            {isExpanded ? (
              <ChevronUp className='h-4 w-4 text-muted-foreground' />
            ) : (
              <ChevronDown className='h-4 w-4 text-muted-foreground' />
            )}
          </div>
        </button>

        {isExpanded && (
          <div className='px-3 pb-3'>
            {/* Compact Timeline */}
            <div className='relative pl-4 space-y-3'>
              <div className='absolute left-1.5 top-1 bottom-1 w-0.5 bg-border' />
              {uniqueTimeline.map((event, index) => {
                const config = statusConfig[event.status] || statusConfig.pending;
                const isCurrent = event.status === currentStatus;
                const eventDate = new Date(event.timestamp);

                return (
                  <div key={`${event.status}-${event.timestamp}`} className='relative flex items-start gap-3'>
                    <div
                      className={cn(
                        'relative z-10 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border',
                        isCurrent ? `${config.bgColor} ${config.color}` : 'bg-background border-muted-foreground/30'
                      )}
                    >
                      <div className={cn('scale-75', isCurrent ? config.color : 'text-muted-foreground')}>{config.icon}</div>
                    </div>
                    <div className='flex-1 min-w-0 -mt-0.5'>
                      <div className='flex items-center justify-between gap-2'>
                        <span className={cn('text-xs font-medium', isCurrent ? config.color : 'text-muted-foreground')}>
                          {config.label}
                        </span>
                        <span className='text-[10px] text-muted-foreground'>
                          {format(eventDate, 'MMM d, h:mm a')}
                        </span>
                      </div>
                      {event.note && (
                        <p className='text-[10px] text-muted-foreground mt-0.5 italic truncate'>{event.note}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Desktop: Original Layout */}
      <CardHeader className='hidden sm:flex px-3 sm:px-4 pt-3 sm:pt-4 pb-3'>
        <CardTitle className='flex items-center gap-2'>
          <Clock className='w-5 h-5' />
          Order Timeline
        </CardTitle>
      </CardHeader>
      <CardContent className='hidden sm:block p-3 sm:p-4 pt-0'>
        <div className='relative'>
          {/* Timeline line */}
          <div className='absolute left-4 top-0 bottom-0 w-0.5 bg-border' />

          {/* Timeline items */}
          <div className='space-y-6'>
            {uniqueTimeline.map((event, index) => {
              const config = statusConfig[event.status] || statusConfig.pending;
              const isLast = index === uniqueTimeline.length - 1;
              const isCurrent = event.status === currentStatus;
              const eventDate = new Date(event.timestamp);
              const isRecent = Date.now() - eventDate.getTime() < 24 * 60 * 60 * 1000; // Last 24 hours

              return (
                <div key={`${event.status}-${event.timestamp}`} className='relative flex items-start gap-4'>
                  {/* Timeline dot */}
                  <div
                    className={`relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 ${
                      isCurrent ? `${config.bgColor} ${config.color} border-current` : "bg-background border-muted-foreground/30"
                    }`}
                  >
                    <div className={isCurrent ? config.color : "text-muted-foreground"}>{config.icon}</div>
                  </div>

                  {/* Content */}
                  <div className='flex-1 space-y-1 pb-6'>
                    <div className='flex items-center gap-2 flex-wrap'>
                      <Badge variant='outline' className={`${config.bgColor} ${config.color} border-current font-medium`}>
                        {config.label}
                      </Badge>
                      {isCurrent && (
                        <Badge variant='outline' className='text-xs'>
                          Current
                        </Badge>
                      )}
                      {isRecent && (
                        <Badge
                          variant='outline'
                          className='text-xs bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800'
                        >
                          Recent
                        </Badge>
                      )}
                    </div>
                    <div className='text-sm text-muted-foreground space-y-1'>
                      <div className='flex items-center gap-2'>
                        <span>{format(eventDate, "MMM d, yyyy 'at' h:mm a")}</span>
                      </div>
                      <div className='text-xs'>{formatDistanceToNow(eventDate, { addSuffix: true })}</div>
                      {event.note && <div className='mt-2 p-2 rounded-md bg-muted text-xs italic'>{event.note}</div>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
