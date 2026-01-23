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
  Search,
  Ticket,
  Loader2,
  Plus,
  Trash2,
  Copy,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { createStoreApiClient } from "@/lib/store-api-client";
import { cn } from "@/utils/cn";
import type { StaffPermission } from "@/contexts/StoreContext";

interface Coupon {
  id: string;
  code: string;
  discountType: "PERCENTAGE" | "FIXED";
  discountValue: number;
  minOrderValue?: number;
  maxUses?: number;
  usedCount: number;
  expiresAt?: string;
  isActive: boolean;
  createdAt: string;
}

interface CouponsClientProps {
  initialCoupons: Coupon[];
  storeId: string;
  permission: StaffPermission | null;
}

/**
 * Coupons Client Component
 * Manage discount codes
 */
export function CouponsClient({
  initialCoupons,
  storeId,
  permission,
}: CouponsClientProps) {
  const [coupons, setCoupons] = useState<Coupon[]>(
    Array.isArray(initialCoupons) ? initialCoupons : []
  );
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newCoupon, setNewCoupon] = useState<{
    code: string;
    discountType: "PERCENTAGE" | "FIXED";
    discountValue: number;
    minOrderValue: number;
    maxUses: number;
    expiresAt: string;
  }>({
    code: "",
    discountType: "PERCENTAGE",
    discountValue: 10,
    minOrderValue: 0,
    maxUses: 0,
    expiresAt: "",
  });

  // Permission checks
  const canEdit = permission === null || permission === "EDIT" || permission === "FULL";

  // Filter coupons
  const filteredCoupons = (Array.isArray(coupons) ? coupons : []).filter((c) =>
    c.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Copy code to clipboard
  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success("Code copied to clipboard");
  };

  // Toggle coupon status
  const toggleStatus = async (couponId: string, currentStatus: boolean) => {
    if (!canEdit) {
      toast.error("You don't have permission to modify coupons");
      return;
    }

    try {
      const storeApi = createStoreApiClient(storeId);
      await storeApi.patch(`coupons/${couponId}`, { isActive: !currentStatus });
      setCoupons(
        coupons.map((c) =>
          c.id === couponId ? { ...c, isActive: !currentStatus } : c
        )
      );
      toast.success(`Coupon ${!currentStatus ? "activated" : "deactivated"}`);
    } catch (error: any) {
      toast.error(error.message || "Failed to update coupon");
    }
  };

  // Delete coupon
  const deleteCoupon = async (couponId: string) => {
    if (!canEdit) {
      toast.error("You don't have permission to delete coupons");
      return;
    }

    if (!confirm("Are you sure you want to delete this coupon?")) return;

    try {
      const storeApi = createStoreApiClient(storeId);
      await storeApi.delete(`coupons/${couponId}`);
      setCoupons(coupons.filter((c) => c.id !== couponId));
      toast.success("Coupon deleted");
    } catch (error: any) {
      toast.error(error.message || "Failed to delete coupon");
    }
  };

  // Create coupon
  const handleCreateCoupon = async () => {
    if (!newCoupon.code) {
      toast.error("Please enter a coupon code");
      return;
    }

    setLoading(true);
    try {
      const storeApi = createStoreApiClient(storeId);
      const result = await storeApi.post("coupons", newCoupon);
      setCoupons([result as Coupon, ...coupons]);
      setCreateDialogOpen(false);
      setNewCoupon({
        code: "",
        discountType: "PERCENTAGE",
        discountValue: 10,
        minOrderValue: 0,
        maxUses: 0,
        expiresAt: "",
      });
      toast.success("Coupon created successfully");
    } catch (error: any) {
      toast.error(error.message || "Failed to create coupon");
    } finally {
      setLoading(false);
    }
  };

  // Generate random code
  const generateCode = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let code = "";
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewCoupon((prev) => ({ ...prev, code }));
  };

  // Format date
  const formatDate = (dateString?: string) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Coupons</h1>
          <p className="text-muted-foreground">
            Manage discount codes and promotions ({coupons.length} total)
          </p>
        </div>
        {canEdit && (
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create Coupon
          </Button>
        )}
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by coupon code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Coupons Table */}
      {filteredCoupons.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Ticket className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium mb-2">
              {coupons.length === 0 ? "No coupons yet" : "No matching coupons"}
            </h3>
            <p className="text-muted-foreground text-center mb-4">
              {coupons.length === 0
                ? "Create your first discount coupon"
                : "Try adjusting your search"}
            </p>
            {canEdit && coupons.length === 0 && (
              <Button onClick={() => setCreateDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create Coupon
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Coupons ({filteredCoupons.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Discount</TableHead>
                  <TableHead>Min Purchase</TableHead>
                  <TableHead>Usage</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead>Status</TableHead>
                  {canEdit && <TableHead className="text-right">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCoupons.map((coupon) => (
                  <TableRow key={coupon.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <code className="rounded bg-muted px-2 py-1 text-sm font-semibold">
                          {coupon.code}
                        </code>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => copyCode(coupon.code)}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">
                      {coupon.discountType === "PERCENTAGE"
                        ? `${coupon.discountValue}%`
                        : `$${coupon.discountValue}`}
                    </TableCell>
                    <TableCell>
                      {coupon.minOrderValue ? `$${coupon.minOrderValue}` : "-"}
                    </TableCell>
                    <TableCell>
                      {coupon.maxUses
                        ? `${coupon.usedCount}/${coupon.maxUses}`
                        : `${coupon.usedCount} uses`}
                    </TableCell>
                    <TableCell className="text-sm">
                      {formatDate(coupon.expiresAt)}
                    </TableCell>
                    <TableCell>
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium",
                          coupon.isActive
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-600"
                        )}
                      >
                        {coupon.isActive ? (
                          <CheckCircle className="h-3 w-3" />
                        ) : (
                          <XCircle className="h-3 w-3" />
                        )}
                        {coupon.isActive ? "Active" : "Inactive"}
                      </span>
                    </TableCell>
                    {canEdit && (
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleStatus(coupon.id, coupon.isActive)}
                          >
                            {coupon.isActive ? "Deactivate" : "Activate"}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-red-500 hover:text-red-600"
                            onClick={() => deleteCoupon(coupon.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Create Coupon Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create Coupon</DialogTitle>
            <DialogDescription>
              Create a new discount code for your customers
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="code">Coupon Code</Label>
              <div className="flex gap-2">
                <Input
                  id="code"
                  value={newCoupon.code}
                  onChange={(e) =>
                    setNewCoupon((prev) => ({
                      ...prev,
                      code: e.target.value.toUpperCase(),
                    }))
                  }
                  placeholder="SUMMER20"
                />
                <Button variant="outline" onClick={generateCode}>
                  Generate
                </Button>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="type">Discount Type</Label>
                <Select
                  value={newCoupon.discountType}
                  onValueChange={(value: "PERCENTAGE" | "FIXED") =>
                    setNewCoupon((prev) => ({ ...prev, discountType: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PERCENTAGE">Percentage</SelectItem>
                    <SelectItem value="FIXED">Fixed Amount</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="value">
                  {newCoupon.discountType === "PERCENTAGE" ? "Discount %" : "Amount $"}
                </Label>
                <Input
                  id="value"
                  type="number"
                  min="1"
                  max={newCoupon.discountType === "PERCENTAGE" ? "100" : undefined}
                  value={newCoupon.discountValue}
                  onChange={(e) =>
                    setNewCoupon((prev) => ({
                      ...prev,
                      discountValue: parseInt(e.target.value, 10),
                    }))
                  }
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="minPurchase">Min Purchase ($)</Label>
                <Input
                  id="minPurchase"
                  type="number"
                  min="0"
                  value={newCoupon.minOrderValue}
                  onChange={(e) =>
                    setNewCoupon((prev) => ({
                      ...prev,
                      minOrderValue: parseInt(e.target.value, 10),
                    }))
                  }
                  placeholder="0 = No minimum"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxUses">Max Uses</Label>
                <Input
                  id="maxUses"
                  type="number"
                  min="0"
                  value={newCoupon.maxUses}
                  onChange={(e) =>
                    setNewCoupon((prev) => ({
                      ...prev,
                      maxUses: parseInt(e.target.value, 10),
                    }))
                  }
                  placeholder="0 = Unlimited"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="endDate">Expiration Date (Optional)</Label>
              <Input
                id="endDate"
                type="date"
                value={newCoupon.expiresAt}
                onChange={(e) =>
                  setNewCoupon((prev) => ({ ...prev, expiresAt: e.target.value }))
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateCoupon} disabled={loading}>
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Plus className="mr-2 h-4 w-4" />
              )}
              Create Coupon
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
