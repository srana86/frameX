"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { RefreshCw, Search, Inbox, Mail, Phone, Filter } from "lucide-react";
import Link from "next/link";
import { useTransition } from "react";
import { cn } from "@/utils";

type FeatureRequestStatus = "new" | "in_review" | "resolved";
type FeatureRequestPriority = "low" | "medium" | "high";

interface FeatureRequest {
  id: string;
  title: string;
  description: string;
  priority: FeatureRequestPriority;
  contactEmail?: string;
  contactPhone?: string;
  merchantId: string;
  status: FeatureRequestStatus;
  createdAt: string;
}

export default function FeatureRequestsPage() {
  const [requests, setRequests] = useState<FeatureRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<FeatureRequestStatus | "all">("all");
  const [priorityFilter, setPriorityFilter] = useState<FeatureRequestPriority | "all">("all");
  const [search, setSearch] = useState("");
  const [pending, startTransition] = useTransition();

  const loadRequests = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/feature-requests");
      if (!res.ok) throw new Error("Failed to load feature requests");
      const data = await res.json();
      setRequests(data.data || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const updateRequest = async (id: string, patch: Partial<Pick<FeatureRequest, "status" | "priority">>) => {
    startTransition(async () => {
      try {
        const res = await fetch("/api/feature-requests", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id, ...patch }),
        });
        if (!res.ok) throw new Error("Failed to update");
        const data = await res.json();
        setRequests((prev) => prev.map((r) => (r.id === id ? { ...r, ...data.data } : r)));
      } catch (error) {
        console.error(error);
      }
    });
  };

  const filteredRequests = useMemo(() => {
    return requests.filter((r) => {
      const matchesStatus = statusFilter === "all" || r.status === statusFilter;
      const matchesPriority = priorityFilter === "all" || r.priority === priorityFilter;
      const q = search.toLowerCase();
      const matchesSearch =
        q === "" ||
        r.title.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q) ||
        r.merchantId.toLowerCase().includes(q) ||
        (r.contactEmail || "").toLowerCase().includes(q) ||
        (r.contactPhone || "").toLowerCase().includes(q);
      return matchesStatus && matchesPriority && matchesSearch;
    });
  }, [requests, statusFilter, priorityFilter, search]);

  const getStatusBadge = (status: FeatureRequestStatus) => {
    const map: Record<FeatureRequestStatus, string> = {
      new: "bg-blue-100 text-blue-800",
      in_review: "bg-amber-100 text-amber-800",
      resolved: "bg-green-100 text-green-800",
    };
    return <Badge className={cn("capitalize", map[status])}>{status.replace("_", " ")}</Badge>;
  };

  const getPriorityBadge = (priority: FeatureRequestPriority) => {
    const map: Record<FeatureRequestPriority, string> = {
      low: "bg-slate-100 text-slate-800",
      medium: "bg-amber-100 text-amber-800",
      high: "bg-red-100 text-red-800",
    };
    return <Badge className={cn("capitalize", map[priority])}>{priority}</Badge>;
  };

  return (
    <div className='space-y-6'>
      <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
        <div>
          <h1 className='text-3xl font-bold tracking-tight'>Feature Requests</h1>
          <p className='text-muted-foreground'>Merchant-submitted requests from the support portal.</p>
        </div>
        <Button variant='outline' onClick={loadRequests} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      <Card>
        <CardContent className='pt-6 space-y-4'>
          <div className='flex flex-col gap-3 sm:flex-row sm:items-center'>
            <div className='relative flex-1'>
              <Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground' />
              <Input
                placeholder='Search by title, description, merchant, or contact...'
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className='pl-9'
              />
            </div>
            <div className='flex gap-2'>
              <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as FeatureRequestStatus | "all")}>
                <SelectTrigger className='w-[160px]'>
                  <Filter className='mr-2 h-4 w-4' />
                  <SelectValue placeholder='Status' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>All Statuses</SelectItem>
                  <SelectItem value='new'>New</SelectItem>
                  <SelectItem value='in_review'>In Review</SelectItem>
                  <SelectItem value='resolved'>Resolved</SelectItem>
                </SelectContent>
              </Select>

              <Select value={priorityFilter} onValueChange={(v) => setPriorityFilter(v as FeatureRequestPriority | "all")}>
                <SelectTrigger className='w-[160px]'>
                  <Filter className='mr-2 h-4 w-4' />
                  <SelectValue placeholder='Priority' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>All Priorities</SelectItem>
                  <SelectItem value='high'>High</SelectItem>
                  <SelectItem value='medium'>Medium</SelectItem>
                  <SelectItem value='low'>Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Card className='border-dashed'>
            <CardHeader>
              <CardTitle>Requests</CardTitle>
              <CardDescription>
                Showing {filteredRequests.length} of {requests.length} requests
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className='space-y-3'>
                  {[1, 2, 3].map((i) => (
                    <div key={i} className='h-12 w-full animate-pulse rounded bg-muted' />
                  ))}
                </div>
              ) : filteredRequests.length === 0 ? (
                <div className='py-12 text-center text-muted-foreground space-y-3'>
                  <Inbox className='mx-auto h-10 w-10' />
                  <p>No requests found.</p>
                </div>
              ) : (
                <div className='overflow-x-auto'>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Title</TableHead>
                        <TableHead>Merchant</TableHead>
                        <TableHead>Priority</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Contact</TableHead>
                        <TableHead>Created</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredRequests.map((req) => (
                        <TableRow key={req.id} className='align-top hover:bg-accent/30 transition-colors'>
                          <TableCell className='space-y-1'>
                            <Link href={`/feature-requests/${req.id}`} className='font-semibold text-foreground hover:text-primary'>
                              {req.title}
                            </Link>
                            <p className='text-sm text-muted-foreground line-clamp-2'>{req.description}</p>
                          </TableCell>
                          <TableCell className='font-mono text-xs text-muted-foreground'>{req.merchantId}</TableCell>
                          <TableCell>
                            <Select
                              value={req.priority}
                              onValueChange={(value) => updateRequest(req.id, { priority: value as FeatureRequestPriority })}
                              disabled={pending}
                            >
                              <SelectTrigger className='w-[130px]'>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value='high'>High</SelectItem>
                                <SelectItem value='medium'>Medium</SelectItem>
                                <SelectItem value='low'>Low</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            <Select
                              value={req.status}
                              onValueChange={(value) => updateRequest(req.id, { status: value as FeatureRequestStatus })}
                              disabled={pending}
                            >
                              <SelectTrigger className='w-[150px]'>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value='new'>New</SelectItem>
                                <SelectItem value='in_review'>In Review</SelectItem>
                                <SelectItem value='resolved'>Resolved</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell className='space-y-1 text-sm text-muted-foreground'>
                            {req.contactEmail && (
                              <div className='flex items-center gap-1'>
                                <Mail className='h-4 w-4' />
                                <span>{req.contactEmail}</span>
                              </div>
                            )}
                            {req.contactPhone && (
                              <div className='flex items-center gap-1'>
                                <Phone className='h-4 w-4' />
                                <span>{req.contactPhone}</span>
                              </div>
                            )}
                            {!req.contactEmail && !req.contactPhone && <span className='text-xs'>No contact info</span>}
                          </TableCell>
                          <TableCell className='text-sm text-muted-foreground'>{new Date(req.createdAt).toLocaleString()}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  );
}
