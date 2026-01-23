"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
  CreditCard,
  Loader2,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { createStoreApiClient } from "@/lib/store-api-client";
import { cn } from "@/utils/cn";
import type { StaffPermission } from "@/contexts/StoreContext";

interface Payment {
  id: string;
  orderId: string;
  orderNumber?: string;
  amount: number;
  currency: string;
  status: string;
  method: string;
  transactionId?: string;
  customerEmail?: string;
  createdAt: string;
}

interface PaginationData {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface PaymentsClientProps {
  initialData: {
    payments: Payment[];
    pagination: PaginationData;
  };
  storeId: string;
  permission: StaffPermission | null;
}

const PAYMENT_STATUSES = [
  { value: "all", label: "All Statuses" },
  { value: "COMPLETED", label: "Completed" },
  { value: "PENDING", label: "Pending" },
  { value: "FAILED", label: "Failed" },
  { value: "REFUNDED", label: "Refunded" },
];

const STATUS_STYLES: Record<string, { bg: string; text: string; icon: any }> = {
  COMPLETED: { bg: "bg-green-100", text: "text-green-700", icon: CheckCircle },
  PENDING: { bg: "bg-yellow-100", text: "text-yellow-700", icon: Clock },
  FAILED: { bg: "bg-red-100", text: "text-red-700", icon: XCircle },
  REFUNDED: { bg: "bg-gray-100", text: "text-gray-700", icon: RefreshCw },
};

/**
 * Payments Client Component
 * View payment transactions
 */
export function PaymentsClient({
  initialData,
  storeId,
  permission,
}: PaymentsClientProps) {
  const router = useRouter();
  const [payments, setPayments] = useState<Payment[]>(initialData.payments);
  const [pagination, setPagination] = useState(initialData.pagination);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");

  // Refresh payments
  const refreshPayments = useCallback(
    async (status?: string) => {
      setLoading(true);
      try {
        const storeApi = createStoreApiClient(storeId);
        const query = new URLSearchParams();
        query.set("page", "1");
        query.set("limit", "20");
        if (status) query.set("status", status);

        const result = await storeApi.getWithMeta(`payments?${query.toString()}`);
        setPayments(result.data as Payment[]);
        if (result.meta) {
          setPagination(result.meta as PaginationData);
        }
      } catch (error) {
        toast.error("Failed to refresh payments");
      } finally {
        setLoading(false);
      }
    },
    [storeId]
  );

  // Handle status filter change
  const handleStatusChange = (value: string) => {
    setStatusFilter(value);
    // Convert "all" to empty string for API
    const apiValue = value === "all" ? "" : value;
    refreshPayments(apiValue);
  };

  // Format currency
  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency || "USD",
    }).format(amount);
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
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Payments</h1>
        <p className="text-muted-foreground">
          View payment transactions ({pagination.total} total)
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <Select value={statusFilter} onValueChange={handleStatusChange}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                {PAYMENT_STATUSES.map((status) => (
                  <SelectItem key={status.value} value={status.value}>
                    {status.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              onClick={() => refreshPayments(statusFilter)}
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

      {/* Payments Table */}
      {payments.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <CreditCard className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium mb-2">No payments found</h3>
            <p className="text-muted-foreground text-center">
              Payment transactions will appear here
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Transactions ({payments.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Transaction</TableHead>
                  <TableHead>Order</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((payment) => {
                  const statusStyle = STATUS_STYLES[payment.status] || {
                    bg: "bg-gray-100",
                    text: "text-gray-700",
                    icon: Clock,
                  };
                  const Icon = statusStyle.icon;

                  return (
                    <TableRow key={payment.id}>
                      <TableCell className="font-mono text-sm">
                        {payment.transactionId
                          ? payment.transactionId.slice(0, 12) + "..."
                          : "-"}
                      </TableCell>
                      <TableCell className="font-medium">
                        {payment.orderNumber || payment.orderId.slice(0, 8)}
                      </TableCell>
                      <TableCell>{payment.customerEmail || "-"}</TableCell>
                      <TableCell className="capitalize">
                        {payment.method.toLowerCase().replace(/_/g, " ")}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(payment.amount, payment.currency)}
                      </TableCell>
                      <TableCell>
                        <span
                          className={cn(
                            "inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium",
                            statusStyle.bg,
                            statusStyle.text
                          )}
                        >
                          <Icon className="h-3 w-3" />
                          {payment.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(payment.createdAt)}
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
              router.push(`/owner/stores/${storeId}/payments?${params.toString()}`);
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
              router.push(`/owner/stores/${storeId}/payments?${params.toString()}`);
            }}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
