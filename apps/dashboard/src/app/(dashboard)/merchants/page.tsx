"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
import type { Merchant } from "@/lib/types";
import { useCurrency } from "@/contexts/SettingsContext";

type MerchantStatus = "active" | "suspended" | "trial" | "inactive";

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
  merchantId: string;
  planId: string;
  planName?: string;
  status: string;
  billingCycleMonths: number;
  currentPeriodEnd: string;
  amount?: number;
}

const STATUS_OPTIONS: { value: MerchantStatus; label: string; color: string }[] = [
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
      <CardContent className='pt-6'>
        <div className='flex items-center justify-between'>
          <div>
            <p className='text-sm font-medium text-muted-foreground'>{title}</p>
            <p className='text-3xl font-bold'>{value}</p>
            {description && <p className='mt-1 text-xs text-muted-foreground'>{description}</p>}
          </div>
          <div className={`rounded-full p-3 ${color}`}>
            <Icon className='h-5 w-5 text-white' />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function MerchantsPage() {
  const { formatAmount, currencySymbol } = useCurrency();
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [showAssignPlanDialog, setShowAssignPlanDialog] = useState(false);
  const [editingMerchant, setEditingMerchant] = useState<Merchant | null>(null);
  const [viewingMerchant, setViewingMerchant] = useState<Merchant | null>(null);
  const [assigningMerchant, setAssigningMerchant] = useState<Merchant | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [newMerchant, setNewMerchant] = useState({
    name: "",
    email: "",
    phone: "",
    status: "active" as MerchantStatus,
  });
  const [assignPlanForm, setAssignPlanForm] = useState({
    planId: "",
    billingCycleMonths: 1,
    startDate: new Date().toISOString().split("T")[0],
  });
  const [assigningPlan, setAssigningPlan] = useState(false);

  // Stats
  const stats = useMemo(() => {
    const total = merchants.length;
    const active = merchants.filter((m) => m.status === "active").length;
    const trial = merchants.filter((m) => m.status === "trial").length;
    const suspended = merchants.filter((m) => m.status === "suspended").length;
    const inactive = merchants.filter((m) => m.status === "inactive").length;
    const deployed = merchants.filter((m) => m.deploymentUrl).length;

    return { total, active, trial, suspended, inactive, deployed };
  }, [merchants]);

  // Filtered merchants
  const filteredMerchants = useMemo(() => {
    return merchants.filter((merchant) => {
      const matchesSearch =
        searchQuery === "" ||
        merchant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        merchant.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        merchant.phone?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = statusFilter === "all" || merchant.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [merchants, searchQuery, statusFilter]);

  const loadMerchants = async () => {
    setLoading(true);
    try {
      const [merchantsRes, plansRes, subscriptionsRes] = await Promise.all([
        fetch("/api/merchants"),
        fetch("/api/plans"),
        fetch("/api/subscriptions"),
      ]);

      if (!merchantsRes.ok) throw new Error("Failed to load merchants");
      const merchantsData = await merchantsRes.json();
      setMerchants(merchantsData);

      if (plansRes.ok) {
        const plansData = await plansRes.json();
        setPlans(plansData);
      }

      if (subscriptionsRes.ok) {
        const subscriptionsData = await subscriptionsRes.json();
        setSubscriptions(subscriptionsData);
      }
    } catch (error) {
      console.error("Failed to load merchants:", error);
      toast.error("Failed to load merchants");
    } finally {
      setLoading(false);
    }
  };

  const getMerchantSubscription = (merchantId: string) => {
    return subscriptions.find((s) => s.merchantId === merchantId);
  };

  const getPlanById = (planId: string) => {
    return plans.find((p) => p.id === planId);
  };

  const handleOpenAssignPlan = (merchant: Merchant) => {
    setAssigningMerchant(merchant);
    const existingSub = getMerchantSubscription(merchant.id);
    setAssignPlanForm({
      planId: existingSub?.planId || plans[0]?.id || "",
      billingCycleMonths: existingSub?.billingCycleMonths || 1,
      startDate: new Date().toISOString().split("T")[0],
    });
    setShowAssignPlanDialog(true);
  };

  const handleAssignPlan = async () => {
    if (!assigningMerchant || !assignPlanForm.planId) {
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
        amount = selectedPlan?.basePrice ? selectedPlan.basePrice * 6 * (1 - discount / 100) : 0;
      } else if (assignPlanForm.billingCycleMonths === 12) {
        const discount = selectedPlan?.discount12Month || 20;
        amount = selectedPlan?.basePrice ? selectedPlan.basePrice * 12 * (1 - discount / 100) : 0;
      }

      const res = await fetch("/api/subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          merchantId: assigningMerchant.id,
          planId: assignPlanForm.planId,
          planName: selectedPlan?.name,
          billingCycleMonths: assignPlanForm.billingCycleMonths,
          billingCycle:
            assignPlanForm.billingCycleMonths === 1 ? "monthly" : assignPlanForm.billingCycleMonths === 6 ? "semi_annual" : "yearly",
          amount: Math.round(amount * 100) / 100,
          currency: "BDT",
          status: "active",
          currentPeriodStart: startDate.toISOString(),
          currentPeriodEnd: endDate.toISOString(),
          autoRenew: true,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to assign plan");
      }

      toast.success(`${selectedPlan?.name} plan assigned to ${assigningMerchant.name}!`);
      setShowAssignPlanDialog(false);
      setAssigningMerchant(null);
      await loadMerchants();
    } catch (error: any) {
      toast.error(error.message || "Failed to assign plan");
    } finally {
      setAssigningPlan(false);
    }
  };

  const handleCreateMerchant = async () => {
    if (!newMerchant.name || !newMerchant.email) {
      toast.error("Name and email are required");
      return;
    }

    try {
      const res = await fetch("/api/merchants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newMerchant),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to create merchant");
      }

      toast.success("Merchant created successfully!");
      setShowCreateDialog(false);
      setNewMerchant({ name: "", email: "", phone: "", status: "active" });
      await loadMerchants();
    } catch (error: any) {
      toast.error(error.message || "Failed to create merchant");
    }
  };

  const handleEditMerchant = (merchant: Merchant) => {
    setEditingMerchant(merchant);
    setShowEditDialog(true);
  };

  const handleViewMerchant = (merchant: Merchant) => {
    setViewingMerchant(merchant);
    setShowViewDialog(true);
  };

  const handleUpdateMerchant = async () => {
    if (!editingMerchant) return;

    try {
      const res = await fetch(`/api/merchants/${editingMerchant.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingMerchant),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to update merchant");
      }

      toast.success("Merchant updated successfully!");
      setShowEditDialog(false);
      setEditingMerchant(null);
      await loadMerchants();
    } catch (error: any) {
      toast.error(error.message || "Failed to update merchant");
    }
  };

  const handleDeleteMerchant = async (merchantId: string, merchantName: string) => {
    if (!confirm(`Are you sure you want to delete "${merchantName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/merchants/${merchantId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to delete merchant");
      }

      toast.success("Merchant deleted successfully!");
      await loadMerchants();
    } catch (error: any) {
      toast.error(error.message || "Failed to delete merchant");
    }
  };

  const exportMerchants = () => {
    const csvContent = [
      ["Name", "Email", "Phone", "Status", "Domain", "Created At"].join(","),
      ...filteredMerchants.map((m) =>
        [m.name, m.email, m.phone || "", m.status, m.customDomain || m.deploymentUrl || "", m.createdAt || ""].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `merchants-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Merchants exported successfully!");
  };

  useEffect(() => {
    loadMerchants();
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className='bg-green-500 hover:bg-green-600'>Active</Badge>;
      case "trial":
        return <Badge className='bg-blue-500 hover:bg-blue-600'>Trial</Badge>;
      case "suspended":
        return <Badge variant='destructive'>Suspended</Badge>;
      case "inactive":
        return <Badge variant='secondary'>Inactive</Badge>;
      default:
        return <Badge variant='outline'>{status}</Badge>;
    }
  };

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
        <div>
          <h1 className='text-3xl font-bold tracking-tight'>Merchants</h1>
          <p className='text-muted-foreground'>Manage all merchant accounts and their deployments</p>
        </div>
        <div className='flex gap-2'>
          <Button variant='outline' onClick={loadMerchants} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button variant='outline' onClick={exportMerchants}>
            <Download className='h-4 w-4 mr-2' />
            Export
          </Button>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className='h-4 w-4 mr-2' />
                Add Merchant
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Merchant</DialogTitle>
                <DialogDescription>Add a new merchant account to the system</DialogDescription>
              </DialogHeader>
              <div className='space-y-4'>
                <div className='space-y-2'>
                  <Label htmlFor='name'>Name *</Label>
                  <Input
                    id='name'
                    value={newMerchant.name}
                    onChange={(e) => setNewMerchant({ ...newMerchant, name: e.target.value })}
                    placeholder='Merchant Name'
                  />
                </div>
                <div className='space-y-2'>
                  <Label htmlFor='email'>Email *</Label>
                  <Input
                    id='email'
                    type='email'
                    value={newMerchant.email}
                    onChange={(e) => setNewMerchant({ ...newMerchant, email: e.target.value })}
                    placeholder='merchant@example.com'
                  />
                </div>
                <div className='space-y-2'>
                  <Label htmlFor='phone'>Phone</Label>
                  <Input
                    id='phone'
                    value={newMerchant.phone}
                    onChange={(e) => setNewMerchant({ ...newMerchant, phone: e.target.value })}
                    placeholder='+1234567890'
                  />
                </div>
                <div className='space-y-2'>
                  <Label htmlFor='status'>Status</Label>
                  <Select
                    value={newMerchant.status}
                    onValueChange={(value) =>
                      setNewMerchant({
                        ...newMerchant,
                        status: value as MerchantStatus,
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
                <div className='flex justify-end gap-2'>
                  <Button variant='outline' onClick={() => setShowCreateDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateMerchant}>Create</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-5'>
        <StatCard title='Total Merchants' value={stats.total} icon={Users} color='bg-primary' />
        <StatCard
          title='Active'
          value={stats.active}
          icon={UserCheck}
          color='bg-green-500'
          description={`${stats.total > 0 ? ((stats.active / stats.total) * 100).toFixed(0) : 0}% of total`}
        />
        <StatCard title='Trial' value={stats.trial} icon={Clock} color='bg-blue-500' />
        <StatCard title='Suspended' value={stats.suspended} icon={UserX} color='bg-red-500' />
        <StatCard
          title='Deployed'
          value={stats.deployed}
          icon={Rocket}
          color='bg-purple-500'
          description={`${stats.total > 0 ? ((stats.deployed / stats.total) * 100).toFixed(0) : 0}% deployed`}
        />
      </div>

      {/* Filters */}
      <Card>
        <CardContent className='pt-6'>
          <div className='flex flex-col gap-4 sm:flex-row sm:items-center'>
            <div className='relative flex-1'>
              <Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground' />
              <Input
                placeholder='Search by name, email, or phone...'
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className='pl-9'
              />
            </div>
            <div className='flex gap-2'>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className='w-[150px]'>
                  <Filter className='mr-2 h-4 w-4' />
                  <SelectValue placeholder='Status' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>All Statuses</SelectItem>
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

      {/* Merchants Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Merchants</CardTitle>
          <CardDescription>
            Showing {filteredMerchants.length} of {merchants.length} merchants
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className='space-y-4'>
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className='flex items-center gap-4'>
                  <div className='h-10 w-10 animate-pulse rounded-full bg-muted' />
                  <div className='flex-1 space-y-2'>
                    <div className='h-4 w-1/3 animate-pulse rounded bg-muted' />
                    <div className='h-3 w-1/2 animate-pulse rounded bg-muted' />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredMerchants.length === 0 ? (
            <div className='py-12 text-center'>
              <Users className='mx-auto mb-4 h-12 w-12 text-muted-foreground' />
              <p className='text-muted-foreground'>{merchants.length === 0 ? "No merchants found" : "No merchants match your filters"}</p>
              {merchants.length === 0 && (
                <Button className='mt-4' onClick={() => setShowCreateDialog(true)}>
                  <Plus className='mr-2 h-4 w-4' />
                  Create First Merchant
                </Button>
              )}
            </div>
          ) : (
            <div className='overflow-x-auto'>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Merchant</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Subscription</TableHead>
                    <TableHead>Deployment</TableHead>
                    <TableHead className='text-right'>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMerchants.map((merchant) => (
                    <TableRow key={merchant.id} className='group'>
                      <TableCell>
                        <div className='flex items-center gap-3'>
                          <div className='flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 font-semibold text-primary'>
                            {merchant.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className='font-medium'>{merchant.name}</p>
                            <p className='text-xs text-muted-foreground'>ID: {merchant.id.slice(0, 8)}...</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className='text-sm'>{merchant.email}</p>
                          <p className='text-xs text-muted-foreground'>{merchant.phone || "No phone"}</p>
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(merchant.status)}</TableCell>
                      <TableCell>
                        {(() => {
                          const sub = getMerchantSubscription(merchant.id);
                          if (!sub) {
                            return (
                              <Button variant='outline' size='sm' onClick={() => handleOpenAssignPlan(merchant)} className='gap-1'>
                                <Crown className='h-3 w-3' />
                                Assign Plan
                              </Button>
                            );
                          }
                          const plan = getPlanById(sub.planId);
                          const isExpired = new Date(sub.currentPeriodEnd) < new Date();
                          const daysLeft = Math.ceil((new Date(sub.currentPeriodEnd).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                          return (
                            <div className='space-y-1'>
                              <div className='flex items-center gap-2'>
                                <Badge
                                  variant={isExpired ? "destructive" : sub.status === "active" ? "default" : "secondary"}
                                  className='gap-1'
                                >
                                  <Crown className='h-3 w-3' />
                                  {plan?.name || sub.planId}
                                </Badge>
                              </div>
                              <div className='flex items-center gap-1 text-xs text-muted-foreground'>
                                {isExpired ? (
                                  <>
                                    <AlertTriangle className='h-3 w-3 text-destructive' />
                                    <span className='text-destructive'>Expired</span>
                                  </>
                                ) : (
                                  <>
                                    <Calendar className='h-3 w-3' />
                                    <span>{daysLeft} days left</span>
                                  </>
                                )}
                              </div>
                              <Button variant='ghost' size='sm' className='h-6 px-2 text-xs' onClick={() => handleOpenAssignPlan(merchant)}>
                                Change Plan
                              </Button>
                            </div>
                          );
                        })()}
                      </TableCell>
                      <TableCell>
                        {merchant.customDomain ? (
                          <div className='flex items-center gap-2'>
                            <Globe className='h-4 w-4 text-green-600' />
                            <a
                              href={`https://${merchant.customDomain}`}
                              target='_blank'
                              rel='noopener noreferrer'
                              className='text-sm text-primary hover:underline'
                            >
                              {merchant.customDomain}
                            </a>
                          </div>
                        ) : merchant.deploymentUrl ? (
                          <a
                            href={`https://${merchant.deploymentUrl}`}
                            target='_blank'
                            rel='noopener noreferrer'
                            className='flex items-center gap-2 text-sm text-primary hover:underline'
                          >
                            <ExternalLink className='h-4 w-4' />
                            {merchant.deploymentUrl.slice(0, 25)}...
                          </a>
                        ) : (
                          <span className='text-sm text-muted-foreground'>Not deployed</span>
                        )}
                      </TableCell>
                      <TableCell className='text-right'>
                        <div className='flex justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100'>
                          <Link href={`/merchants/${merchant.id}`}>
                            <Button variant='ghost' size='icon'>
                              <Eye className='h-4 w-4' />
                            </Button>
                          </Link>
                          <Button variant='ghost' size='icon' onClick={() => handleEditMerchant(merchant)}>
                            <Edit className='h-4 w-4' />
                          </Button>
                          <Button variant='ghost' size='icon' onClick={() => handleDeleteMerchant(merchant.id, merchant.name)}>
                            <Trash2 className='h-4 w-4 text-destructive' />
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
        <DialogContent className='max-w-2xl'>
          <DialogHeader>
            <DialogTitle>Merchant Details</DialogTitle>
            <DialogDescription>Complete information about this merchant</DialogDescription>
          </DialogHeader>
          {viewingMerchant && (
            <div className='space-y-6'>
              <div className='flex items-center gap-4'>
                <div className='flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-2xl font-bold text-primary'>
                  {viewingMerchant.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className='text-xl font-semibold'>{viewingMerchant.name}</h3>
                  <p className='text-muted-foreground'>{viewingMerchant.email}</p>
                </div>
                {getStatusBadge(viewingMerchant.status)}
              </div>

              <div className='grid gap-4 sm:grid-cols-2'>
                <div className='space-y-1'>
                  <Label className='text-xs text-muted-foreground'>Merchant ID</Label>
                  <p className='font-mono text-sm'>{viewingMerchant.id}</p>
                </div>
                <div className='space-y-1'>
                  <Label className='text-xs text-muted-foreground'>Phone</Label>
                  <p className='text-sm'>{viewingMerchant.phone || "Not provided"}</p>
                </div>
                <div className='space-y-1'>
                  <Label className='text-xs text-muted-foreground'>Custom Domain</Label>
                  <p className='text-sm'>{viewingMerchant.customDomain || "Not configured"}</p>
                </div>
                <div className='space-y-1'>
                  <Label className='text-xs text-muted-foreground'>Deployment URL</Label>
                  {viewingMerchant.deploymentUrl ? (
                    <a
                      href={`https://${viewingMerchant.deploymentUrl}`}
                      target='_blank'
                      rel='noopener noreferrer'
                      className='flex items-center gap-1 text-sm text-primary hover:underline'
                    >
                      {viewingMerchant.deploymentUrl}
                      <ExternalLink className='h-3 w-3' />
                    </a>
                  ) : (
                    <p className='text-sm text-muted-foreground'>Not deployed</p>
                  )}
                </div>
                {viewingMerchant.subscriptionId && (
                  <div className='space-y-1'>
                    <Label className='text-xs text-muted-foreground'>Subscription ID</Label>
                    <p className='font-mono text-sm'>{viewingMerchant.subscriptionId}</p>
                  </div>
                )}
                {viewingMerchant.createdAt && (
                  <div className='space-y-1'>
                    <Label className='text-xs text-muted-foreground'>Created At</Label>
                    <p className='text-sm'>{new Date(viewingMerchant.createdAt).toLocaleString()}</p>
                  </div>
                )}
              </div>

              {viewingMerchant.settings && (
                <div className='rounded-lg border p-4'>
                  <h4 className='mb-3 font-semibold'>Settings</h4>
                  <div className='grid gap-2 text-sm'>
                    {viewingMerchant.settings.brandName && (
                      <div className='flex justify-between'>
                        <span className='text-muted-foreground'>Brand Name</span>
                        <span>{viewingMerchant.settings.brandName}</span>
                      </div>
                    )}
                    {viewingMerchant.settings.currency && (
                      <div className='flex justify-between'>
                        <span className='text-muted-foreground'>Currency</span>
                        <span>{viewingMerchant.settings.currency}</span>
                      </div>
                    )}
                    {viewingMerchant.settings.timezone && (
                      <div className='flex justify-between'>
                        <span className='text-muted-foreground'>Timezone</span>
                        <span>{viewingMerchant.settings.timezone}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className='flex justify-end gap-2'>
                <Button
                  variant='outline'
                  onClick={() => {
                    setShowViewDialog(false);
                    handleEditMerchant(viewingMerchant);
                  }}
                >
                  <Edit className='mr-2 h-4 w-4' />
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
            <DialogTitle>Edit Merchant</DialogTitle>
            <DialogDescription>Update merchant information</DialogDescription>
          </DialogHeader>
          {editingMerchant && (
            <div className='space-y-4'>
              <div className='space-y-2'>
                <Label htmlFor='edit-name'>Name *</Label>
                <Input
                  id='edit-name'
                  value={editingMerchant.name}
                  onChange={(e) =>
                    setEditingMerchant({
                      ...editingMerchant,
                      name: e.target.value,
                    })
                  }
                  placeholder='Merchant Name'
                />
              </div>
              <div className='space-y-2'>
                <Label htmlFor='edit-email'>Email *</Label>
                <Input
                  id='edit-email'
                  type='email'
                  value={editingMerchant.email}
                  onChange={(e) =>
                    setEditingMerchant({
                      ...editingMerchant,
                      email: e.target.value,
                    })
                  }
                  placeholder='merchant@example.com'
                />
              </div>
              <div className='space-y-2'>
                <Label htmlFor='edit-phone'>Phone</Label>
                <Input
                  id='edit-phone'
                  value={editingMerchant.phone || ""}
                  onChange={(e) =>
                    setEditingMerchant({
                      ...editingMerchant,
                      phone: e.target.value,
                    })
                  }
                  placeholder='+1234567890'
                />
              </div>
              <div className='space-y-2'>
                <Label htmlFor='edit-status'>Status</Label>
                <Select
                  value={editingMerchant.status}
                  onValueChange={(value) =>
                    setEditingMerchant({
                      ...editingMerchant,
                      status: value as MerchantStatus,
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
              <div className='flex justify-end gap-2'>
                <Button variant='outline' onClick={() => setShowEditDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleUpdateMerchant}>Save Changes</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Assign Plan Dialog */}
      <Dialog open={showAssignPlanDialog} onOpenChange={setShowAssignPlanDialog}>
        <DialogContent className='max-w-lg'>
          <DialogHeader>
            <DialogTitle className='flex items-center gap-2'>
              <Crown className='h-5 w-5 text-yellow-500' />
              Assign Subscription Plan
            </DialogTitle>
            <DialogDescription>
              {assigningMerchant ? `Assign or update subscription for ${assigningMerchant.name}` : "Select a merchant first"}
            </DialogDescription>
          </DialogHeader>
          {assigningMerchant && (
            <div className='space-y-6'>
              {/* Merchant Info */}
              <div className='flex items-center gap-3 p-3 rounded-lg bg-muted/50'>
                <div className='flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 font-semibold text-primary'>
                  {assigningMerchant.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className='font-medium'>{assigningMerchant.name}</p>
                  <p className='text-sm text-muted-foreground'>{assigningMerchant.email}</p>
                </div>
              </div>

              {/* Current Subscription */}
              {(() => {
                const currentSub = getMerchantSubscription(assigningMerchant.id);
                if (currentSub) {
                  const currentPlan = getPlanById(currentSub.planId);
                  const isExpired = new Date(currentSub.currentPeriodEnd) < new Date();
                  return (
                    <div className='p-3 rounded-lg border bg-amber-50 border-amber-200'>
                      <div className='flex items-center gap-2 mb-1'>
                        <AlertTriangle className='h-4 w-4 text-amber-600' />
                        <span className='font-medium text-amber-800'>Current Subscription</span>
                      </div>
                      <p className='text-sm text-amber-700'>
                        {currentPlan?.name || currentSub.planId} ({currentSub.billingCycleMonths} month
                        {currentSub.billingCycleMonths > 1 ? "s" : ""})
                        {isExpired ? " - Expired" : ` - Expires ${new Date(currentSub.currentPeriodEnd).toLocaleDateString()}`}
                      </p>
                      <p className='text-xs text-amber-600 mt-1'>This will be replaced with the new plan.</p>
                    </div>
                  );
                }
                return null;
              })()}

              {/* Plan Selection */}
              <div className='space-y-2'>
                <Label>Select Plan *</Label>
                <Select value={assignPlanForm.planId} onValueChange={(value) => setAssignPlanForm({ ...assignPlanForm, planId: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder='Select a plan' />
                  </SelectTrigger>
                  <SelectContent>
                    {plans.map((plan) => (
                      <SelectItem key={plan.id} value={plan.id}>
                        <div className='flex items-center justify-between gap-4'>
                          <span>{plan.name}</span>
                          <span className='text-muted-foreground'>{formatAmount(plan.basePrice)}/mo</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Billing Cycle */}
              <div className='space-y-2'>
                <Label>Billing Cycle</Label>
                <Select
                  value={String(assignPlanForm.billingCycleMonths)}
                  onValueChange={(value) => setAssignPlanForm({ ...assignPlanForm, billingCycleMonths: Number(value) })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='1'>Monthly (1 month)</SelectItem>
                    <SelectItem value='6'>Semi-Annual (6 months)</SelectItem>
                    <SelectItem value='12'>Yearly (12 months)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Start Date */}
              <div className='space-y-2'>
                <Label>Start Date</Label>
                <Input
                  type='date'
                  value={assignPlanForm.startDate}
                  onChange={(e) => setAssignPlanForm({ ...assignPlanForm, startDate: e.target.value })}
                />
              </div>

              {/* Price Preview */}
              {assignPlanForm.planId && (
                <div className='p-4 rounded-lg bg-primary/5 border'>
                  {(() => {
                    const selectedPlan = getPlanById(assignPlanForm.planId);
                    if (!selectedPlan) return null;
                    let amount = selectedPlan.basePrice * assignPlanForm.billingCycleMonths;
                    let discount = 0;
                    if (assignPlanForm.billingCycleMonths === 6) {
                      discount = selectedPlan.discount6Month || 10;
                    } else if (assignPlanForm.billingCycleMonths === 12) {
                      discount = selectedPlan.discount12Month || 20;
                    }
                    const discountedAmount = amount * (1 - discount / 100);
                    const endDate = new Date(assignPlanForm.startDate);
                    endDate.setMonth(endDate.getMonth() + assignPlanForm.billingCycleMonths);

                    return (
                      <div className='space-y-2'>
                        <div className='flex justify-between items-center'>
                          <span className='font-medium'>{selectedPlan.name} Plan</span>
                          <span className='text-lg font-bold'>{formatAmount(discountedAmount)}</span>
                        </div>
                        {discount > 0 && (
                          <div className='flex justify-between items-center text-sm text-green-600'>
                            <span>Discount ({discount}%)</span>
                            <span>-{formatAmount(amount - discountedAmount)}</span>
                          </div>
                        )}
                        <div className='flex justify-between items-center text-sm text-muted-foreground'>
                          <span>Period</span>
                          <span>
                            {new Date(assignPlanForm.startDate).toLocaleDateString()} → {endDate.toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* Actions */}
              <div className='flex justify-end gap-2 pt-2'>
                <Button variant='outline' onClick={() => setShowAssignPlanDialog(false)} disabled={assigningPlan}>
                  Cancel
                </Button>
                <Button onClick={handleAssignPlan} disabled={assigningPlan || !assignPlanForm.planId}>
                  {assigningPlan ? (
                    <>
                      <RefreshCw className='mr-2 h-4 w-4 animate-spin' />
                      Assigning...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className='mr-2 h-4 w-4' />
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
