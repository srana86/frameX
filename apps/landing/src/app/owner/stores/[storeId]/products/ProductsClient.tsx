"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Package,
  Image as ImageIcon,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { createStoreApiClient } from "@/lib/store-api-client";
import { cn } from "@/utils/cn";
import type { StaffPermission } from "@/contexts/StoreContext";

interface Product {
  id: string;
  name: string;
  slug: string;
  category?: string;
  price: number;
  stock?: number;
  images?: string[];
  featured?: boolean;
}

interface PaginationData {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface InitialData {
  products: Product[];
  pagination: PaginationData;
  categories: string[];
}

interface ProductsClientProps {
  initialData: InitialData;
  storeId: string;
  permission: StaffPermission | null;
}

/**
 * Products Client Component
 * Displays and manages store products
 */
export function ProductsClient({
  initialData,
  storeId,
  permission,
}: ProductsClientProps) {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>(initialData.products);
  const [pagination, setPagination] = useState(initialData.pagination);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Permission checks
  const canEdit = permission === null || permission === "EDIT" || permission === "FULL";
  const canDelete = permission === null || permission === "FULL";

  // Filter products by search query
  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Refresh products
  const refreshProducts = useCallback(async () => {
    setLoading(true);
    try {
      const storeApi = createStoreApiClient(storeId);
      const result = await storeApi.getWithMeta("products");
      setProducts(result.data as Product[]);
      if (result.meta) {
        setPagination(result.meta as PaginationData);
      }
    } catch (error) {
      toast.error("Failed to refresh products");
    } finally {
      setLoading(false);
    }
  }, [storeId]);

  // Delete product
  const handleDelete = async (productId: string) => {
    if (!canDelete) {
      toast.error("You don't have permission to delete products");
      return;
    }

    setDeletingId(productId);
    try {
      const storeApi = createStoreApiClient(storeId);
      await storeApi.delete(`products/${productId}`);
      setProducts(products.filter((p) => p.id !== productId));
      toast.success("Product deleted successfully");
    } catch (error: any) {
      toast.error(error.message || "Failed to delete product");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Products</h1>
          <p className="text-muted-foreground">
            Manage your store products ({pagination.total} total)
          </p>
        </div>
        {canEdit && (
          <Link href={`/owner/stores/${storeId}/products/create`}>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Product
            </Button>
          </Link>
        )}
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button
              variant="outline"
              onClick={refreshProducts}
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

      {/* Products Table */}
      {filteredProducts.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Package className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium mb-2">
              {products.length === 0
                ? "No products yet"
                : "No matching products"}
            </h3>
            <p className="text-muted-foreground text-center mb-4">
              {products.length === 0
                ? "Add your first product to start selling"
                : "Try adjusting your search query"}
            </p>
            {products.length === 0 && canEdit && (
              <Link href={`/owner/stores/${storeId}/products/create`}>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Your First Product
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Products ({filteredProducts.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">Image</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead className="text-right">Stock</TableHead>
                  {(canEdit || canDelete) && (
                    <TableHead className="text-right">Actions</TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell>
                      {product.images && product.images[0] ? (
                        <img
                          src={product.images[0]}
                          alt={product.name}
                          className="h-10 w-10 rounded object-cover"
                        />
                      ) : (
                        <div className="flex h-10 w-10 items-center justify-center rounded bg-muted">
                          <ImageIcon className="h-5 w-5 text-muted-foreground" />
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{product.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {product.slug}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="rounded-full bg-muted px-2 py-1 text-xs">
                        {product.category || "Uncategorized"}
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      ${product.price.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right">
                      <span
                        className={cn(
                          "rounded-full px-2 py-1 text-xs font-medium",
                          (product.stock || 0) > 10
                            ? "bg-green-100 text-green-700"
                            : (product.stock || 0) > 0
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-red-100 text-red-700"
                        )}
                      >
                        {product.stock ?? "N/A"}
                      </span>
                    </TableCell>
                    {(canEdit || canDelete) && (
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          {canEdit && (
                            <Link
                              href={`/owner/stores/${storeId}/products/${product.id}/edit`}
                            >
                              <Button variant="ghost" size="icon">
                                <Edit className="h-4 w-4" />
                              </Button>
                            </Link>
                          )}
                          {canDelete && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="text-destructive hover:text-destructive"
                                  disabled={deletingId === product.id}
                                >
                                  {deletingId === product.id ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <Trash2 className="h-4 w-4" />
                                  )}
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>
                                    Delete Product
                                  </AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete &quot;
                                    {product.name}&quot;? This action cannot be
                                    undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDelete(product.id)}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
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

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <Button
            variant="outline"
            disabled={pagination.page <= 1}
            onClick={() => {
              router.push(
                `/owner/stores/${storeId}/products?page=${pagination.page - 1}`
              );
            }}
          >
            Previous
          </Button>
          <span className="flex items-center px-4">
            Page {pagination.page} of {pagination.totalPages}
          </span>
          <Button
            variant="outline"
            disabled={pagination.page >= pagination.totalPages}
            onClick={() => {
              router.push(
                `/owner/stores/${storeId}/products?page=${pagination.page + 1}`
              );
            }}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
