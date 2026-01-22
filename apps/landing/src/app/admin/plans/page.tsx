"use client";

import { useState, useEffect, useMemo } from "react";
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
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  CreditCard,
  Plus,
  RefreshCw,
  Edit,
  Trash2,
  DollarSign,
  Star,
  CheckCircle2,
  Layers,
  TrendingUp,
  Users,
  Eye,
  Copy,
  LayoutGrid,
  List,
  Calendar,
} from "lucide-react";
import { toast } from "sonner";
import { useCurrency } from "@/contexts/SettingsContext";
import { api } from "@/lib/api-client";

interface Plan {
  id: string;
  name: string;
  description?: string;
  price: number;
  billingCycleMonths: number;
  featuresList: string[];
  isActive: boolean;
  isPopular?: boolean;
  sortOrder?: number;
  buttonText?: string;
  buttonVariant?: string;
  iconType?: string;
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

function getBillingBadgeColor(months: number) {
  switch (months) {
    case 1:
      return "bg-blue-100 text-blue-700";
    case 6:
      return "bg-purple-100 text-purple-700";
    case 12:
      return "bg-green-100 text-green-700";
    default:
      return "bg-gray-100 text-gray-700";
  }
}

function PlanCard({
  plan,
  onEdit,
  onDelete,
  onDuplicate,
  subscriptionCount,
  formatAmount,
}: {
  plan: Plan;
  onEdit: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
  subscriptionCount: number;
  formatAmount: (amount: number) => string;
}) {
  const monthlyEquivalent = plan.price / (plan.billingCycleMonths || 1);

  return (
    <Card
      className={`relative overflow-hidden transition-all hover:shadow-lg ${
        plan.isPopular ? "ring-2 ring-primary" : ""
      }`}
    >
      {plan.isPopular && (
        <div className="absolute right-0 top-0">
          <div className="flex items-center gap-1 rounded-bl-lg bg-primary px-3 py-1 text-xs font-medium text-primary-foreground">
            <Star className="h-3 w-3" />
            Popular
          </div>
        </div>
      )}
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-xl">{plan.name}</CardTitle>
            <Badge className={getBillingBadgeColor(plan.billingCycleMonths)}>
              <Calendar className="h-3 w-3 mr-1" />
              {getBillingLabel(plan.billingCycleMonths)}
            </Badge>
          </div>
          <Badge variant={plan.isActive ? "default" : "secondary"}>
            {plan.isActive ? "Active" : "Inactive"}
          </Badge>
        </div>
        {plan.description && (
          <CardDescription className="mt-2">{plan.description}</CardDescription>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="flex items-baseline gap-1">
            <span className="text-4xl font-bold">
              {formatAmount(plan.price)}
            </span>
            <span className="text-muted-foreground">
              /{getBillingLabel(plan.billingCycleMonths).toLowerCase()}
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {formatAmount(monthlyEquivalent)}/month
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            <span>{plan.featuresList?.length || 0} features</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Users className="h-4 w-4" />
            <span>{subscriptionCount} subscribers</span>
          </div>
        </div>

        {/* Features preview */}
        {plan.featuresList && plan.featuresList.length > 0 && (
          <div className="border-t pt-3">
            <ul className="space-y-1 text-sm text-muted-foreground">
              {plan.featuresList.slice(0, 3).map((feature, idx) => (
                <li key={idx} className="flex items-center gap-2">
                  <CheckCircle2 className="h-3 w-3 text-green-500" />
                  <span className="truncate">{feature}</span>
                </li>
              ))}
              {plan.featuresList.length > 3 && (
                <li className="text-xs text-muted-foreground/70">
                  +{plan.featuresList.length - 3} more features
                </li>
              )}
            </ul>
          </div>
        )}

        <div className="flex gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={onEdit}
          >
            <Edit className="mr-1 h-3 w-3" />
            Edit
          </Button>
          <Button variant="outline" size="sm" onClick={onDuplicate}>
            <Copy className="h-3 w-3" />
          </Button>
          <Button variant="outline" size="sm" onClick={onDelete}>
            <Trash2 className="h-3 w-3 text-destructive" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function PlansPage() {
  const { formatAmount, currencySymbol } = useCurrency();
  const router = useRouter();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [cycleFilter, setCycleFilter] = useState<"all" | "1" | "6" | "12">(
    "all"
  );

  const loadData = async () => {
    setLoading(true);
    try {
      const [plansData, subsData] = await Promise.all([
        api.get<Plan[]>("plans"),
        api.get<any[]>("subscriptions").catch(() => []),
      ]);

      setPlans(plansData);
      setSubscriptions(subsData);
    } catch (error: any) {
      console.error("Failed to load data:", error);
      toast.error(error?.message || "Failed to load plans");
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePlan = async (planId: string, planName: string) => {
    if (
      !confirm(
        `Are you sure you want to delete "${planName}"? This cannot be undone.`
      )
    ) {
      return;
    }

    try {
      await api.delete(`plans/${planId}`);
      toast.success("Plan deleted successfully!");
      await loadData();
    } catch (error: any) {
      toast.error(error?.message || "Failed to delete plan");
    }
  };

  const handleDuplicatePlan = async (plan: Plan) => {
    try {
      await api.post("plans", {
        ...plan,
        id: undefined,
        name: `${plan.name} (Copy)`,
        isPopular: false,
      });

      toast.success("Plan duplicated successfully!");
      await loadData();
    } catch (error: any) {
      toast.error(error?.message || "Failed to duplicate plan");
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filter plans by billing cycle
  const filteredPlans = useMemo(() => {
    if (cycleFilter === "all") return plans;
    return plans.filter((p) => p.billingCycleMonths === parseInt(cycleFilter));
  }, [plans, cycleFilter]);

  // Sort plans
  const sortedPlans = useMemo(() => {
    return [...filteredPlans].sort(
      (a, b) => (a.sortOrder || 0) - (b.sortOrder || 0)
    );
  }, [filteredPlans]);

  // Stats
  const stats = useMemo(() => {
    const total = plans.length;
    const active = plans.filter((p) => p.isActive).length;
    const byMonthly = plans.filter((p) => p.billingCycleMonths === 1).length;
    const bySixMonth = plans.filter((p) => p.billingCycleMonths === 6).length;
    const byYearly = plans.filter((p) => p.billingCycleMonths === 12).length;
    const totalRevenue = subscriptions
      .filter((s) => s.status === "active")
      .reduce((sum, s) => {
        const plan = plans.find((p) => p.id === s.planId);
        return sum + (plan?.price || 0);
      }, 0);

    return { total, active, byMonthly, bySixMonth, byYearly, totalRevenue };
  }, [plans, subscriptions]);

  // Get subscription count per plan
  const getSubscriptionCount = (planId: string) => {
    return subscriptions.filter(
      (s) => s.planId === planId && s.status === "active"
    ).length;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Subscription Plans
          </h1>
          <p className="text-muted-foreground">
            Create separate plans for each billing cycle (monthly, 6-month,
            yearly)
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadData} disabled={loading}>
            <RefreshCw
              className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
          <Link href="/admin/plans/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Plan
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Total Plans
                </p>
                <p className="text-3xl font-bold">{stats.total}</p>
                <p className="text-xs text-muted-foreground">
                  {stats.active} active
                </p>
              </div>
              <div className="rounded-full bg-primary/10 p-3">
                <Layers className="h-5 w-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Monthly Plans
                </p>
                <p className="text-3xl font-bold">{stats.byMonthly}</p>
              </div>
              <div className="rounded-full bg-blue-500/10 p-3">
                <Calendar className="h-5 w-5 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  6-Month Plans
                </p>
                <p className="text-3xl font-bold">{stats.bySixMonth}</p>
              </div>
              <div className="rounded-full bg-purple-500/10 p-3">
                <Calendar className="h-5 w-5 text-purple-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Yearly Plans
                </p>
                <p className="text-3xl font-bold">{stats.byYearly}</p>
              </div>
              <div className="rounded-full bg-green-500/10 p-3">
                <Calendar className="h-5 w-5 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Active Subscribers
                </p>
                <p className="text-3xl font-bold">
                  {subscriptions.filter((s) => s.status === "active").length}
                </p>
              </div>
              <div className="rounded-full bg-green-500/10 p-3">
                <Users className="h-5 w-5 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and View Mode */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Tabs
          value={cycleFilter}
          onValueChange={(v) => setCycleFilter(v as any)}
        >
          <TabsList>
            <TabsTrigger value="all">All Plans</TabsTrigger>
            <TabsTrigger value="1" className="gap-1">
              <span className="h-2 w-2 rounded-full bg-blue-500" />
              Monthly
            </TabsTrigger>
            <TabsTrigger value="6" className="gap-1">
              <span className="h-2 w-2 rounded-full bg-purple-500" />6 Months
            </TabsTrigger>
            <TabsTrigger value="12" className="gap-1">
              <span className="h-2 w-2 rounded-full bg-green-500" />
              Yearly
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as any)}>
          <TabsList>
            <TabsTrigger value="grid" className="gap-2">
              <LayoutGrid className="h-4 w-4" />
              Cards
            </TabsTrigger>
            <TabsTrigger value="table" className="gap-2">
              <List className="h-4 w-4" />
              Table
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Content */}
      {loading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <div className="h-6 w-24 animate-pulse rounded bg-muted" />
                <div className="h-4 w-48 animate-pulse rounded bg-muted" />
              </CardHeader>
              <CardContent>
                <div className="h-10 w-32 animate-pulse rounded bg-muted" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : sortedPlans.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <CreditCard className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
            <p className="text-muted-foreground">
              {cycleFilter === "all"
                ? "No plans found"
                : `No ${getBillingLabel(parseInt(cycleFilter))} plans found`}
            </p>
            <Link href="/admin/plans/new">
              <Button className="mt-4">
                <Plus className="mr-2 h-4 w-4" />
                Create First Plan
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : viewMode === "grid" ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {sortedPlans.map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              onEdit={() => router.push(`/plans/${plan.id}/edit`)}
              onDelete={() => handleDeletePlan(plan.id, plan.name)}
              onDuplicate={() => handleDuplicatePlan(plan)}
              subscriptionCount={getSubscriptionCount(plan.id)}
              formatAmount={formatAmount}
            />
          ))}
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>All Plans</CardTitle>
            <CardDescription>
              Showing {sortedPlans.length}{" "}
              {cycleFilter === "all"
                ? ""
                : getBillingLabel(parseInt(cycleFilter)).toLowerCase()}{" "}
              plan(s)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Billing Cycle</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Features</TableHead>
                  <TableHead>Subscribers</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedPlans.map((plan) => (
                  <TableRow key={plan.id} className="group">
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{plan.name}</span>
                        {plan.isPopular && (
                          <Badge className="bg-yellow-500">
                            <Star className="mr-1 h-3 w-3" />
                            Popular
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={getBillingBadgeColor(
                          plan.billingCycleMonths
                        )}
                      >
                        {getBillingLabel(plan.billingCycleMonths)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div>
                        <span className="font-semibold">
                          {formatAmount(plan.price)}
                        </span>
                        <span className="text-xs text-muted-foreground ml-1">
                          ({formatAmount(plan.price / plan.billingCycleMonths)}
                          /mo)
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {plan.featuresList?.length || 0} features
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {getSubscriptionCount(plan.id)} active
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={plan.isActive ? "default" : "secondary"}>
                        {plan.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                        <Link href={`/plans/${plan.id}/edit`}>
                          <Button variant="ghost" size="icon">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDuplicatePlan(plan)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeletePlan(plan.id, plan.name)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
