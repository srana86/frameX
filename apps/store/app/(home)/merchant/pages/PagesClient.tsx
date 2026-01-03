"use client";

import { useEffect, useState } from "react";
import type { FooterPage } from "@/app/api/pages/route";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "sonner";
import { Plus, Edit, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
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

export function PagesClient() {
  const router = useRouter();
  const [pages, setPages] = useState<FooterPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteSlug, setDeleteSlug] = useState<string | null>(null);

  useEffect(() => {
    loadPages();
  }, []);

  const loadPages = async () => {
    try {
      const res = await fetch("/api/pages");
      if (!res.ok) throw new Error("Failed to load pages");
      const data = await res.json();
      setPages(data || []);
    } catch (error) {
      toast.error("Failed to load pages");
    } finally {
      setLoading(false);
    }
  };

  const handleNewPage = () => {
    router.push("/merchant/pages/new");
  };

  const handleEdit = (page: FooterPage) => {
    router.push(`/merchant/pages/${page.slug}/edit`);
  };

  const handleToggleEnabled = async (page: FooterPage) => {
    try {
      const res = await fetch(`/api/pages/${page.slug}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          enabled: !page.enabled,
        }),
      });

      if (!res.ok) throw new Error("Failed to update page");

      toast.success(`Page ${!page.enabled ? "enabled" : "disabled"}`);
      loadPages();
    } catch (error) {
      toast.error("Failed to update page");
    }
  };

  const handleDelete = async () => {
    const slugToDelete = deleteSlug;
    if (!slugToDelete) return;

    try {
      const res = await fetch(`/api/pages/${slugToDelete}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to delete page");

      toast.success("Page deleted successfully");
      setDeleteSlug(null);
      loadPages();
    } catch (error) {
      toast.error("Failed to delete page");
      setDeleteSlug(null);
    }
  };

  if (loading) {
    return (
      <div className='flex items-center justify-center py-12'>
        <Spinner />
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between'>
        <div>
          <h2 className='text-2xl font-bold'>Footer Pages</h2>
          <p className='text-muted-foreground'>Manage footer links and their content</p>
        </div>
        <Button onClick={handleNewPage}>
          <Plus className='w-4 h-4 mr-2' />
          New Page
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pages</CardTitle>
          <CardDescription>Pages that appear in the footer. Only enabled pages are visible to visitors.</CardDescription>
        </CardHeader>
        <CardContent>
          {pages.length === 0 ? (
            <div className='text-center py-8 text-muted-foreground'>
              <p>No pages yet. Create your first page to get started.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className='text-right'>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pages.map((page) => (
                  <TableRow key={page.slug}>
                    <TableCell className='font-medium'>{page.title}</TableCell>
                    <TableCell>
                      <span className='inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary'>
                        {page.category || "General"}
                      </span>
                    </TableCell>
                    <TableCell className='text-muted-foreground font-mono text-sm'>{page.slug}</TableCell>
                    <TableCell>
                      <div className='flex items-center gap-2'>
                        <Switch checked={page.enabled} onCheckedChange={() => handleToggleEnabled(page)} />
                        <span className='text-sm text-muted-foreground'>{page.enabled ? "Enabled" : "Disabled"}</span>
                      </div>
                    </TableCell>
                    <TableCell className='text-right'>
                      <div className='flex items-center justify-end gap-2'>
                        <Button variant='ghost' size='sm' onClick={() => handleEdit(page)}>
                          <Edit className='w-4 h-4' />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant='ghost'
                              size='sm'
                              onClick={() => setDeleteSlug(page.slug)}
                              className='text-destructive hover:text-destructive'
                            >
                              <Trash2 className='w-4 h-4' />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will permanently delete the page "{page.title}". This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel onClick={() => setDeleteSlug(null)}>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={async () => {
                                  if (deleteSlug) {
                                    await handleDelete();
                                  }
                                }}
                                className='bg-destructive text-destructive-foreground'
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
