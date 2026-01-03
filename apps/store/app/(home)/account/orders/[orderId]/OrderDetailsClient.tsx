"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Package,
  Calendar,
  DollarSign,
  ArrowLeft,
  ShoppingBag,
  Truck,
  CheckCircle,
  XCircle,
  Clock,
  MapPin,
  Phone,
  Mail,
  CreditCard,
  Tag,
} from "lucide-react";
import CloudImage from "@/components/site/CloudImage";
import type { Order } from "@/lib/types";
import { format } from "date-fns";
import { useCurrencySymbol } from "@/hooks/use-currency";
import { toast } from "sonner";
import { Spinner } from "@/components/ui/spinner";
import { AlertCircle } from "lucide-react";
import { apiRequest } from "@/lib/api-client";

const statusColors: Record<string, string> = {
  pending: "bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400 border-amber-200 dark:border-amber-800",
  processing: "bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400 border-blue-200 dark:border-blue-800",
  shipped: "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800",
  delivered: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800",
  cancelled: "bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-400 border-rose-200 dark:border-rose-800",
};

const statusIcons: Record<string, React.ReactNode> = {
  pending: <Clock className='w-4 h-4' />,
  processing: <Package className='w-4 h-4' />,
  shipped: <Truck className='w-4 h-4' />,
  delivered: <CheckCircle className='w-4 h-4' />,
  cancelled: <XCircle className='w-4 h-4' />,
};

const paymentStatusColors: Record<string, string> = {
  completed: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800",
  pending: "bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400 border-amber-200 dark:border-amber-800",
  failed: "bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-400 border-rose-200 dark:border-rose-800",
  cancelled: "bg-gray-50 text-gray-700 dark:bg-gray-950/50 dark:text-gray-400 border-gray-200 dark:border-gray-800",
  refunded: "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800",
};

export default function OrderDetailsClient() {
  const params = useParams();
  const router = useRouter();
  const currencySymbol = useCurrencySymbol();
  const orderId = params?.orderId as string;
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!orderId) {
      setLoading(false);
      setError("Order ID is required");
      return;
    }

    const fetchOrder = async () => {
      try {
        const data: any = await apiRequest("GET", `/orders/${orderId}`);
        setOrder(data);
        setError(null);
      } catch (err: any) {
        setError(err?.message || "Failed to load order details");
        toast.error(err?.message || "Failed to load order details");
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId]);

  if (loading) {
    return (
      <div className='min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center p-4'>
        <div className='text-center space-y-4 max-w-sm w-full'>
          <div className='relative mx-auto w-16 h-16'>
            <Spinner className='h-16 w-16 mx-auto' />
          </div>
          <div className='space-y-2'>
            <h3 className='text-lg font-semibold'>Loading order details</h3>
            <p className='text-sm text-muted-foreground'>Please wait while we fetch your order information...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className='min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center p-4'>
        <Card className='max-w-md w-full shadow-lg'>
          <CardContent className='p-6 sm:p-8 text-center space-y-4'>
            <div className='mx-auto w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center'>
              <AlertCircle className='w-8 h-8 text-destructive' />
            </div>
            <div className='space-y-2'>
              <h2 className='text-xl font-semibold'>Order Not Found</h2>
              <p className='text-sm text-muted-foreground'>{error || "The order you're looking for doesn't exist."}</p>
            </div>
            <div className='flex flex-col sm:flex-row gap-3 justify-center'>
              <Button onClick={() => router.back()} variant='outline'>
                Go Back
              </Button>
              <Button asChild>
                <Link href='/account/orders'>View All Orders</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const addressLines = [order.customer.addressLine1, order.customer.addressLine2].filter(Boolean);
  const locationLine = [order.customer.city, order.customer.postalCode].filter(Boolean).join(", ");

  return (
    <div className='min-h-screen bg-gradient-to-br from-background via-background to-muted/20'>
      <div className='mx-auto max-w-[1440px] px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8'>
        {/* Header */}
        <div className='mb-4 sm:mb-6'>
          {/* Back Button */}
          <Button variant='ghost' size='sm' className='mb-4 -ml-2 hover:bg-muted/50' asChild>
            <Link href='/account/orders' className='flex items-center gap-2 text-sm font-medium'>
              <ArrowLeft className='w-4 h-4' />
              <span>Back to Orders</span>
            </Link>
          </Button>

          {/* Title & Order ID */}
          <div className='space-y-3'>
            <div className='flex items-center gap-3'>
              <div className='w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0'>
                <Package className='w-5 h-5 text-primary' />
              </div>
              <div className='min-w-0 flex-1'>
                <h1 className='text-xl sm:text-2xl md:text-3xl font-bold tracking-tight'>Order Details</h1>
                <p className='text-xs sm:text-sm text-muted-foreground font-mono mt-0.5'>#{order.id.slice(-8).toUpperCase()}</p>
              </div>
            </div>

            {/* Status Badges */}
            <div className='flex items-center gap-2 flex-wrap'>
              <Badge className={`${statusColors[order.status] || ""} border font-medium px-2.5 py-1 text-xs flex items-center gap-1.5`}>
                {statusIcons[order.status]}
                <span className='capitalize'>{order.status}</span>
              </Badge>
              {order.paymentMethod === "online" && order.paymentStatus && (
                <Badge
                  className={`${paymentStatusColors[order.paymentStatus] || paymentStatusColors.pending
                    } border font-medium px-2.5 py-1 text-xs flex items-center gap-1.5`}
                >
                  <DollarSign className='w-3.5 h-3.5' />
                  <span className='capitalize'>{order.paymentStatus}</span>
                </Badge>
              )}
              {order.paymentMethod === "cod" && (
                <Badge className='bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400 border-blue-200 dark:border-blue-800 font-medium px-2.5 py-1 text-xs flex items-center gap-1.5'>
                  <DollarSign className='w-3.5 h-3.5' />
                  <span>COD</span>
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className='grid gap-4 sm:gap-6 lg:grid-cols-3'>
          {/* Left Column - Order Details */}
          <div className='lg:col-span-2 space-y-4 sm:space-y-6'>
            {/* Order Information */}
            <Card className='shadow-sm'>
              <CardHeader className='pb-3'>
                <CardTitle className='flex items-center gap-2 text-base sm:text-lg'>
                  <Package className='w-4 h-4 sm:w-5 sm:h-5' />
                  Order Information
                </CardTitle>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div className='grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4'>
                  <div>
                    <p className='text-xs sm:text-sm text-muted-foreground mb-1'>Order ID</p>
                    <p className='font-mono font-semibold text-sm sm:text-base break-all'>
                      {order.customOrderId || order.id.slice(-10).toUpperCase()}
                    </p>
                    {order.customOrderId && (
                      <p className='text-[10px] text-muted-foreground mt-0.5'>
                        Ref: #{order.id.slice(-6).toUpperCase()}
                      </p>
                    )}
                  </div>
                  <div>
                    <p className='text-xs sm:text-sm text-muted-foreground mb-1'>Order Date</p>
                    <div className='flex items-start gap-2 text-xs sm:text-sm font-medium'>
                      <Calendar className='w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground shrink-0 mt-0.5' />
                      <span className='break-words'>{format(new Date(order.createdAt), "MMM dd, yyyy 'at' h:mm a")}</span>
                    </div>
                  </div>
                </div>
                <Separator />
                <div className='grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4'>
                  <div className='flex items-start gap-2'>
                    <CreditCard className='w-4 h-4 text-muted-foreground shrink-0 mt-0.5' />
                    <div className='min-w-0'>
                      <p className='text-muted-foreground text-xs mb-0.5'>Payment Method</p>
                      <p className='font-medium text-xs sm:text-sm capitalize'>
                        {order.paymentMethod === "cod" ? "Cash on Delivery" : "Online Payment"}
                      </p>
                    </div>
                  </div>
                  {order.paymentMethod === "online" && order.paymentStatus && (
                    <div>
                      <p className='text-muted-foreground text-xs mb-1'>Payment Status</p>
                      <Badge
                        className={`${paymentStatusColors[order.paymentStatus] || paymentStatusColors.pending
                          } border font-medium text-xs px-2 py-0.5`}
                      >
                        {order.paymentStatus}
                      </Badge>
                    </div>
                  )}
                  {order.paymentTransactionId && (
                    <div className='col-span-full'>
                      <p className='text-muted-foreground text-xs mb-1'>Transaction ID</p>
                      <p className='font-mono text-xs break-all'>{order.paymentTransactionId}</p>
                    </div>
                  )}
                  {order.couponCode && (
                    <div className='flex items-start gap-2'>
                      <Tag className='w-4 h-4 text-muted-foreground shrink-0 mt-0.5' />
                      <div className='min-w-0'>
                        <p className='text-muted-foreground text-xs mb-1'>Coupon Code</p>
                        <Badge className='bg-purple-50 text-purple-700 dark:bg-purple-950/50 dark:text-purple-400 border-purple-200 dark:border-purple-800 font-medium font-mono text-xs px-2 py-0.5'>
                          {order.couponCode}
                        </Badge>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Order Items */}
            <Card className='shadow-sm'>
              <CardHeader className='pb-3'>
                <CardTitle className='flex items-center gap-2 text-base sm:text-lg'>
                  <ShoppingBag className='w-4 h-4 sm:w-5 sm:h-5' />
                  Order Items ({order.items.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className='space-y-3 sm:space-y-4'>
                  {order.items.map((item, index) => (
                    <div key={index}>
                      <div className='flex gap-3 sm:gap-4'>
                        <Link
                          href={`/products/${item.slug}`}
                          className='relative h-16 w-16 sm:h-20 sm:w-20 overflow-hidden rounded-lg border bg-accent/30 shrink-0 hover:border-primary transition-colors'
                        >
                          <CloudImage src={item.image} alt={item.name} fill className='object-contain p-1' />
                        </Link>
                        <div className='flex-1 min-w-0 space-y-1.5 sm:space-y-2'>
                          <Link href={`/products/${item.slug}`}>
                            <h3 className='font-semibold text-xs sm:text-sm line-clamp-2 hover:text-primary transition-colors leading-snug'>
                              {item.name}
                            </h3>
                          </Link>
                          <div className='flex items-center gap-2 flex-wrap'>
                            {item.size && (
                              <Badge variant='outline' className='text-xs px-1.5 py-0'>
                                Size {item.size}
                              </Badge>
                            )}
                            <span className='text-xs text-muted-foreground'>Qty: {item.quantity}</span>
                          </div>
                          <div className='flex items-baseline gap-2'>
                            <p className='text-sm sm:text-base font-bold text-primary'>
                              {currencySymbol}
                              {(item.price * item.quantity).toFixed(2)}
                            </p>
                            {item.price && (
                              <p className='text-xs text-muted-foreground'>
                                ({currencySymbol}
                                {item.price.toFixed(2)} each)
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                      {index < order.items.length - 1 && <Separator className='mt-3 sm:mt-4' />}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Delivery Address */}
            <Card className='shadow-sm'>
              <CardHeader className='pb-3'>
                <CardTitle className='flex items-center gap-2 text-base sm:text-lg'>
                  <MapPin className='w-4 h-4 sm:w-5 sm:h-5' />
                  Delivery Address
                </CardTitle>
              </CardHeader>
              <CardContent className='space-y-3'>
                <div className='space-y-1'>
                  <p className='font-semibold text-sm'>{order.customer.fullName}</p>
                  {addressLines.map((line, index) => (
                    <p key={`address-line-${index}`} className='text-xs sm:text-sm text-muted-foreground leading-relaxed'>
                      {line}
                    </p>
                  ))}
                  {locationLine && <p className='text-xs sm:text-sm text-muted-foreground'>{locationLine}</p>}
                </div>
                <Separator />
                <div className='space-y-2'>
                  {order.customer.phone && (
                    <div className='flex items-center gap-2 text-xs sm:text-sm'>
                      <Phone className='w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground shrink-0' />
                      <span className='break-all'>{order.customer.phone}</span>
                    </div>
                  )}
                  {order.customer.email && (
                    <div className='flex items-center gap-2 text-xs sm:text-sm'>
                      <Mail className='w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground shrink-0' />
                      <span className='break-all'>{order.customer.email}</span>
                    </div>
                  )}
                </div>
                {order.customer.notes && (
                  <div className='mt-3 rounded-lg bg-muted/50 p-3'>
                    <p className='text-xs font-medium text-muted-foreground mb-1'>Delivery Notes:</p>
                    <p className='text-xs sm:text-sm leading-relaxed'>{order.customer.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Order Summary */}
          <div className='lg:col-span-1'>
            <Card className='shadow-sm lg:sticky lg:top-8'>
              <CardHeader className='pb-3'>
                <CardTitle className='text-base sm:text-lg'>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div className='space-y-2.5 text-xs sm:text-sm'>
                  <div className='flex items-center justify-between gap-2'>
                    <span className='text-muted-foreground'>
                      Subtotal ({order.items.length} item{order.items.length !== 1 ? "s" : ""})
                    </span>
                    <span className='font-medium'>
                      {currencySymbol}
                      {order.subtotal.toFixed(2)}
                    </span>
                  </div>
                  <div className='flex items-center justify-between gap-2'>
                    <span className='text-muted-foreground'>Shipping</span>
                    <span className='font-medium'>
                      {order.shipping === 0 ? (
                        <span className='text-emerald-600 dark:text-emerald-400'>Free</span>
                      ) : (
                        `${currencySymbol}${order.shipping.toFixed(2)}`
                      )}
                    </span>
                  </div>
                  {order.discountAmount && order.discountAmount > 0 && (
                    <div className='flex items-center justify-between gap-2 text-emerald-600 dark:text-emerald-400'>
                      <div className='flex items-center gap-1.5 min-w-0'>
                        <span className='font-medium shrink-0'>Discount</span>
                        {order.couponCode && (
                          <Badge className='bg-purple-50 text-purple-700 dark:bg-purple-950/50 dark:text-purple-400 border-purple-200 dark:border-purple-800 text-xs font-mono px-1.5 py-0 shrink-0'>
                            {order.couponCode}
                          </Badge>
                        )}
                      </div>
                      <span className='font-semibold shrink-0'>
                        -{currencySymbol}
                        {order.discountAmount.toFixed(2)}
                      </span>
                    </div>
                  )}
                  {order.vatTaxAmount && order.vatTaxAmount > 0 && (
                    <div className='flex items-center justify-between gap-2'>
                      <span className='text-muted-foreground'>
                        {order.vatTaxPercentage ? `VAT/Tax (${order.vatTaxPercentage}%)` : "VAT/Tax"}
                      </span>
                      <span className='font-medium'>
                        {currencySymbol}
                        {order.vatTaxAmount.toFixed(2)}
                      </span>
                    </div>
                  )}
                  <Separator />
                  <div className='flex items-center justify-between gap-2 text-base sm:text-lg font-bold pt-1'>
                    <span>Total</span>
                    <span className='text-primary text-lg sm:text-xl'>
                      {currencySymbol}
                      {order.total.toFixed(2)}
                    </span>
                  </div>
                </div>

                <Separator />

                {/* Courier Info */}
                {order.courier && (
                  <div className='rounded-lg bg-muted/50 p-3 space-y-2'>
                    <h3 className='font-semibold text-xs sm:text-sm flex items-center gap-2'>
                      <Truck className='w-3.5 h-3.5 sm:w-4 sm:h-4' />
                      Shipping Information
                    </h3>
                    {order.courier.serviceName && (
                      <p className='text-xs text-muted-foreground break-words'>
                        Service: <span className='font-medium'>{order.courier.serviceName}</span>
                      </p>
                    )}
                    {order.courier.consignmentId && (
                      <p className='text-xs text-muted-foreground break-all'>
                        Tracking: <span className='font-mono font-medium'>{order.courier.consignmentId}</span>
                      </p>
                    )}
                    {order.courier.deliveryStatus && (
                      <p className='text-xs text-muted-foreground'>
                        Status: <span className='font-medium capitalize'>{order.courier.deliveryStatus}</span>
                      </p>
                    )}
                  </div>
                )}

                {/* Action Buttons */}
                <div className='space-y-2 pt-2'>
                  <Button asChild className='w-full text-sm' size='default'>
                    <Link href='/'>Continue Shopping</Link>
                  </Button>
                  <Button asChild variant='outline' className='w-full text-sm' size='default'>
                    <Link href='/account/orders'>View All Orders</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
