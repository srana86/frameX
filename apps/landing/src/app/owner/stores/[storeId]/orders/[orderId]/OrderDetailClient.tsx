"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ArrowLeft,
  Package,
  User,
  MapPin,
  CreditCard,
  Truck,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  AlertCircle,
  Printer,
  Mail,
} from "lucide-react";
import { toast } from "sonner";
import { createStoreApiClient } from "@/lib/store-api-client";
import { cn } from "@/utils/cn";
import type { StaffPermission } from "@/contexts/StoreContext";

interface OrderItem {
  id: string;
  productId: string;
  name: string;
  quantity: number;
  price: number;
  image?: string;
}

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  total: number;
  subtotal: number;
  discount: number;
  deliveryFee: number;
  deliveryAddress?: string;
  currency?: string;
  customer?: {
    id: string;
    name: string;
    email: string;
    phone?: string;
  };
  payment?: {
    status: string;
    method?: string;
  };
  items: OrderItem[];
  notes?: string;
  trackingNumber?: string;
  createdAt: string;
  updatedAt: string;
}

interface OrderDetailClientProps {
  order: Order;
  storeId: string;
  permission: StaffPermission | null;
}

const ORDER_STATUSES = [
  { value: "PENDING", label: "Pending" },
  { value: "PROCESSING", label: "Processing" },
  { value: "SHIPPED", label: "Shipped" },
  { value: "DELIVERED", label: "Delivered" },
  { value: "CANCELLED", label: "Cancelled" },
];

const STATUS_STYLES: Record<string, { bg: string; text: string; icon: any }> = {
  PENDING: { bg: "bg-yellow-100", text: "text-yellow-700", icon: Clock },
  PROCESSING: { bg: "bg-blue-100", text: "text-blue-700", icon: Package },
  SHIPPED: { bg: "bg-purple-100", text: "text-purple-700", icon: Truck },
  DELIVERED: { bg: "bg-green-100", text: "text-green-700", icon: CheckCircle },
  CANCELLED: { bg: "bg-red-100", text: "text-red-700", icon: XCircle },
};

const PAYMENT_STATUS_STYLES: Record<string, { bg: string; text: string }> = {
  PAID: { bg: "bg-green-100", text: "text-green-700" },
  PENDING: { bg: "bg-yellow-100", text: "text-yellow-700" },
  FAILED: { bg: "bg-red-100", text: "text-red-700" },
  REFUNDED: { bg: "bg-gray-100", text: "text-gray-700" },
};

/**
 * Order Detail Client Component
 */
export function OrderDetailClient({
  order: initialOrder,
  storeId,
  permission,
}: OrderDetailClientProps) {
  const router = useRouter();
  const [order, setOrder] = useState<Order>(initialOrder);
  const [updating, setUpdating] = useState(false);

  // Permission check
  const canEdit = permission === null || permission === "EDIT" || permission === "FULL";

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: order.currency || "USD",
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Update order status
  const updateStatus = async (newStatus: string) => {
    if (!canEdit) {
      toast.error("You don't have permission to update orders");
      return;
    }

    setUpdating(true);
    try {
      const storeApi = createStoreApiClient(storeId);
      await storeApi.patch(`orders/${order.id}`, { status: newStatus });
      setOrder((prev) => ({ ...prev, status: newStatus }));
      toast.success("Order status updated");
    } catch (error: any) {
      toast.error(error.message || "Failed to update order");
    } finally {
      setUpdating(false);
    }
  };

  // Send notification
  const sendNotification = async () => {
    try {
      const storeApi = createStoreApiClient(storeId);
      await storeApi.post(`orders/${order.id}/notify`);
      toast.success("Notification sent to customer");
    } catch (error: any) {
      toast.error(error.message || "Failed to send notification");
    }
  };

  const statusStyle = STATUS_STYLES[order.status] || STATUS_STYLES.PENDING;
  const StatusIcon = statusStyle.icon;
  const paymentStatus = order.payment?.status || "PENDING";
  const paymentStyle = PAYMENT_STATUS_STYLES[paymentStatus] || PAYMENT_STATUS_STYLES.PENDING;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/owner/stores/${storeId}/orders`}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Order #{order.orderNumber}
            </h1>
            <p className="text-sm text-muted-foreground">
              Placed on {formatDate(order.createdAt)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={sendNotification}>
            <Mail className="mr-2 h-4 w-4" />
            Notify Customer
          </Button>
          <Button variant="outline" onClick={() => window.print()}>
            <Printer className="mr-2 h-4 w-4" />
            Print
          </Button>
        </div>
      </div>

      {/* Status Row */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <span
                className={cn(
                  "inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-medium",
                  statusStyle.bg,
                  statusStyle.text
                )}
              >
                <StatusIcon className="h-4 w-4" />
                {order.status}
              </span>
              <span
                className={cn(
                  "inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm font-medium",
                  paymentStyle.bg,
                  paymentStyle.text
                )}
              >
                <CreditCard className="h-4 w-4" />
                Payment: {paymentStatus}
              </span>
            </div>
            {canEdit && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Update status:</span>
                <Select
                  value={order.status}
                  onValueChange={updateStatus}
                  disabled={updating}
                >
                  <SelectTrigger className="w-40">
                    {updating ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <SelectValue />
                    )}
                  </SelectTrigger>
                  <SelectContent>
                    {ORDER_STATUSES.map((status) => (
                      <SelectItem key={status.value} value={status.value}>
                        {status.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Order Items */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Order Items ({order.items.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead className="text-center">Qty</TableHead>
                    <TableHead className="text-right">Price</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {order.items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {item.image && (
                            <div className="h-12 w-12 rounded-lg bg-muted overflow-hidden">
                              <img
                                src={item.image}
                                alt={item.name}
                                className="h-full w-full object-cover"
                              />
                            </div>
                          )}
                          <span className="font-medium">{item.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">{item.quantity}</TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(Number(item.price))}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(Number(item.price) * item.quantity)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <Separator className="my-4" />

              {/* Order Totals */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{formatCurrency(Number(order.subtotal))}</span>
                </div>
                {Number(order.discount) > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Discount</span>
                    <span className="text-green-600">-{formatCurrency(Number(order.discount))}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Shipping</span>
                  <span>{formatCurrency(Number(order.deliveryFee))}</span>
                </div>
                <Separator />
                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span>{formatCurrency(Number(order.total))}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Customer Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Customer
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {order.customer ? (
                <div>
                  <p className="font-medium">{order.customer.name}</p>
                  <p className="text-sm text-muted-foreground">{order.customer.email}</p>
                  {order.customer.phone && (
                    <p className="text-sm text-muted-foreground">{order.customer.phone}</p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground italic">Guest Customer</p>
              )}
            </CardContent>
          </Card>

          {/* Shipping Address */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Shipping Address
              </CardTitle>
            </CardHeader>
            <CardContent>
              {order.deliveryAddress ? (
                <p className="text-sm text-muted-foreground whitespace-pre-line">
                  {order.deliveryAddress}
                </p>
              ) : (
                <p className="text-sm text-muted-foreground italic">No address provided</p>
              )}
            </CardContent>
          </Card>

          {/* Payment Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Payment
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Method</span>
                <span className="capitalize">
                  {(order.payment?.method || "N/A").toLowerCase().replace(/_/g, " ")}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Status</span>
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-xs font-medium",
                    paymentStyle.bg,
                    paymentStyle.text
                  )}
                >
                  {paymentStatus}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Shipping Info */}
          {order.trackingNumber && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Truck className="h-5 w-5" />
                  Shipping
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tracking</span>
                  <span className="font-mono">{order.trackingNumber}</span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Notes */}
          {order.notes && (
            <Card>
              <CardHeader>
                <CardTitle>Order Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{order.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
