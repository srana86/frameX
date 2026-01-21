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
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Database,
  RefreshCw,
  HardDrive,
  Calendar,
  Search,
  Download,
  Eye,
  Activity,
  Server,
  Layers,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
} from "lucide-react";
import { toast } from "sonner";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { api } from "@/lib/api-client";

interface DatabaseInfo {
  name: string;
  sizeOnDisk: number;
  empty: boolean;
  tenantId: string | null;
  createdAt: string | null;
  connectionString: string | null;
}

const CHART_COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

function StatCard({
  title,
  value,
  icon: Icon,
  color,
  description,
  trend,
}: {
  title: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  description?: string;
  trend?: string;
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
            {trend && (
              <div className="flex items-center gap-1 text-xs text-green-600">
                <TrendingUp className="h-3 w-3" />
                {trend}
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

function StorageUsageBar({
  used,
  total,
  label,
}: {
  used: number;
  total: number;
  label: string;
}) {
  const percentage = total > 0 ? (used / total) * 100 : 0;
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium">{label}</span>
        <span className="text-muted-foreground">
          {formatBytes(used)} / {formatBytes(total)}
        </span>
      </div>
      <Progress value={percentage} className="h-2" />
      <p className="text-xs text-muted-foreground text-right">
        {percentage.toFixed(1)}% used
      </p>
    </div>
  );
}

export default function DatabasePage() {
  const [databases, setDatabases] = useState<DatabaseInfo[]>([]);
  const [tenants, setTenants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [viewingDatabase, setViewingDatabase] = useState<DatabaseInfo | null>(
    null
  );

  const loadData = async () => {
    setLoading(true);
    try {
      const [dbData, tenantsData] = await Promise.all([
        api.get<any[]>("databases"),
        api.get<any[]>("tenants").catch(() => []),
      ]);

      setDatabases(dbData);
      setTenants(tenantsData);
    } catch (error: any) {
      console.error("Failed to load data:", error);
      toast.error(error?.message || "Failed to load databases");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
  };

  // Get tenant name by ID
  const getTenantName = (tenantId: string | null) => {
    if (!tenantId) return null;
    const tenant = tenants.find((m) => m.id === tenantId);
    return tenant?.name || tenantId;
  };

  // Stats
  const stats = useMemo(() => {
    const tenantDatabases = databases.filter((db) => db.tenantId);
    const systemDatabases = databases.filter((db) => !db.tenantId);
    const totalSize = databases.reduce((sum, db) => sum + db.sizeOnDisk, 0);
    const tenantSize = tenantDatabases.reduce(
      (sum, db) => sum + db.sizeOnDisk,
      0
    );
    const activeDatabases = databases.filter((db) => !db.empty).length;
    const emptyDatabases = databases.filter((db) => db.empty).length;
    const avgSize =
      tenantDatabases.length > 0
        ? tenantSize / tenantDatabases.length
        : 0;

    return {
      total: databases.length,
      tenantCount: tenantDatabases.length,
      systemCount: systemDatabases.length,
      totalSize,
      tenantSize,
      activeDatabases,
      emptyDatabases,
      avgSize,
    };
  }, [databases]);

  // Filtered databases
  const filteredDatabases = useMemo(() => {
    const tenantDatabases = databases.filter((db) => db.tenantId);
    if (searchQuery === "") return tenantDatabases;

    return tenantDatabases.filter((db) => {
      const tenantName = getTenantName(db.tenantId);
      return (
        db.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        db.tenantId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tenantName?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    });
  }, [databases, searchQuery, tenants]);

  // System databases
  const systemDatabases = useMemo(() => {
    return databases.filter((db) => !db.tenantId);
  }, [databases]);

  // Top databases by size
  const topDatabasesBySize = useMemo(() => {
    return [...databases]
      .filter((db) => db.tenantId)
      .sort((a, b) => b.sizeOnDisk - a.sizeOnDisk)
      .slice(0, 5)
      .map((db) => ({
        name: getTenantName(db.tenantId) || db.name,
        size: db.sizeOnDisk,
      }));
  }, [databases, tenants]);

  // Status distribution
  const statusDistribution = useMemo(() => {
    const active = databases.filter((db) => !db.empty && db.tenantId).length;
    const empty = databases.filter((db) => db.empty && db.tenantId).length;
    const system = databases.filter((db) => !db.tenantId).length;

    return [
      { name: "Active", value: active },
      { name: "Empty", value: empty },
      { name: "System", value: system },
    ].filter((item) => item.value > 0);
  }, [databases]);

  const handleViewDatabase = (db: DatabaseInfo) => {
    setViewingDatabase(db);
    setShowViewDialog(true);
  };

  const exportDatabases = () => {
    const csvContent = [
      ["Name", "Tenant", "Size", "Status", "Created At"].join(","),
      ...filteredDatabases.map((db) =>
        [
          db.name,
          getTenantName(db.tenantId) || db.tenantId || "",
          formatBytes(db.sizeOnDisk),
          db.empty ? "Empty" : "Active",
          db.createdAt || "",
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `databases-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Databases exported successfully!");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Database Management
          </h1>
          <p className="text-muted-foreground">
            Monitor storage usage, database health, and tenant data
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadData} disabled={loading}>
            <RefreshCw
              className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
          <Button variant="outline" onClick={exportDatabases}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Databases"
          value={stats.total}
          icon={Database}
          color="bg-primary"
          description={`${stats.tenantCount} tenant, ${stats.systemCount} system`}
        />
        <StatCard
          title="Total Storage"
          value={formatBytes(stats.totalSize)}
          icon={HardDrive}
          color="bg-blue-500"
          description={`${formatBytes(stats.tenantSize)} tenant data`}
        />
        <StatCard
          title="Active Databases"
          value={stats.activeDatabases}
          icon={Activity}
          color="bg-green-500"
          description={`${stats.emptyDatabases} empty`}
        />
        <StatCard
          title="Avg. Database Size"
          value={formatBytes(stats.avgSize)}
          icon={Layers}
          color="bg-purple-500"
          description="Per tenant database"
        />
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Top Databases by Size */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HardDrive className="h-5 w-5" />
              Top Databases by Size
            </CardTitle>
            <CardDescription>Largest tenant databases</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex h-[200px] items-center justify-center">
                <div className="h-full w-full animate-pulse rounded bg-muted" />
              </div>
            ) : topDatabasesBySize.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={topDatabasesBySize} layout="vertical">
                  <CartesianGrid
                    strokeDasharray="3 3"
                    className="stroke-muted"
                  />
                  <XAxis
                    type="number"
                    className="text-xs"
                    tickFormatter={(v) => formatBytes(v)}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    className="text-xs"
                    width={100}
                  />
                  <Tooltip
                    formatter={(value) => [formatBytes(Number(value) || 0), "Size"]}
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Bar
                    dataKey="size"
                    fill="hsl(var(--primary))"
                    radius={[0, 4, 4, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-[200px] flex-col items-center justify-center text-muted-foreground">
                <Database className="mb-2 h-12 w-12 opacity-50" />
                <p>No database data</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Database Status
            </CardTitle>
            <CardDescription>Distribution by status</CardDescription>
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
                    label={({
                      name,
                      percent,
                    }: {
                      name?: string;
                      percent?: number;
                    }) => `${name || ""} ${((percent ?? 0) * 100).toFixed(0)}%`}
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
                <Database className="mb-2 h-12 w-12 opacity-50" />
                <p>No database data</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Storage Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Storage Overview</CardTitle>
          <CardDescription>Database storage allocation</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <StorageUsageBar
            used={stats.tenantSize}
            total={stats.totalSize}
            label="Tenant Data"
          />
          <StorageUsageBar
            used={stats.totalSize - stats.tenantSize}
            total={stats.totalSize}
            label="System Data"
          />
        </CardContent>
      </Card>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by database name, tenant name, or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardContent>
      </Card>

      {/* Tenant Databases Table */}
      <Card>
        <CardHeader>
          <CardTitle>Tenant Databases</CardTitle>
          <CardDescription>
            Showing {filteredDatabases.length} of{" "}
            {databases.filter((db) => db.tenantId).length} tenant databases
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
          ) : filteredDatabases.length === 0 ? (
            <div className="py-12 text-center">
              <Database className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
              <p className="text-muted-foreground">
                No tenant databases found
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Database</TableHead>
                    <TableHead>Tenant</TableHead>
                    <TableHead>Size</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDatabases.map((db) => (
                    <TableRow key={db.name} className="group">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                            <Database className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-mono text-sm font-medium">
                              {db.name}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">
                            {getTenantName(db.tenantId) || "Unknown"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {db.tenantId?.slice(0, 12)}...
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <HardDrive className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">
                            {formatBytes(db.sizeOnDisk)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={db.empty ? "secondary" : "default"}
                          className={db.empty ? "" : "bg-green-500"}
                        >
                          {db.empty ? (
                            <>
                              <AlertTriangle className="mr-1 h-3 w-3" />
                              Empty
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="mr-1 h-3 w-3" />
                              Active
                            </>
                          )}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          {db.createdAt
                            ? new Date(db.createdAt).toLocaleDateString()
                            : "N/A"}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleViewDatabase(db)}
                          >
                            <Eye className="h-4 w-4" />
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

      {/* System Databases */}
      {systemDatabases.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Server className="h-5 w-5" />
              System Databases
            </CardTitle>
            <CardDescription>
              Internal system and infrastructure databases
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Database Name</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {systemDatabases.map((db) => (
                  <TableRow key={db.name}>
                    <TableCell className="font-mono text-sm">
                      {db.name}
                    </TableCell>
                    <TableCell>{formatBytes(db.sizeOnDisk)}</TableCell>
                    <TableCell>
                      <Badge variant={db.empty ? "secondary" : "default"}>
                        {db.empty ? "Empty" : "Active"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* View Dialog */}
      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Database Details</DialogTitle>
            <DialogDescription>Complete database information</DialogDescription>
          </DialogHeader>
          {viewingDatabase && (
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-primary/10">
                  <Database className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold font-mono">
                    {viewingDatabase.name}
                  </h3>
                  <p className="text-muted-foreground">
                    {getTenantName(viewingDatabase.tenantId) ||
                      "System Database"}
                  </p>
                </div>
                <Badge
                  variant={viewingDatabase.empty ? "secondary" : "default"}
                  className={viewingDatabase.empty ? "" : "bg-green-500"}
                >
                  {viewingDatabase.empty ? "Empty" : "Active"}
                </Badge>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">
                    Database Name
                  </Label>
                  <p className="font-mono text-sm">{viewingDatabase.name}</p>
                </div>
                {viewingDatabase.tenantId && (
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">
                      Tenant ID
                    </Label>
                    <p className="font-mono text-sm">
                      {viewingDatabase.tenantId}
                    </p>
                  </div>
                )}
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">
                    Size on Disk
                  </Label>
                  <p className="text-lg font-semibold">
                    {formatBytes(viewingDatabase.sizeOnDisk)}
                  </p>
                </div>
                {viewingDatabase.createdAt && (
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">
                      Created At
                    </Label>
                    <p className="text-sm">
                      {new Date(viewingDatabase.createdAt).toLocaleString()}
                    </p>
                  </div>
                )}
              </div>

              {viewingDatabase.connectionString && (
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">
                    Connection String
                  </Label>
                  <div className="rounded-lg bg-muted p-3 font-mono text-xs break-all">
                    {viewingDatabase.connectionString}
                  </div>
                </div>
              )}

              <div className="flex justify-end">
                <Button onClick={() => setShowViewDialog(false)}>Close</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
