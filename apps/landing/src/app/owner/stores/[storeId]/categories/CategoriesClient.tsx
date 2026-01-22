"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
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
  Search,
  Tag,
  Loader2,
  Plus,
  Trash2,
  Pencil,
} from "lucide-react";
import { toast } from "sonner";
import { createStoreApiClient } from "@/lib/store-api-client";
import type { StaffPermission } from "@/contexts/StoreContext";

interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  productCount?: number;
  createdAt: string;
}

interface CategoriesClientProps {
  initialCategories: Category[];
  storeId: string;
  permission: StaffPermission | null;
}

/**
 * Categories Client Component
 * Manage product categories
 */
export function CategoriesClient({
  initialCategories,
  storeId,
  permission,
}: CategoriesClientProps) {
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
  });

  // Permission checks
  const canEdit = permission === null || permission === "EDIT" || permission === "FULL";

  // Filter categories
  const filteredCategories = categories.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Open create dialog
  const openCreateDialog = () => {
    setEditingCategory(null);
    setFormData({ name: "", description: "" });
    setDialogOpen(true);
  };

  // Open edit dialog
  const openEditDialog = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description || "",
    });
    setDialogOpen(true);
  };

  // Save category
  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.error("Please enter a category name");
      return;
    }

    setLoading(true);
    try {
      const storeApi = createStoreApiClient(storeId);

      if (editingCategory) {
        // Update existing
        const result = await storeApi.patch(
          `product-categories/${editingCategory.id}`,
          formData
        );
        setCategories(
          categories.map((c) =>
            c.id === editingCategory.id ? { ...c, ...result } : c
          )
        );
        toast.success("Category updated");
      } else {
        // Create new
        const result = await storeApi.post("product-categories", formData);
        setCategories([result as Category, ...categories]);
        toast.success("Category created");
      }

      setDialogOpen(false);
      setFormData({ name: "", description: "" });
      setEditingCategory(null);
    } catch (error: any) {
      toast.error(error.message || "Failed to save category");
    } finally {
      setLoading(false);
    }
  };

  // Delete category
  const handleDelete = async (categoryId: string) => {
    if (!confirm("Are you sure you want to delete this category?")) return;

    try {
      const storeApi = createStoreApiClient(storeId);
      await storeApi.delete(`product-categories/${categoryId}`);
      setCategories(categories.filter((c) => c.id !== categoryId));
      toast.success("Category deleted");
    } catch (error: any) {
      toast.error(error.message || "Failed to delete category");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Categories</h1>
          <p className="text-muted-foreground">
            Organize your products with categories ({categories.length} total)
          </p>
        </div>
        {canEdit && (
          <Button onClick={openCreateDialog}>
            <Plus className="mr-2 h-4 w-4" />
            Add Category
          </Button>
        )}
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search categories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Categories Table */}
      {filteredCategories.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Tag className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium mb-2">
              {categories.length === 0 ? "No categories yet" : "No matching categories"}
            </h3>
            <p className="text-muted-foreground text-center mb-4">
              {categories.length === 0
                ? "Create categories to organize your products"
                : "Try adjusting your search"}
            </p>
            {canEdit && categories.length === 0 && (
              <Button onClick={openCreateDialog}>
                <Plus className="mr-2 h-4 w-4" />
                Add Category
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Categories ({filteredCategories.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-center">Products</TableHead>
                  {canEdit && <TableHead className="text-right">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCategories.map((category) => (
                  <TableRow key={category.id}>
                    <TableCell className="font-medium">{category.name}</TableCell>
                    <TableCell className="font-mono text-sm text-muted-foreground">
                      {category.slug}
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {category.description || "-"}
                    </TableCell>
                    <TableCell className="text-center">
                      {category.productCount || 0}
                    </TableCell>
                    {canEdit && (
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditDialog(category)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-red-500 hover:text-red-600"
                            onClick={() => handleDelete(category.id)}
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

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingCategory ? "Edit Category" : "Create Category"}
            </DialogTitle>
            <DialogDescription>
              {editingCategory
                ? "Update the category details"
                : "Add a new product category"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Category Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="Electronics"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description (optional)</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, description: e.target.value }))
                }
                placeholder="Electronic devices and accessories"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingCategory ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
