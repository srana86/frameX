"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useCurrencySymbol } from "@/hooks/use-currency";
import type { Coupon, CouponType, CouponStatus } from "@/lib/coupon-types";
import { couponTypeLabels } from "@/lib/coupon-types";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Spinner } from "@/components/ui/spinner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { ArrowLeft, Percent, DollarSign, Truck, Gift, Star, Tag, Save } from "lucide-react";
import { apiRequest } from "@/lib/api-client";

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
};

interface EditCouponClientProps {
  couponId: string;
}

export default function EditCouponClient({ couponId }: EditCouponClientProps) {
  const router = useRouter();
  const currencySymbol = useCurrencySymbol();
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState<CouponFormData | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [currentUses, setCurrentUses] = useState(0);

  useEffect(() => {
    loadCoupon();
  }, [couponId]);

  const loadCoupon = async () => {
    try {
      const coupon = await apiRequest<Coupon>("GET", `/coupons/${couponId}`);

      setFormData({
        code: coupon.code,
        name: coupon.name,
        description: coupon.description || "",
        type: coupon.type,
        status: coupon.status,
        discountValue: coupon.discountValue,
        maxDiscountAmount: coupon.maxDiscountAmount,
        startDate: coupon.startDate.split("T")[0],
        endDate: coupon.endDate.split("T")[0],
        minOrderValue: coupon.conditions.minOrderValue || 0,
        maxOrderValue: coupon.conditions.maxOrderValue,
        totalUses: coupon.usageLimit.totalUses,
        usesPerCustomer: coupon.usageLimit.usesPerCustomer || 1,
        isFirstOrderOnly: coupon.conditions.isFirstOrderOnly || false,
        requiresAuthentication: coupon.conditions.requiresAuthentication || false,
        buyQuantity: coupon.buyXGetY?.buyQuantity,
        getQuantity: coupon.buyXGetY?.getQuantity,
      });
      setCurrentUses(coupon.usageLimit.currentUses || 0);
    } catch (error) {
      toast.error("Failed to load coupon");
      router.push("/tenant/coupons");
    } finally {
      setLoading(false);
    }
  };

  const getTypeIcon = (type: CouponType) => {
    switch (type) {
      case "percentage":
        return <Percent className="h-4 w-4" />;
      case "fixed_amount":
        return <DollarSign className="h-4 w-4" />;
      case "free_shipping":
        return <Truck className="h-4 w-4" />;
      case "buy_x_get_y":
        return <Gift className="h-4 w-4" />;
      case "first_order":
        return <Star className="h-4 w-4" />;
      default:
        return <Tag className="h-4 w-4" />;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData) return;

    // Validation
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

    setSubmitting(true);
    try {
      const payload = {
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
          applicableTo: "all",
          minOrderValue: formData.minOrderValue,
          maxOrderValue: formData.maxOrderValue || undefined,
          isFirstOrderOnly: formData.isFirstOrderOnly,
          requiresAuthentication: formData.requiresAuthentication,
        },
        buyXGetY:
          formData.type === "buy_x_get_y"
            ? {
              buyQuantity: formData.buyQuantity || 2,
              getQuantity: formData.getQuantity || 1,
            }
            : undefined,
      };

      await apiRequest<any>("PUT", `/coupons/${couponId}`, payload);

      toast.success("Coupon updated successfully");
      router.push("/tenant/coupons");
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to update coupon";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !formData) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/tenant/coupons">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Edit Coupon</h1>
          <p className="text-muted-foreground">
            Editing <code className="font-mono text-primary">{formData.code}</code>
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Info */}
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
                <CardDescription>Update the coupon display details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="code">Coupon Code</Label>
                    <Input
                      id="code"
                      value={formData.code}
                      className="font-mono uppercase bg-muted"
                      disabled
                    />
                    <p className="text-xs text-muted-foreground">Code cannot be changed after creation</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="name">Display Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Summer Sale 20% Off"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Get 20% off on all summer collection items"
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Discount Type */}
            <Card>
              <CardHeader>
                <CardTitle>Discount Type</CardTitle>
                <CardDescription>Choose how the discount will be applied</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
                  {(["percentage", "fixed_amount", "free_shipping", "buy_x_get_y", "first_order"] as CouponType[]).map(
                    (type) => (
                      <Button
                        key={type}
                        type="button"
                        variant={formData.type === type ? "default" : "outline"}
                        className="h-auto py-3 flex-col gap-1"
                        onClick={() => setFormData({ ...formData, type })}
                      >
                        {getTypeIcon(type)}
                        <span className="text-xs text-center">{couponTypeLabels[type]}</span>
                      </Button>
                    )
                  )}
                </div>

                {formData.type !== "free_shipping" && formData.type !== "buy_x_get_y" && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
                    <div className="space-y-2">
                      <Label htmlFor="discountValue">
                        Discount Value {formData.type === "percentage" ? "(%)" : `(${currencySymbol})`}
                      </Label>
                      <Input
                        id="discountValue"
                        type="number"
                        min="0"
                        max={formData.type === "percentage" ? "100" : undefined}
                        value={formData.discountValue}
                        onChange={(e) => setFormData({ ...formData, discountValue: Number(e.target.value) })}
                      />
                    </div>
                    {formData.type === "percentage" && (
                      <div className="space-y-2">
                        <Label htmlFor="maxDiscount">Max Discount ({currencySymbol})</Label>
                        <Input
                          id="maxDiscount"
                          type="number"
                          min="0"
                          value={formData.maxDiscountAmount || ""}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              maxDiscountAmount: e.target.value ? Number(e.target.value) : undefined,
                            })
                          }
                          placeholder="No limit"
                        />
                      </div>
                    )}
                  </div>
                )}

                {formData.type === "buy_x_get_y" && (
                  <div className="grid grid-cols-2 gap-4 pt-4">
                    <div className="space-y-2">
                      <Label htmlFor="buyQuantity">Buy Quantity</Label>
                      <Input
                        id="buyQuantity"
                        type="number"
                        min="1"
                        value={formData.buyQuantity || 2}
                        onChange={(e) => setFormData({ ...formData, buyQuantity: Number(e.target.value) })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="getQuantity">Get Free Quantity</Label>
                      <Input
                        id="getQuantity"
                        type="number"
                        min="1"
                        value={formData.getQuantity || 1}
                        onChange={(e) => setFormData({ ...formData, getQuantity: Number(e.target.value) })}
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Conditions */}
            <Card>
              <CardHeader>
                <CardTitle>Conditions</CardTitle>
                <CardDescription>Set requirements for using this coupon</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="minOrder">Minimum Order Value ({currencySymbol})</Label>
                    <Input
                      id="minOrder"
                      type="number"
                      min="0"
                      value={formData.minOrderValue}
                      onChange={(e) => setFormData({ ...formData, minOrderValue: Number(e.target.value) })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="maxOrder">Maximum Order Value ({currencySymbol})</Label>
                    <Input
                      id="maxOrder"
                      type="number"
                      min="0"
                      value={formData.maxOrderValue || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          maxOrderValue: e.target.value ? Number(e.target.value) : undefined,
                        })
                      }
                      placeholder="No limit"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="totalUses">Total Uses Limit</Label>
                    <Input
                      id="totalUses"
                      type="number"
                      min="1"
                      value={formData.totalUses || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          totalUses: e.target.value ? Number(e.target.value) : undefined,
                        })
                      }
                      placeholder="Unlimited"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="usesPerCustomer">Uses Per Customer</Label>
                    <Input
                      id="usesPerCustomer"
                      type="number"
                      min="1"
                      value={formData.usesPerCustomer}
                      onChange={(e) => setFormData({ ...formData, usesPerCustomer: Number(e.target.value) })}
                    />
                  </div>
                </div>

                <div className="space-y-4 pt-2">
                  <div className="flex items-center justify-between p-4 rounded-lg border">
                    <div className="space-y-0.5">
                      <Label>First Order Only</Label>
                      <p className="text-xs text-muted-foreground">Only allow first-time customers to use this coupon</p>
                    </div>
                    <Switch
                      checked={formData.isFirstOrderOnly}
                      onCheckedChange={(checked) => setFormData({ ...formData, isFirstOrderOnly: checked })}
                    />
                  </div>
                  <div className="flex items-center justify-between p-4 rounded-lg border">
                    <div className="space-y-0.5">
                      <Label>Requires Login</Label>
                      <p className="text-xs text-muted-foreground">Customer must be logged in to use this coupon</p>
                    </div>
                    <Switch
                      checked={formData.requiresAuthentication}
                      onCheckedChange={(checked) => setFormData({ ...formData, requiresAuthentication: checked })}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Status & Dates */}
            <Card>
              <CardHeader>
                <CardTitle>Status & Schedule</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(v) => setFormData({ ...formData, status: v as CouponStatus })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="endDate">End Date</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Usage Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Usage Statistics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center p-4 rounded-lg bg-muted/50">
                  <p className="text-3xl font-bold">{currentUses}</p>
                  <p className="text-sm text-muted-foreground">
                    {formData.totalUses ? `of ${formData.totalUses} uses` : "total uses"}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Preview */}
            <Card>
              <CardHeader>
                <CardTitle>Preview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="p-4 rounded-lg border-2 border-dashed bg-muted/30 space-y-2">
                  <div className="flex items-center gap-2">
                    {getTypeIcon(formData.type)}
                    <code className="font-mono font-bold text-primary">{formData.code}</code>
                  </div>
                  <p className="font-medium">{formData.name || "Coupon Name"}</p>
                  <p className="text-sm text-muted-foreground">
                    {formData.type === "percentage" && `${formData.discountValue}% off`}
                    {formData.type === "fixed_amount" && `${currencySymbol}${formData.discountValue} off`}
                    {formData.type === "free_shipping" && "Free Shipping"}
                    {formData.type === "buy_x_get_y" &&
                      `Buy ${formData.buyQuantity || 2} Get ${formData.getQuantity || 1} Free`}
                    {formData.type === "first_order" && `${formData.discountValue}% off (First Order)`}
                  </p>
                  {formData.minOrderValue > 0 && (
                    <p className="text-xs text-muted-foreground">
                      Min. order: {currencySymbol}
                      {formData.minOrderValue}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex flex-col gap-2">
              <Button type="submit" disabled={submitting} className="w-full">
                {submitting ? (
                  <>
                    <Spinner className="mr-2 h-4 w-4" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Changes
                  </>
                )}
              </Button>
              <Button type="button" variant="outline" asChild className="w-full">
                <Link href="/tenant/coupons">Cancel</Link>
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}

