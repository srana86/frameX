"use client";

import { useState, useEffect } from "react";
import type { FooterPage, FooterCategory } from "@/lib/types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import RichTextEditor from "@/components/site/RichTextEditor";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { apiRequest } from "@/lib/api-client";

type Draft = {
  slug: string;
  title: string;
  content: string;
  category: string;
  enabled: boolean;
};

export default function PageForm({ initial }: { initial?: FooterPage }) {
  const router = useRouter();
  const [draft, setDraft] = useState<Draft>({
    slug: initial?.slug || "",
    title: initial?.title || "",
    content: initial?.content || "",
    category: initial?.category || "General",
    enabled: initial?.enabled ?? false,
  });
  const [categories, setCategories] = useState<FooterCategory[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const data = await apiRequest<FooterCategory[]>("GET", "/pages/categories");
      setCategories(data || []);

      // Set default category if none is selected and categories exist
      if (!draft.category && data.length > 0) {
        setDraft({ ...draft, category: data[0].name });
      }
    } catch (error) {
      console.error("Failed to load categories:", error);
    }
  };

  const validate = () => {
    const next: Record<string, string> = {};
    if (!draft.title.trim()) next.title = "Title is required";
    const slug = (draft.slug || generateSlug(draft.title)).trim();
    if (!slug) next.slug = "Slug is required";

    // Validate slug format (lowercase, no spaces, alphanumeric and hyphens only)
    const slugRegex = /^[a-z0-9-]+$/;
    if (slug && !slugRegex.test(slug)) {
      next.slug = "Slug must be lowercase, contain only letters, numbers, and hyphens";
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_-]+/g, "-")
      .replace(/^-+|-+$/g, "");
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);

    const slug = draft.slug || generateSlug(draft.title);
    const payload = {
      slug,
      title: draft.title,
      content: draft.content,
      category: draft.category,
      enabled: draft.enabled,
    };

    try {
      toast.loading(initial ? "Updating page..." : "Creating page...", { id: "save-page" });
      const res = await fetch(initial ? `/api/pages/${initial.slug}` : "/api/pages", {
        method: initial ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `Save failed: ${res.status} ${res.statusText}`);
      }

      toast.success(initial ? "Page updated" : "Page created", { id: "save-page" });
      router.push("/tenant/pages");
      router.refresh();
    } catch (error: any) {
      toast.error(error?.message || "Failed to save page", { id: "save-page" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <form onSubmit={onSubmit} className='space-y-6'>
        <div className='space-y-2'>
          <Label htmlFor='title'>Title *</Label>
          <Input
            id='title'
            value={draft.title}
            onChange={(e) => {
              const title = e.target.value;
              setDraft({
                ...draft,
                title,
                slug: initial ? draft.slug : generateSlug(title),
              });
            }}
            placeholder='e.g., About Us'
          />
          {errors.title && <div className='text-xs text-destructive'>{errors.title}</div>}
        </div>

        <div className='space-y-2'>
          <Label htmlFor='slug'>Slug *</Label>
          <Input
            id='slug'
            value={draft.slug}
            onChange={(e) => setDraft({ ...draft, slug: e.target.value.toLowerCase().trim() })}
            placeholder='e.g., about-us'
            disabled={!!initial}
          />
          {errors.slug && <div className='text-xs text-destructive'>{errors.slug}</div>}
          <p className='text-xs text-muted-foreground'>
            URL-friendly identifier. {initial ? "Cannot be changed after creation." : "Only lowercase letters, numbers, and hyphens."}
          </p>
        </div>

        <div className='space-y-2'>
          <Label htmlFor='category'>Category *</Label>
          <Select value={draft.category} onValueChange={(value) => setDraft({ ...draft, category: value })}>
            <SelectTrigger id='category'>
              <SelectValue placeholder='Select a category' />
            </SelectTrigger>
            <SelectContent>
              {categories.map((cat) => (
                <SelectItem key={cat.id} value={cat.name}>
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className='space-y-2'>
          <Label htmlFor='content'>Content</Label>
          <RichTextEditor
            value={draft.content}
            onChange={(content) => setDraft({ ...draft, content })}
            placeholder='Write the page content...'
          />
        </div>

        <div className='flex items-center space-x-2'>
          <Switch id='enabled' checked={draft.enabled} onCheckedChange={(checked) => setDraft({ ...draft, enabled: checked })} />
          <Label htmlFor='enabled' className='cursor-pointer'>
            Enable this page (show in footer)
          </Label>
        </div>

        <div className='flex items-center justify-end gap-3 pt-4'>
          <Button type='button' variant='outline' onClick={() => router.push("/admin/pages")}>
            Cancel
          </Button>
          <Button type='submit' disabled={submitting}>
            {submitting ? (
              <span className='inline-flex items-center gap-2'>
                <Spinner /> Saving...
              </span>
            ) : initial ? (
              "Update Page"
            ) : (
              "Create Page"
            )}
          </Button>
        </div>
      </form>
    </>
  );
}
