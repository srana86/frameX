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
  Rocket,
  RefreshCw,
  ExternalLink,
  Globe,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  Search,
  Filter,
  Download,
  Eye,
  Activity,
  Server,
  Zap,
  TrendingUp,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import type { MerchantDeployment } from "@/lib/types";
import { api } from "@/lib/api-client";

const CHART_COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

const STATUS_OPTIONS = [
  {
    value: "active",
    label: "Active",
    color: "bg-green-500",
    icon: CheckCircle2,
  },
  { value: "pending", label: "Pending", color: "bg-yellow-500", icon: Clock },
  { value: "failed", label: "Failed", color: "bg-red-500", icon: XCircle },
  {
    value: "inactive",
    label: "Inactive",
    color: "bg-gray-500",
    icon: AlertTriangle,
  },
];

function StatCard({
  title,
  value,
  icon: Icon,
  color,
  description,
}: {
  title: string;
  value: number | string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  description?: string;
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
          </div>
          <div className={`rounded-full p-3 ${color}`}>
            <Icon className="h-5 w-5 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function DeploymentHealthIndicator({ status }: { status: string }) {
  const config =
    STATUS_OPTIONS.find((s) => s.value === status) || STATUS_OPTIONS[3];
  const Icon = config.icon;

  return (
    <div className="flex items-center gap-2">
      <div className={`h-2 w-2 rounded-full ${config.color}`} />
      <Icon
        className={`h-4 w-4 ${
          status === "active"
            ? "text-green-500"
            : status === "pending"
            ? "text-yellow-500"
            : status === "failed"
            ? "text-red-500"
            : "text-gray-500"
        }`}
      />
    </div>
  );
}

export default function DeploymentsPage() {
  const [deployments, setDeployments] = useState<MerchantDeployment[]>([]);
  const [merchants, setMerchants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [viewingDeployment, setViewingDeployment] =
    useState<MerchantDeployment | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [deploymentsData, merchantsData] = await Promise.all([
        api.get<MerchantDeployment[]>("deployments"),
        api.get<any[]>("merchants").catch(() => []),
      ]);

      setDeployments(deploymentsData);
      setMerchants(merchantsData);
    } catch (error: any) {
      console.error("Failed to load data:", error);
      toast.error(error?.message || "Failed to load deployments");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Get merchant name by ID
  const getMerchantName = (merchantId: string) => {
    const merchant = merchants.find((m) => m.id === merchantId);
    return merchant?.name || merchantId;
  };

  // Stats
  const stats = useMemo(() => {
    const total = deployments.length;
    const active = deployments.filter(
      (d) => d.deploymentStatus === "active"
    ).length;
    const pending = deployments.filter(
      (d) => d.deploymentStatus === "pending"
    ).length;
    const failed = deployments.filter(
      (d) => d.deploymentStatus === "failed"
    ).length;
    const customDomains = deployments.filter(
      (d) => d.deploymentType === "custom_domain"
    ).length;
    const subdomains = deployments.filter(
      (d) => d.deploymentType === "subdomain"
    ).length;

    const uptime = total > 0 ? ((active / total) * 100).toFixed(1) : "0";

    return {
      total,
      active,
      pending,
      failed,
      customDomains,
      subdomains,
      uptime,
    };
  }, [deployments]);

  // Filtered deployments
  const filteredDeployments = useMemo(() => {
    return deployments.filter((deployment) => {
      const merchantName = getMerchantName(deployment.merchantId);
      const matchesSearch =
        searchQuery === "" ||
        merchantName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        deployment.deploymentUrl
          ?.toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        deployment.merchantId.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus =
        statusFilter === "all" || deployment.deploymentStatus === statusFilter;
      const matchesType =
        typeFilter === "all" || deployment.deploymentType === typeFilter;

      return matchesSearch && matchesStatus && matchesType;
    });
  }, [deployments, searchQuery, statusFilter, typeFilter, merchants]);

  // Status distribution for pie chart
  const statusDistribution = useMemo(() => {
    const counts: Record<string, number> = {};
    deployments.forEach((d) => {
      counts[d.deploymentStatus] = (counts[d.deploymentStatus] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [deployments]);

  // Deployment type distribution
  const typeDistribution = useMemo(() => {
    const counts: Record<string, number> = {};
    deployments.forEach((d) => {
      const type =
        d.deploymentType === "custom_domain" ? "Custom Domain" : "Subdomain";
      counts[type] = (counts[type] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [deployments]);

  // Provider distribution
  const providerDistribution = useMemo(() => {
    const counts: Record<string, number> = {};
    deployments.forEach((d) => {
      const provider = d.deploymentProvider || "Unknown";
      counts[provider] = (counts[provider] || 0) + 1;
    });
    return Object.entries(counts).map(([name, count]) => ({ name, count }));
  }, [deployments]);

  const handleViewDeployment = (deployment: MerchantDeployment) => {
    setViewingDeployment(deployment);
    setShowViewDialog(true);
  };

  const exportDeployments = () => {
    const csvContent = [
      ["Merchant", "URL", "Type", "Status", "Provider", "Created At"].join(","),
      ...filteredDeployments.map((d) =>
        [
          getMerchantName(d.merchantId),
          d.deploymentUrl || "",
          d.deploymentType,
          d.deploymentStatus,
          d.deploymentProvider || "",
          d.createdAt || "",
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `deployments-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Deployments exported successfully!");
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return (
          <Badge className="bg-green-500 hover:bg-green-600">Active</Badge>
        );
      case "pending":
        return (
          <Badge className="bg-yellow-500 hover:bg-yellow-600">Pending</Badge>
        );
      case "failed":
        return <Badge variant="destructive">Failed</Badge>;
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
          <h1 className="text-3xl font-bold tracking-tight">Deployments</h1>
          <p className="text-muted-foreground">
            Monitor deployment health, status, and infrastructure
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadData} disabled={loading}>
            <RefreshCw
              className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
          <Button variant="outline" onClick={exportDeployments}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Link href="/admin/simulate">
            <Button>
              <Zap className="h-4 w-4 mr-2" />
              New Deployment
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Deployments"
          value={stats.total}
          icon={Server}
          color="bg-primary"
          description={`${stats.active} active`}
        />
        <StatCard
          title="Uptime Rate"
          value={`${stats.uptime}%`}
          icon={Activity}
          color="bg-green-500"
          description="Active deployments"
        />
        <StatCard
          title="Custom Domains"
          value={stats.customDomains}
          icon={Globe}
          color="bg-blue-500"
          description={`${stats.subdomains} subdomains`}
        />
        <StatCard
          title="Pending/Failed"
          value={stats.pending + stats.failed}
          icon={AlertTriangle}
          color={
            stats.pending + stats.failed > 0 ? "bg-yellow-500" : "bg-gray-400"
          }
          description={`${stats.pending} pending, ${stats.failed} failed`}
        />
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Status Distribution
            </CardTitle>
            <CardDescription>Deployment health overview</CardDescription>
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
                    {statusDistribution.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={
                          entry.name === "active"
                            ? "#22c55e"
                            : entry.name === "pending"
                            ? "#eab308"
                            : entry.name === "failed"
                            ? "#ef4444"
                            : "#6b7280"
                        }
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-[200px] flex-col items-center justify-center text-muted-foreground">
                <Rocket className="mb-2 h-12 w-12 opacity-50" />
                <p>No deployment data</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Provider Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Server className="h-5 w-5" />
              Deployments by Provider
            </CardTitle>
            <CardDescription>Infrastructure distribution</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex h-[200px] items-center justify-center">
                <div className="h-full w-full animate-pulse rounded bg-muted" />
              </div>
            ) : providerDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={providerDistribution}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    className="stroke-muted"
                  />
                  <XAxis dataKey="name" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Bar
                    dataKey="count"
                    fill="hsl(var(--primary))"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-[200px] flex-col items-center justify-center text-muted-foreground">
                <Server className="mb-2 h-12 w-12 opacity-50" />
                <p>No provider data</p>
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
                placeholder="Search by merchant, URL, or ID..."
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
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="subdomain">Subdomain</SelectItem>
                  <SelectItem value="custom_domain">Custom Domain</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Deployments Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Deployments</CardTitle>
          <CardDescription>
            Showing {filteredDeployments.length} of {deployments.length}{" "}
            deployments
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
          ) : filteredDeployments.length === 0 ? (
            <div className="py-12 text-center">
              <Rocket className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
              <p className="text-muted-foreground">
                {deployments.length === 0
                  ? "No deployments found"
                  : "No deployments match your filters"}
              </p>
              {deployments.length === 0 && (
                <Link href="/admin/simulate">
                  <Button className="mt-4">
                    <Zap className="mr-2 h-4 w-4" />
                    Create First Deployment
                  </Button>
                </Link>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Health</TableHead>
                    <TableHead>Merchant</TableHead>
                    <TableHead>URL</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Provider</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDeployments.map((deployment) => (
                    <TableRow key={deployment.id} className="group">
                      <TableCell>
                        <DeploymentHealthIndicator
                          status={deployment.deploymentStatus}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 font-semibold text-primary">
                            {getMerchantName(deployment.merchantId)
                              .charAt(0)
                              .toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium">
                              {getMerchantName(deployment.merchantId)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              ID: {deployment.merchantId.slice(0, 12)}...
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {deployment.deploymentUrl ? (
                          <a
                            href={`https://${deployment.deploymentUrl}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-sm text-primary hover:underline"
                          >
                            <ExternalLink className="h-3 w-3" />
                            {deployment.deploymentUrl.length > 30
                              ? `${deployment.deploymentUrl.slice(0, 30)}...`
                              : deployment.deploymentUrl}
                          </a>
                        ) : (
                          <span className="text-sm text-muted-foreground">
                            Not available
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="gap-1">
                          {deployment.deploymentType === "custom_domain" ? (
                            <>
                              <Globe className="h-3 w-3" />
                              Custom
                            </>
                          ) : (
                            "Subdomain"
                          )}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(deployment.deploymentStatus)}
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">
                          {deployment.deploymentProvider || "N/A"}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleViewDeployment(deployment)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {deployment.deploymentUrl && (
                            <a
                              href={`https://${deployment.deploymentUrl}`}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <Button variant="ghost" size="icon">
                                <ExternalLink className="h-4 w-4" />
                              </Button>
                            </a>
                          )}
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
            <DialogTitle>Deployment Details</DialogTitle>
            <DialogDescription>
              Complete deployment information
            </DialogDescription>
          </DialogHeader>
          {viewingDeployment && (
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-2xl font-bold text-primary">
                  {getMerchantName(viewingDeployment.merchantId)
                    .charAt(0)
                    .toUpperCase()}
                </div>
                <div>
                  <h3 className="text-xl font-semibold">
                    {getMerchantName(viewingDeployment.merchantId)}
                  </h3>
                  <p className="text-muted-foreground">
                    {viewingDeployment.deploymentUrl || "No URL"}
                  </p>
                </div>
                {getStatusBadge(viewingDeployment.deploymentStatus)}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">
                    Deployment ID
                  </Label>
                  <p className="font-mono text-sm">{viewingDeployment.id}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">
                    Merchant ID
                  </Label>
                  <p className="font-mono text-sm">
                    {viewingDeployment.merchantId}
                  </p>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Type</Label>
                  <div className="flex items-center gap-2">
                    {viewingDeployment.deploymentType === "custom_domain" ? (
                      <Globe className="h-4 w-4 text-blue-500" />
                    ) : (
                      <Server className="h-4 w-4" />
                    )}
                    <span className="capitalize">
                      {viewingDeployment.deploymentType.replace("_", " ")}
                    </span>
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">
                    Provider
                  </Label>
                  <p>
                    {viewingDeployment.deploymentProvider || "Not specified"}
                  </p>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">
                    Deployment URL
                  </Label>
                  {viewingDeployment.deploymentUrl ? (
                    <a
                      href={`https://${viewingDeployment.deploymentUrl}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-sm text-primary hover:underline"
                    >
                      {viewingDeployment.deploymentUrl}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Not available
                    </p>
                  )}
                </div>
                {viewingDeployment.createdAt && (
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">
                      Created At
                    </Label>
                    <p className="text-sm">
                      {new Date(viewingDeployment.createdAt).toLocaleString()}
                    </p>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2">
                {viewingDeployment.deploymentUrl && (
                  <a
                    href={`https://${viewingDeployment.deploymentUrl}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button variant="outline">
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Visit Site
                    </Button>
                  </a>
                )}
                <Button onClick={() => setShowViewDialog(false)}>Close</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
