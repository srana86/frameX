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
  Users,
  Loader2,
  Mail,
  Phone,
  ShoppingBag,
  Ban,
  CheckCircle,
} from "lucide-react";
import { toast } from "sonner";
import { createStoreApiClient } from "@/lib/store-api-client";
import { cn } from "@/utils/cn";
import type { StaffPermission } from "@/contexts/StoreContext";

interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  status: string;
  totalOrders?: number;
  totalSpent?: number;
  createdAt: string;
}

interface PaginationData {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface InitialData {
  customers: Customer[];
  pagination: PaginationData;
}

interface CustomersClientProps {
  initialData: InitialData;
  storeId: string;
  permission: StaffPermission | null;
}

const CUSTOMER_STATUSES = [
  { value: "all", label: "All Statuses" },
  { value: "ACTIVE", label: "Active" },
  { value: "BLOCKED", label: "Blocked" },
];

/**
 * Customers Client Component
 * Displays and manages store customers
 */
export function CustomersClient({
  initialData,
  storeId,
  permission,
}: CustomersClientProps) {
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>(
    Array.isArray(initialData.customers) ? initialData.customers : []
  );
  const [pagination, setPagination] = useState(initialData.pagination);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Permission checks
  const canEdit = permission === null || permission === "EDIT" || permission === "FULL";

  // Filter customers by search query
  const filteredCustomers = (Array.isArray(customers) ? customers : []).filter((c) => {
    const matchesSearch =
      c.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone?.includes(searchQuery);
    return matchesSearch;
  });

  // Refresh customers
  const refreshCustomers = useCallback(
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
        const result = await storeApi.getWithMeta(`customers?${query.toString()}`);
        setCustomers((result.data as any).customers || []);
        if (result.meta) {
          setPagination(result.meta as PaginationData);
        }
      } catch (error) {
        toast.error("Failed to refresh customers");
      } finally {
        setLoading(false);
      }
    },
    [storeId]
  );

  // Toggle customer status
  const toggleStatus = async (customerId: string, currentStatus: string) => {
    if (!canEdit) {
      toast.error("You don't have permission to modify customers");
      return;
    }

    const newStatus = currentStatus === "ACTIVE" ? "BLOCKED" : "ACTIVE";

    try {
      const storeApi = createStoreApiClient(storeId);
      await storeApi.patch(`customers/${customerId}`, { status: newStatus });

      setCustomers(
        customers.map((c) =>
          c.id === customerId ? { ...c, status: newStatus } : c
        )
      );
      toast.success(`Customer ${newStatus === "BLOCKED" ? "blocked" : "unblocked"}`);
    } catch (error: any) {
      toast.error(error.message || "Failed to update customer");
    }
  };

  // Handle status filter change
  const handleStatusChange = (value: string) => {
    setStatusFilter(value);
    // Convert "all" to empty string for API
    const apiValue = value === "all" ? "" : value;
    refreshCustomers(apiValue);
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Customers</h1>
        <p className="text-muted-foreground">
          View and manage customer accounts ({pagination.total} total)
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, or phone..."
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
                {CUSTOMER_STATUSES.map((status) => (
                  <SelectItem key={status.value} value={status.value}>
                    {status.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              onClick={() => refreshCustomers(statusFilter)}
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

      {/* Customers Table */}
      {filteredCustomers.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium mb-2">
              {customers.length === 0 ? "No customers yet" : "No matching customers"}
            </h3>
            <p className="text-muted-foreground text-center">
              {customers.length === 0
                ? "Customers will appear here when they create accounts"
                : "Try adjusting your search or filter"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Customers ({filteredCustomers.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Orders</TableHead>
                  <TableHead className="text-right">Total Spent</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Joined</TableHead>
                  {canEdit && <TableHead className="text-right">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCustomers.map((customer) => (
                  <TableRow key={customer.id}>
                    <TableCell>
                      <p className="font-medium">{customer.name || "Unknown"}</p>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {customer.email && (
                          <div className="flex items-center gap-1 text-sm">
                            <Mail className="h-3 w-3 text-muted-foreground" />
                            {customer.email}
                          </div>
                        )}
                        {customer.phone && (
                          <div className="flex items-center gap-1 text-sm">
                            <Phone className="h-3 w-3 text-muted-foreground" />
                            {customer.phone}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                        {customer.totalOrders || 0}
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      ${(customer.totalSpent || 0).toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium",
                          customer.status === "ACTIVE"
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        )}
                      >
                        {customer.status === "ACTIVE" ? (
                          <CheckCircle className="h-3 w-3" />
                        ) : (
                          <Ban className="h-3 w-3" />
                        )}
                        {customer.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(customer.createdAt)}
                    </TableCell>
                    {canEdit && (
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleStatus(customer.id, customer.status)}
                          className={
                            customer.status === "ACTIVE"
                              ? "text-red-500 hover:text-red-600"
                              : "text-green-500 hover:text-green-600"
                          }
                        >
                          {customer.status === "ACTIVE" ? (
                            <>
                              <Ban className="h-4 w-4 mr-1" />
                              Block
                            </>
                          ) : (
                            <>
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Unblock
                            </>
                          )}
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
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
              router.push(`/owner/stores/${storeId}/customers?${params.toString()}`);
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
              router.push(`/owner/stores/${storeId}/customers?${params.toString()}`);
            }}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
