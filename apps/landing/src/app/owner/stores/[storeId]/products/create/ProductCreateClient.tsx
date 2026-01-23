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
  Package,
  DollarSign,
  Tag,
} from "lucide-react";
import { toast } from "sonner";
import { createStoreApiClient } from "@/lib/store-api-client";
import type { StaffPermission } from "@/contexts/StoreContext";

interface Category {
  id: string;
  name: string;
}

interface ProductCreateClientProps {
  categories: Category[];
  storeId: string;
  permission: StaffPermission | null;
}

interface ProductFormData {
  name: string;
  description: string;
  price: number;
  comparePrice: number | undefined;
  costPrice: number | undefined;
  sku: string;
  barcode: string;
  stock: number;
  lowStockThreshold: number | undefined;
  brand: string;
  categoryId: string | undefined;
  isActive: boolean;
  isFeatured: boolean;
  weight: number | undefined;
  metaTitle: string;
  metaDescription: string;
}

/**
 * Product Create Client Component
 */
export function ProductCreateClient({
  categories,
  storeId,
  permission,
}: ProductCreateClientProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [product, setProduct] = useState<ProductFormData>({
    name: "",
    description: "",
    price: 0,
    comparePrice: undefined,
    costPrice: undefined,
    sku: "",
    barcode: "",
    stock: 0,
    lowStockThreshold: undefined,
    brand: "",
    categoryId: undefined,
    isActive: true,
    isFeatured: false,
    weight: undefined,
    metaTitle: "",
    metaDescription: "",
  });

  // Update product field
  const updateField = <K extends keyof ProductFormData>(
    field: K,
    value: ProductFormData[K]
  ) => {
    setProduct((prev) => ({ ...prev, [field]: value }));
  };

  // Create product
  const handleCreate = async () => {
    if (!product.name.trim()) {
      toast.error("Please enter a product name");
      return;
    }

    if (!product.brand.trim()) {
      toast.error("Please enter a brand name");
      return;
    }

    if (product.price <= 0) {
      toast.error("Please enter a valid price");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...product,
        category: product.categoryId,
        weight: product.weight ? String(product.weight) : undefined,
      };

      const storeApi = createStoreApiClient(storeId);
      const result = await storeApi.post("products", payload);
      toast.success("Product created successfully");
      router.push(`/owner/stores/${storeId}/products/${(result as any).id}`);
    } catch (error: any) {
      toast.error(error.message || "Failed to create product");
      setSaving(false);
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
            <h1 className="text-2xl font-bold tracking-tight">Create Product</h1>
            <p className="text-sm text-muted-foreground">
              Add a new product to your store
            </p>
          </div>
        </div>
        <Button onClick={handleCreate} disabled={saving}>
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Create Product
            </>
          )}
        </Button>
      </div>

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
                <Label htmlFor="name">Product Name *</Label>
                <Input
                  id="name"
                  value={product.name}
                  onChange={(e) => updateField("name", e.target.value)}
                  placeholder="Enter product name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="brand">Brand *</Label>
                <Input
                  id="brand"
                  value={product.brand}
                  onChange={(e) => updateField("brand", e.target.value)}
                  placeholder="Enter brand name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={product.description}
                  onChange={(e) => updateField("description", e.target.value)}
                  rows={5}
                  placeholder="Describe your product..."
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="sku">SKU</Label>
                  <Input
                    id="sku"
                    value={product.sku}
                    onChange={(e) => updateField("sku", e.target.value)}
                    placeholder="Stock keeping unit"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="barcode">Barcode</Label>
                  <Input
                    id="barcode"
                    value={product.barcode}
                    onChange={(e) => updateField("barcode", e.target.value)}
                    placeholder="UPC, EAN, etc."
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
                  <Label htmlFor="price">Price *</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    min="0"
                    value={product.price || ""}
                    onChange={(e) =>
                      updateField("price", parseFloat(e.target.value) || 0)
                    }
                    placeholder="0.00"
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
                      updateField(
                        "comparePrice",
                        parseFloat(e.target.value) || undefined
                      )
                    }
                    placeholder="For sales display"
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
                      updateField(
                        "costPrice",
                        parseFloat(e.target.value) || undefined
                      )
                    }
                    placeholder="For profit tracking"
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
                  <Label htmlFor="stock">Initial Stock</Label>
                  <Input
                    id="stock"
                    type="number"
                    min="0"
                    value={product.stock || ""}
                    onChange={(e) =>
                      updateField("stock", parseInt(e.target.value) || 0)
                    }
                    placeholder="0"
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
                      updateField(
                        "lowStockThreshold",
                        parseInt(e.target.value) || undefined
                      )
                    }
                    placeholder="Alert when below this"
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
                  value={product.metaTitle}
                  onChange={(e) => updateField("metaTitle", e.target.value)}
                  placeholder="Leave empty to use product name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="metaDescription">Meta Description</Label>
                <Textarea
                  id="metaDescription"
                  value={product.metaDescription}
                  onChange={(e) => updateField("metaDescription", e.target.value)}
                  rows={3}
                  placeholder="Brief description for search results"
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
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <Label htmlFor="isFeatured">Featured</Label>
                <Switch
                  id="isFeatured"
                  checked={product.isFeatured}
                  onCheckedChange={(checked) => updateField("isFeatured", checked)}
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
                onValueChange={(value) =>
                  updateField("categoryId", value === "none" ? undefined : value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No category</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
                  placeholder="For shipping calculations"
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
