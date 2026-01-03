"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Suspense } from "react";
import type { Order } from "@/lib/types";
import { XCircle, Package, MapPin, Phone, Mail, CreditCard, Calendar, ShoppingBag, ArrowLeft, Info, ShoppingCart } from "lucide-react";
import CloudImage from "@/components/site/CloudImage";
import { format } from "date-fns";
import { useCurrencySymbol } from "@/hooks/use-currency";

function PaymentCancelContent() {
  const params = useSearchParams();
  const currencySymbol = useCurrencySymbol();
  const orderId = params.get("orderId");
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!orderId) {
      setLoading(false);
      return;
    }

    const fetchOrder = async () => {
      try {
        const res = await fetch(`/api/orders/${orderId}`);
        if (!res.ok) {
          throw new Error("Failed to fetch order");
        }
        const data = (await res.json()) as Order;
        setOrder(data);
      } catch (err: any) {
        setError(err?.message || "Failed to load order details");
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId]);

  if (loading) {
    return (
      <div className='min-h-screen bg-gradient-to-br from-background to-accent/5'>
        <div className='mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8'>
          <div className='mx-auto max-w-2xl rounded-2xl border bg-card p-10 text-center'>
            <div className='mb-3 text-sm uppercase tracking-wider text-amber-600'>Payment Cancelled</div>
            <h1 className='text-2xl font-semibold tracking-tight'>Loading order details...</h1>
          </div>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className='min-h-screen bg-gradient-to-br from-background to-accent/5'>
        <div className='mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8'>
          <div className='mx-auto max-w-2xl rounded-2xl border bg-card p-10 text-center'>
            <div className='mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30'>
              <XCircle className='h-10 w-10 text-amber-600 dark:text-amber-400' />
            </div>
            <h1 className='text-2xl font-semibold tracking-tight'>Payment Cancelled</h1>
            {orderId && <p className='mt-2 text-muted-foreground'>Order ID: {orderId}</p>}
            {error && <p className='mt-4 text-destructive'>{error}</p>}
            <div className='mt-8 flex items-center justify-center gap-3'>
              <Button asChild variant='outline'>
                <Link href='/checkout'>Try Again</Link>
              </Button>
              <Button asChild>
                <Link href='/'>Continue Shopping</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const addressLines = [order.customer.addressLine1, order.customer.addressLine2].filter(Boolean);
  const locationLine = [order.customer.city, order.customer.postalCode].filter(Boolean).join(", ");

  return (
    <div className='min-h-screen bg-gradient-to-br from-background to-accent/5'>
      <div className='mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8'>
        {/* Header */}
        <div className='mb-8'>
          <Button asChild variant='ghost' size='sm' className='mb-4'>
            <Link href='/' className='flex items-center gap-2'>
              <ArrowLeft className='w-4 h-4' />
              <span>Back to Home</span>
            </Link>
          </Button>
        </div>

        {/* Cancellation Message */}
        <div className='mb-8 text-center'>
          <div className='mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30'>
            <XCircle className='h-10 w-10 text-amber-600 dark:text-amber-400' />
          </div>
          <h1 className='text-3xl font-bold tracking-tight'>Payment Cancelled</h1>
          <p className='mt-2 text-lg text-muted-foreground'>You cancelled the payment process. Your order is still saved.</p>
        </div>

        {/* Info Banner */}
        <Card className='mb-6 border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/20'>
          <CardContent className='pt-6'>
            <div className='flex items-start gap-3'>
              <Info className='h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5' />
              <div className='flex-1'>
                <h3 className='font-semibold text-amber-900 dark:text-amber-100 mb-1'>Your order is saved</h3>
                <p className='text-sm text-amber-800 dark:text-amber-200'>
                  Don't worry! Your order has been saved and you can complete the payment anytime. Your items are reserved for you.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className='grid gap-6 lg:grid-cols-3'>
          {/* Order Details - Main Content */}
          <div className='lg:col-span-2 space-y-6'>
            {/* Order Info */}
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <Package className='w-5 h-5' />
                  Order Information
                </CardTitle>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div className='flex items-center justify-between'>
                  <div>
                    <p className='text-sm text-muted-foreground'>Order ID</p>
                    <p className='font-mono font-semibold'>{order.id}</p>
                  </div>
                  <Badge variant='secondary' className='capitalize'>
                    {order.status}
                  </Badge>
                </div>
                <Separator />
                <div className='flex items-center gap-2 text-sm'>
                  <Calendar className='w-4 h-4 text-muted-foreground' />
                  <span className='text-muted-foreground'>Order Date:</span>
                  <span className='font-medium'>{format(new Date(order.createdAt), "MMMM dd, yyyy 'at' h:mm a")}</span>
                </div>
                <div className='flex items-center gap-2 text-sm'>
                  <CreditCard className='w-4 h-4 text-muted-foreground' />
                  <span className='text-muted-foreground'>Payment Method:</span>
                  <span className='font-medium capitalize'>{order.paymentMethod === "cod" ? "Cash on Delivery" : "Online Payment"}</span>
                </div>
                {order.paymentStatus && (
                  <div className='flex items-center gap-2 text-sm'>
                    <span className='text-muted-foreground'>Payment Status:</span>
                    <Badge variant='secondary' className='capitalize'>
                      {order.paymentStatus}
                    </Badge>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Order Items */}
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <ShoppingBag className='w-5 h-5' />
                  Order Items ({order.items.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className='space-y-4'>
                  {order.items.map((item, index) => (
                    <div key={index}>
                      <div className='flex gap-4'>
                        <div className='relative h-20 w-20 overflow-hidden rounded-lg border bg-accent/30 shrink-0'>
                          <CloudImage src={item.image} alt={item.name} fill className='object-contain p-1' />
                        </div>
                        <div className='flex-1 min-w-0'>
                          <h3 className='font-semibold line-clamp-2'>{item.name}</h3>
                          <div className='mt-1 flex items-center gap-2'>
                            {item.size && (
                              <Badge variant='outline' className='text-xs'>
                                Size {item.size}
                              </Badge>
                            )}
                            <span className='text-sm text-muted-foreground'>Quantity: {item.quantity}</span>
                          </div>
                          <p className='mt-1 text-sm font-semibold text-primary'>
                            {currencySymbol}
                            {(item.price * item.quantity).toFixed(2)}
                          </p>
                        </div>
                      </div>
                      {index < order.items.length - 1 && <Separator className='mt-4' />}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Delivery Address */}
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <MapPin className='w-5 h-5' />
                  Delivery Address
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className='space-y-1'>
                  <p className='font-semibold'>{order.customer.fullName}</p>
                  {addressLines.map((line, index) => (
                    <p key={`address-line-${index}`} className='text-sm text-muted-foreground'>
                      {line}
                    </p>
                  ))}
                  {locationLine && <p className='text-sm text-muted-foreground'>{locationLine}</p>}
                  <div className='mt-3 space-y-1'>
                    {order.customer.phone && (
                      <div className='flex items-center gap-2 text-sm'>
                        <Phone className='w-4 h-4 text-muted-foreground' />
                        <span>{order.customer.phone}</span>
                      </div>
                    )}
                    {order.customer.email && (
                      <div className='flex items-center gap-2 text-sm'>
                        <Mail className='w-4 h-4 text-muted-foreground' />
                        <span>{order.customer.email}</span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Order Summary - Sidebar */}
          <div className='lg:col-span-1'>
            <Card className='sticky top-8'>
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div className='space-y-2 text-sm'>
                  <div className='flex items-center justify-between'>
                    <span className='text-muted-foreground'>
                      Subtotal ({order.items.length} item{order.items.length !== 1 ? "s" : ""})
                    </span>
                    <span className='font-medium'>
                      {currencySymbol}
                      {order.subtotal.toFixed(2)}
                    </span>
                  </div>
                  {order.discountAmount && order.discountAmount > 0 && (
                    <div className='flex items-center justify-between text-green-600'>
                      <span className='text-muted-foreground'>Discount</span>
                      <span className='font-medium'>
                        -{currencySymbol}
                        {order.discountAmount.toFixed(2)}
                      </span>
                    </div>
                  )}
                  {order.vatTaxAmount && order.vatTaxAmount > 0 && (
                    <div className='flex items-center justify-between'>
                      <span className='text-muted-foreground'>VAT/TAX</span>
                      <span className='font-medium'>
                        {currencySymbol}
                        {order.vatTaxAmount.toFixed(2)}
                      </span>
                    </div>
                  )}
                  <div className='flex items-center justify-between'>
                    <span className='text-muted-foreground'>Shipping</span>
                    <span className='font-medium'>{order.shipping === 0 ? "Free" : `${currencySymbol}${order.shipping.toFixed(2)}`}</span>
                  </div>
                  <Separator />
                  <div className='flex items-center justify-between text-lg font-bold'>
                    <span>Total</span>
                    <span>
                      {currencySymbol}
                      {order.total.toFixed(2)}
                    </span>
                  </div>
                </div>

                <Separator />

                {/* Next Steps */}
                <div className='rounded-lg bg-primary/5 p-4'>
                  <h3 className='font-semibold mb-2 text-sm'>What's Next?</h3>
                  <ul className='space-y-2 text-xs text-muted-foreground'>
                    <li className='flex items-start gap-2'>
                      <Info className='w-3 h-3 mt-0.5 shrink-0 text-primary' />
                      <span>Your order is saved and ready for payment</span>
                    </li>
                    <li className='flex items-start gap-2'>
                      <Info className='w-3 h-3 mt-0.5 shrink-0 text-primary' />
                      <span>Complete payment anytime to proceed</span>
                    </li>
                    <li className='flex items-start gap-2'>
                      <Info className='w-3 h-3 mt-0.5 shrink-0 text-primary' />
                      <span>Items will be reserved for you</span>
                    </li>
                  </ul>
                </div>

                {/* Action Buttons */}
                <div className='space-y-2'>
                  <Button asChild className='w-full' size='lg'>
                    <Link href='/checkout' className='flex items-center justify-center gap-2'>
                      <ShoppingCart className='w-4 h-4' />
                      Complete Payment
                    </Link>
                  </Button>
                  <Button asChild variant='outline' className='w-full'>
                    <Link href='/'>Continue Shopping</Link>
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

export default function PaymentCancelPage() {
  return (
    <Suspense
      fallback={
        <div className='min-h-screen bg-gradient-to-br from-background to-accent/5'>
          <div className='mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8'>
            <div className='mx-auto max-w-2xl rounded-2xl border bg-card p-10 text-center'>
              <div className='mb-3 text-sm uppercase tracking-wider text-amber-600'>Payment Cancelled</div>
              <h1 className='text-2xl font-semibold tracking-tight'>Loading order details...</h1>
            </div>
          </div>
        </div>
      }
    >
      <PaymentCancelContent />
    </Suspense>
  );
}
