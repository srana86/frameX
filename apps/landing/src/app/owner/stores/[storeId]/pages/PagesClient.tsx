"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  FileText,
  Loader2,
  Plus,
  Trash2,
  Pencil,
  Eye,
  EyeOff,
} from "lucide-react";
import { toast } from "sonner";
import { createStoreApiClient } from "@/lib/store-api-client";
import { cn } from "@/utils/cn";
import type { StaffPermission } from "@/contexts/StoreContext";

interface ContentPage {
  id: string;
  title: string;
  slug: string;
  content?: string;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

interface PagesClientProps {
  initialPages: ContentPage[];
  storeId: string;
  permission: StaffPermission | null;
}

/**
 * Pages Client Component
 * Manage content pages
 */
export function PagesClient({
  initialPages,
  storeId,
  permission,
}: PagesClientProps) {
  const router = useRouter();
  const [pages, setPages] = useState<ContentPage[]>(initialPages);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPage, setEditingPage] = useState<ContentPage | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    content: "",
    isPublished: true,
  });

  // Permission check
  const canEdit = permission === null || permission === "EDIT" || permission === "FULL";

  // Filter pages
  const filteredPages = pages.filter((p) =>
    p.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Generate slug from title
  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  };

  // Open create dialog
  const openCreateDialog = () => {
    setEditingPage(null);
    setFormData({ title: "", slug: "", content: "", isPublished: true });
    setDialogOpen(true);
  };

  // Open edit dialog
  const openEditDialog = (page: ContentPage) => {
    setEditingPage(page);
    setFormData({
      title: page.title,
      slug: page.slug,
      content: page.content || "",
      isPublished: page.isPublished,
    });
    setDialogOpen(true);
  };

  // Save page
  const handleSave = async () => {
    if (!formData.title.trim()) {
      toast.error("Please enter a page title");
      return;
    }

    const slug = formData.slug || generateSlug(formData.title);

    setLoading(true);
    try {
      const storeApi = createStoreApiClient(storeId);

      if (editingPage) {
        const result = await storeApi.patch(`pages/${editingPage.id}`, {
          ...formData,
          slug,
        });
        setPages(
          pages.map((p) =>
            p.id === editingPage.id ? { ...p, ...result } : p
          )
        );
        toast.success("Page updated");
      } else {
        const result = await storeApi.post("pages", { ...formData, slug });
        setPages([result as ContentPage, ...pages]);
        toast.success("Page created");
      }

      setDialogOpen(false);
      setFormData({ title: "", slug: "", content: "", isPublished: true });
      setEditingPage(null);
    } catch (error: any) {
      toast.error(error.message || "Failed to save page");
    } finally {
      setLoading(false);
    }
  };

  // Toggle publish status
  const togglePublish = async (pageId: string, currentStatus: boolean) => {
    try {
      const storeApi = createStoreApiClient(storeId);
      await storeApi.patch(`pages/${pageId}`, { isPublished: !currentStatus });
      setPages(
        pages.map((p) =>
          p.id === pageId ? { ...p, isPublished: !currentStatus } : p
        )
      );
      toast.success(`Page ${!currentStatus ? "published" : "unpublished"}`);
    } catch (error: any) {
      toast.error(error.message || "Failed to update page");
    }
  };

  // Delete page
  const handleDelete = async (pageId: string) => {
    if (!confirm("Are you sure you want to delete this page?")) return;

    try {
      const storeApi = createStoreApiClient(storeId);
      await storeApi.delete(`pages/${pageId}`);
      setPages(pages.filter((p) => p.id !== pageId));
      toast.success("Page deleted");
    } catch (error: any) {
      toast.error(error.message || "Failed to delete page");
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
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
          <h1 className="text-3xl font-bold tracking-tight">Content Pages</h1>
          <p className="text-muted-foreground">
            Manage store pages like About, FAQ, Terms ({pages.length} total)
          </p>
        </div>
        {canEdit && (
          <Button onClick={openCreateDialog}>
            <Plus className="mr-2 h-4 w-4" />
            Create Page
          </Button>
        )}
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search pages..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Pages Table */}
      {filteredPages.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium mb-2">
              {pages.length === 0 ? "No pages yet" : "No matching pages"}
            </h3>
            <p className="text-muted-foreground text-center mb-4">
              {pages.length === 0
                ? "Create content pages for your store"
                : "Try adjusting your search"}
            </p>
            {canEdit && pages.length === 0 && (
              <Button onClick={openCreateDialog}>
                <Plus className="mr-2 h-4 w-4" />
                Create Page
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Pages ({filteredPages.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>URL Path</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Updated</TableHead>
                  {canEdit && <TableHead className="text-right">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPages.map((page) => (
                  <TableRow key={page.id}>
                    <TableCell className="font-medium">{page.title}</TableCell>
                    <TableCell className="font-mono text-sm text-muted-foreground">
                      /{page.slug}
                    </TableCell>
                    <TableCell>
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium",
                          page.isPublished
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-600"
                        )}
                      >
                        {page.isPublished ? (
                          <>
                            <Eye className="h-3 w-3" />
                            Published
                          </>
                        ) : (
                          <>
                            <EyeOff className="h-3 w-3" />
                            Draft
                          </>
                        )}
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {formatDate(page.updatedAt)}
                    </TableCell>
                    {canEdit && (
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => togglePublish(page.id, page.isPublished)}
                          >
                            {page.isPublished ? "Unpublish" : "Publish"}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditDialog(page)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-red-500 hover:text-red-600"
                            onClick={() => handleDelete(page.id)}
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
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingPage ? "Edit Page" : "Create Page"}
            </DialogTitle>
            <DialogDescription>
              {editingPage
                ? "Update the page content"
                : "Create a new content page"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="title">Page Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => {
                    const title = e.target.value;
                    setFormData((prev) => ({
                      ...prev,
                      title,
                      slug: prev.slug || generateSlug(title),
                    }));
                  }}
                  placeholder="About Us"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="slug">URL Path</Label>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, slug: e.target.value }))
                  }
                  placeholder="about-us"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="content">Content</Label>
              <Textarea
                id="content"
                value={formData.content}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, content: e.target.value }))
                }
                placeholder="Enter page content..."
                rows={10}
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isPublished"
                checked={formData.isPublished}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, isPublished: e.target.checked }))
                }
                className="h-4 w-4 rounded border-gray-300"
              />
              <Label htmlFor="isPublished" className="cursor-pointer">
                Publish immediately
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingPage ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
