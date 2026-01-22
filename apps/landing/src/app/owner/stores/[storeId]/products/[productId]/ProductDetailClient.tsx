"use client";

import { useState } from "react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  Save,
  Loader2,
  Trash2,
  Package,
  DollarSign,
  Tag,
  Image as ImageIcon,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { createStoreApiClient } from "@/lib/store-api-client";
import { cn } from "@/utils/cn";
import type { StaffPermission } from "@/contexts/StoreContext";

interface Product {
  id: string;
  name: string;
  slug: string;
  description?: string;
  price: number;
  comparePrice?: number;
  costPrice?: number;
  sku?: string;
  barcode?: string;
  stock: number;
  lowStockThreshold?: number;
  categoryId?: string;
  isActive: boolean;
  isFeatured: boolean;
  images: string[];
  weight?: number;
  dimensions?: { length?: number; width?: number; height?: number };
  metaTitle?: string;
  metaDescription?: string;
  createdAt: string;
  updatedAt: string;
}

interface Category {
  id: string;
  name: string;
}

interface ProductDetailClientProps {
  product: Product;
  categories: Category[];
  storeId: string;
  permission: StaffPermission | null;
}

/**
 * Product Detail Client Component
 * View and edit product details
 */
export function ProductDetailClient({
  product: initialProduct,
  categories,
  storeId,
  permission,
}: ProductDetailClientProps) {
  const router = useRouter();
  const [product, setProduct] = useState<Product>(initialProduct);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Permission checks
  const canEdit = permission === null || permission === "EDIT" || permission === "FULL";
  const canDelete = permission === null || permission === "FULL";

  // Update product field
  const updateField = <K extends keyof Product>(field: K, value: Product[K]) => {
    setProduct((prev) => ({ ...prev, [field]: value }));
  };

  // Save product
  const handleSave = async () => {
    if (!canEdit) {
      toast.error("You don't have permission to edit products");
      return;
    }

    setSaving(true);
    try {
      const storeApi = createStoreApiClient(storeId);
      await storeApi.put(`products/${product.id}`, {
        name: product.name,
        description: product.description,
        price: product.price,
        comparePrice: product.comparePrice,
        costPrice: product.costPrice,
        sku: product.sku,
        barcode: product.barcode,
        stock: product.stock,
        lowStockThreshold: product.lowStockThreshold,
        categoryId: product.categoryId,
        isActive: product.isActive,
        isFeatured: product.isFeatured,
        weight: product.weight,
        dimensions: product.dimensions,
        metaTitle: product.metaTitle,
        metaDescription: product.metaDescription,
      });
      toast.success("Product saved successfully");
    } catch (error: any) {
      toast.error(error.message || "Failed to save product");
    } finally {
      setSaving(false);
    }
  };

  // Delete product
  const handleDelete = async () => {
    if (!canDelete) {
      toast.error("You don't have permission to delete products");
      return;
    }

    if (!confirm("Are you sure you want to delete this product? This action cannot be undone.")) {
      return;
    }

    setDeleting(true);
    try {
      const storeApi = createStoreApiClient(storeId);
      await storeApi.delete(`products/${product.id}`);
      toast.success("Product deleted");
      router.push(`/owner/stores/${storeId}/products`);
    } catch (error: any) {
      toast.error(error.message || "Failed to delete product");
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/owner/stores/${storeId}/products`}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{product.name}</h1>
            <p className="text-sm text-muted-foreground">
              SKU: {product.sku || "N/A"} · Created{" "}
              {new Date(product.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {canDelete && (
            <Button
              variant="outline"
              className="text-red-500 hover:text-red-600"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="mr-2 h-4 w-4" />
              )}
              Delete
            </Button>
          )}
          {canEdit && (
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      {!canEdit && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="flex items-center gap-3 pt-6">
            <AlertCircle className="h-5 w-5 text-yellow-600" />
            <p className="text-yellow-800">
              You have view-only access. Contact an administrator to make changes.
            </p>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Product Name</Label>
                <Input
                  id="name"
                  value={product.name}
                  onChange={(e) => updateField("name", e.target.value)}
                  disabled={!canEdit}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={product.description || ""}
                  onChange={(e) => updateField("description", e.target.value)}
                  rows={5}
                  disabled={!canEdit}
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="sku">SKU</Label>
                  <Input
                    id="sku"
                    value={product.sku || ""}
                    onChange={(e) => updateField("sku", e.target.value)}
                    disabled={!canEdit}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="barcode">Barcode</Label>
                  <Input
                    id="barcode"
                    value={product.barcode || ""}
                    onChange={(e) => updateField("barcode", e.target.value)}
                    disabled={!canEdit}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pricing */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Pricing
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="price">Price</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    min="0"
                    value={product.price}
                    onChange={(e) => updateField("price", parseFloat(e.target.value) || 0)}
                    disabled={!canEdit}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="comparePrice">Compare at Price</Label>
                  <Input
                    id="comparePrice"
                    type="number"
                    step="0.01"
                    min="0"
                    value={product.comparePrice || ""}
                    onChange={(e) =>
                      updateField("comparePrice", parseFloat(e.target.value) || undefined)
                    }
                    placeholder="Optional"
                    disabled={!canEdit}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="costPrice">Cost Price</Label>
                  <Input
                    id="costPrice"
                    type="number"
                    step="0.01"
                    min="0"
                    value={product.costPrice || ""}
                    onChange={(e) =>
                      updateField("costPrice", parseFloat(e.target.value) || undefined)
                    }
                    placeholder="For profit tracking"
                    disabled={!canEdit}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Inventory */}
          <Card>
            <CardHeader>
              <CardTitle>Inventory</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="stock">Stock Quantity</Label>
                  <Input
                    id="stock"
                    type="number"
                    min="0"
                    value={product.stock}
                    onChange={(e) => updateField("stock", parseInt(e.target.value) || 0)}
                    disabled={!canEdit}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lowStockThreshold">Low Stock Alert</Label>
                  <Input
                    id="lowStockThreshold"
                    type="number"
                    min="0"
                    value={product.lowStockThreshold || ""}
                    onChange={(e) =>
                      updateField("lowStockThreshold", parseInt(e.target.value) || undefined)
                    }
                    placeholder="Alert when below"
                    disabled={!canEdit}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* SEO */}
          <Card>
            <CardHeader>
              <CardTitle>SEO</CardTitle>
              <CardDescription>
                Optimize for search engines
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="metaTitle">Meta Title</Label>
                <Input
                  id="metaTitle"
                  value={product.metaTitle || ""}
                  onChange={(e) => updateField("metaTitle", e.target.value)}
                  placeholder={product.name}
                  disabled={!canEdit}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="metaDescription">Meta Description</Label>
                <Textarea
                  id="metaDescription"
                  value={product.metaDescription || ""}
                  onChange={(e) => updateField("metaDescription", e.target.value)}
                  rows={3}
                  disabled={!canEdit}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status */}
          <Card>
            <CardHeader>
              <CardTitle>Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="isActive">Published</Label>
                <Switch
                  id="isActive"
                  checked={product.isActive}
                  onCheckedChange={(checked) => updateField("isActive", checked)}
                  disabled={!canEdit}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <Label htmlFor="isFeatured">Featured</Label>
                <Switch
                  id="isFeatured"
                  checked={product.isFeatured}
                  onCheckedChange={(checked) => updateField("isFeatured", checked)}
                  disabled={!canEdit}
                />
              </div>
            </CardContent>
          </Card>

          {/* Category */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Tag className="h-5 w-5" />
                Category
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Select
                value={product.categoryId || ""}
                onValueChange={(value) => updateField("categoryId", value || undefined)}
                disabled={!canEdit}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No category</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Images */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ImageIcon className="h-5 w-5" />
                Images
              </CardTitle>
            </CardHeader>
            <CardContent>
              {product.images.length === 0 ? (
                <div className="flex h-32 items-center justify-center rounded-lg border-2 border-dashed">
                  <p className="text-sm text-muted-foreground">No images</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {product.images.slice(0, 4).map((img, idx) => (
                    <div
                      key={idx}
                      className="aspect-square rounded-lg bg-muted overflow-hidden"
                    >
                      <img
                        src={img}
                        alt={`Product ${idx + 1}`}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Shipping */}
          <Card>
            <CardHeader>
              <CardTitle>Shipping</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="weight">Weight (kg)</Label>
                <Input
                  id="weight"
                  type="number"
                  step="0.01"
                  min="0"
                  value={product.weight || ""}
                  onChange={(e) =>
                    updateField("weight", parseFloat(e.target.value) || undefined)
                  }
                  disabled={!canEdit}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
