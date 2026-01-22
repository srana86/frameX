"use client";

import { useState, useCallback } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  Box,
  Loader2,
  AlertTriangle,
  PackageX,
  Plus,
  Minus,
} from "lucide-react";
import { toast } from "sonner";
import { createStoreApiClient } from "@/lib/store-api-client";
import { cn } from "@/utils/cn";
import type { StaffPermission } from "@/contexts/StoreContext";

interface InventoryProduct {
  id: string;
  name: string;
  sku?: string;
  category?: string;
  stock: number;
  lowStockThreshold?: number;
}

interface InitialData {
  products: InventoryProduct[];
  lowStockCount: number;
  outOfStockCount: number;
}

interface InventoryClientProps {
  initialData: InitialData;
  storeId: string;
  permission: StaffPermission | null;
}

/**
 * Inventory Client Component
 * Manage product stock levels
 */
export function InventoryClient({
  initialData,
  storeId,
  permission,
}: InventoryClientProps) {
  const [products, setProducts] = useState<InventoryProduct[]>(initialData.products);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [stockFilter, setStockFilter] = useState<string>("all");
  const [adjustDialogOpen, setAdjustDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<InventoryProduct | null>(null);
  const [adjustmentType, setAdjustmentType] = useState<"add" | "remove">("add");
  const [adjustmentAmount, setAdjustmentAmount] = useState("");

  // Permission check
  const canEdit = permission === null || permission === "EDIT" || permission === "FULL";

  // Filter products
  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStock =
      stockFilter === "all" ||
      (stockFilter === "low" && p.stock > 0 && p.stock <= (p.lowStockThreshold || 10)) ||
      (stockFilter === "out" && p.stock === 0);

    return matchesSearch && matchesStock;
  });

  // Stats
  const lowStockCount = products.filter(
    (p) => p.stock > 0 && p.stock <= (p.lowStockThreshold || 10)
  ).length;
  const outOfStockCount = products.filter((p) => p.stock === 0).length;

  // Refresh inventory
  const refreshInventory = useCallback(async () => {
    setLoading(true);
    try {
      const storeApi = createStoreApiClient(storeId);
      const result = await storeApi.get("inventory");
      setProducts((result as any).products || []);
    } catch (error) {
      toast.error("Failed to refresh inventory");
    } finally {
      setLoading(false);
    }
  }, [storeId]);

  // Adjust stock
  const handleAdjustStock = async () => {
    if (!selectedProduct || !adjustmentAmount) return;

    const amount = parseInt(adjustmentAmount, 10);
    if (isNaN(amount) || amount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    const newStock =
      adjustmentType === "add"
        ? selectedProduct.stock + amount
        : Math.max(0, selectedProduct.stock - amount);

    try {
      const storeApi = createStoreApiClient(storeId);
      await storeApi.patch(`inventory/${selectedProduct.id}`, {
        stock: newStock,
        type: adjustmentType === "add" ? "RESTOCK" : "ADJUSTMENT",
      });

      setProducts(
        products.map((p) =>
          p.id === selectedProduct.id ? { ...p, stock: newStock } : p
        )
      );

      toast.success(
        `Stock ${adjustmentType === "add" ? "added" : "removed"} successfully`
      );
      setAdjustDialogOpen(false);
      setSelectedProduct(null);
      setAdjustmentAmount("");
    } catch (error: any) {
      toast.error(error.message || "Failed to adjust stock");
    }
  };

  // Open adjust dialog
  const openAdjustDialog = (product: InventoryProduct, type: "add" | "remove") => {
    setSelectedProduct(product);
    setAdjustmentType(type);
    setAdjustmentAmount("");
    setAdjustDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Inventory</h1>
        <p className="text-muted-foreground">
          Manage product stock levels and inventory
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{products.length}</div>
          </CardContent>
        </Card>
        <Card className={lowStockCount > 0 ? "border-yellow-200" : ""}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
              Low Stock
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{lowStockCount}</div>
          </CardContent>
        </Card>
        <Card className={outOfStockCount > 0 ? "border-red-200" : ""}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <PackageX className="h-4 w-4 text-red-500" />
              Out of Stock
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{outOfStockCount}</div>
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
                placeholder="Search by name or SKU..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={stockFilter} onValueChange={setStockFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Stock Level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Products</SelectItem>
                <SelectItem value="low">Low Stock</SelectItem>
                <SelectItem value="out">Out of Stock</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              onClick={refreshInventory}
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Refresh"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Inventory Table */}
      {filteredProducts.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Box className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium mb-2">No products found</h3>
            <p className="text-muted-foreground text-center">
              {products.length === 0
                ? "Add products to start tracking inventory"
                : "Try adjusting your search or filter"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Products ({filteredProducts.length})</CardTitle>
            <CardDescription>
              Click +/- to adjust stock levels
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-center">Stock</TableHead>
                  <TableHead>Status</TableHead>
                  {canEdit && <TableHead className="text-right">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map((product) => {
                  const isLowStock =
                    product.stock > 0 &&
                    product.stock <= (product.lowStockThreshold || 10);
                  const isOutOfStock = product.stock === 0;

                  return (
                    <TableRow key={product.id}>
                      <TableCell className="font-medium">{product.name}</TableCell>
                      <TableCell className="font-mono text-sm">
                        {product.sku || "-"}
                      </TableCell>
                      <TableCell>{product.category || "Uncategorized"}</TableCell>
                      <TableCell className="text-center">
                        <span
                          className={cn(
                            "font-bold",
                            isOutOfStock
                              ? "text-red-600"
                              : isLowStock
                              ? "text-yellow-600"
                              : "text-green-600"
                          )}
                        >
                          {product.stock}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span
                          className={cn(
                            "rounded-full px-2 py-1 text-xs font-medium",
                            isOutOfStock
                              ? "bg-red-100 text-red-700"
                              : isLowStock
                              ? "bg-yellow-100 text-yellow-700"
                              : "bg-green-100 text-green-700"
                          )}
                        >
                          {isOutOfStock
                            ? "Out of Stock"
                            : isLowStock
                            ? "Low Stock"
                            : "In Stock"}
                        </span>
                      </TableCell>
                      {canEdit && (
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => openAdjustDialog(product, "add")}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => openAdjustDialog(product, "remove")}
                              disabled={product.stock === 0}
                            >
                              <Minus className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Adjust Stock Dialog */}
      <Dialog open={adjustDialogOpen} onOpenChange={setAdjustDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {adjustmentType === "add" ? "Add Stock" : "Remove Stock"}
            </DialogTitle>
            <DialogDescription>
              {selectedProduct?.name} - Current stock: {selectedProduct?.stock}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="amount">
                Amount to {adjustmentType === "add" ? "add" : "remove"}
              </Label>
              <Input
                id="amount"
                type="number"
                min="1"
                value={adjustmentAmount}
                onChange={(e) => setAdjustmentAmount(e.target.value)}
                placeholder="Enter quantity"
              />
            </div>
            {selectedProduct && adjustmentAmount && (
              <p className="text-sm text-muted-foreground">
                New stock will be:{" "}
                <span className="font-bold">
                  {adjustmentType === "add"
                    ? selectedProduct.stock + parseInt(adjustmentAmount || "0", 10)
                    : Math.max(
                        0,
                        selectedProduct.stock - parseInt(adjustmentAmount || "0", 10)
                      )}
                </span>
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAdjustDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAdjustStock}>
              {adjustmentType === "add" ? "Add Stock" : "Remove Stock"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
