"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Package,
  Calendar,
  DollarSign,
  ExternalLink,
  AlertCircle,
  Search,
  ArrowLeft,
  ShoppingBag,
  Truck,
  CheckCircle,
  XCircle,
  Clock,
  Tag,
} from "lucide-react";
import CloudImage from "@/components/site/CloudImage";
import type { Order } from "@/lib/types";
import { format } from "date-fns";
import { useCurrencySymbol } from "@/hooks/use-currency";
import { toast } from "sonner";
import { Spinner } from "@/components/ui/spinner";
import { apiRequest } from "@/lib/api-client";

const statusColors: Record<string, string> = {
  pending: "bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400 border-amber-200 dark:border-amber-800",
  processing: "bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400 border-blue-200 dark:border-blue-800",
  shipped: "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800",
  delivered: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800",
  cancelled: "bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-400 border-rose-200 dark:border-rose-800",
};

const statusIcons: Record<string, React.ReactNode> = {
  pending: <Clock className='w-3.5 h-3.5 sm:w-4 sm:h-4' />,
  processing: <Package className='w-3.5 h-3.5 sm:w-4 sm:h-4' />,
  shipped: <Truck className='w-3.5 h-3.5 sm:w-4 sm:h-4' />,
  delivered: <CheckCircle className='w-3.5 h-3.5 sm:w-4 sm:h-4' />,
  cancelled: <XCircle className='w-3.5 h-3.5 sm:w-4 sm:h-4' />,
};

const paymentStatusColors: Record<string, string> = {
  completed: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800",
  pending: "bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400 border-amber-200 dark:border-amber-800",
  failed: "bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-400 border-rose-200 dark:border-rose-800",
  cancelled: "bg-gray-50 text-gray-700 dark:bg-gray-950/50 dark:text-gray-400 border-gray-200 dark:border-gray-800",
  refunded: "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800",
};

export default function MyOrdersClient() {
  const currencySymbol = useCurrencySymbol();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const fetchUserAndOrders = async () => {
      try {
        // Fetch user profile first
        const userData = await apiRequest<any>("GET", "/auth/me");
        if (!userData.data) {
          router.push("/login");
          return;
        }
        setUserProfile(userData.data);

        // Fetch orders
        const params = new URLSearchParams();
        if (userData.data.email) params.append("email", userData.data.email);
        if (userData.data.phone) params.append("phone", userData.data.phone);

        const ordersData = await apiRequest<any>("GET", `/orders/user?${params.toString()}`);
        setOrders(ordersData);
        setError(null);
      } catch (err: any) {
        if (err?.response?.status === 401) {
          router.push("/login");
          return;
        }
        setError(err?.message || "Failed to load orders");
        toast.error(err?.message || "Failed to load orders");
      } finally {
        setLoading(false);
      }
    };

    fetchUserAndOrders();
  }, [router]);

  const filteredOrders = orders.filter((order) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return order.id.toLowerCase().includes(query) || order.items.some((item) => item.name.toLowerCase().includes(query));
  });

  if (loading) {
    return (
      <div className='min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center p-4'>
        <div className='text-center space-y-4 max-w-sm w-full'>
          <div className='relative mx-auto w-16 h-16'>
            <Spinner className='h-16 w-16 mx-auto' />
          </div>
          <div className='space-y-2'>
            <h3 className='text-lg font-semibold'>Loading your orders</h3>
            <p className='text-sm text-muted-foreground'>Please wait while we fetch your order history...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error && !userProfile) {
    return (
      <div className='min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center p-4'>
        <Card className='max-w-md w-full shadow-lg'>
          <CardContent className='p-6 sm:p-8 text-center space-y-4'>
            <div className='mx-auto w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center'>
              <AlertCircle className='w-8 h-8 text-destructive' />
            </div>
            <div className='space-y-2'>
              <h2 className='text-xl font-semibold'>Error Loading Orders</h2>
              <p className='text-sm text-muted-foreground'>{error}</p>
            </div>
            <Button onClick={() => window.location.reload()} className='w-full sm:w-auto'>
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gradient-to-br from-background via-background to-muted/20'>
      <div className='mx-auto max-w-[1440px] px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8'>
        {/* Header Section */}
        <div className='mb-6 sm:mb-8'>
          {/* Back Button */}
          <Button variant='ghost' size='sm' className='mb-4 -ml-2 hover:bg-muted/50' asChild>
            <Link href='/account' className='flex items-center gap-2 text-sm font-medium'>
              <ArrowLeft className='w-4 h-4' />
              <span>Back to Account</span>
            </Link>
          </Button>

          {/* Title and Search Section */}
          <div className='flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 lg:gap-6'>
            {/* Title */}
            <div className='space-y-1'>
              <div className='flex items-center gap-3'>
                <div className='w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0'>
                  <ShoppingBag className='w-5 h-5 text-primary' />
                </div>
                <div>
                  <h1 className='text-2xl sm:text-3xl font-bold tracking-tight'>My Orders</h1>
                  <p className='text-sm text-muted-foreground mt-0.5'>
                    {orders.length > 0 ? `${orders.length} order${orders.length !== 1 ? "s" : ""} found` : "View and track your orders"}
                  </p>
                </div>
              </div>
            </div>

            {/* Search Bar */}
            {orders.length > 0 && (
              <div className='w-full lg:w-auto lg:min-w-[320px] lg:max-w-md'>
                <div className='relative'>
                  <Search className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none' />
                  <Input
                    placeholder='Search orders...'
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className='pl-9 h-10 w-full'
                  />
                </div>
              </div>
            )}
          </div>
        </div>
        {/* Orders List */}
        {filteredOrders.length === 0 && !loading ? (
          <Card className='shadow-none border-none'>
            <CardContent className='p-8 sm:p-12 text-center space-y-4'>
              <div className='mx-auto w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center'>
                <Package className='w-8 h-8 text-muted-foreground opacity-60' />
              </div>
              <div className='space-y-2'>
                <h2 className='text-xl sm:text-2xl font-semibold'>{searchQuery ? "No Orders Found" : "No Orders Yet"}</h2>
                <p className='text-sm text-muted-foreground max-w-md mx-auto'>
                  {searchQuery
                    ? "Try adjusting your search terms to find orders."
                    : "You haven't placed any orders yet. Start shopping to see your orders here!"}
                </p>
              </div>
              {!searchQuery && (
                <Button asChild size='default' className='mt-4'>
                  <Link href='/'>Start Shopping</Link>
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className='space-y-3'>
            {/* Orders Rows */}
            <div className='space-y-3'>
              {filteredOrders.map((order, index) => (
                <Link key={order.id} href={`/account/orders/${order.id}`} className='block group'>
                  <Card className='border shadow-sm hover:shadow-md hover:border-primary/20 transition-all duration-200'>
                    <CardContent className='p-4 md:p-5'>
                      <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4'>
                        {/* Order ID & Date */}
                        <div className='flex items-center gap-3'>
                          <div className='w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0'>
                            <Package className='w-4 h-4 text-primary' />
                          </div>
                          <div>
                            <p className='font-mono font-semibold text-sm'>#{order.id.slice(-8).toUpperCase()}</p>
                            <div className='flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5'>
                              <Calendar className='w-3 h-3' />
                              <span>{format(new Date(order.createdAt), "MMM dd, yyyy")}</span>
                            </div>
                          </div>
                        </div>

                        {/* Total - Desktop */}
                        <div className='hidden sm:block text-right'>
                          <p className='text-xs text-muted-foreground'>Total Amount</p>
                          <p className='font-bold text-lg text-primary'>
                            {currencySymbol}
                            {order.total.toFixed(2)}
                          </p>
                        </div>
                      </div>

                      {/* Items Preview & Status */}
                      <div className='flex items-center justify-between gap-4 pb-3 border-b'>
                        {/* Items */}
                        <div className='flex items-center gap-3'>
                          <div className='flex -space-x-2'>
                            {order.items.slice(0, 3).map((item, idx) => (
                              <div
                                key={idx}
                                className='relative w-10 h-10 rounded-lg border-2 border-background overflow-hidden bg-muted shrink-0 shadow-sm'
                              >
                                <CloudImage src={item.image} alt={item.name} fill className='object-contain p-1' />
                              </div>
                            ))}
                            {order.items.length > 3 && (
                              <div className='w-10 h-10 rounded-lg border-2 border-background bg-muted flex items-center justify-center text-xs font-semibold text-muted-foreground shrink-0 shadow-sm'>
                                +{order.items.length - 3}
                              </div>
                            )}
                          </div>
                          <span className='text-sm text-muted-foreground'>
                            {order.items.length} item{order.items.length !== 1 ? "s" : ""}
                          </span>
                        </div>

                        {/* View Button - Desktop */}
                        <Button
                          variant='ghost'
                          size='sm'
                          className='hidden sm:flex gap-1.5 text-primary hover:text-primary hover:bg-primary/10'
                          onClick={(e) => {
                            e.preventDefault();
                            window.location.href = `/account/orders/${order.id}`;
                          }}
                        >
                          <span className='text-sm font-medium'>View Details</span>
                          <ExternalLink className='w-3.5 h-3.5' />
                        </Button>
                      </div>

                      {/* Status & Payment Info */}
                      <div className='pt-3 flex flex-wrap items-center justify-between gap-3'>
                        <div className='flex items-center gap-2 flex-wrap'>
                          <Badge
                            className={`${statusColors[order.status] || ""
                              } border font-medium px-2.5 py-1 text-xs flex items-center gap-1.5`}
                          >
                            {statusIcons[order.status]}
                            <span className='capitalize'>{order.status}</span>
                          </Badge>
                          {order.paymentMethod === "online" && order.paymentStatus && (
                            <Badge
                              className={`${paymentStatusColors[order.paymentStatus] || paymentStatusColors.pending
                                } border font-medium px-2.5 py-1 text-xs flex items-center gap-1.5`}
                            >
                              <DollarSign className='w-3 h-3' />
                              <span className='capitalize'>{order.paymentStatus}</span>
                            </Badge>
                          )}
                          {order.paymentMethod === "cod" && (
                            <Badge className='bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400 border-blue-200 dark:border-blue-800 font-medium px-2.5 py-1 text-xs flex items-center gap-1.5'>
                              <DollarSign className='w-3 h-3' />
                              <span>COD</span>
                            </Badge>
                          )}
                          {order.couponCode && (
                            <Badge className='bg-purple-50 text-purple-700 dark:bg-purple-950/50 dark:text-purple-400 border-purple-200 dark:border-purple-800 font-medium px-2.5 py-1 text-xs flex items-center gap-1.5'>
                              <Tag className='w-3 h-3' />
                              <span className='font-mono'>{order.couponCode}</span>
                            </Badge>
                          )}
                        </div>

                        {/* Total & Button - Mobile */}
                        <div className='flex items-center gap-3 w-full sm:hidden'>
                          <div className='flex-1'>
                            <p className='text-xs text-muted-foreground'>Total</p>
                            <p className='font-bold text-lg text-primary'>
                              {currencySymbol}
                              {order.total.toFixed(2)}
                            </p>
                          </div>
                          <Button
                            variant='outline'
                            size='sm'
                            className='gap-1.5'
                            onClick={(e) => {
                              e.preventDefault();
                              window.location.href = `/account/orders/${order.id}`;
                            }}
                          >
                            <span className='text-sm'>View</span>
                            <ExternalLink className='w-3.5 h-3.5' />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
