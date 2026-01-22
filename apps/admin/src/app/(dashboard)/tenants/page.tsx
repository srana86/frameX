"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
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
  Users,
  Plus,
  RefreshCw,
  ExternalLink,
  Globe,
  Edit,
  Trash2,
  Search,
  Filter,
  Download,
  TrendingUp,
  UserCheck,
  UserX,
  Clock,
  MoreHorizontal,
  Eye,
  Rocket,
  CreditCard,
  Crown,
  Calendar,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import type { Tenant } from "@/lib/types";
import { useCurrency } from "@/contexts/SettingsContext";
import { api } from "@/lib/api-client";

type TenantStatus = "active" | "suspended" | "trial" | "inactive";

interface Plan {
  id: string;
  name: string;
  basePrice: number;
  discount6Month?: number;
  discount12Month?: number;
  featuresList?: string[];
  prices?: { monthly: number; semi_annual: number; yearly: number };
}

interface Subscription {
  id: string;
  tenantId: string;
  planId: string;
  planName?: string;
  status: string;
  billingCycleMonths: number;
  currentPeriodEnd: string;
  amount?: number;
}

const STATUS_OPTIONS: {
  value: TenantStatus;
  label: string;
  color: string;
}[] = [
    { value: "active", label: "Active", color: "bg-green-500" },
    { value: "trial", label: "Trial", color: "bg-blue-500" },
    { value: "suspended", label: "Suspended", color: "bg-red-500" },
    { value: "inactive", label: "Inactive", color: "bg-gray-500" },
  ];

function StatCard({
  title,
  value,
  icon: Icon,
  color,
  description,
}: {
  title: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  description?: string;
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold">{value}</p>
            {description && (
              <p className="mt-1 text-xs text-muted-foreground">
                {description}
              </p>
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

export default function TenantsPage() {
  const { formatAmount, currencySymbol } = useCurrency();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [showAssignPlanDialog, setShowAssignPlanDialog] = useState(false);
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);
  const [viewingTenant, setViewingTenant] = useState<Tenant | null>(null);
  const [assigningTenant, setAssigningTenant] = useState<Tenant | null>(
    null
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [newTenant, setNewTenant] = useState({
    name: "",
    email: "",
    phone: "",
    status: "active" as TenantStatus,
  });
  const [assignPlanForm, setAssignPlanForm] = useState({
    planId: "",
    billingCycleMonths: 1,
    startDate: new Date().toISOString().split("T")[0],
  });
  const [assigningPlan, setAssigningPlan] = useState(false);

  // Stats
  const stats = useMemo(() => {
    const total = tenants.length;
    const active = tenants.filter((m) => m.status === "active").length;
    const trial = tenants.filter((m) => m.status === "trial").length;
    const suspended = tenants.filter((m) => m.status === "suspended").length;
    const inactive = tenants.filter((m) => m.status === "inactive").length;
    const deployed = tenants.filter((m) => m.deploymentUrl).length;

    return { total, active, trial, suspended, inactive, deployed };
  }, [tenants]);

  // Filtered tenants
  const filteredTenants = useMemo(() => {
    return tenants.filter((tenant) => {
      const matchesSearch =
        searchQuery === "" ||
        tenant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tenant.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tenant.phone?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus =
        statusFilter === "all" || tenant.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [tenants, searchQuery, statusFilter]);

  const loadTenants = async () => {
    setLoading(true);
    try {
      const [tenantsData, plansData, subscriptionsData] = await Promise.all([
        api.get<Tenant[]>("tenants"),
        api.get<Plan[]>("plans").catch(() => []),
        api.get<any[]>("subscriptions").catch(() => []),
      ]);

      setTenants(tenantsData);
      if (plansData) {
        setPlans(plansData);
      }
      if (subscriptionsData) {
        setSubscriptions(subscriptionsData);
      }
    } catch (error: any) {
      console.error("Failed to load tenants:", error);
      toast.error(error?.message || "Failed to load tenants");
    } finally {
      setLoading(false);
    }
  };

  const getTenantSubscription = (tenantId: string) => {
    return subscriptions.find((s) => s.tenantId === tenantId);
  };

  const getPlanById = (planId: string) => {
    return plans.find((p) => p.id === planId);
  };

  const handleOpenAssignPlan = (tenant: Tenant) => {
    setAssigningTenant(tenant);
    const existingSub = getTenantSubscription(tenant.id);
    setAssignPlanForm({
      planId: existingSub?.planId || plans[0]?.id || "",
      billingCycleMonths: existingSub?.billingCycleMonths || 1,
      startDate: new Date().toISOString().split("T")[0],
    });
    setShowAssignPlanDialog(true);
  };

  const handleAssignPlan = async () => {
    if (!assigningTenant || !assignPlanForm.planId) {
      toast.error("Please select a plan");
      return;
    }

    setAssigningPlan(true);
    try {
      const selectedPlan = getPlanById(assignPlanForm.planId);
      const startDate = new Date(assignPlanForm.startDate);
      const endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + assignPlanForm.billingCycleMonths);

      // Calculate price based on billing cycle
      let amount = selectedPlan?.basePrice || 0;
      if (assignPlanForm.billingCycleMonths === 6) {
        const discount = selectedPlan?.discount6Month || 10;
        amount = selectedPlan?.basePrice
          ? selectedPlan.basePrice * 6 * (1 - discount / 100)
          : 0;
      } else if (assignPlanForm.billingCycleMonths === 12) {
        const discount = selectedPlan?.discount12Month || 20;
        amount = selectedPlan?.basePrice
          ? selectedPlan.basePrice * 12 * (1 - discount / 100)
          : 0;
      }

      await api.post("subscriptions", {
        tenantId: assigningTenant.id,
        planId: assignPlanForm.planId,
        planName: selectedPlan?.name,
        billingCycleMonths: assignPlanForm.billingCycleMonths,
        billingCycle:
          assignPlanForm.billingCycleMonths === 1
            ? "monthly"
            : assignPlanForm.billingCycleMonths === 6
              ? "semi_annual"
              : "yearly",
        amount: Math.round(amount * 100) / 100,
        currency: "BDT",
        status: "active",
        currentPeriodStart: startDate.toISOString(),
        currentPeriodEnd: endDate.toISOString(),
        autoRenew: true,
      });

      toast.success(
        `${selectedPlan?.name} plan assigned to ${assigningTenant.name}!`
      );
      setShowAssignPlanDialog(false);
      setAssigningTenant(null);
      await loadTenants();
    } catch (error: any) {
      toast.error(error.message || "Failed to assign plan");
    } finally {
      setAssigningPlan(false);
    }
  };

  const handleCreateTenant = async () => {
    if (!newTenant.name || !newTenant.email) {
      toast.error("Name and email are required");
      return;
    }

    try {
      await api.post("tenants", newTenant);

      toast.success("Tenant created successfully!");
      setShowCreateDialog(false);
      setNewTenant({ name: "", email: "", phone: "", status: "active" });
      await loadTenants();
    } catch (error: any) {
      toast.error(error.message || "Failed to create tenant");
    }
  };

  const handleEditTenant = (tenant: Tenant) => {
    setEditingTenant(tenant);
    setShowEditDialog(true);
  };

  const handleViewTenant = (tenant: Tenant) => {
    setViewingTenant(tenant);
    setShowViewDialog(true);
  };

  const handleUpdateTenant = async () => {
    if (!editingTenant) return;

    try {
      await api.put(`tenants/${editingTenant.id}`, editingTenant);

      toast.success("Tenant updated successfully!");
      setShowEditDialog(false);
      setEditingTenant(null);
      await loadTenants();
    } catch (error: any) {
      toast.error(error.message || "Failed to update tenant");
    }
  };

  const handleDeleteTenant = async (
    tenantId: string,
    tenantName: string
  ) => {
    if (
      !confirm(
        `Are you sure you want to delete "${tenantName}"? This action cannot be undone.`
      )
    ) {
      return;
    }

    try {
      await api.delete(`tenants/${tenantId}`);

      toast.success("Tenant deleted successfully!");
      await loadTenants();
    } catch (error: any) {
      toast.error(error.message || "Failed to delete tenant");
    }
  };

  const exportTenants = () => {
    const csvContent = [
      ["Name", "Email", "Phone", "Status", "Domain", "Created At"].join(","),
      ...filteredTenants.map((m) =>
        [
          m.name,
          m.email,
          m.phone || "",
          m.status,
          m.customDomain || m.deploymentUrl || "",
          m.createdAt || "",
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `tenants-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Tenants exported successfully!");
  };

  useEffect(() => {
    loadTenants();
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return (
          <Badge className="bg-green-500 hover:bg-green-600">Active</Badge>
        );
      case "trial":
        return <Badge className="bg-blue-500 hover:bg-blue-600">Trial</Badge>;
      case "suspended":
        return <Badge variant="destructive">Suspended</Badge>;
      case "inactive":
        return <Badge variant="secondary">Inactive</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tenants</h1>
          <p className="text-muted-foreground">
            Manage all tenant accounts and their deployments
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadTenants} disabled={loading}>
            <RefreshCw
              className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
          <Button variant="outline" onClick={exportTenants}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Tenant
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Tenant</DialogTitle>
                <DialogDescription>
                  Add a new tenant account to the system
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    value={newTenant.name}
                    onChange={(e) =>
                      setNewTenant({ ...newTenant, name: e.target.value })
                    }
                    placeholder="Tenant Name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newTenant.email}
                    onChange={(e) =>
                      setNewTenant({ ...newTenant, email: e.target.value })
                    }
                    placeholder="tenant@example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={newTenant.phone}
                    onChange={(e) =>
                      setNewTenant({ ...newTenant, phone: e.target.value })
                    }
                    placeholder="+1234567890"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={newTenant.status}
                    onValueChange={(value) =>
                      setNewTenant({
                        ...newTenant,
                        status: value as TenantStatus,
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
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowCreateDialog(false)}
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleCreateTenant}>Create</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard
          title="Total Tenants"
          value={stats.total}
          icon={Users}
          color="bg-primary"
        />
        <StatCard
          title="Active"
          value={stats.active}
          icon={UserCheck}
          color="bg-green-500"
          description={`${stats.total > 0
              ? ((stats.active / stats.total) * 100).toFixed(0)
              : 0
            }% of total`}
        />
        <StatCard
          title="Trial"
          value={stats.trial}
          icon={Clock}
          color="bg-blue-500"
        />
        <StatCard
          title="Suspended"
          value={stats.suspended}
          icon={UserX}
          color="bg-red-500"
        />
        <StatCard
          title="Deployed"
          value={stats.deployed}
          icon={Rocket}
          color="bg-purple-500"
          description={`${stats.total > 0
              ? ((stats.deployed / stats.total) * 100).toFixed(0)
              : 0
            }% deployed`}
        />
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
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tenants Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Tenants</CardTitle>
          <CardDescription>
            Showing {filteredTenants.length} of {tenants.length} tenants
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
          ) : filteredTenants.length === 0 ? (
            <div className="py-12 text-center">
              <Users className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
              <p className="text-muted-foreground">
                {tenants.length === 0
                  ? "No tenants found"
                  : "No tenants match your filters"}
              </p>
              {tenants.length === 0 && (
                <Button
                  className="mt-4"
                  onClick={() => setShowCreateDialog(true)}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Create First Tenant
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tenant</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Subscription</TableHead>
                    <TableHead>Deployment</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTenants.map((tenant) => (
                    <TableRow key={tenant.id} className="group">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 font-semibold text-primary">
                            {tenant.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium">{tenant.name}</p>
                            <p className="text-xs text-muted-foreground">
                              ID: {tenant.id.slice(0, 8)}...
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="text-sm">{tenant.email}</p>
                          <p className="text-xs text-muted-foreground">
                            {tenant.phone || "No phone"}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(tenant.status)}</TableCell>
                      <TableCell>
                        {(() => {
                          const sub = getTenantSubscription(tenant.id);
                          if (!sub) {
                            return (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleOpenAssignPlan(tenant)}
                                className="gap-1"
                              >
                                <Crown className="h-3 w-3" />
                                Assign Plan
                              </Button>
                            );
                          }
                          const plan = getPlanById(sub.planId);
                          const isExpired =
                            new Date(sub.currentPeriodEnd) < new Date();
                          const daysLeft = Math.ceil(
                            (new Date(sub.currentPeriodEnd).getTime() -
                              Date.now()) /
                            (1000 * 60 * 60 * 24)
                          );
                          return (
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <Badge
                                  variant={
                                    isExpired
                                      ? "destructive"
                                      : sub.status === "active"
                                        ? "default"
                                        : "secondary"
                                  }
                                  className="gap-1"
                                >
                                  <Crown className="h-3 w-3" />
                                  {plan?.name || sub.planId}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                {isExpired ? (
                                  <>
                                    <AlertTriangle className="h-3 w-3 text-destructive" />
                                    <span className="text-destructive">
                                      Expired
                                    </span>
                                  </>
                                ) : (
                                  <>
                                    <Calendar className="h-3 w-3" />
                                    <span>{daysLeft} days left</span>
                                  </>
                                )}
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 px-2 text-xs"
                                onClick={() => handleOpenAssignPlan(tenant)}
                              >
                                Change Plan
                              </Button>
                            </div>
                          );
                        })()}
                      </TableCell>
                      <TableCell>
                        {tenant.customDomain ? (
                          <div className="flex items-center gap-2">
                            <Globe className="h-4 w-4 text-green-600" />
                            <a
                              href={`https://${tenant.customDomain}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-primary hover:underline"
                            >
                              {tenant.customDomain}
                            </a>
                          </div>
                        ) : tenant.deploymentUrl ? (
                          <a
                            href={`https://${tenant.deploymentUrl}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-sm text-primary hover:underline"
                          >
                            <ExternalLink className="h-4 w-4" />
                            {tenant.deploymentUrl.slice(0, 25)}...
                          </a>
                        ) : (
                          <span className="text-sm text-muted-foreground">
                            Not deployed
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                          <Link href={`/tenants/${tenant.id}`}>
                            <Button variant="ghost" size="icon">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditTenant(tenant)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() =>
                              handleDeleteTenant(tenant.id, tenant.name)
                            }
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* View Dialog */}
      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Tenant Details</DialogTitle>
            <DialogDescription>
              Complete information about this tenant
            </DialogDescription>
          </DialogHeader>
          {viewingTenant && (
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-2xl font-bold text-primary">
                  {viewingTenant.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-xl font-semibold">
                    {viewingTenant.name}
                  </h3>
                  <p className="text-muted-foreground">
                    {viewingTenant.email}
                  </p>
                </div>
                {getStatusBadge(viewingTenant.status)}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">
                    Tenant ID
                  </Label>
                  <p className="font-mono text-sm">{viewingTenant.id}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Phone</Label>
                  <p className="text-sm">
                    {viewingTenant.phone || "Not provided"}
                  </p>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">
                    Custom Domain
                  </Label>
                  <p className="text-sm">
                    {viewingTenant.customDomain || "Not configured"}
                  </p>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">
                    Deployment URL
                  </Label>
                  {viewingTenant.deploymentUrl ? (
                    <a
                      href={`https://${viewingTenant.deploymentUrl}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-sm text-primary hover:underline"
                    >
                      {viewingTenant.deploymentUrl}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Not deployed
                    </p>
                  )}
                </div>
                {viewingTenant.subscriptionId && (
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">
                      Subscription ID
                    </Label>
                    <p className="font-mono text-sm">
                      {viewingTenant.subscriptionId}
                    </p>
                  </div>
                )}
                {viewingTenant.createdAt && (
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">
                      Created At
                    </Label>
                    <p className="text-sm">
                      {new Date(viewingTenant.createdAt).toLocaleString()}
                    </p>
                  </div>
                )}
              </div>

              {viewingTenant.settings && (
                <div className="rounded-lg border p-4">
                  <h4 className="mb-3 font-semibold">Settings</h4>
                  <div className="grid gap-2 text-sm">
                    {viewingTenant.settings.brandName && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          Brand Name
                        </span>
                        <span>{viewingTenant.settings.brandName}</span>
                      </div>
                    )}
                    {viewingTenant.settings.currency && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Currency</span>
                        <span>{viewingTenant.settings.currency}</span>
                      </div>
                    )}
                    {viewingTenant.settings.timezone && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Timezone</span>
                        <span>{viewingTenant.settings.timezone}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowViewDialog(false);
                    handleEditTenant(viewingTenant);
                  }}
                >
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </Button>
                <Button onClick={() => setShowViewDialog(false)}>Close</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Tenant</DialogTitle>
            <DialogDescription>Update tenant information</DialogDescription>
          </DialogHeader>
          {editingTenant && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Name *</Label>
                <Input
                  id="edit-name"
                  value={editingTenant.name}
                  onChange={(e) =>
                    setEditingTenant({
                      ...editingTenant,
                      name: e.target.value,
                    })
                  }
                  placeholder="Tenant Name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-email">Email *</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={editingTenant.email}
                  onChange={(e) =>
                    setEditingTenant({
                      ...editingTenant,
                      email: e.target.value,
                    })
                  }
                  placeholder="tenant@example.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-phone">Phone</Label>
                <Input
                  id="edit-phone"
                  value={editingTenant.phone || ""}
                  onChange={(e) =>
                    setEditingTenant({
                      ...editingTenant,
                      phone: e.target.value,
                    })
                  }
                  placeholder="+1234567890"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-status">Status</Label>
                <Select
                  value={editingTenant.status}
                  onValueChange={(value) =>
                    setEditingTenant({
                      ...editingTenant,
                      status: value as TenantStatus,
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
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowEditDialog(false)}
                >
                  Cancel
                </Button>
                <Button onClick={handleUpdateTenant}>Save Changes</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Assign Plan Dialog */}
      <Dialog
        open={showAssignPlanDialog}
        onOpenChange={setShowAssignPlanDialog}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-yellow-500" />
              Assign Subscription Plan
            </DialogTitle>
            <DialogDescription>
              {assigningTenant
                ? `Assign or update subscription for ${assigningTenant.name}`
                : "Select a tenant first"}
            </DialogDescription>
          </DialogHeader>
          {assigningTenant && (
            <div className="space-y-6">
              {/* Tenant Info */}
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 font-semibold text-primary">
                  {assigningTenant.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-medium">{assigningTenant.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {assigningTenant.email}
                  </p>
                </div>
              </div>

              {/* Current Subscription */}
              {(() => {
                const currentSub = getTenantSubscription(
                  assigningTenant.id
                );
                if (currentSub) {
                  const currentPlan = getPlanById(currentSub.planId);
                  const isExpired =
                    new Date(currentSub.currentPeriodEnd) < new Date();
                  return (
                    <div className="p-3 rounded-lg border bg-amber-50 border-amber-200">
                      <div className="flex items-center gap-2 mb-1">
                        <AlertTriangle className="h-4 w-4 text-amber-600" />
                        <span className="font-medium text-amber-800">
                          Current Subscription
                        </span>
                      </div>
                      <p className="text-sm text-amber-700">
                        {currentPlan?.name || currentSub.planId} (
                        {currentSub.billingCycleMonths} month
                        {currentSub.billingCycleMonths > 1 ? "s" : ""})
                        {isExpired
                          ? " - Expired"
                          : ` - Expires ${new Date(
                            currentSub.currentPeriodEnd
                          ).toLocaleDateString()}`}
                      </p>
                      <p className="text-xs text-amber-600 mt-1">
                        This will be replaced with the new plan.
                      </p>
                    </div>
                  );
                }
                return null;
              })()}

              {/* Plan Selection */}
              <div className="space-y-2">
                <Label>Select Plan *</Label>
                <Select
                  value={assignPlanForm.planId}
                  onValueChange={(value) =>
                    setAssignPlanForm({ ...assignPlanForm, planId: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a plan" />
                  </SelectTrigger>
                  <SelectContent>
                    {plans.map((plan) => (
                      <SelectItem key={plan.id} value={plan.id}>
                        <div className="flex items-center justify-between gap-4">
                          <span>{plan.name}</span>
                          <span className="text-muted-foreground">
                            {formatAmount(plan.basePrice)}/mo
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Billing Cycle */}
              <div className="space-y-2">
                <Label>Billing Cycle</Label>
                <Select
                  value={String(assignPlanForm.billingCycleMonths)}
                  onValueChange={(value) =>
                    setAssignPlanForm({
                      ...assignPlanForm,
                      billingCycleMonths: Number(value),
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Monthly (1 month)</SelectItem>
                    <SelectItem value="6">Semi-Annual (6 months)</SelectItem>
                    <SelectItem value="12">Yearly (12 months)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Start Date */}
              <div className="space-y-2">
                <Label>Start Date</Label>
                <Input
                  type="date"
                  value={assignPlanForm.startDate}
                  onChange={(e) =>
                    setAssignPlanForm({
                      ...assignPlanForm,
                      startDate: e.target.value,
                    })
                  }
                />
              </div>

              {/* Price Preview */}
              {assignPlanForm.planId && (
                <div className="p-4 rounded-lg bg-primary/5 border">
                  {(() => {
                    const selectedPlan = getPlanById(assignPlanForm.planId);
                    if (!selectedPlan) return null;
                    const amount =
                      selectedPlan.basePrice *
                      assignPlanForm.billingCycleMonths;
                    let discount = 0;
                    if (assignPlanForm.billingCycleMonths === 6) {
                      discount = selectedPlan.discount6Month || 10;
                    } else if (assignPlanForm.billingCycleMonths === 12) {
                      discount = selectedPlan.discount12Month || 20;
                    }
                    const discountedAmount = amount * (1 - discount / 100);
                    const endDate = new Date(assignPlanForm.startDate);
                    endDate.setMonth(
                      endDate.getMonth() + assignPlanForm.billingCycleMonths
                    );

                    return (
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="font-medium">
                            {selectedPlan.name} Plan
                          </span>
                          <span className="text-lg font-bold">
                            {formatAmount(discountedAmount)}
                          </span>
                        </div>
                        {discount > 0 && (
                          <div className="flex justify-between items-center text-sm text-green-600">
                            <span>Discount ({discount}%)</span>
                            <span>
                              -{formatAmount(amount - discountedAmount)}
                            </span>
                          </div>
                        )}
                        <div className="flex justify-between items-center text-sm text-muted-foreground">
                          <span>Period</span>
                          <span>
                            {new Date(
                              assignPlanForm.startDate
                            ).toLocaleDateString()}{" "}
                            → {endDate.toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-end gap-2 pt-2">
                <Button
                  variant="outline"
                  onClick={() => setShowAssignPlanDialog(false)}
                  disabled={assigningPlan}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleAssignPlan}
                  disabled={assigningPlan || !assignPlanForm.planId}
                >
                  {assigningPlan ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Assigning...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Assign Plan
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
