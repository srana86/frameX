"use client";

import { useState, useEffect } from "react";
import type { Product, ProductCategory } from "@/lib/types";
import { apiRequest } from "@/lib/api-client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import CloudImage from "@/components/site/CloudImage";
import RichTextEditor from "@/components/site/RichTextEditor";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useCurrencySymbol } from "@/hooks/use-currency";
import { Package, Image as ImageIcon, DollarSign, Tag, Info, X, Plus, Upload, Trash2, FileText, Box } from "lucide-react";
import imageCompression from "browser-image-compression";

type Draft = {
  id?: string;
  name: string;
  slug: string;
  brand: string;
  category: string;
  description: string;
  price: string;
  buyPrice: string;
  images: string[];
  sizes: string;
  colors: string;
  materials: string;
  weight: string;
  dimensions: string;
  sku: string;
  condition: string;
  warranty: string;
  tags: string;
  discountPercentage: string;
  stock: string;
};

export default function ProductForm({ initial }: { initial?: Product }) {
  const router = useRouter();
  const currencySymbol = useCurrencySymbol();
  const [draft, setDraft] = useState<Draft>({
    id: initial?.id,
    name: initial?.name || "",
    slug: initial?.slug || "",
    brand: initial?.brand || "",
    category: initial?.category || "",
    description: initial?.description || "",
    price: initial ? String(initial.price) : "",
    buyPrice: initial?.buyPrice !== undefined ? String(initial.buyPrice) : "",
    images: initial?.images?.length ? initial.images : ["/file.svg"],
    sizes: (initial?.sizes ?? []).join(","),
    colors: (initial?.colors ?? []).join(","),
    materials: (initial?.materials ?? []).join(","),
    weight: initial?.weight || "",
    dimensions: initial?.dimensions || "",
    sku: initial?.sku || "",
    condition: initial?.condition || "",
    warranty: initial?.warranty || "",
    tags: (initial?.tags ?? []).join(","),
    discountPercentage: initial?.discountPercentage !== undefined ? String(initial.discountPercentage) : "",
    stock: initial?.stock !== undefined ? String(initial.stock) : "",
  });
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);

  useEffect(() => {
    loadCategories();
  }, []);

  // Auto-generate slug from name for new products
  useEffect(() => {
    // Only auto-generate for new products (no initial product)
    if (!initial && draft.name.trim() && !slugManuallyEdited) {
      const autoSlug = slugify(draft.name);
      // Only update if the generated slug is different from current slug
      if (autoSlug && autoSlug !== draft.slug) {
        setDraft((prev) => ({ ...prev, slug: autoSlug }));
      }
    }
    // Reset manual edit flag when name is cleared
    if (!draft.name.trim()) {
      setSlugManuallyEdited(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft.name]);

  const loadCategories = async () => {
    try {
      const data: any = await apiRequest("/products/categories", { method: "GET" });
      // API returns { categories: [...], pagination: {...} }
      const categoriesList = Array.isArray(data) ? data : data?.data?.categories || data?.categories || [];
      setCategories(categoriesList);

      // Set default category if none is selected and categories exist
      if (!draft.category && categoriesList.length > 0) {
        setDraft((prev) => ({ ...prev, category: categoriesList[0].name }));
      }
    } catch (error) {
      console.error("Failed to load categories:", error);
      setCategories([]);
    }
  };

  const validate = () => {
    const next: Record<string, string> = {};
    if (!draft.name.trim()) next.name = "Name is required";
    const slug = (draft.slug || slugify(draft.name)).trim();
    if (!slug) next.slug = "Slug is required";
    if (!draft.price || Number.isNaN(Number(draft.price))) next.price = "Valid price is required";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  async function handleUpload(idx: number, file: File) {
    setUploadingIndex(idx);
    try {
      // Compress image before uploading
      let compressedFile: File;
      if (file.type.startsWith("image/")) {
        try {
          const originalSizeMB = file.size / 1024 / 1024;

          // Adaptive compression based on file size
          // For larger files, use more aggressive compression
          const isLargeFile = originalSizeMB > 2;
          const compressionOptions = {
            maxSizeMB: 1, // Target maximum size in MB (will compress until under this)
            maxWidthOrHeight: isLargeFile ? 1600 : 1920, // Reduce dimensions more for large files
            useWebWorker: true, // Use web worker for better performance
            fileType: file.type, // Preserve original file type
            initialQuality: isLargeFile ? 0.7 : 0.85, // Lower quality for larger files
          };
          compressedFile = await imageCompression(file, compressionOptions);
          const compressionRatio = ((1 - compressedFile.size / file.size) * 100).toFixed(1);
          if (compressionRatio !== "0.0") {
            console.log(`[ProductForm] Image compressed: ${compressionRatio}% reduction`);
          }
        } catch (compressionError) {
          console.warn("[ProductForm] Compression failed, using original file:", compressionError);
          // If compression fails, use original file
          compressedFile = file;
        }
      } else {
        // For non-image files, use original
        compressedFile = file;
      }

      const form = new FormData();
      form.append("file", compressedFile);
      form.append("folder", "products");
      form.append("resource_type", "auto");
      const res: any = await apiRequest("/upload", {
        method: "POST",
        body: form,
      });
      const url = res?.data?.secure_url || res?.data?.url || res?.secure_url || res?.url;
      if (url) {
        const next = [...draft.images];
        next[idx] = url;
        setDraft({ ...draft, images: next });
      }
    } finally {
      setUploadingIndex(null);
    }
  }

  function isVideoUrl(u: string) {
    if (!u) return false;
    const lower = u.toLowerCase();
    return lower.endsWith(".mp4") || lower.endsWith(".webm") || lower.includes("/video/upload");
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    const id = draft.id;
    const payload = {
      id,
      slug: draft.slug || slugify(draft.name),
      name: draft.name,
      brand: draft.brand,
      category: draft.category,
      description: draft.description,
      price: Number(draft.price || 0),
      buyPrice: draft.buyPrice && draft.buyPrice.trim() !== "" ? Number(draft.buyPrice) : undefined,
      images: draft.images.map((u) => u || "/file.svg").filter(Boolean),
      sizes: draft.sizes
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      colors: draft.colors
        .split(",")
        .map((c) => c.trim())
        .filter(Boolean),
      materials: draft.materials
        .split(",")
        .map((m) => m.trim())
        .filter(Boolean),
      weight: draft.weight.trim() || undefined,
      dimensions: draft.dimensions.trim() || undefined,
      sku: draft.sku.trim() || undefined,
      condition: draft.condition.trim() || undefined,
      warranty: draft.warranty.trim() || undefined,
      tags: draft.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      discountPercentage: draft.discountPercentage && draft.discountPercentage.trim() !== "" ? Number(draft.discountPercentage) : undefined,
      stock: draft.stock ? Number(draft.stock) : undefined,
    } as Partial<Product> & { id?: string };
    try {
      toast.loading(id ? "Updating product..." : "Creating product...", { id: "save-product" });
      await apiRequest(id ? `/products/${id}` : "/products", {
        method: id ? "PUT" : "POST",
        body: JSON.stringify(payload),
      });
      toast.success(id ? "Product updated" : "Product created", { id: "save-product" });
      router.push("/merchant/products");
      router.refresh();
    } catch (error: any) {
      toast.error(error?.message || "Failed to save product", { id: "save-product" });
    }
    setSubmitting(false);
  };

  return (
    <div className='w-full mx-auto space-y-4'>
      <form onSubmit={onSubmit} className='space-y-4'>
        {/* Basic Information */}
        <Card className='border shadow-md gap-2'>
          <CardHeader className='px-4'>
            <div className='flex items-center gap-2'>
              <Package className='h-4 w-4 text-primary' />
              <CardTitle className='text-lg font-semibold'>Basic Information</CardTitle>
            </div>
          </CardHeader>
          <CardContent className='px-4 space-y-4'>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div className='space-y-1.5'>
                <Label htmlFor='name' className='text-xs font-medium flex items-center gap-1'>
                  Product Name <span className='text-destructive'>*</span>
                </Label>
                <Input
                  id='name'
                  placeholder='Enter product name'
                  value={draft.name}
                  onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                  className='h-9 text-sm'
                />
                {errors.name && (
                  <div className='text-xs text-destructive flex items-center gap-1'>
                    <X className='h-3 w-3' /> {errors.name}
                  </div>
                )}
              </div>
              <div className='space-y-1.5'>
                <Label htmlFor='slug' className='text-xs font-medium'>
                  Slug
                </Label>
                <Input
                  id='slug'
                  placeholder='product-slug'
                  value={draft.slug}
                  onChange={(e) => {
                    setDraft({ ...draft, slug: e.target.value });
                    // Mark as manually edited if user types something
                    if (e.target.value.trim()) {
                      setSlugManuallyEdited(true);
                    }
                  }}
                  onBlur={() => {
                    // Auto-generate if slug is empty and name exists
                    if (!draft.slug.trim() && draft.name.trim()) {
                      setDraft({ ...draft, slug: slugify(draft.name) });
                      setSlugManuallyEdited(false);
                    }
                  }}
                  className='h-9 text-sm'
                />
                {errors.slug && (
                  <div className='text-xs text-destructive flex items-center gap-1'>
                    <X className='h-3 w-3' /> {errors.slug}
                  </div>
                )}
                <p className='text-xs text-muted-foreground'>Auto-generated if empty</p>
              </div>
            </div>

            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div className='space-y-1.5'>
                <Label htmlFor='brand' className='text-xs font-medium'>
                  Brand
                </Label>
                <Input
                  id='brand'
                  placeholder='Enter brand name'
                  value={draft.brand}
                  onChange={(e) => setDraft({ ...draft, brand: e.target.value })}
                  className='h-9 text-sm'
                />
              </div>
              <div className='space-y-1.5'>
                <Label htmlFor='category' className='text-xs font-medium flex items-center gap-1'>
                  Category <span className='text-destructive'>*</span>
                </Label>
                <Select value={draft.category} onValueChange={(value) => setDraft({ ...draft, category: value })}>
                  <SelectTrigger id='category' className='h-9 text-sm w-full'>
                    <SelectValue placeholder='Select a category' />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.isArray(categories) &&
                      categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.name}>
                          {cat.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pricing */}
        <Card className='border shadow-md gap-2'>
          <CardHeader className='px-4'>
            <div className='flex items-center gap-2'>
              <DollarSign className='h-4 w-4 text-primary' />
              <CardTitle className='text-lg font-semibold'>Pricing</CardTitle>
            </div>
          </CardHeader>
          <CardContent className='px-4 space-y-4'>
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
              <div className='space-y-1.5'>
                <Label htmlFor='price' className='text-xs font-medium flex items-center gap-1'>
                  Price <span className='text-destructive'>*</span>
                </Label>
                <div className='relative'>
                  <span className='absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground text-sm'>$</span>
                  <Input
                    id='price'
                    placeholder='0.00'
                    type='number'
                    step='0.01'
                    value={draft.price}
                    onChange={(e) => setDraft({ ...draft, price: e.target.value })}
                    className='h-9 text-sm pl-7'
                  />
                </div>
                {errors.price && (
                  <div className='text-xs text-destructive flex items-center gap-1'>
                    <X className='h-3 w-3' /> {errors.price}
                  </div>
                )}
              </div>
              <div className='space-y-1.5'>
                <Label htmlFor='buyPrice' className='text-xs font-medium'>
                  Buy Price
                </Label>
                <div className='relative'>
                  <span className='absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground text-sm'>$</span>
                  <Input
                    id='buyPrice'
                    placeholder='0.00'
                    type='number'
                    step='0.01'
                    value={draft.buyPrice}
                    onChange={(e) => setDraft({ ...draft, buyPrice: e.target.value })}
                    className='h-9 text-sm pl-7'
                  />
                </div>
                <p className='text-xs text-muted-foreground'>Cost price for profit calculations</p>
              </div>
              <div className='space-y-1.5'>
                <Label htmlFor='discountPercentage' className='text-xs font-medium'>
                  Discount %
                </Label>
                <div className='relative'>
                  <span className='absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground text-sm'>%</span>
                  <Input
                    id='discountPercentage'
                    placeholder='0-100'
                    type='number'
                    min='0'
                    max='100'
                    step='0.01'
                    value={draft.discountPercentage}
                    onChange={(e) => setDraft({ ...draft, discountPercentage: e.target.value })}
                    className='h-9 text-sm pr-7'
                  />
                </div>
              </div>
            </div>
            {draft.price && draft.discountPercentage && !isNaN(Number(draft.price)) && !isNaN(Number(draft.discountPercentage)) && (
              <div className='rounded-md border border-primary/20 bg-primary/5 p-3'>
                <div className='grid grid-cols-3 gap-3 text-center'>
                  <div>
                    <p className='text-xs text-muted-foreground mb-1'>Original</p>
                    <p className='text-sm font-semibold'>
                      {currencySymbol}
                      {Number(draft.price).toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className='text-xs text-muted-foreground mb-1'>Discount</p>
                    <p className='text-sm font-semibold text-primary'>{draft.discountPercentage}%</p>
                  </div>
                  <div>
                    <p className='text-xs text-muted-foreground mb-1'>Final</p>
                    <p className='text-base font-bold text-green-600'>
                      {currencySymbol}
                      {(Number(draft.price) * (1 - Number(draft.discountPercentage) / 100)).toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {draft.price && draft.buyPrice && !isNaN(Number(draft.price)) && !isNaN(Number(draft.buyPrice)) && (
              <div className='rounded-md border border-green-200/50 bg-green-50/50 dark:border-green-800/30 dark:bg-green-950/20 p-3'>
                <div className='grid grid-cols-3 gap-3 text-center'>
                  <div>
                    <p className='text-xs text-muted-foreground mb-1'>Buy Price</p>
                    <p className='text-sm font-semibold'>
                      {currencySymbol}
                      {Number(draft.buyPrice).toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className='text-xs text-muted-foreground mb-1'>Selling Price</p>
                    <p className='text-sm font-semibold'>
                      {currencySymbol}
                      {Number(draft.price).toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className='text-xs text-muted-foreground mb-1'>Profit Margin</p>
                    <p
                      className={`text-base font-bold ${Number(draft.price) - Number(draft.buyPrice) >= 0 ? "text-green-600" : "text-red-600"
                        }`}
                    >
                      {currencySymbol}
                      {(Number(draft.price) - Number(draft.buyPrice)).toFixed(2)}
                      <span className='text-xs ml-1'>
                        ({(((Number(draft.price) - Number(draft.buyPrice)) / Number(draft.buyPrice)) * 100).toFixed(1)}%)
                      </span>
                    </p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Product Images */}
        <Card className='border shadow-md gap-2'>
          <CardHeader className='px-4'>
            <div className='flex items-center gap-2'>
              <ImageIcon className='h-4 w-4 text-primary' />
              <CardTitle className='text-lg font-semibold'>Product Images</CardTitle>
            </div>
          </CardHeader>
          <CardContent className='px-4 space-y-3'>
            <div className='grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3'>
              {draft.images.map((url, idx) => (
                <div key={idx} className='group relative border border-dashed rounded-md p-2 bg-muted/30 hover:border-primary/50'>
                  <div className='relative aspect-square w-full overflow-hidden rounded border bg-background mb-2'>
                    {url ? (
                      isVideoUrl(url) ? (
                        <video src={url} className='h-full w-full object-cover' preload='metadata' />
                      ) : (
                        <CloudImage src={url} alt='preview' fill className='object-cover' />
                      )
                    ) : (
                      <div className='flex h-full w-full items-center justify-center bg-muted/30'>
                        <ImageIcon className='h-6 w-6 text-muted-foreground/40' />
                      </div>
                    )}
                    {uploadingIndex === idx && (
                      <div className='absolute inset-0 bg-black/60 flex items-center justify-center rounded'>
                        <Spinner className='h-4 w-4 text-white' />
                      </div>
                    )}
                  </div>
                  <div className='space-y-1.5'>
                    <Input
                      placeholder='URL or upload'
                      value={url}
                      onChange={(e) => {
                        const next = [...draft.images];
                        next[idx] = e.target.value;
                        setDraft({ ...draft, images: next });
                      }}
                      className='h-8 text-xs'
                    />
                    <div className='flex gap-1'>
                      <input
                        id={`file-${idx}`}
                        type='file'
                        accept='image/*,video/*'
                        className='hidden'
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) void handleUpload(idx, f);
                          e.currentTarget.value = "";
                        }}
                      />
                      <Button
                        type='button'
                        variant='outline'
                        size='sm'
                        onClick={() => document.getElementById(`file-${idx}`)?.click()}
                        disabled={uploadingIndex === idx}
                        className='flex-1 h-7 text-xs px-2'
                      >
                        {uploadingIndex === idx ? <Spinner className='h-3 w-3' /> : <Upload className='h-3 w-3' />}
                      </Button>
                      <Button
                        type='button'
                        variant='outline'
                        size='sm'
                        onClick={() => setDraft({ ...draft, images: draft.images.filter((_, i) => i !== idx) })}
                        className='h-7 w-7 p-0 text-destructive hover:text-destructive hover:bg-destructive/10'
                      >
                        <Trash2 className='h-3 w-3' />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className='flex flex-wrap gap-2'>
              <Button
                type='button'
                variant='outline'
                size='sm'
                onClick={() => setDraft({ ...draft, images: [...draft.images, ""] })}
                className='h-8 text-xs'
              >
                <Plus className='h-3 w-3 mr-1' />
                Add Slot
              </Button>
              <input
                id='file-add'
                type='file'
                accept='image/*,video/*'
                className='hidden'
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) {
                    const idx = draft.images.length;
                    setDraft({ ...draft, images: [...draft.images, ""] });
                    setTimeout(() => void handleUpload(idx, f), 0);
                  }
                  e.currentTarget.value = "";
                }}
              />
              <Button
                type='button'
                variant='default'
                size='sm'
                onClick={() => document.getElementById("file-add")?.click()}
                className='h-8 text-xs'
              >
                <Upload className='h-3 w-3 mr-1' />
                Upload
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Product Options */}
        <Card className='border shadow-md gap-2'>
          <CardHeader className='px-4'>
            <div className='flex items-center gap-2'>
              <Tag className='h-4 w-4 text-primary' />
              <CardTitle className='text-lg font-semibold'>Product Options</CardTitle>
            </div>
          </CardHeader>
          <CardContent className='px-4 space-y-3'>
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3'>
              <div className='space-y-1.5'>
                <Label htmlFor='sizes' className='text-xs font-medium'>
                  Sizes
                </Label>
                <Input
                  id='sizes'
                  placeholder='S, M, L, XL'
                  value={draft.sizes}
                  onChange={(e) => setDraft({ ...draft, sizes: e.target.value })}
                  className='h-9 text-sm'
                />
              </div>

              <div className='space-y-1.5'>
                <Label htmlFor='colors' className='text-xs font-medium'>
                  Colors
                </Label>
                <Input
                  id='colors'
                  placeholder='Red, Blue, Green'
                  value={draft.colors}
                  onChange={(e) => setDraft({ ...draft, colors: e.target.value })}
                  className='h-9 text-sm'
                />
              </div>

              <div className='space-y-1.5'>
                <Label htmlFor='materials' className='text-xs font-medium'>
                  Materials
                </Label>
                <Input
                  id='materials'
                  placeholder='Cotton, Leather'
                  value={draft.materials}
                  onChange={(e) => setDraft({ ...draft, materials: e.target.value })}
                  className='h-9 text-sm'
                />
              </div>

              <div className='space-y-1.5'>
                <Label htmlFor='sku' className='text-xs font-medium'>
                  SKU
                </Label>
                <Input
                  id='sku'
                  placeholder='PROD-001'
                  value={draft.sku}
                  onChange={(e) => setDraft({ ...draft, sku: e.target.value })}
                  className='h-9 text-sm'
                />
              </div>

              <div className='space-y-1.5'>
                <Label htmlFor='weight' className='text-xs font-medium'>
                  Weight
                </Label>
                <Input
                  id='weight'
                  placeholder='500g, 1.2kg'
                  value={draft.weight}
                  onChange={(e) => setDraft({ ...draft, weight: e.target.value })}
                  className='h-9 text-sm'
                />
              </div>

              <div className='space-y-1.5'>
                <Label htmlFor='dimensions' className='text-xs font-medium'>
                  Dimensions
                </Label>
                <Input
                  id='dimensions'
                  placeholder='10x5x3 cm'
                  value={draft.dimensions}
                  onChange={(e) => setDraft({ ...draft, dimensions: e.target.value })}
                  className='h-9 text-sm'
                />
              </div>

              <div className='space-y-1.5'>
                <Label htmlFor='condition' className='text-xs font-medium'>
                  Condition
                </Label>
                <div className='flex gap-1.5'>
                  <Select value={draft.condition || undefined} onValueChange={(value) => setDraft({ ...draft, condition: value })}>
                    <SelectTrigger id='condition' className='flex-1 h-9 text-sm'>
                      <SelectValue placeholder='Select condition' />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='New'>New</SelectItem>
                      <SelectItem value='Refurbished'>Refurbished</SelectItem>
                      <SelectItem value='Used'>Used</SelectItem>
                      <SelectItem value='Open Box'>Open Box</SelectItem>
                    </SelectContent>
                  </Select>
                  {draft.condition && (
                    <Button
                      type='button'
                      variant='outline'
                      size='icon'
                      onClick={() => setDraft({ ...draft, condition: "" })}
                      className='h-9 w-9 p-0 hover:bg-destructive/10 hover:text-destructive'
                    >
                      <X className='h-3 w-3' />
                    </Button>
                  )}
                </div>
              </div>

              <div className='space-y-1.5'>
                <Label htmlFor='warranty' className='text-xs font-medium'>
                  Warranty
                </Label>
                <Input
                  id='warranty'
                  placeholder='1 year, 2 years'
                  value={draft.warranty}
                  onChange={(e) => setDraft({ ...draft, warranty: e.target.value })}
                  className='h-9 text-sm'
                />
              </div>

              <div className='space-y-1.5'>
                <Label htmlFor='stock' className='text-xs font-medium flex items-center gap-1'>
                  <Box className='h-3 w-3' /> Stock
                </Label>
                <Input
                  id='stock'
                  placeholder='Quantity'
                  type='number'
                  min='0'
                  step='1'
                  value={draft.stock}
                  onChange={(e) => setDraft({ ...draft, stock: e.target.value })}
                  className='h-9 text-sm'
                />
              </div>

              <div className='md:col-span-2 lg:col-span-3 space-y-1.5'>
                <Label htmlFor='tags' className='text-xs font-medium'>
                  Tags
                </Label>
                <Input
                  id='tags'
                  placeholder='premium, eco-friendly, bestseller'
                  value={draft.tags}
                  onChange={(e) => setDraft({ ...draft, tags: e.target.value })}
                  className='h-9 text-sm'
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Description */}
        <Card className='border shadow-md gap-2'>
          <CardHeader className='px-4'>
            <div className='flex items-center gap-2'>
              <FileText className='h-4 w-4 text-primary' />
              <CardTitle className='text-lg font-semibold'>Description</CardTitle>
            </div>
          </CardHeader>
          <CardContent className='px-4'>
            <RichTextEditor
              value={draft.description}
              onChange={(val) => setDraft({ ...draft, description: val })}
              placeholder='Write product details...'
            />
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className='flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2 pt-2 border-t'>
          <Button type='button' variant='outline' size='sm' onClick={() => router.push("/merchant/products")} className='h-9'>
            Cancel
          </Button>
          <Button type='submit' size='sm' disabled={submitting} className='h-9 min-w-[120px]'>
            {submitting ? (
              <span className='inline-flex items-center gap-1.5'>
                <Spinner className='h-3 w-3' /> Saving...
              </span>
            ) : initial ? (
              "Update Product"
            ) : (
              "Create Product"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}
