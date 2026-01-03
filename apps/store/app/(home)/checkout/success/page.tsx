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
import {
  CheckCircle,
  Package,
  MapPin,
  Phone,
  Mail,
  CreditCard,
  Calendar,
  ShoppingBag,
  ArrowLeft,
  Tag,
} from "lucide-react";
import CloudImage from "@/components/site/CloudImage";
import { format } from "date-fns";
import { useCurrencySymbol } from "@/hooks/use-currency";
import { useCart } from "@/components/providers/cart-provider";

function OrderSuccessContent() {
  const params = useSearchParams();
  const currencySymbol = useCurrencySymbol();
  const orderId = params.get("orderId");
  const paymentSource = params.get("payment");
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { items, clear } = useCart();

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

  // Clear cart when coming back from a successful online payment that matches the current cart
  useEffect(() => {
    if (!order) return;
    if (!items || items.length === 0) return;

    // Only auto-clear for online payments (from gateway redirect or order marked as online)
    const isFromOnlinePayment =
      paymentSource === "online" || order.paymentMethod === "online";
    if (!isFromOnlinePayment) return;

    // Ensure the current cart still matches this order (prevents clearing unrelated carts)
    const sameItems =
      items.length === order.items.length &&
      items.every((ci) =>
        order.items.some(
          (oi) =>
            oi.productId === ci.productId &&
            oi.size === ci.size &&
            oi.quantity === ci.quantity
        )
      );

    if (sameItems) {
      clear();
    }
  }, [order, items, clear, paymentSource]);

  // Track purchase event when order is loaded (client-side only)
  // Note: Server-side Purchase tracking is already handled in:
  // - /api/orders/place for COD orders
  // - /api/payment/success for online payment orders
  // This prevents duplicate tracking
  useEffect(() => {
    if (order && typeof window !== "undefined") {
      // Check if Purchase was already tracked for this order (prevent duplicate on reload)
      const trackingKey = `purchase-tracked-${order.id}`;
      if (sessionStorage.getItem(trackingKey)) {
        return; // Already tracked, skip
      }

      // Mark as tracked
      sessionStorage.setItem(trackingKey, "true");

      // Use consistent eventID format: purchase-{orderId} for proper deduplication
      // This matches the format used in server-side tracking
      const eventId = `purchase-${order.id}`;
      const contentIds = order.items.map((item) => item.productId);
      const numItems = order.items.reduce(
        (sum, item) => sum + item.quantity,
        0
      );

      // Initialize dataLayer if not exists
      if (!(window as any).dataLayer) {
        (window as any).dataLayer = [];
      }

      // Prepare items for dataLayer
      const dataLayerItems = order.items.map((item) => ({
        item_id: item.productId,
        item_name: item.name,
        item_category: item.category || "Product",
        price: item.price,
        quantity: item.quantity,
      }));

      // Fetch brand config for currency
      fetch("/api/brand-config", {
        cache: "force-cache",
        next: { revalidate: 300 },
      })
        .then((res) => res.json())
        .then((brandConfig) => {
          const currency = brandConfig?.currency?.iso || "USD";

          // Push purchase event to dataLayer (Google Analytics / GTM)
          (window as any).dataLayer.push({
            event: "purchase",
            ecommerce: {
              transaction_id: order.id,
              value: order.total,
              currency: currency,
              tax: 0,
              shipping: order.shipping,
              items: dataLayerItems,
            },
          });

          // Meta Pixel - Purchase (browser-side only, server-side already tracked in API)
          // Use eventID for deduplication with server-side event
          if ((window as any).fbq) {
            (window as any).fbq(
              "track",
              "Purchase",
              {
                content_ids: contentIds,
                content_type: "product",
                value: order.total,
                currency: currency,
                num_items: numItems,
                contents: order.items.map((item) => ({
                  id: item.productId,
                  quantity: item.quantity,
                  item_price: item.price,
                })),
              },
              { eventID: eventId }
            );
          }

          // TikTok Pixel - CompletePayment
          if ((window as any).ttq) {
            (window as any).ttq.track("CompletePayment", {
              content_type: "product",
              value: order.total,
              currency: currency,
              quantity: numItems,
              contents: order.items.map((item) => ({
                content_id: item.productId,
                content_name: item.name,
                quantity: item.quantity,
                price: item.price,
              })),
            });
          }

          // Pinterest Pixel - Purchase
          if ((window as any).pintrk) {
            (window as any).pintrk("track", "checkout", {
              order_quantity: numItems,
              order_id: order.id,
              value: order.total,
              currency: currency,
              line_items: dataLayerItems,
            });
          }

          // Snapchat Pixel - Purchase
          if ((window as any).snaptr) {
            (window as any).snaptr("track", "PURCHASE", {
              currency: currency,
              value: order.total,
              transaction_id: order.id,
            });
          }

          // LinkedIn Insight Tag - Purchase
          if ((window as any)._linkedin_partner_id) {
            (window as any).lintrk = (window as any).lintrk || {};
            (window as any).lintrk.q = (window as any).lintrk.q || [];
            (window as any).lintrk.q.push([
              "track",
              "Purchase",
              {
                value: order.total,
                currency: currency,
              },
            ]);
          }
        })
        .catch(() => {});
    }
  }, [order]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-accent/5">
        <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl rounded-2xl border bg-card p-10 text-center">
            <div className="mb-3 text-sm uppercase tracking-wider text-primary">
              Thank you
            </div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Your order has been placed
            </h1>
            <p className="mt-4 text-muted-foreground">
              Loading order details...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-accent/5">
        <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl rounded-2xl border bg-card p-10 text-center">
            <div className="mb-3 text-sm uppercase tracking-wider text-primary">
              Thank you
            </div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Your order has been placed
            </h1>
            {orderId && (
              <p className="mt-2 text-muted-foreground">Order ID: {orderId}</p>
            )}
            {error && <p className="mt-4 text-destructive">{error}</p>}
            <p className="mt-4 text-muted-foreground">
              We'll contact you shortly to confirm your delivery details.
            </p>
            <div className="mt-8 flex items-center justify-center gap-3">
              <Button asChild variant="outline">
                <Link href="/">Continue Shopping</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const addressLines = [
    order.customer.addressLine1,
    order.customer.addressLine2,
  ].filter(Boolean);
  const locationLine = [order.customer.city, order.customer.postalCode]
    .filter(Boolean)
    .join(", ");

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-accent/5">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Button asChild variant="ghost" size="sm" className="mb-4">
            <Link href="/" className="flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Home</span>
            </Link>
          </Button>
        </div>

        {/* Success Message */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
            <CheckCircle className="h-10 w-10 text-green-600 dark:text-green-400" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">
            Thank You for Your Order!
          </h1>
          <p className="mt-2 text-lg text-muted-foreground">
            Your order has been confirmed and is being processed
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Order Details - Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  Order Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Order ID</p>
                    <p className="font-mono font-semibold text-lg">
                      {order.customOrderId || order.id.slice(-10).toUpperCase()}
                    </p>
                    {order.customOrderId && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Ref: #{order.id.slice(-6).toUpperCase()}
                      </p>
                    )}
                  </div>
                  <Badge
                    variant={
                      order.status === "delivered"
                        ? "default"
                        : order.status === "pending"
                        ? "secondary"
                        : order.status === "cancelled"
                        ? "destructive"
                        : "outline"
                    }
                    className="capitalize"
                  >
                    {order.status}
                  </Badge>
                </div>
                <Separator />
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Order Date:</span>
                  <span className="font-medium">
                    {format(
                      new Date(order.createdAt),
                      "MMMM dd, yyyy 'at' h:mm a"
                    )}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CreditCard className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Payment Method:</span>
                  <span className="font-medium capitalize">
                    {order.paymentMethod === "cod"
                      ? "Cash on Delivery"
                      : "Online Payment"}
                  </span>
                </div>
                {order.paymentMethod === "online" && order.paymentStatus && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-muted-foreground">
                      Payment Status:
                    </span>
                    <Badge
                      variant={
                        order.paymentStatus === "completed"
                          ? "default"
                          : order.paymentStatus === "failed"
                          ? "destructive"
                          : "secondary"
                      }
                      className="capitalize"
                    >
                      {order.paymentStatus}
                    </Badge>
                  </div>
                )}
                {order.couponCode && (
                  <div className="flex items-center gap-2 text-sm">
                    <Tag className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Coupon Code:</span>
                    <Badge className="bg-purple-50 text-purple-700 dark:bg-purple-950/50 dark:text-purple-400 border-purple-200 dark:border-purple-800 font-medium font-mono">
                      {order.couponCode}
                    </Badge>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Order Items */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5" />
                  Order Items ({order.items.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {order.items.map((item, index) => (
                    <div key={index}>
                      <div className="flex gap-4">
                        <div className="relative h-20 w-20 overflow-hidden rounded-lg border bg-accent/30 flex-shrink-0">
                          <CloudImage
                            src={item.image}
                            alt={item.name}
                            fill
                            className="object-contain p-1"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold line-clamp-2">
                            {item.name}
                          </h3>
                          <div className="mt-1 flex items-center gap-2">
                            {item.size && (
                              <Badge variant="outline" className="text-xs">
                                Size {item.size}
                              </Badge>
                            )}
                            <span className="text-sm text-muted-foreground">
                              Quantity: {item.quantity}
                            </span>
                          </div>
                          <p className="mt-1 text-sm font-semibold text-primary">
                            {currencySymbol}
                            {(item.price * item.quantity).toFixed(2)}
                          </p>
                        </div>
                      </div>
                      {index < order.items.length - 1 && (
                        <Separator className="mt-4" />
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Delivery Address */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  Delivery Address
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  <p className="font-semibold">{order.customer.fullName}</p>
                  {addressLines.map((line, index) => (
                    <p
                      key={`address-line-${index}`}
                      className="text-sm text-muted-foreground"
                    >
                      {line}
                    </p>
                  ))}
                  {locationLine && (
                    <p className="text-sm text-muted-foreground">
                      {locationLine}
                    </p>
                  )}
                  <div className="mt-3 space-y-1">
                    {order.customer.phone && (
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="w-4 h-4 text-muted-foreground" />
                        <span>{order.customer.phone}</span>
                      </div>
                    )}
                    {order.customer.email && (
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="w-4 h-4 text-muted-foreground" />
                        <span>{order.customer.email}</span>
                      </div>
                    )}
                  </div>
                  {order.customer.notes && (
                    <div className="mt-3 rounded-lg bg-accent/50 p-3">
                      <p className="text-xs font-medium text-muted-foreground mb-1">
                        Delivery Notes:
                      </p>
                      <p className="text-sm">{order.customer.notes}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Order Summary - Sidebar */}
          <div className="lg:col-span-1">
            <Card className="sticky top-8">
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">
                      Subtotal ({order.items.length} item
                      {order.items.length !== 1 ? "s" : ""})
                    </span>
                    <span className="font-medium">
                      {currencySymbol}
                      {order.subtotal.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Shipping</span>
                    <span className="font-medium">
                      {order.shipping === 0 ? (
                        <span className="text-emerald-600 dark:text-emerald-400">
                          Free
                        </span>
                      ) : (
                        `${currencySymbol}${order.shipping.toFixed(2)}`
                      )}
                    </span>
                  </div>
                  {order.discountAmount && order.discountAmount > 0 && (
                    <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Discount</span>
                        {order.couponCode && (
                          <Badge className="bg-purple-50 text-purple-700 dark:bg-purple-950/50 dark:text-purple-400 border-purple-200 dark:border-purple-800 text-xs font-mono px-1.5 py-0">
                            {order.couponCode}
                          </Badge>
                        )}
                      </div>
                      <span className="font-semibold">
                        -{currencySymbol}
                        {order.discountAmount.toFixed(2)}
                      </span>
                    </div>
                  )}
                  {order.vatTaxAmount && order.vatTaxAmount > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">
                        {order.vatTaxPercentage
                          ? `VAT/Tax (${order.vatTaxPercentage}%)`
                          : "VAT/Tax"}
                      </span>
                      <span className="font-medium">
                        {currencySymbol}
                        {order.vatTaxAmount.toFixed(2)}
                      </span>
                    </div>
                  )}
                  <Separator />
                  <div className="flex items-center justify-between text-lg font-bold">
                    <span>Total</span>
                    <span>
                      {currencySymbol}
                      {order.total.toFixed(2)}
                    </span>
                  </div>
                </div>

                <Separator />

                {/* Next Steps */}
                <div className="rounded-lg bg-primary/5 p-4">
                  <h3 className="font-semibold mb-2 text-sm">What's Next?</h3>
                  <ul className="space-y-2 text-xs text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-3 h-3 mt-0.5 flex-shrink-0 text-primary" />
                      <span>You'll receive a confirmation email shortly</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-3 h-3 mt-0.5 flex-shrink-0 text-primary" />
                      <span>We'll contact you to confirm delivery details</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-3 h-3 mt-0.5 flex-shrink-0 text-primary" />
                      <span>Your order will be processed within 24 hours</span>
                    </li>
                  </ul>
                </div>

                {/* Action Buttons */}
                <div className="space-y-2">
                  <Button asChild className="w-full" size="lg">
                    <Link href="/">Continue Shopping</Link>
                  </Button>
                  <Button asChild variant="outline" className="w-full">
                    <Link href="/account?tab=orders">View My Orders</Link>
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

export default function OrderSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-background to-accent/5">
          <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-2xl rounded-2xl border bg-card p-10 text-center">
              <div className="mb-3 text-sm uppercase tracking-wider text-primary">
                Thank you
              </div>
              <h1 className="text-2xl font-semibold tracking-tight">
                Your order has been placed
              </h1>
              <p className="mt-4 text-muted-foreground">
                Loading order details...
              </p>
            </div>
          </div>
        </div>
      }
    >
      <OrderSuccessContent />
    </Suspense>
  );
}
