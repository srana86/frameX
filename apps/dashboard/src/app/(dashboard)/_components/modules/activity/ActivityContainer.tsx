"use client";

import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  RefreshCw,
  Activity,
  Search,
  Filter,
  Download,
  Trash2,
  Building2,
  CreditCard,
  Layers,
  Rocket,
  Database,
  Settings,
  Calendar,
  Clock,
  User,
  Globe,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";

interface ActivityLog {
  id: string;
  type: "merchant" | "subscription" | "plan" | "deployment" | "database" | "system";
  action: string;
  entityId: string;
  entityName?: string;
  details?: Record<string, any>;
  performedBy?: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const TYPE_OPTIONS = [
  { value: "merchant", label: "Merchant", icon: Building2 },
  { value: "subscription", label: "Subscription", icon: CreditCard },
  { value: "plan", label: "Plan", icon: Layers },
  { value: "deployment", label: "Deployment", icon: Rocket },
  { value: "database", label: "Database", icon: Database },
  { value: "system", label: "System", icon: Settings },
];

function TypeIcon({ type }: { type: string }) {
  const option = TYPE_OPTIONS.find((o) => o.value === type);
  if (!option) return <Activity className='h-4 w-4' />;
  const Icon = option.icon;
  return <Icon className='h-4 w-4' />;
}

function ActionBadge({ action }: { action: string }) {
  const colors: Record<string, string> = {
    created: "bg-green-500",
    updated: "bg-blue-500",
    deleted: "bg-red-500",
    activated: "bg-green-500",
    deactivated: "bg-gray-500",
    suspended: "bg-yellow-500",
    deployed: "bg-purple-500",
    failed: "bg-red-500",
    pending: "bg-yellow-500",
    active: "bg-green-500",
  };

  return <Badge className={`${colors[action.toLowerCase()] || "bg-gray-500"} capitalize`}>{action.replace(/_/g, " ")}</Badge>;
}

export default function ActivityContainer() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({
    start: "",
    end: "",
  });

  const loadLogs = async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20",
      });

      if (typeFilter !== "all") params.append("type", typeFilter);
      if (dateRange.start) params.append("startDate", dateRange.start);
      if (dateRange.end) params.append("endDate", dateRange.end);

      const res = await fetch(`/api/activity-logs?${params}`);
      if (!res.ok) throw new Error("Failed to load activity logs");

      const data = await res.json();
      setLogs(data.logs || []);
      setPagination(data.pagination || { page: 1, limit: 20, total: 0, totalPages: 0 });
    } catch (error) {
      console.error("Failed to load activity logs:", error);
      // If the collection doesn't exist yet, show empty state
      setLogs([]);
      setPagination({ page: 1, limit: 20, total: 0, totalPages: 0 });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, [typeFilter, dateRange]);

  const filteredLogs = useMemo(() => {
    if (!searchQuery) return logs;
    const query = searchQuery.toLowerCase();
    return logs.filter(
      (log) =>
        log.entityId?.toLowerCase().includes(query) ||
        log.entityName?.toLowerCase().includes(query) ||
        log.action?.toLowerCase().includes(query) ||
        log.performedBy?.toLowerCase().includes(query)
    );
  }, [logs, searchQuery]);

  const handleClearOldLogs = async () => {
    if (!confirm("Are you sure you want to delete logs older than 90 days? This action cannot be undone.")) {
      return;
    }

    try {
      const res = await fetch("/api/activity-logs?olderThanDays=90", { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to clear logs");

      const data = await res.json();
      toast.success(`Deleted ${data.deletedCount} old logs`);
      loadLogs();
    } catch (error) {
      toast.error("Failed to clear old logs");
    }
  };

  const exportLogs = () => {
    const csvContent = [
      ["Timestamp", "Type", "Action", "Entity ID", "Entity Name", "Performed By", "IP Address"].join(","),
      ...filteredLogs.map((log) =>
        [log.createdAt, log.type, log.action, log.entityId, log.entityName || "", log.performedBy || "", log.ipAddress || ""].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `activity-logs-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Activity logs exported successfully!");
  };

  // Stats
  const stats = useMemo(() => {
    const today = new Date().toISOString().split("T")[0];
    const todayLogs = logs.filter((l) => l.createdAt?.startsWith(today));
    const byType = logs.reduce((acc, log) => {
      const type = log.type || "unknown";
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      total: pagination.total,
      today: todayLogs.length,
      byType,
    };
  }, [logs, pagination.total]);

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
        <div>
          <h1 className='text-3xl font-bold tracking-tight'>Activity Logs</h1>
          <p className='text-muted-foreground'>Track all administrative actions and system events</p>
        </div>
        <div className='flex gap-2'>
          <Button variant='outline' onClick={() => loadLogs(pagination.page)} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button variant='outline' onClick={exportLogs}>
            <Download className='h-4 w-4 mr-2' />
            Export
          </Button>
          <Button variant='destructive' onClick={handleClearOldLogs}>
            <Trash2 className='h-4 w-4 mr-2' />
            Clear Old
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
        <Card>
          <CardContent className='pt-6'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm text-muted-foreground'>Total Logs</p>
                <p className='text-2xl font-bold'>{stats.total.toLocaleString()}</p>
              </div>
              <Activity className='h-8 w-8 text-muted-foreground' />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className='pt-6'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm text-muted-foreground'>Today</p>
                <p className='text-2xl font-bold'>{stats.today}</p>
              </div>
              <Calendar className='h-8 w-8 text-muted-foreground' />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className='pt-6'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm text-muted-foreground'>Merchant Actions</p>
                <p className='text-2xl font-bold'>{stats.byType.merchant || 0}</p>
              </div>
              <Building2 className='h-8 w-8 text-muted-foreground' />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className='pt-6'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm text-muted-foreground'>Deployment Actions</p>
                <p className='text-2xl font-bold'>{stats.byType.deployment || 0}</p>
              </div>
              <Rocket className='h-8 w-8 text-muted-foreground' />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className='pt-6'>
          <div className='flex flex-col gap-4 sm:flex-row sm:items-end'>
            <div className='flex-1'>
              <Label className='text-xs text-muted-foreground'>Search</Label>
              <div className='relative mt-1'>
                <Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground' />
                <Input
                  placeholder='Search by entity, action, or user...'
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className='pl-9'
                />
              </div>
            </div>
            <div className='w-full sm:w-[150px]'>
              <Label className='text-xs text-muted-foreground'>Type</Label>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className='mt-1'>
                  <Filter className='mr-2 h-4 w-4' />
                  <SelectValue placeholder='Type' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>All Types</SelectItem>
                  {TYPE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className='w-full sm:w-[150px]'>
              <Label className='text-xs text-muted-foreground'>From</Label>
              <Input
                type='date'
                value={dateRange.start}
                onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                className='mt-1'
              />
            </div>
            <div className='w-full sm:w-[150px]'>
              <Label className='text-xs text-muted-foreground'>To</Label>
              <Input
                type='date'
                value={dateRange.end}
                onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                className='mt-1'
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle>Activity History</CardTitle>
          <CardDescription>
            Showing {filteredLogs.length} of {pagination.total} logs
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
          ) : filteredLogs.length === 0 ? (
            <div className='py-12 text-center'>
              <Activity className='mx-auto mb-4 h-12 w-12 text-muted-foreground' />
              <p className='text-muted-foreground'>{logs.length === 0 ? "No activity logs yet" : "No logs match your filters"}</p>
              <p className='mt-2 text-sm text-muted-foreground'>Activity logs are automatically recorded when actions are performed</p>
            </div>
          ) : (
            <>
              <div className='overflow-x-auto'>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Timestamp</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Entity</TableHead>
                      <TableHead>Performed By</TableHead>
                      <TableHead>IP Address</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLogs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell>
                          <div className='flex items-center gap-2 text-sm'>
                            <Clock className='h-4 w-4 text-muted-foreground' />
                            <div>
                              <p>{new Date(log.createdAt).toLocaleDateString()}</p>
                              <p className='text-xs text-muted-foreground'>{new Date(log.createdAt).toLocaleTimeString()}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className='flex items-center gap-2'>
                            <TypeIcon type={log.type} />
                            <span className='capitalize'>{log.type}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <ActionBadge action={log.action} />
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className='font-medium'>{log.entityName || log.entityId}</p>
                            {log.entityName && <p className='text-xs text-muted-foreground font-mono'>{log.entityId.slice(0, 20)}...</p>}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className='flex items-center gap-2'>
                            <User className='h-4 w-4 text-muted-foreground' />
                            <span>{log.performedBy || "System"}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {log.ipAddress ? (
                            <div className='flex items-center gap-2'>
                              <Globe className='h-4 w-4 text-muted-foreground' />
                              <span className='font-mono text-sm'>{log.ipAddress}</span>
                            </div>
                          ) : (
                            <span className='text-muted-foreground'>—</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className='mt-4 flex items-center justify-between'>
                  <p className='text-sm text-muted-foreground'>
                    Page {pagination.page} of {pagination.totalPages}
                  </p>
                  <div className='flex gap-2'>
                    <Button
                      variant='outline'
                      size='sm'
                      onClick={() => loadLogs(pagination.page - 1)}
                      disabled={pagination.page <= 1 || loading}
                    >
                      <ChevronLeft className='h-4 w-4' />
                      Previous
                    </Button>
                    <Button
                      variant='outline'
                      size='sm'
                      onClick={() => loadLogs(pagination.page + 1)}
                      disabled={pagination.page >= pagination.totalPages || loading}
                    >
                      Next
                      <ChevronRight className='h-4 w-4' />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
