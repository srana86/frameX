"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Loader2,
  Plus,
  Trash2,
  PiggyBank,
} from "lucide-react";
import { toast } from "sonner";
import { createStoreApiClient } from "@/lib/store-api-client";
import { cn } from "@/utils/cn";
import type { StaffPermission } from "@/contexts/StoreContext";

interface Investment {
  id: string;
  name: string;
  category: string;
  amount: number;
  date: string;
  expectedReturn?: number;
  actualReturn?: number;
  notes?: string;
}

interface InvestmentsData {
  investments: Investment[];
  summary: {
    totalInvested: number;
    totalReturns: number;
    roi: number;
  };
}

interface InvestmentsClientProps {
  initialData: InvestmentsData;
  storeId: string;
  permission: StaffPermission | null;
}

const CATEGORIES = [
  { value: "MARKETING", label: "Marketing" },
  { value: "INVENTORY", label: "Inventory" },
  { value: "EQUIPMENT", label: "Equipment" },
  { value: "SOFTWARE", label: "Software" },
  { value: "SERVICES", label: "Services" },
  { value: "OTHER", label: "Other" },
];

/**
 * Investments Client Component
 * Track and manage business investments
 */
export function InvestmentsClient({
  initialData,
  storeId,
  permission,
}: InvestmentsClientProps) {
  const [data, setData] = useState<InvestmentsData>(initialData);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    category: "MARKETING",
    amount: 0,
    date: new Date().toISOString().split("T")[0],
    expectedReturn: 0,
    notes: "",
  });

  // Permission check
  const canEdit = permission === null || permission === "EDIT" || permission === "FULL";

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Add investment
  const handleAddInvestment = async () => {
    if (!formData.name || formData.amount <= 0) {
      toast.error("Please fill in required fields");
      return;
    }

    setLoading(true);
    try {
      const storeApi = createStoreApiClient(storeId);
      const result = await storeApi.post("investments", formData);
      
      setData((prev) => ({
        ...prev,
        investments: [result as Investment, ...prev.investments],
        summary: {
          ...prev.summary,
          totalInvested: prev.summary.totalInvested + formData.amount,
        },
      }));
      
      setDialogOpen(false);
      setFormData({
        name: "",
        category: "MARKETING",
        amount: 0,
        date: new Date().toISOString().split("T")[0],
        expectedReturn: 0,
        notes: "",
      });
      toast.success("Investment added");
    } catch (error: any) {
      toast.error(error.message || "Failed to add investment");
    } finally {
      setLoading(false);
    }
  };

  // Delete investment
  const handleDelete = async (investmentId: string) => {
    if (!confirm("Are you sure you want to delete this investment?")) return;

    try {
      const storeApi = createStoreApiClient(storeId);
      await storeApi.delete(`investments/${investmentId}`);
      
      const investment = data.investments.find((i) => i.id === investmentId);
      setData((prev) => ({
        ...prev,
        investments: prev.investments.filter((i) => i.id !== investmentId),
        summary: {
          ...prev.summary,
          totalInvested: prev.summary.totalInvested - (investment?.amount || 0),
        },
      }));
      
      toast.success("Investment deleted");
    } catch (error: any) {
      toast.error(error.message || "Failed to delete investment");
    }
  };

  // Calculate ROI
  const calculateRoi = (invested: number, returns: number) => {
    if (invested === 0) return 0;
    return ((returns - invested) / invested) * 100;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Investments</h1>
          <p className="text-muted-foreground">
            Track your business investments and returns
          </p>
        </div>
        {canEdit && (
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Investment
          </Button>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              Total Invested
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(data.summary.totalInvested)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <PiggyBank className="h-4 w-4 text-muted-foreground" />
              Total Returns
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(data.summary.totalReturns)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              {data.summary.roi >= 0 ? (
                <TrendingUp className="h-4 w-4 text-green-500" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-500" />
              )}
              ROI
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className={cn(
                "text-2xl font-bold",
                data.summary.roi >= 0 ? "text-green-600" : "text-red-600"
              )}
            >
              {data.summary.roi.toFixed(1)}%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Investments Table */}
      {data.investments.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <PiggyBank className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium mb-2">No investments yet</h3>
            <p className="text-muted-foreground text-center mb-4">
              Start tracking your business investments
            </p>
            {canEdit && (
              <Button onClick={() => setDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Investment
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Investment History</CardTitle>
            <CardDescription>
              All recorded investments ({data.investments.length})
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-right">Expected Return</TableHead>
                  <TableHead className="text-right">Actual Return</TableHead>
                  <TableHead>Date</TableHead>
                  {canEdit && <TableHead className="text-right">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.investments.map((investment) => (
                  <TableRow key={investment.id}>
                    <TableCell className="font-medium">{investment.name}</TableCell>
                    <TableCell>
                      <span className="rounded-full bg-muted px-2 py-1 text-xs">
                        {investment.category}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(investment.amount)}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {investment.expectedReturn
                        ? formatCurrency(investment.expectedReturn)
                        : "-"}
                    </TableCell>
                    <TableCell
                      className={cn(
                        "text-right font-medium",
                        investment.actualReturn
                          ? investment.actualReturn > investment.amount
                            ? "text-green-600"
                            : "text-red-600"
                          : ""
                      )}
                    >
                      {investment.actualReturn
                        ? formatCurrency(investment.actualReturn)
                        : "-"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(investment.date)}
                    </TableCell>
                    {canEdit && (
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-red-500 hover:text-red-600"
                          onClick={() => handleDelete(investment.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Add Investment Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Investment</DialogTitle>
            <DialogDescription>
              Record a new business investment
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Investment Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="e.g., Facebook Ads Campaign"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, category: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, date: e.target.value }))
                  }
                />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="amount">Amount ($) *</Label>
                <Input
                  id="amount"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.amount || ""}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      amount: parseFloat(e.target.value) || 0,
                    }))
                  }
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="expectedReturn">Expected Return ($)</Label>
                <Input
                  id="expectedReturn"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.expectedReturn || ""}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      expectedReturn: parseFloat(e.target.value) || 0,
                    }))
                  }
                  placeholder="Optional"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Input
                id="notes"
                value={formData.notes}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, notes: e.target.value }))
                }
                placeholder="Optional notes"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddInvestment} disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Add Investment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
