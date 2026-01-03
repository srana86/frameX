"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useCurrencySymbol } from "@/hooks/use-currency";
import type { CouponType, CouponStatus, CouponApplicability } from "@/lib/coupon-types";
import { couponTypeLabels } from "@/lib/coupon-types";
import type { Product } from "@/lib/types";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Spinner } from "@/components/ui/spinner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { ArrowLeft, Percent, DollarSign, Truck, Gift, Star, Tag, Save, X, Package, Folder } from "lucide-react";
import CloudImage from "@/components/site/CloudImage";

type CouponFormData = {
  code: string;
  name: string;
  description: string;
  type: CouponType;
  status: CouponStatus;
  discountValue: number;
  maxDiscountAmount?: number;
  startDate: string;
  endDate: string;
  minOrderValue: number;
  maxOrderValue?: number;
  totalUses?: number;
  usesPerCustomer: number;
  isFirstOrderOnly: boolean;
  requiresAuthentication: boolean;
  buyQuantity?: number;
  getQuantity?: number;
  applicableTo: CouponApplicability;
  productIds: string[];
  categoryIds: string[];
  excludedProductIds: string[];
  excludedCategoryIds: string[];
};

const defaultFormData: CouponFormData = {
  code: "",
  name: "",
  description: "",
  type: "percentage",
  status: "active",
  discountValue: 10,
  startDate: new Date().toISOString().split("T")[0],
  endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
  minOrderValue: 0,
  usesPerCustomer: 1,
  isFirstOrderOnly: false,
  requiresAuthentication: false,
  applicableTo: "all",
  productIds: [],
  categoryIds: [],
  excludedProductIds: [],
  excludedCategoryIds: [],
};

export default function CouponFormClient() {
  const router = useRouter();
  const currencySymbol = useCurrencySymbol();
  const [formData, setFormData] = useState<CouponFormData>(defaultFormData);
  const [submitting, setSubmitting] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [productDialogOpen, setProductDialogOpen] = useState(false);
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [excludedProductDialogOpen, setExcludedProductDialogOpen] = useState(false);
  const [excludedCategoryDialogOpen, setExcludedCategoryDialogOpen] = useState(false);
  const [productSearch, setProductSearch] = useState("");
  const [excludedProductSearch, setExcludedProductSearch] = useState("");

  // Load products and categories (with caching)
  useEffect(() => {
    let cancelled = false;
    const loadData = async () => {
      try {
        const res = await fetch("/api/products", {
          cache: "force-cache", // Use Next.js cache
          next: { revalidate: 60 }, // Revalidate every 60 seconds
        });
        if (res.ok && !cancelled) {
          const data = await res.json();
          // API returns { products: [], pagination: {}, categories: [] }
          const productsList = Array.isArray(data.products) ? data.products : Array.isArray(data) ? data : [];
          setProducts(productsList);
          // Extract unique categories from response or products
          const cats = new Set<string>();
          if (Array.isArray(data.categories)) {
            data.categories.forEach((cat: string) => {
              if (cat) cats.add(cat);
            });
          } else {
            productsList.forEach((p: Product) => {
              if (p.category) cats.add(p.category);
            });
          }
          setCategories(Array.from(cats).sort());
        }
      } catch (error) {
        if (!cancelled) {
          console.error("Failed to load products:", error);
        }
      } finally {
        if (!cancelled) {
          setLoadingProducts(false);
        }
      }
    };
    loadData();
    return () => {
      cancelled = true;
    };
  }, []);

  const getTypeIcon = (type: CouponType) => {
    switch (type) {
      case "percentage":
        return <Percent className='h-4 w-4' />;
      case "fixed_amount":
        return <DollarSign className='h-4 w-4' />;
      case "free_shipping":
        return <Truck className='h-4 w-4' />;
      case "buy_x_get_y":
        return <Gift className='h-4 w-4' />;
      case "first_order":
        return <Star className='h-4 w-4' />;
      default:
        return <Tag className='h-4 w-4' />;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.code.trim()) {
      toast.error("Coupon code is required");
      return;
    }
    if (!formData.name.trim()) {
      toast.error("Coupon name is required");
      return;
    }
    if (formData.discountValue <= 0 && formData.type !== "free_shipping") {
      toast.error("Discount value must be greater than 0");
      return;
    }
    if (formData.type === "percentage" && formData.discountValue > 100) {
      toast.error("Percentage discount cannot exceed 100%");
      return;
    }
    if (formData.applicableTo === "products" && formData.productIds.length === 0) {
      toast.error("Please select at least one product");
      return;
    }
    if (formData.applicableTo === "categories" && formData.categoryIds.length === 0) {
      toast.error("Please select at least one category");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        code: formData.code.toUpperCase(),
        name: formData.name,
        description: formData.description,
        type: formData.type,
        status: formData.status,
        discountValue: formData.discountValue,
        maxDiscountAmount: formData.maxDiscountAmount || undefined,
        startDate: new Date(formData.startDate).toISOString(),
        endDate: new Date(formData.endDate + "T23:59:59").toISOString(),
        usageLimit: {
          totalUses: formData.totalUses || undefined,
          usesPerCustomer: formData.usesPerCustomer,
        },
        conditions: {
          applicableTo: formData.applicableTo,
          minOrderValue: formData.minOrderValue,
          maxOrderValue: formData.maxOrderValue || undefined,
          isFirstOrderOnly: formData.isFirstOrderOnly,
          requiresAuthentication: formData.requiresAuthentication,
          productIds: formData.applicableTo === "products" && formData.productIds.length > 0 ? formData.productIds : undefined,
          categoryIds: formData.applicableTo === "categories" && formData.categoryIds.length > 0 ? formData.categoryIds : undefined,
          excludedProductIds: formData.excludedProductIds.length > 0 ? formData.excludedProductIds : undefined,
          excludedCategoryIds: formData.excludedCategoryIds.length > 0 ? formData.excludedCategoryIds : undefined,
        },
        buyXGetY:
          formData.type === "buy_x_get_y"
            ? {
                buyQuantity: formData.buyQuantity || 2,
                getQuantity: formData.getQuantity || 1,
              }
            : undefined,
      };

      const res = await fetch("/api/coupons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create coupon");
      }

      toast.success("Coupon created successfully");
      router.push("/merchant/coupons");
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to create coupon";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className='space-y-4 sm:space-y-6 py-4'>
      {/* Header */}
      <div className='flex flex-row items-center gap-3 sm:gap-4'>
        <Button variant='ghost' size='icon' asChild className='shrink-0'>
          <Link href='/merchant/coupons'>
            <ArrowLeft className='h-5 w-5' />
          </Link>
        </Button>
        <div>
          <h1 className='text-xl sm:text-2xl font-bold'>Create Coupon</h1>
          <p className='text-sm sm:text-base text-muted-foreground mt-0.5 sm:mt-1'>Create a new discount coupon for your store</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className='grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6'>
          {/* Main Content */}
          <div className='lg:col-span-2 space-y-6'>
            {/* Basic Info */}
            <Card className='p-0 !p-4 md:p-5'>
              <CardHeader className='p-0'>
                <CardTitle>Basic Information</CardTitle>
                <CardDescription>Set up the coupon code and display details</CardDescription>
              </CardHeader>
              <CardContent className='space-y-4 p-0'>
                <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                  <div className='space-y-2'>
                    <Label htmlFor='code'>Coupon Code *</Label>
                    <Input
                      id='code'
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                      placeholder='SUMMER20'
                      className='font-mono uppercase h-9'
                    />
                    <p className='text-xs text-muted-foreground'>3-20 characters, letters, numbers, dashes</p>
                  </div>
                  <div className='space-y-2'>
                    <Label htmlFor='name'>Display Name *</Label>
                    <Input
                      id='name'
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder='Summer Sale 20% Off'
                      className='h-9'
                    />
                  </div>
                </div>

                <div className='space-y-2'>
                  <Label htmlFor='description'>Description</Label>
                  <Textarea
                    id='description'
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder='Get 20% off on all summer collection items'
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Discount Type */}
            <Card className='p-0 !p-4 md:p-5'>
              <CardHeader className='p-0'>
                <CardTitle>Discount Type</CardTitle>
                <CardDescription>Choose how the discount will be applied</CardDescription>
              </CardHeader>
              <CardContent className='space-y-4 p-0'>
                <div className='grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2'>
                  {(["percentage", "fixed_amount", "free_shipping", "buy_x_get_y", "first_order"] as CouponType[]).map((type) => (
                    <Button
                      key={type}
                      type='button'
                      variant={formData.type === type ? "default" : "outline"}
                      className='h-auto py-3 flex-col gap-1'
                      onClick={() => setFormData({ ...formData, type })}
                    >
                      {getTypeIcon(type)}
                      <span className='text-xs text-center'>{couponTypeLabels[type]}</span>
                    </Button>
                  ))}
                </div>

                {formData.type !== "free_shipping" && formData.type !== "buy_x_get_y" && (
                  <div className='grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4'>
                    <div className='space-y-2'>
                      <Label htmlFor='discountValue'>Discount Value {formData.type === "percentage" ? "(%)" : `(${currencySymbol})`}</Label>
                      <Input
                        id='discountValue'
                        type='number'
                        min='0'
                        max={formData.type === "percentage" ? "100" : undefined}
                        value={formData.discountValue}
                        onChange={(e) => setFormData({ ...formData, discountValue: Number(e.target.value) })}
                        className='h-9'
                      />
                    </div>
                    {formData.type === "percentage" && (
                      <div className='space-y-2'>
                        <Label htmlFor='maxDiscount'>Max Discount ({currencySymbol})</Label>
                        <Input
                          id='maxDiscount'
                          type='number'
                          min='0'
                          value={formData.maxDiscountAmount || ""}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              maxDiscountAmount: e.target.value ? Number(e.target.value) : undefined,
                            })
                          }
                          placeholder='No limit'
                          className='h-9'
                        />
                      </div>
                    )}
                  </div>
                )}

                {formData.type === "buy_x_get_y" && (
                  <div className='grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4'>
                    <div className='space-y-2'>
                      <Label htmlFor='buyQuantity'>Buy Quantity</Label>
                      <Input
                        id='buyQuantity'
                        type='number'
                        min='1'
                        value={formData.buyQuantity || 2}
                        onChange={(e) => setFormData({ ...formData, buyQuantity: Number(e.target.value) })}
                        className='h-9'
                      />
                    </div>
                    <div className='space-y-2'>
                      <Label htmlFor='getQuantity'>Get Free Quantity</Label>
                      <Input
                        id='getQuantity'
                        type='number'
                        min='1'
                        value={formData.getQuantity || 1}
                        onChange={(e) => setFormData({ ...formData, getQuantity: Number(e.target.value) })}
                        className='h-9'
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Conditions */}
            <Card className='p-0 !p-4 md:p-5'>
              <CardHeader className='p-0'>
                <CardTitle>Conditions</CardTitle>
                <CardDescription>Set requirements for using this coupon</CardDescription>
              </CardHeader>
              <CardContent className='space-y-4 p-0'>
                {/* Applicable To */}
                <div className='space-y-2'>
                  <Label>Applicable To</Label>
                  <Select
                    value={formData.applicableTo}
                    onValueChange={(v) => setFormData({ ...formData, applicableTo: v as CouponApplicability })}
                  >
                    <SelectTrigger className='h-9 w-full'>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='all'>All Products</SelectItem>
                      <SelectItem value='products'>Specific Products</SelectItem>
                      <SelectItem value='categories'>Specific Categories</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Product Selection */}
                {formData.applicableTo === "products" && (
                  <div className='space-y-2'>
                    <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4'>
                      <Label>Selected Products</Label>
                      <Dialog open={productDialogOpen} onOpenChange={setProductDialogOpen}>
                        <DialogTrigger asChild>
                          <Button type='button' variant='outline' size='sm' className='w-full sm:w-auto h-9'>
                            <Package className='h-4 w-4 mr-2' />
                            {formData.productIds.length > 0 ? `Edit (${formData.productIds.length})` : "Select Products"}
                          </Button>
                        </DialogTrigger>
                        <DialogContent className='max-w-2xl max-h-[80vh] overflow-hidden flex flex-col'>
                          <DialogHeader>
                            <DialogTitle>Select Products</DialogTitle>
                          </DialogHeader>
                          <div className='flex-1 overflow-hidden flex flex-col gap-4'>
                            <Input
                              placeholder='Search products...'
                              value={productSearch}
                              onChange={(e) => setProductSearch(e.target.value)}
                            />
                            <div className='flex-1 overflow-y-auto space-y-2'>
                              {products
                                .filter((p) => p.name.toLowerCase().includes(productSearch.toLowerCase()))
                                .map((product) => (
                                  <div key={product.id} className='flex items-center gap-3 p-3 border rounded-lg hover:bg-accent/50'>
                                    <Checkbox
                                      checked={formData.productIds.includes(product.id)}
                                      onCheckedChange={(checked) => {
                                        if (checked) {
                                          setFormData({ ...formData, productIds: [...formData.productIds, product.id] });
                                        } else {
                                          setFormData({
                                            ...formData,
                                            productIds: formData.productIds.filter((id) => id !== product.id),
                                          });
                                        }
                                      }}
                                    />
                                    <div className='relative w-12 h-12 overflow-hidden rounded border bg-accent/30 shrink-0'>
                                      <CloudImage
                                        src={product.images[0] || "/file.svg"}
                                        alt={product.name}
                                        fill
                                        className='object-contain p-1'
                                      />
                                    </div>
                                    <div className='flex-1 min-w-0'>
                                      <p className='font-medium text-sm truncate'>{product.name}</p>
                                      <p className='text-xs text-muted-foreground'>{product.category}</p>
                                    </div>
                                  </div>
                                ))}
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                    {formData.productIds.length > 0 && (
                      <div className='flex flex-wrap gap-2'>
                        {formData.productIds.map((id) => {
                          const product = products.find((p) => p.id === id);
                          if (!product) return null;
                          return (
                            <Badge key={id} variant='secondary' className='flex items-center gap-1'>
                              {product.name}
                              <button
                                type='button'
                                onClick={() => {
                                  setFormData({
                                    ...formData,
                                    productIds: formData.productIds.filter((pid) => pid !== id),
                                  });
                                }}
                                className='ml-1 hover:text-destructive'
                              >
                                <X className='h-3 w-3' />
                              </button>
                            </Badge>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* Category Selection */}
                {formData.applicableTo === "categories" && (
                  <div className='space-y-2'>
                    <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4'>
                      <Label>Selected Categories</Label>
                      <Dialog open={categoryDialogOpen} onOpenChange={setCategoryDialogOpen}>
                        <DialogTrigger asChild>
                          <Button type='button' variant='outline' size='sm' className='w-full sm:w-auto h-9'>
                            <Folder className='h-4 w-4 mr-2' />
                            {formData.categoryIds.length > 0 ? `Edit (${formData.categoryIds.length})` : "Select Categories"}
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Select Categories</DialogTitle>
                          </DialogHeader>
                          <div className='space-y-2 max-h-[400px] overflow-y-auto'>
                            {categories.map((category) => (
                              <div key={category} className='flex items-center gap-3 p-2 border rounded-lg hover:bg-accent/50'>
                                <Checkbox
                                  checked={formData.categoryIds.includes(category)}
                                  onCheckedChange={(checked) => {
                                    if (checked) {
                                      setFormData({ ...formData, categoryIds: [...formData.categoryIds, category] });
                                    } else {
                                      setFormData({
                                        ...formData,
                                        categoryIds: formData.categoryIds.filter((c) => c !== category),
                                      });
                                    }
                                  }}
                                />
                                <Label className='flex-1 cursor-pointer'>{category}</Label>
                              </div>
                            ))}
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                    {formData.categoryIds.length > 0 && (
                      <div className='flex flex-wrap gap-2'>
                        {formData.categoryIds.map((category) => (
                          <Badge key={category} variant='secondary' className='flex items-center gap-1'>
                            {category}
                            <button
                              type='button'
                              onClick={() => {
                                setFormData({
                                  ...formData,
                                  categoryIds: formData.categoryIds.filter((c) => c !== category),
                                });
                              }}
                              className='ml-1 hover:text-destructive'
                            >
                              <X className='h-3 w-3' />
                            </button>
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Excluded Products */}
                <div className='space-y-2'>
                  <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4'>
                    <Label>Excluded Products (Optional)</Label>
                    <Dialog open={excludedProductDialogOpen} onOpenChange={setExcludedProductDialogOpen}>
                      <DialogTrigger asChild>
                        <Button type='button' variant='outline' size='sm' className='w-full sm:w-auto h-9'>
                          <Package className='h-4 w-4 mr-2' />
                          {formData.excludedProductIds.length > 0 ? `Edit (${formData.excludedProductIds.length})` : "Exclude Products"}
                        </Button>
                      </DialogTrigger>
                      <DialogContent className='max-w-2xl max-h-[80vh] overflow-hidden flex flex-col'>
                        <DialogHeader>
                          <DialogTitle>Exclude Products</DialogTitle>
                        </DialogHeader>
                        <div className='flex-1 overflow-hidden flex flex-col gap-4'>
                          <Input
                            placeholder='Search products...'
                            value={excludedProductSearch}
                            onChange={(e) => setExcludedProductSearch(e.target.value)}
                          />
                          <div className='flex-1 overflow-y-auto space-y-2'>
                            {products
                              .filter((p) => p.name.toLowerCase().includes(excludedProductSearch.toLowerCase()))
                              .map((product) => (
                                <div key={product.id} className='flex items-center gap-3 p-3 border rounded-lg hover:bg-accent/50'>
                                  <Checkbox
                                    checked={formData.excludedProductIds.includes(product.id)}
                                    onCheckedChange={(checked) => {
                                      if (checked) {
                                        setFormData({
                                          ...formData,
                                          excludedProductIds: [...formData.excludedProductIds, product.id],
                                        });
                                      } else {
                                        setFormData({
                                          ...formData,
                                          excludedProductIds: formData.excludedProductIds.filter((id) => id !== product.id),
                                        });
                                      }
                                    }}
                                  />
                                  <div className='relative w-12 h-12 overflow-hidden rounded border bg-accent/30 shrink-0'>
                                    <CloudImage
                                      src={product.images[0] || "/file.svg"}
                                      alt={product.name}
                                      fill
                                      className='object-contain p-1'
                                    />
                                  </div>
                                  <div className='flex-1 min-w-0'>
                                    <p className='font-medium text-sm truncate'>{product.name}</p>
                                    <p className='text-xs text-muted-foreground'>{product.category}</p>
                                  </div>
                                </div>
                              ))}
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                  {formData.excludedProductIds.length > 0 && (
                    <div className='flex flex-wrap gap-2'>
                      {formData.excludedProductIds.map((id) => {
                        const product = products.find((p) => p.id === id);
                        if (!product) return null;
                        return (
                          <Badge key={id} variant='secondary' className='flex items-center gap-1'>
                            {product.name}
                            <button
                              type='button'
                              onClick={() => {
                                setFormData({
                                  ...formData,
                                  excludedProductIds: formData.excludedProductIds.filter((pid) => pid !== id),
                                });
                              }}
                              className='ml-1 hover:text-destructive'
                            >
                              <X className='h-3 w-3' />
                            </button>
                          </Badge>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Excluded Categories */}
                <div className='space-y-2'>
                  <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4'>
                    <Label>Excluded Categories (Optional)</Label>
                    <Dialog open={excludedCategoryDialogOpen} onOpenChange={setExcludedCategoryDialogOpen}>
                      <DialogTrigger asChild>
                        <Button type='button' variant='outline' size='sm' className='w-full sm:w-auto h-9'>
                          <Folder className='h-4 w-4 mr-2' />
                          {formData.excludedCategoryIds.length > 0 ? `Edit (${formData.excludedCategoryIds.length})` : "Exclude Categories"}
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Exclude Categories</DialogTitle>
                        </DialogHeader>
                        <div className='space-y-2 max-h-[400px] overflow-y-auto'>
                          {categories.map((category) => (
                            <div key={category} className='flex items-center gap-3 p-2 border rounded-lg hover:bg-accent/50'>
                              <Checkbox
                                checked={formData.excludedCategoryIds.includes(category)}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    setFormData({
                                      ...formData,
                                      excludedCategoryIds: [...formData.excludedCategoryIds, category],
                                    });
                                  } else {
                                    setFormData({
                                      ...formData,
                                      excludedCategoryIds: formData.excludedCategoryIds.filter((c) => c !== category),
                                    });
                                  }
                                }}
                              />
                              <Label className='flex-1 cursor-pointer'>{category}</Label>
                            </div>
                          ))}
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                  {formData.excludedCategoryIds.length > 0 && (
                    <div className='flex flex-wrap gap-2'>
                      {formData.excludedCategoryIds.map((category) => (
                        <Badge key={category} variant='secondary' className='flex items-center gap-1'>
                          {category}
                          <button
                            type='button'
                            onClick={() => {
                              setFormData({
                                ...formData,
                                excludedCategoryIds: formData.excludedCategoryIds.filter((c) => c !== category),
                              });
                            }}
                            className='ml-1 hover:text-destructive'
                          >
                            <X className='h-3 w-3' />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                  <div className='space-y-2'>
                    <Label htmlFor='minOrder'>Minimum Order Value ({currencySymbol})</Label>
                    <Input
                      id='minOrder'
                      type='number'
                      min='0'
                      value={formData.minOrderValue}
                      onChange={(e) => setFormData({ ...formData, minOrderValue: Number(e.target.value) })}
                      className='h-9'
                    />
                  </div>
                  <div className='space-y-2'>
                    <Label htmlFor='maxOrder'>Maximum Order Value ({currencySymbol})</Label>
                    <Input
                      id='maxOrder'
                      type='number'
                      min='0'
                      value={formData.maxOrderValue || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          maxOrderValue: e.target.value ? Number(e.target.value) : undefined,
                        })
                      }
                      placeholder='No limit'
                      className='h-9'
                    />
                  </div>
                </div>

                <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                  <div className='space-y-2'>
                    <Label htmlFor='totalUses'>Total Uses Limit</Label>
                    <Input
                      id='totalUses'
                      type='number'
                      min='1'
                      value={formData.totalUses || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          totalUses: e.target.value ? Number(e.target.value) : undefined,
                        })
                      }
                      placeholder='Unlimited'
                      className='h-9'
                    />
                  </div>
                  <div className='space-y-2'>
                    <Label htmlFor='usesPerCustomer'>Uses Per Customer</Label>
                    <Input
                      id='usesPerCustomer'
                      type='number'
                      min='1'
                      value={formData.usesPerCustomer}
                      onChange={(e) => setFormData({ ...formData, usesPerCustomer: Number(e.target.value) })}
                      className='h-9'
                    />
                  </div>
                </div>

                <div className='space-y-3 sm:space-y-4 pt-2'>
                  <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 p-3 sm:p-4 rounded-lg border'>
                    <div className='space-y-0.5 flex-1'>
                      <Label>First Order Only</Label>
                      <p className='text-xs text-muted-foreground'>Only allow first-time customers to use this coupon</p>
                    </div>
                    <Switch
                      checked={formData.isFirstOrderOnly}
                      onCheckedChange={(checked) => setFormData({ ...formData, isFirstOrderOnly: checked })}
                      className='shrink-0'
                    />
                  </div>
                  <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 p-3 sm:p-4 rounded-lg border'>
                    <div className='space-y-0.5 flex-1'>
                      <Label>Requires Login</Label>
                      <p className='text-xs text-muted-foreground'>Customer must be logged in to use this coupon</p>
                    </div>
                    <Switch
                      checked={formData.requiresAuthentication}
                      onCheckedChange={(checked) => setFormData({ ...formData, requiresAuthentication: checked })}
                      className='shrink-0'
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className='space-y-6'>
            {/* Status & Dates */}
            <Card className='p-0 !p-4 md:p-5'>
              <CardHeader className='p-0'>
                <CardTitle>Status & Schedule</CardTitle>
              </CardHeader>
              <CardContent className='space-y-4 p-0'>
                <div className='space-y-2'>
                  <Label htmlFor='status'>Status</Label>
                  <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v as CouponStatus })}>
                    <SelectTrigger className='h-9 w-full'>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='active'>Active</SelectItem>
                      <SelectItem value='inactive'>Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className='space-y-2'>
                  <Label htmlFor='startDate'>Start Date</Label>
                  <Input
                    id='startDate'
                    type='date'
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className='h-9'
                  />
                </div>

                <div className='space-y-2'>
                  <Label htmlFor='endDate'>End Date</Label>
                  <Input
                    id='endDate'
                    type='date'
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className='h-9'
                  />
                </div>
              </CardContent>
            </Card>

            {/* Preview */}
            <Card className='p-0 !p-4 md:p-5'>
              <CardHeader className='p-0'>
                <CardTitle>Preview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className='p-4 rounded-lg border-2 border-dashed bg-muted/30 space-y-2'>
                  <div className='flex items-center gap-2'>
                    {getTypeIcon(formData.type)}
                    <code className='font-mono font-bold text-primary'>{formData.code || "CODE"}</code>
                  </div>
                  <p className='font-medium'>{formData.name || "Coupon Name"}</p>
                  <p className='text-sm text-muted-foreground'>
                    {formData.type === "percentage" && `${formData.discountValue}% off`}
                    {formData.type === "fixed_amount" && `${currencySymbol}${formData.discountValue} off`}
                    {formData.type === "free_shipping" && "Free Shipping"}
                    {formData.type === "buy_x_get_y" && `Buy ${formData.buyQuantity || 2} Get ${formData.getQuantity || 1} Free`}
                    {formData.type === "first_order" && `${formData.discountValue}% off (First Order)`}
                  </p>
                  {formData.minOrderValue > 0 && (
                    <p className='text-xs text-muted-foreground'>
                      Min. order: {currencySymbol}
                      {formData.minOrderValue}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className='flex flex-col gap-2'>
              <Button type='submit' disabled={submitting} className='w-full h-10'>
                {submitting ? (
                  <>
                    <Spinner className='mr-2 h-4 w-4' />
                    Creating...
                  </>
                ) : (
                  <>
                    <Save className='mr-2 h-4 w-4' />
                    Create Coupon
                  </>
                )}
              </Button>
              <Button type='button' variant='outline' asChild className='w-full h-10'>
                <Link href='/merchant/coupons'>Cancel</Link>
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
