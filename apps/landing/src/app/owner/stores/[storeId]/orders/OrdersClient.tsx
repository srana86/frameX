"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  Eye,
  ShoppingCart,
  Loader2,
  Package,
  Truck,
  CheckCircle,
  XCircle,
  Clock,
} from "lucide-react";
import { toast } from "sonner";
import { createStoreApiClient } from "@/lib/store-api-client";
import { cn } from "@/utils/cn";
import type { StaffPermission } from "@/contexts/StoreContext";

interface Order {
  id: string;
  createdAt: string;
  status: string;
  paymentStatus: string;
  total: number;
  customer?: {
    name?: string;
    email?: string;
    phone?: string;
  };
  items?: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
}

interface PaginationData {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface InitialData {
  orders: Order[];
  pagination: PaginationData;
}

interface OrdersClientProps {
  initialData: InitialData;
  storeId: string;
  permission: StaffPermission | null;
}

const ORDER_STATUSES = [
  { value: "", label: "All Statuses" },
  { value: "PENDING", label: "Pending" },
  { value: "CONFIRMED", label: "Confirmed" },
  { value: "PROCESSING", label: "Processing" },
  { value: "SHIPPED", label: "Shipped" },
  { value: "DELIVERED", label: "Delivered" },
  { value: "CANCELLED", label: "Cancelled" },
  { value: "REFUNDED", label: "Refunded" },
];

/**
 * Get status badge styles
 */
function getStatusBadge(status: string) {
  const styles: Record<string, { bg: string; text: string; icon: React.ReactNode }> = {
    PENDING: { bg: "bg-yellow-100", text: "text-yellow-700", icon: <Clock className="h-3 w-3" /> },
    CONFIRMED: { bg: "bg-blue-100", text: "text-blue-700", icon: <CheckCircle className="h-3 w-3" /> },
    PROCESSING: { bg: "bg-purple-100", text: "text-purple-700", icon: <Package className="h-3 w-3" /> },
    SHIPPED: { bg: "bg-indigo-100", text: "text-indigo-700", icon: <Truck className="h-3 w-3" /> },
    DELIVERED: { bg: "bg-green-100", text: "text-green-700", icon: <CheckCircle className="h-3 w-3" /> },
    CANCELLED: { bg: "bg-red-100", text: "text-red-700", icon: <XCircle className="h-3 w-3" /> },
    REFUNDED: { bg: "bg-gray-100", text: "text-gray-700", icon: <XCircle className="h-3 w-3" /> },
  };
  return styles[status] || { bg: "bg-gray-100", text: "text-gray-700", icon: null };
}

/**
 * Orders Client Component
 * Displays and manages store orders
 */
export function OrdersClient({
  initialData,
  storeId,
  permission,
}: OrdersClientProps) {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>(initialData.orders);
  const [pagination, setPagination] = useState(initialData.pagination);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // Permission checks
  const canEdit = permission === null || permission === "EDIT" || permission === "FULL";

  // Filter orders by search query
  const filteredOrders = orders.filter((o) => {
    const matchesSearch =
      o.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.customer?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.customer?.email?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  // Refresh orders with filter
  const refreshOrders = useCallback(
    async (status?: string) => {
      setLoading(true);
      try {
        const storeApi = createStoreApiClient(storeId);
        const query = new URLSearchParams();
        query.set("page", "1");
        query.set("limit", "20");
        if (status) {
          query.set("status", status);
        }
        const result = await storeApi.getWithMeta(`orders?${query.toString()}`);
        setOrders(result.data as Order[]);
        if (result.meta) {
          setPagination(result.meta as PaginationData);
        }
      } catch (error) {
        toast.error("Failed to refresh orders");
      } finally {
        setLoading(false);
      }
    },
    [storeId]
  );

  // Handle status filter change
  const handleStatusChange = (value: string) => {
    setStatusFilter(value);
    refreshOrders(value);
    
    // Update URL
    const params = new URLSearchParams();
    if (value) {
      params.set("status", value);
    }
    router.push(`/owner/stores/${storeId}/orders?${params.toString()}`);
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Orders</h1>
          <p className="text-muted-foreground">
            Manage customer orders ({pagination.total} total)
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by order ID or customer..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={handleStatusChange}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                {ORDER_STATUSES.map((status) => (
                  <SelectItem key={status.value} value={status.value}>
                    {status.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              onClick={() => refreshOrders(statusFilter)}
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Refresh"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Orders Table */}
      {filteredOrders.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <ShoppingCart className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium mb-2">
              {orders.length === 0 ? "No orders yet" : "No matching orders"}
            </h3>
            <p className="text-muted-foreground text-center">
              {orders.length === 0
                ? "Orders will appear here when customers make purchases"
                : "Try adjusting your search or filter"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Orders ({filteredOrders.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order ID</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.map((order) => {
                  const statusBadge = getStatusBadge(order.status);
                  return (
                    <TableRow key={order.id}>
                      <TableCell className="font-mono text-sm">
                        #{order.id.slice(0, 8)}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">
                            {order.customer?.name || "Guest"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {order.customer?.email || order.customer?.phone || "-"}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">
                        {formatDate(order.createdAt)}
                      </TableCell>
                      <TableCell>
                        <span
                          className={cn(
                            "inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium",
                            statusBadge.bg,
                            statusBadge.text
                          )}
                        >
                          {statusBadge.icon}
                          {order.status}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span
                          className={cn(
                            "rounded-full px-2 py-1 text-xs font-medium",
                            order.paymentStatus === "COMPLETED"
                              ? "bg-green-100 text-green-700"
                              : order.paymentStatus === "FAILED"
                              ? "bg-red-100 text-red-700"
                              : "bg-yellow-100 text-yellow-700"
                          )}
                        >
                          {order.paymentStatus}
                        </span>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        ${order.total.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Link
                          href={`/owner/stores/${storeId}/orders/${order.id}`}
                        >
                          <Button variant="ghost" size="icon">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <Button
            variant="outline"
            disabled={pagination.page <= 1}
            onClick={() => {
              const params = new URLSearchParams();
              params.set("page", (pagination.page - 1).toString());
              if (statusFilter) params.set("status", statusFilter);
              router.push(`/owner/stores/${storeId}/orders?${params.toString()}`);
            }}
          >
            Previous
          </Button>
          <span className="flex items-center px-4">
            Page {pagination.page} of {pagination.totalPages}
          </span>
          <Button
            variant="outline"
            disabled={pagination.page >= pagination.totalPages}
            onClick={() => {
              const params = new URLSearchParams();
              params.set("page", (pagination.page + 1).toString());
              if (statusFilter) params.set("status", statusFilter);
              router.push(`/owner/stores/${storeId}/orders?${params.toString()}`);
            }}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
