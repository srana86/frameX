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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CreditCard,
  RefreshCw,
  DollarSign,
  Calendar,
  Plus,
  Edit,
  Trash2,
  Eye,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Search,
  Filter,
  Download,
  BarChart3,
  Users,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from "recharts";
import { useCurrency } from "@/contexts/SettingsContext";
import { api } from "@/lib/api-client";

interface Subscription {
  id: string;
  merchantId: string;
  planId: string;
  status: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  trialEndsAt?: string;
  cancelAtPeriodEnd: boolean;
  cancelledAt?: string;
  plan: {
    id: string;
    name: string;
    price: number;
    description?: string;
  } | null;
  merchant: {
    name: string;
    email: string;
  } | null;
}

interface Plan {
  id: string;
  name: string;
  price: number;
}

const CHART_COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

const STATUS_OPTIONS = [
  { value: "active", label: "Active", color: "bg-green-500" },
  { value: "trial", label: "Trial", color: "bg-blue-500" },
  { value: "past_due", label: "Past Due", color: "bg-yellow-500" },
  { value: "cancelled", label: "Cancelled", color: "bg-red-500" },
  { value: "expired", label: "Expired", color: "bg-gray-500" },
];

function StatCard({
  title,
  value,
  icon: Icon,
  color,
  description,
  trend,
  trendValue,
}: {
  title: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  description?: string;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold">{value}</p>
            {description && (
              <p className="text-xs text-muted-foreground">{description}</p>
            )}
            {trend && trendValue && (
              <div
                className={`flex items-center gap-1 text-xs font-medium ${trend === "up"
                    ? "text-green-600"
                    : trend === "down"
                      ? "text-red-600"
                      : "text-muted-foreground"
                  }`}
              >
                {trend === "up" ? (
                  <TrendingUp className="h-3 w-3" />
                ) : trend === "down" ? (
                  <TrendingDown className="h-3 w-3" />
                ) : null}
                {trendValue}
              </div>
            )}
          </div>
          <div className={`rounded-full p-3 ${color}`}>
            <Icon className="h-5 w-5 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function SubscriptionsPage() {
  const { formatAmount, currencySymbol } = useCurrency();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [merchants, setMerchants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [editingSubscription, setEditingSubscription] =
    useState<Subscription | null>(null);
  const [viewingSubscription, setViewingSubscription] =
    useState<Subscription | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [planFilter, setPlanFilter] = useState<string>("all");
  const [newSubscription, setNewSubscription] = useState({
    merchantId: "",
    planId: "",
    status: "active",
    currentPeriodStart: new Date().toISOString().split("T")[0],
    currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0],
  });

  // Stats
  const stats = useMemo(() => {
    const total = subscriptions.length;
    const active = subscriptions.filter((s) => s.status === "active").length;
    const trial = subscriptions.filter((s) => s.status === "trial").length;
    const pastDue = subscriptions.filter((s) => s.status === "past_due").length;
    const cancelled = subscriptions.filter(
      (s) => s.status === "cancelled"
    ).length;

    const monthlyRevenue = subscriptions
      .filter((s) => s.status === "active" && s.plan?.price)
      .reduce((sum, s) => sum + (s.plan?.price || 0), 0);

    const avgRevenue = active > 0 ? monthlyRevenue / active : 0;

    // Expiring soon (within 7 days)
    const now = new Date();
    const expiringSoon = subscriptions.filter((s) => {
      if (s.status !== "active") return false;
      const endDate = new Date(s.currentPeriodEnd);
      const daysUntilExpiry = Math.ceil(
        (endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );
      return daysUntilExpiry <= 7 && daysUntilExpiry > 0;
    }).length;

    return {
      total,
      active,
      trial,
      pastDue,
      cancelled,
      monthlyRevenue,
      avgRevenue,
      expiringSoon,
    };
  }, [subscriptions]);

  // Filtered subscriptions
  const filteredSubscriptions = useMemo(() => {
    return subscriptions.filter((sub) => {
      const matchesSearch =
        searchQuery === "" ||
        sub.merchant?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        sub.merchant?.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        sub.plan?.name.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus =
        statusFilter === "all" || sub.status === statusFilter;
      const matchesPlan = planFilter === "all" || sub.planId === planFilter;

      return matchesSearch && matchesStatus && matchesPlan;
    });
  }, [subscriptions, searchQuery, statusFilter, planFilter]);

  // Status distribution for pie chart
  const statusDistribution = useMemo(() => {
    const counts: Record<string, number> = {};
    subscriptions.forEach((s) => {
      counts[s.status] = (counts[s.status] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [subscriptions]);

  // Revenue by plan for bar chart
  const revenueByPlan = useMemo(() => {
    const revenue: Record<string, number> = {};
    subscriptions
      .filter((s) => s.status === "active" && s.plan)
      .forEach((s) => {
        const planName = s.plan?.name || "Unknown";
        revenue[planName] = (revenue[planName] || 0) + (s.plan?.price || 0);
      });
    return Object.entries(revenue).map(([name, amount]) => ({ name, amount }));
  }, [subscriptions]);

  // Subscriptions by plan count
  const subscriptionsByPlan = useMemo(() => {
    const counts: Record<string, number> = {};
    subscriptions.forEach((s) => {
      const planName = s.plan?.name || "Unknown";
      counts[planName] = (counts[planName] || 0) + 1;
    });
    return Object.entries(counts).map(([name, count]) => ({ name, count }));
  }, [subscriptions]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [subsData, plansData, merchantsData] = await Promise.all([
        api.get<Subscription[]>("subscriptions"),
        api.get<Plan[]>("plans"),
        api.get<any[]>("merchants"),
      ]);

      setSubscriptions(subsData);
      setPlans(plansData);
      setMerchants(merchantsData);
    } catch (error: any) {
      console.error("Failed to load data:", error);
      toast.error(error?.message || "Failed to load subscriptions");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSubscription = async () => {
    if (!newSubscription.merchantId || !newSubscription.planId) {
      toast.error("Merchant and plan are required");
      return;
    }

    try {
      await api.post("subscriptions", {
        ...newSubscription,
        currentPeriodStart: new Date(
          newSubscription.currentPeriodStart
        ).toISOString(),
        currentPeriodEnd: new Date(
          newSubscription.currentPeriodEnd
        ).toISOString(),
      });

      toast.success("Subscription created successfully!");
      setShowCreateDialog(false);
      setNewSubscription({
        merchantId: "",
        planId: "",
        status: "active",
        currentPeriodStart: new Date().toISOString().split("T")[0],
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0],
      });
      await loadData();
    } catch (error: any) {
      toast.error(error?.message || "Failed to create subscription");
    }
  };

  const handleEditSubscription = (subscription: Subscription) => {
    setEditingSubscription({
      ...subscription,
      currentPeriodStart: new Date(subscription.currentPeriodStart)
        .toISOString()
        .split("T")[0],
      currentPeriodEnd: new Date(subscription.currentPeriodEnd)
        .toISOString()
        .split("T")[0],
    });
    setShowEditDialog(true);
  };

  const handleUpdateSubscription = async () => {
    if (!editingSubscription) return;

    try {
      await api.put(`subscriptions/${editingSubscription.id}`, {
        ...editingSubscription,
        currentPeriodStart: new Date(
          editingSubscription.currentPeriodStart
        ).toISOString(),
        currentPeriodEnd: new Date(
          editingSubscription.currentPeriodEnd
        ).toISOString(),
      });

      toast.success("Subscription updated successfully!");
      setShowEditDialog(false);
      setEditingSubscription(null);
      await loadData();
    } catch (error: any) {
      toast.error(error?.message || "Failed to update subscription");
    }
  };

  const handleDeleteSubscription = async (subscriptionId: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this subscription? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      await api.delete(`subscriptions/${subscriptionId}`);
      toast.success("Subscription deleted successfully!");
      await loadData();
    } catch (error: any) {
      toast.error(error?.message || "Failed to delete subscription");
    }
  };

  const handleViewSubscription = async (subscription: Subscription) => {
    try {
      const data = await api.get<Subscription>(
        `subscriptions/${subscription.id}`
      );
      setViewingSubscription(data);
      setShowViewDialog(true);
    } catch (error: any) {
      toast.error(error.message || "Failed to load subscription");
    }
  };

  const exportSubscriptions = () => {
    const csvContent = [
      [
        "Merchant",
        "Email",
        "Plan",
        "Price",
        "Status",
        "Period Start",
        "Period End",
      ].join(","),
      ...filteredSubscriptions.map((s) =>
        [
          s.merchant?.name || s.merchantId,
          s.merchant?.email || "",
          s.plan?.name || s.planId,
          s.plan?.price || 0,
          s.status,
          new Date(s.currentPeriodStart).toLocaleDateString(),
          new Date(s.currentPeriodEnd).toLocaleDateString(),
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `subscriptions-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Subscriptions exported successfully!");
  };

  useEffect(() => {
    loadData();
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return (
          <Badge className="bg-green-500 hover:bg-green-600">Active</Badge>
        );
      case "trial":
        return <Badge className="bg-blue-500 hover:bg-blue-600">Trial</Badge>;
      case "past_due":
        return (
          <Badge className="bg-yellow-500 hover:bg-yellow-600">Past Due</Badge>
        );
      case "cancelled":
        return <Badge variant="destructive">Cancelled</Badge>;
      case "expired":
        return <Badge variant="secondary">Expired</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getDaysUntilExpiry = (endDate: string) => {
    const end = new Date(endDate);
    const now = new Date();
    return Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Subscriptions</h1>
          <p className="text-muted-foreground">
            Manage billing, track revenue, and monitor subscription health
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadData} disabled={loading}>
            <RefreshCw
              className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
          <Button variant="outline" onClick={exportSubscriptions}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Subscription
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New Subscription</DialogTitle>
                <DialogDescription>
                  Create a new subscription for a merchant
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="merchant">Merchant *</Label>
                  <Select
                    value={newSubscription.merchantId}
                    onValueChange={(value) =>
                      setNewSubscription({
                        ...newSubscription,
                        merchantId: value,
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select merchant" />
                    </SelectTrigger>
                    <SelectContent>
                      {merchants.map((merchant) => (
                        <SelectItem key={merchant.id} value={merchant.id}>
                          {merchant.name} ({merchant.email})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="plan">Plan *</Label>
                  <Select
                    value={newSubscription.planId}
                    onValueChange={(value) =>
                      setNewSubscription({ ...newSubscription, planId: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select plan" />
                    </SelectTrigger>
                    <SelectContent>
                      {plans.map((plan) => (
                        <SelectItem key={plan.id} value={plan.id}>
                          {plan.name} - {formatAmount(plan.price)}/month
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={newSubscription.status}
                    onValueChange={(value) =>
                      setNewSubscription({ ...newSubscription, status: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUS_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="periodStart">Period Start</Label>
                    <Input
                      id="periodStart"
                      type="date"
                      value={newSubscription.currentPeriodStart}
                      onChange={(e) =>
                        setNewSubscription({
                          ...newSubscription,
                          currentPeriodStart: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="periodEnd">Period End</Label>
                    <Input
                      id="periodEnd"
                      type="date"
                      value={newSubscription.currentPeriodEnd}
                      onChange={(e) =>
                        setNewSubscription({
                          ...newSubscription,
                          currentPeriodEnd: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowCreateDialog(false)}
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleCreateSubscription}>Create</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Monthly Revenue"
          value={formatAmount(stats.monthlyRevenue)}
          icon={DollarSign}
          color="bg-green-500"
          trend="up"
          trendValue="+12% from last month"
        />
        <StatCard
          title="Active Subscriptions"
          value={stats.active}
          icon={CheckCircle2}
          color="bg-blue-500"
          description={`${stats.total > 0
              ? ((stats.active / stats.total) * 100).toFixed(0)
              : 0
            }% of total`}
        />
        <StatCard
          title="Trial Users"
          value={stats.trial}
          icon={Clock}
          color="bg-purple-500"
          description="Converting to paid"
        />
        <StatCard
          title="Expiring Soon"
          value={stats.expiringSoon}
          icon={AlertTriangle}
          color="bg-yellow-500"
          description="Within 7 days"
        />
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Status Distribution
            </CardTitle>
            <CardDescription>
              Breakdown of subscription statuses
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex h-[200px] items-center justify-center">
                <div className="h-32 w-32 animate-pulse rounded-full bg-muted" />
              </div>
            ) : statusDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={statusDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, percent }) =>
                      `${name} ${((percent ?? 0) * 100).toFixed(0)}%`
                    }
                    labelLine={false}
                  >
                    {statusDistribution.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={CHART_COLORS[index % CHART_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-[200px] flex-col items-center justify-center text-muted-foreground">
                <CreditCard className="mb-2 h-12 w-12 opacity-50" />
                <p>No subscription data</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Revenue by Plan */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Revenue by Plan
            </CardTitle>
            <CardDescription>Monthly revenue per plan</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex h-[200px] items-center justify-center">
                <div className="h-full w-full animate-pulse rounded bg-muted" />
              </div>
            ) : revenueByPlan.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={revenueByPlan}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    className="stroke-muted"
                  />
                  <XAxis dataKey="name" className="text-xs" />
                  <YAxis
                    className="text-xs"
                    tickFormatter={(v) => `${currencySymbol}${v}`}
                  />
                  <Tooltip
                    formatter={(value: number | undefined) => [
                      formatAmount(value || 0),
                      "Revenue",
                    ]}
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Bar
                    dataKey="amount"
                    fill="hsl(var(--primary))"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-[200px] flex-col items-center justify-center text-muted-foreground">
                <BarChart3 className="mb-2 h-12 w-12 opacity-50" />
                <p>No revenue data</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by merchant, email, or plan..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[150px]">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  {STATUS_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={planFilter} onValueChange={setPlanFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Plan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Plans</SelectItem>
                  {plans.map((plan) => (
                    <SelectItem key={plan.id} value={plan.id}>
                      {plan.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Subscriptions Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Subscriptions</CardTitle>
          <CardDescription>
            Showing {filteredSubscriptions.length} of {subscriptions.length}{" "}
            subscriptions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className="h-10 w-10 animate-pulse rounded-full bg-muted" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-1/3 animate-pulse rounded bg-muted" />
                    <div className="h-3 w-1/2 animate-pulse rounded bg-muted" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredSubscriptions.length === 0 ? (
            <div className="py-12 text-center">
              <CreditCard className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
              <p className="text-muted-foreground">
                {subscriptions.length === 0
                  ? "No subscriptions found"
                  : "No subscriptions match your filters"}
              </p>
              {subscriptions.length === 0 && (
                <Button
                  className="mt-4"
                  onClick={() => setShowCreateDialog(true)}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Create First Subscription
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Merchant</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Revenue</TableHead>
                    <TableHead>Period</TableHead>
                    <TableHead>Expires</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSubscriptions.map((sub) => {
                    const daysLeft = getDaysUntilExpiry(sub.currentPeriodEnd);
                    return (
                      <TableRow key={sub.id} className="group">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 font-semibold text-primary">
                              {(sub.merchant?.name || "?")
                                .charAt(0)
                                .toUpperCase()}
                            </div>
                            <div>
                              <p className="font-medium">
                                {sub.merchant?.name || sub.merchantId}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {sub.merchant?.email}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">
                              {sub.plan?.name || sub.planId}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {formatAmount(sub.plan?.price || 0)}/month
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(sub.status)}</TableCell>
                        <TableCell>
                          <span className="font-semibold text-green-600">
                            {formatAmount(sub.plan?.price || 0)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <p>
                              {new Date(
                                sub.currentPeriodStart
                              ).toLocaleDateString()}
                            </p>
                            <p className="text-muted-foreground">
                              to{" "}
                              {new Date(
                                sub.currentPeriodEnd
                              ).toLocaleDateString()}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          {sub.status === "active" && (
                            <div
                              className={`flex items-center gap-1 text-sm ${daysLeft <= 7
                                  ? "text-yellow-600"
                                  : daysLeft <= 0
                                    ? "text-red-600"
                                    : "text-muted-foreground"
                                }`}
                            >
                              {daysLeft <= 7 && daysLeft > 0 && (
                                <AlertTriangle className="h-3 w-3" />
                              )}
                              {daysLeft <= 0 && <XCircle className="h-3 w-3" />}
                              {daysLeft > 0 ? `${daysLeft} days` : "Expired"}
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleViewSubscription(sub)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEditSubscription(sub)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteSubscription(sub.id)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      {editingSubscription && (
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Subscription</DialogTitle>
              <DialogDescription>
                Update subscription information
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={editingSubscription.status}
                  onValueChange={(value) =>
                    setEditingSubscription({
                      ...editingSubscription,
                      status: value,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Period Start</Label>
                  <Input
                    type="date"
                    value={editingSubscription.currentPeriodStart}
                    onChange={(e) =>
                      setEditingSubscription({
                        ...editingSubscription,
                        currentPeriodStart: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Period End</Label>
                  <Input
                    type="date"
                    value={editingSubscription.currentPeriodEnd}
                    onChange={(e) =>
                      setEditingSubscription({
                        ...editingSubscription,
                        currentPeriodEnd: e.target.value,
                      })
                    }
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowEditDialog(false)}
                >
                  Cancel
                </Button>
                <Button onClick={handleUpdateSubscription}>Save Changes</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* View Dialog */}
      {viewingSubscription && (
        <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Subscription Details</DialogTitle>
              <DialogDescription>
                Complete subscription information
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-2xl font-bold text-primary">
                  {(viewingSubscription.merchant?.name || "?")
                    .charAt(0)
                    .toUpperCase()}
                </div>
                <div>
                  <h3 className="text-xl font-semibold">
                    {viewingSubscription.merchant?.name ||
                      viewingSubscription.merchantId}
                  </h3>
                  <p className="text-muted-foreground">
                    {viewingSubscription.merchant?.email}
                  </p>
                </div>
                {getStatusBadge(viewingSubscription.status)}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">
                    Subscription ID
                  </Label>
                  <p className="font-mono text-sm">{viewingSubscription.id}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Plan</Label>
                  <p className="font-medium">
                    {viewingSubscription.plan?.name ||
                      viewingSubscription.planId}
                  </p>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Price</Label>
                  <p className="text-lg font-semibold text-green-600">
                    {formatAmount(viewingSubscription.plan?.price || 0)}/month
                  </p>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">
                    Cancel at Period End
                  </Label>
                  <p>{viewingSubscription.cancelAtPeriodEnd ? "Yes" : "No"}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">
                    Period Start
                  </Label>
                  <p>
                    {new Date(
                      viewingSubscription.currentPeriodStart
                    ).toLocaleString()}
                  </p>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">
                    Period End
                  </Label>
                  <p>
                    {new Date(
                      viewingSubscription.currentPeriodEnd
                    ).toLocaleString()}
                  </p>
                </div>
                {viewingSubscription.trialEndsAt && (
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">
                      Trial Ends
                    </Label>
                    <p>
                      {new Date(
                        viewingSubscription.trialEndsAt
                      ).toLocaleString()}
                    </p>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowViewDialog(false);
                    handleEditSubscription(viewingSubscription);
                  }}
                >
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </Button>
                <Button onClick={() => setShowViewDialog(false)}>Close</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
