"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  RefreshCw,
  DollarSign,
  TrendingUp,
  Users,
  CreditCard,
  Calendar,
  Search,
  Download,
  ShoppingCart,
  ArrowUpRight,
  Repeat,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { useCurrency } from "@/contexts/SettingsContext";
import { api } from "@/lib/api-client";

interface Sale {
  id: string;
  merchantId: string;
  merchantName?: string;
  merchantEmail?: string;
  subscriptionId?: string;
  planId: string;
  planName: string;
  amount: number;
  currency: string;
  billingCycleMonths: number;
  paymentMethod: string;
  transactionId?: string;
  status: "completed" | "pending" | "failed" | "refunded";
  type: "new" | "renewal" | "upgrade" | "downgrade";
  createdAt: string;
}

interface SalesStats {
  totalRevenue: number;
  totalSales: number;
  byType: Record<string, number>;
  currency: string;
}

function getTypeIcon(type: string) {
  switch (type) {
    case "new":
      return <ShoppingCart className="h-4 w-4" />;
    case "renewal":
      return <Repeat className="h-4 w-4" />;
    case "upgrade":
      return <ArrowUpRight className="h-4 w-4" />;
    default:
      return <Zap className="h-4 w-4" />;
  }
}

function getTypeBadgeClass(type: string) {
  switch (type) {
    case "new":
      return "bg-green-100 text-green-700";
    case "renewal":
      return "bg-blue-100 text-blue-700";
    case "upgrade":
      return "bg-purple-100 text-purple-700";
    case "downgrade":
      return "bg-orange-100 text-orange-700";
    default:
      return "bg-gray-100 text-gray-700";
  }
}

function getStatusBadgeClass(status: string) {
  switch (status) {
    case "completed":
      return "bg-green-100 text-green-700";
    case "pending":
      return "bg-yellow-100 text-yellow-700";
    case "failed":
      return "bg-red-100 text-red-700";
    case "refunded":
      return "bg-gray-100 text-gray-700";
    default:
      return "bg-gray-100 text-gray-700";
  }
}

function getBillingLabel(months: number) {
  switch (months) {
    case 1:
      return "Monthly";
    case 6:
      return "6 Months";
    case 12:
      return "Yearly";
    default:
      return `${months} Months`;
  }
}

export default function SalesPage() {
  const { formatAmount, currencySymbol } = useCurrency();
  const [sales, setSales] = useState<Sale[]>([]);
  const [stats, setStats] = useState<SalesStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  const loadSales = async () => {
    setLoading(true);
    try {
      const data = await api.get<{ sales: Sale[]; stats: any }>("sales");
      console.log("[Sales] API Response:", data);
      console.log("[Sales] Sales array:", data?.sales);
      console.log("[Sales] Stats:", data?.stats);

      // Handle both possible response formats
      if (Array.isArray(data)) {
        // If data is directly an array (fallback case)
        setSales(data);
        setStats(null);
      } else if (data && typeof data === "object") {
        // Normal case: { sales: [...], stats: {...} }
        setSales(data.sales || []);
        setStats(data.stats || null);
      } else {
        console.warn("[Sales] Unexpected data format:", data);
        setSales([]);
        setStats(null);
      }
    } catch (error: any) {
      console.error("Failed to load sales:", error);
      console.error("Error details:", error?.data || error);
      toast.error(error?.message || "Failed to load sales data");
      setSales([]);
      setStats(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSales();
  }, []);

  // Filter sales
  const filteredSales = useMemo(() => {
    return sales.filter((sale) => {
      // Status filter
      if (statusFilter !== "all" && sale.status !== statusFilter) return false;

      // Type filter
      if (typeFilter !== "all" && sale.type !== typeFilter) return false;

      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          sale.merchantName?.toLowerCase().includes(query) ||
          sale.merchantEmail?.toLowerCase().includes(query) ||
          sale.planName?.toLowerCase().includes(query) ||
          sale.transactionId?.toLowerCase().includes(query) ||
          sale.id.toLowerCase().includes(query)
        );
      }

      return true;
    });
  }, [sales, statusFilter, typeFilter, searchQuery]);

  // Export to CSV
  const exportToCSV = () => {
    const headers = [
      "Date",
      "Merchant",
      "Email",
      "Plan",
      "Amount",
      "Type",
      "Status",
      "Transaction ID",
    ];
    const rows = filteredSales.map((sale) => [
      new Date(sale.createdAt).toLocaleString(),
      sale.merchantName || sale.merchantId,
      sale.merchantEmail || "",
      sale.planName,
      `${sale.currency} ${sale.amount}`,
      sale.type,
      sale.status,
      sale.transactionId || "",
    ]);

    const csv = [headers.join(","), ...rows.map((row) => row.join(","))].join(
      "\n"
    );
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `sales-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Sales data exported!");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Sales & Revenue</h1>
          <p className="text-muted-foreground">
            Track all subscription sales and revenue
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadSales} disabled={loading}>
            <RefreshCw
              className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
          <Button
            variant="outline"
            onClick={exportToCSV}
            disabled={filteredSales.length === 0}
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Total Revenue
                </p>
                <p className="text-3xl font-bold">
                  {formatAmount(stats?.totalRevenue || 0)}
                </p>
              </div>
              <div className="rounded-full bg-green-500/10 p-3">
                <DollarSign className="h-5 w-5 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Total Sales
                </p>
                <p className="text-3xl font-bold">{stats?.totalSales || 0}</p>
              </div>
              <div className="rounded-full bg-blue-500/10 p-3">
                <ShoppingCart className="h-5 w-5 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  New Subscriptions
                </p>
                <p className="text-3xl font-bold">{stats?.byType?.new || 0}</p>
              </div>
              <div className="rounded-full bg-purple-500/10 p-3">
                <Users className="h-5 w-5 text-purple-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Renewals
                </p>
                <p className="text-3xl font-bold">
                  {stats?.byType?.renewal || 0}
                </p>
              </div>
              <div className="rounded-full bg-orange-500/10 p-3">
                <Repeat className="h-5 w-5 text-orange-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by merchant, plan, or transaction..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="refunded">Refunded</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="new">New</SelectItem>
                <SelectItem value="renewal">Renewal</SelectItem>
                <SelectItem value="upgrade">Upgrade</SelectItem>
                <SelectItem value="downgrade">Downgrade</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Sales Table */}
      <Card>
        <CardHeader>
          <CardTitle>Sales History</CardTitle>
          <CardDescription>
            Showing {filteredSales.length} of {sales.length} sales
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredSales.length === 0 ? (
            <div className="text-center py-12">
              <ShoppingCart className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
              <p className="text-muted-foreground">No sales found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Merchant</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Billing</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Transaction</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSales.map((sale) => (
                  <TableRow key={sale.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium">
                            {new Date(sale.createdAt).toLocaleDateString()}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(sale.createdAt).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">
                          {sale.merchantName || sale.merchantId}
                        </p>
                        {sale.merchantEmail && (
                          <p className="text-xs text-muted-foreground">
                            {sale.merchantEmail}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="font-medium">{sale.planName}</p>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {getBillingLabel(sale.billingCycleMonths)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="font-bold text-green-600">
                        {formatAmount(sale.amount)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge className={getTypeBadgeClass(sale.type)}>
                        {getTypeIcon(sale.type)}
                        <span className="ml-1 capitalize">{sale.type}</span>
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusBadgeClass(sale.status)}>
                        {sale.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <code className="text-xs bg-muted px-1 py-0.5 rounded">
                        {sale.transactionId?.slice(0, 12) || "-"}...
                      </code>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
