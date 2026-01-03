"use client";

import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  FileText,
  RefreshCw,
  DollarSign,
  Search,
  Filter,
  Download,
  Eye,
  CheckCircle2,
  XCircle,
  Clock,
  Send,
  Printer,
  AlertTriangle,
  Calendar,
  Receipt,
} from "lucide-react";
import { toast } from "sonner";
import { useCurrency } from "@/contexts/SettingsContext";

interface Invoice {
  id: string;
  invoiceNumber: string;
  merchantId: string;
  merchantName: string;
  merchantEmail: string;
  subscriptionId?: string;
  planName: string;
  billingCycle: string;
  amount: number;
  currency: string;
  status: "draft" | "sent" | "paid" | "overdue" | "cancelled";
  dueDate: string;
  paidAt?: string;
  createdAt: string;
  items: {
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }[];
  notes?: string;
}

const STATUS_OPTIONS = [
  { value: "all", label: "All Statuses" },
  { value: "draft", label: "Draft" },
  { value: "sent", label: "Sent" },
  { value: "paid", label: "Paid" },
  { value: "overdue", label: "Overdue" },
  { value: "cancelled", label: "Cancelled" },
];

function StatCard({
  title,
  value,
  icon: Icon,
  color,
  description,
}: {
  title: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  description?: string;
}) {
  return (
    <Card>
      <CardContent className='pt-6'>
        <div className='flex items-center justify-between'>
          <div className='space-y-1'>
            <p className='text-sm font-medium text-muted-foreground'>{title}</p>
            <p className='text-3xl font-bold'>{value}</p>
            {description && <p className='text-xs text-muted-foreground'>{description}</p>}
          </div>
          <div className={`rounded-full p-3 ${color}`}>
            <Icon className='h-5 w-5 text-white' />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function InvoicesPage() {
  const { formatAmount, currencySymbol } = useCurrency();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [viewingInvoice, setViewingInvoice] = useState<Invoice | null>(null);
  const [showViewDialog, setShowViewDialog] = useState(false);

  // Calculate stats
  const stats = useMemo(() => {
    const total = invoices.length;
    const paid = invoices.filter((i) => i.status === "paid").length;
    const pending = invoices.filter((i) => i.status === "sent" || i.status === "draft").length;
    const overdue = invoices.filter((i) => i.status === "overdue").length;

    const totalPaid = invoices.filter((i) => i.status === "paid").reduce((sum, i) => sum + i.amount, 0);

    const totalPending = invoices.filter((i) => i.status === "sent" || i.status === "draft").reduce((sum, i) => sum + i.amount, 0);

    const totalOverdue = invoices.filter((i) => i.status === "overdue").reduce((sum, i) => sum + i.amount, 0);

    return {
      total,
      paid,
      pending,
      overdue,
      totalPaid,
      totalPending,
      totalOverdue,
    };
  }, [invoices]);

  // Filtered invoices
  const filteredInvoices = useMemo(() => {
    return invoices.filter((i) => {
      const matchesSearch =
        searchQuery === "" ||
        i.merchantName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        i.merchantEmail?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        i.invoiceNumber?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = statusFilter === "all" || i.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [invoices, searchQuery, statusFilter]);

  const loadInvoices = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/invoices");
      if (!res.ok) throw new Error("Failed to load invoices");
      const data = await res.json();
      setInvoices(data);
    } catch (error) {
      console.error("Failed to load invoices:", error);
      toast.error("Failed to load invoices");
    } finally {
      setLoading(false);
    }
  };

  const handleViewInvoice = (invoice: Invoice) => {
    setViewingInvoice(invoice);
    setShowViewDialog(true);
  };

  const handleSendInvoice = async (invoiceId: string) => {
    try {
      const res = await fetch(`/api/invoices/${invoiceId}/send`, {
        method: "POST",
      });

      if (!res.ok) throw new Error("Failed to send invoice");

      toast.success("Invoice sent successfully!");
      await loadInvoices();
    } catch (error: any) {
      toast.error(error.message || "Failed to send invoice");
    }
  };

  const handleMarkAsPaid = async (invoiceId: string) => {
    try {
      const res = await fetch(`/api/invoices/${invoiceId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "paid", paidAt: new Date().toISOString() }),
      });

      if (!res.ok) throw new Error("Failed to update invoice");

      toast.success("Invoice marked as paid!");
      await loadInvoices();
    } catch (error: any) {
      toast.error(error.message || "Failed to update invoice");
    }
  };

  const exportInvoices = () => {
    const csvContent = [
      ["Invoice #", "Merchant", "Email", "Amount", "Status", "Due Date", "Paid Date"].join(","),
      ...filteredInvoices.map((i) =>
        [
          i.invoiceNumber,
          i.merchantName,
          i.merchantEmail,
          i.amount,
          i.status,
          new Date(i.dueDate).toLocaleDateString(),
          i.paidAt ? new Date(i.paidAt).toLocaleDateString() : "",
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `invoices-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Invoices exported successfully!");
  };

  useEffect(() => {
    loadInvoices();
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "paid":
        return (
          <Badge className='bg-green-500 hover:bg-green-600'>
            <CheckCircle2 className='mr-1 h-3 w-3' />
            Paid
          </Badge>
        );
      case "sent":
        return (
          <Badge className='bg-blue-500 hover:bg-blue-600'>
            <Send className='mr-1 h-3 w-3' />
            Sent
          </Badge>
        );
      case "draft":
        return (
          <Badge variant='secondary'>
            <FileText className='mr-1 h-3 w-3' />
            Draft
          </Badge>
        );
      case "overdue":
        return (
          <Badge variant='destructive'>
            <AlertTriangle className='mr-1 h-3 w-3' />
            Overdue
          </Badge>
        );
      case "cancelled":
        return (
          <Badge variant='outline'>
            <XCircle className='mr-1 h-3 w-3' />
            Cancelled
          </Badge>
        );
      default:
        return <Badge variant='outline'>{status}</Badge>;
    }
  };

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
        <div>
          <h1 className='text-3xl font-bold tracking-tight'>Invoices</h1>
          <p className='text-muted-foreground'>Manage and track subscription invoices</p>
        </div>
        <div className='flex gap-2'>
          <Button variant='outline' onClick={loadInvoices} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button variant='outline' onClick={exportInvoices}>
            <Download className='h-4 w-4 mr-2' />
            Export
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
        <StatCard
          title='Total Collected'
          value={formatAmount(stats.totalPaid)}
          icon={DollarSign}
          color='bg-green-500'
          description={`${stats.paid} paid invoices`}
        />
        <StatCard
          title='Pending Amount'
          value={formatAmount(stats.totalPending)}
          icon={Clock}
          color='bg-blue-500'
          description={`${stats.pending} pending invoices`}
        />
        <StatCard
          title='Overdue Amount'
          value={formatAmount(stats.totalOverdue)}
          icon={AlertTriangle}
          color='bg-red-500'
          description={`${stats.overdue} overdue invoices`}
        />
        <StatCard title='Total Invoices' value={stats.total} icon={FileText} color='bg-purple-500' description='All time' />
      </div>

      {/* Filters */}
      <Card>
        <CardContent className='pt-6'>
          <div className='flex flex-col gap-4 sm:flex-row sm:items-center'>
            <div className='relative flex-1'>
              <Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground' />
              <Input
                placeholder='Search by merchant, email, or invoice number...'
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className='pl-9'
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className='w-[180px]'>
                <Filter className='mr-2 h-4 w-4' />
                <SelectValue placeholder='Status' />
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
        </CardContent>
      </Card>

      {/* Invoices Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Invoices</CardTitle>
          <CardDescription>
            Showing {filteredInvoices.length} of {invoices.length} invoices
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
          ) : filteredInvoices.length === 0 ? (
            <div className='py-12 text-center'>
              <Receipt className='mx-auto mb-4 h-12 w-12 text-muted-foreground' />
              <p className='text-muted-foreground'>{invoices.length === 0 ? "No invoices yet" : "No invoices match your filters"}</p>
            </div>
          ) : (
            <div className='overflow-x-auto'>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice</TableHead>
                    <TableHead>Merchant</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead className='text-right'>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInvoices.map((invoice) => (
                    <TableRow key={invoice.id} className='group'>
                      <TableCell>
                        <div>
                          <p className='font-mono font-medium'>{invoice.invoiceNumber}</p>
                          <p className='text-xs text-muted-foreground'>{new Date(invoice.createdAt).toLocaleDateString()}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className='flex items-center gap-3'>
                          <div className='flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 font-semibold text-primary'>
                            {(invoice.merchantName || "?").charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className='font-medium'>{invoice.merchantName}</p>
                            <p className='text-xs text-muted-foreground'>{invoice.merchantEmail}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className='font-medium'>{invoice.planName}</p>
                          <p className='text-xs text-muted-foreground'>{invoice.billingCycle}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className='font-semibold'>{formatAmount(invoice.amount)}</span>
                      </TableCell>
                      <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                      <TableCell>
                        <div className='text-sm'>
                          <p>{new Date(invoice.dueDate).toLocaleDateString()}</p>
                          {invoice.paidAt && (
                            <p className='text-xs text-green-600'>Paid: {new Date(invoice.paidAt).toLocaleDateString()}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className='text-right'>
                        <div className='flex justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100'>
                          <Button variant='ghost' size='icon' onClick={() => handleViewInvoice(invoice)}>
                            <Eye className='h-4 w-4' />
                          </Button>
                          {invoice.status === "draft" && (
                            <Button variant='ghost' size='icon' onClick={() => handleSendInvoice(invoice.id)}>
                              <Send className='h-4 w-4' />
                            </Button>
                          )}
                          {(invoice.status === "sent" || invoice.status === "overdue") && (
                            <Button variant='ghost' size='icon' onClick={() => handleMarkAsPaid(invoice.id)}>
                              <CheckCircle2 className='h-4 w-4 text-green-500' />
                            </Button>
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

      {/* View Invoice Dialog */}
      {viewingInvoice && (
        <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
          <DialogContent className='max-w-3xl'>
            <DialogHeader>
              <DialogTitle>Invoice {viewingInvoice.invoiceNumber}</DialogTitle>
              <DialogDescription>Invoice details and line items</DialogDescription>
            </DialogHeader>
            <div className='space-y-6'>
              {/* Invoice Header */}
              <div className='flex items-start justify-between'>
                <div>
                  <h3 className='text-lg font-semibold'>FrameX Super Admin</h3>
                  <p className='text-sm text-muted-foreground'>Invoice #{viewingInvoice.invoiceNumber}</p>
                </div>
                <div className='text-right'>
                  {getStatusBadge(viewingInvoice.status)}
                  <p className='mt-2 text-2xl font-bold'>{formatAmount(viewingInvoice.amount)}</p>
                </div>
              </div>

              {/* Bill To */}
              <div className='grid gap-4 sm:grid-cols-2'>
                <div className='space-y-1 rounded-lg border p-4'>
                  <Label className='text-xs text-muted-foreground'>Bill To</Label>
                  <p className='font-medium'>{viewingInvoice.merchantName}</p>
                  <p className='text-sm text-muted-foreground'>{viewingInvoice.merchantEmail}</p>
                </div>
                <div className='space-y-1 rounded-lg border p-4'>
                  <div className='flex justify-between'>
                    <div>
                      <Label className='text-xs text-muted-foreground'>Issue Date</Label>
                      <p className='text-sm'>{new Date(viewingInvoice.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <Label className='text-xs text-muted-foreground'>Due Date</Label>
                      <p className='text-sm'>{new Date(viewingInvoice.dueDate).toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Line Items */}
              <div className='rounded-lg border'>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Description</TableHead>
                      <TableHead className='text-right'>Qty</TableHead>
                      <TableHead className='text-right'>Unit Price</TableHead>
                      <TableHead className='text-right'>Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {viewingInvoice.items?.length > 0 ? (
                      viewingInvoice.items.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell>{item.description}</TableCell>
                          <TableCell className='text-right'>{item.quantity}</TableCell>
                          <TableCell className='text-right'>{formatAmount(item.unitPrice)}</TableCell>
                          <TableCell className='text-right font-medium'>{formatAmount(item.total)}</TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell>
                          {viewingInvoice.planName} - {viewingInvoice.billingCycle}
                        </TableCell>
                        <TableCell className='text-right'>1</TableCell>
                        <TableCell className='text-right'>{formatAmount(viewingInvoice.amount)}</TableCell>
                        <TableCell className='text-right font-medium'>{formatAmount(viewingInvoice.amount)}</TableCell>
                      </TableRow>
                    )}
                    <TableRow>
                      <TableCell colSpan={3} className='text-right font-semibold'>
                        Total
                      </TableCell>
                      <TableCell className='text-right text-lg font-bold'>{formatAmount(viewingInvoice.amount)}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>

              {/* Notes */}
              {viewingInvoice.notes && (
                <div className='rounded-lg border p-4'>
                  <Label className='text-xs text-muted-foreground'>Notes</Label>
                  <p className='text-sm'>{viewingInvoice.notes}</p>
                </div>
              )}

              {/* Actions */}
              <div className='flex justify-end gap-2'>
                <Button variant='outline'>
                  <Printer className='mr-2 h-4 w-4' />
                  Print
                </Button>
                <Button variant='outline'>
                  <Download className='mr-2 h-4 w-4' />
                  Download PDF
                </Button>
                {viewingInvoice.status === "draft" && (
                  <Button onClick={() => handleSendInvoice(viewingInvoice.id)}>
                    <Send className='mr-2 h-4 w-4' />
                    Send Invoice
                  </Button>
                )}
                <Button variant='secondary' onClick={() => setShowViewDialog(false)}>
                  Close
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
