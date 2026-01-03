"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "sonner";
import { Tag, Copy, Check, Percent, DollarSign, Truck, Gift, ChevronDown, ChevronUp, X } from "lucide-react";
import type { Coupon, CouponType, ApplyCouponResponse } from "@/lib/coupon-types";
import { useCurrencySymbol } from "@/hooks/use-currency";
import { apiRequest } from "@/lib/api-client";

interface ProductCouponPreviewProps {
  productPrice: number;
  productId?: string;
  categoryId?: string;
}

export function ProductCouponPreview({ productPrice, productId, categoryId }: ProductCouponPreviewProps) {
  const currencySymbol = useCurrencySymbol();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Coupon input state
  const [inputCode, setInputCode] = useState("");
  const [validating, setValidating] = useState(false);
  const [validatedCoupon, setValidatedCoupon] = useState<ApplyCouponResponse | null>(null);

  useEffect(() => {
    loadCoupons();
  }, []);

  const loadCoupons = async () => {
    try {
      const data = await apiRequest<any>("GET", "/coupons?status=active&limit=10");

      if (data) {
        const activeCoupons = (data.coupons || []).filter((coupon: Coupon) => {
          if (coupon.status !== "active") return false;
          const now = new Date();
          const startDate = new Date(coupon.startDate);
          const endDate = new Date(coupon.endDate);
          if (startDate > now || endDate < now) return false;
          if (!coupon.conditions || coupon.conditions.applicableTo === "all") return true;
          if (coupon.conditions.applicableTo === "products" && coupon.conditions.productIds?.length) {
            if (!productId || !coupon.conditions.productIds.includes(productId)) return false;
          }
          if (coupon.conditions.applicableTo === "categories" && coupon.conditions.categoryIds?.length) {
            if (!categoryId || !coupon.conditions.categoryIds.includes(categoryId)) return false;
          }
          if (productId && coupon.conditions.excludedProductIds?.includes(productId)) return false;
          return true;
        });
        setCoupons(activeCoupons);
      }
    } catch (error) {
      console.error("[ProductCouponPreview] Error loading coupons:", error);
    } finally {
      setLoading(false);
    }
  };

  const validateCoupon = async () => {
    if (!inputCode.trim()) {
      toast.error("Please enter a coupon code");
      return;
    }

    setValidating(true);
    try {
      const data: ApplyCouponResponse = await apiRequest("POST", "/coupons/apply", {
        code: inputCode.trim(),
        cartSubtotal: productPrice,
        cartItems: [{ productId: productId || "", quantity: 1, price: productPrice }],
      });

      if (data.success) {
        setValidatedCoupon(data);
        toast.success(data.message || "Coupon is valid!", {
          description: `You'll save ${currencySymbol}${data.discount.toFixed(2)} when you checkout`,
        });
      } else {
        toast.error(data.message || "Invalid coupon code");
        setValidatedCoupon(null);
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to validate coupon");
      setValidatedCoupon(null);
    } finally {
      setValidating(false);
    }
  };

  const clearValidation = () => {
    setInputCode("");
    setValidatedCoupon(null);
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast.success(`Copied: ${code}`);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const applyToInput = (code: string) => {
    setInputCode(code);
    setValidatedCoupon(null);
  };

  const getTypeIcon = (type: CouponType) => {
    switch (type) {
      case "percentage":
        return <Percent className='h-3 w-3' />;
      case "fixed_amount":
        return <DollarSign className='h-3 w-3' />;
      case "free_shipping":
        return <Truck className='h-3 w-3' />;
      case "buy_x_get_y":
        return <Gift className='h-3 w-3' />;
      default:
        return <Tag className='h-3 w-3' />;
    }
  };

  const formatDiscount = (coupon: Coupon) => {
    switch (coupon.type) {
      case "percentage":
        return `${coupon.discountValue}% OFF`;
      case "fixed_amount":
        return `${currencySymbol}${coupon.discountValue} OFF`;
      case "free_shipping":
        return "FREE SHIPPING";
      case "buy_x_get_y":
        return `Buy ${coupon.buyXGetY?.buyQuantity || 2} Get ${coupon.buyXGetY?.getQuantity || 1} FREE`;
      case "first_order":
        return `${coupon.discountValue}% OFF (First Order)`;
      default:
        return `${coupon.discountValue}% OFF`;
    }
  };

  const calculateSavings = (coupon: Coupon) => {
    if (coupon.type === "percentage") {
      let discount = productPrice * (coupon.discountValue / 100);
      if (coupon.maxDiscountAmount && discount > coupon.maxDiscountAmount) {
        discount = coupon.maxDiscountAmount;
      }
      return discount;
    }
    if (coupon.type === "fixed_amount") {
      return Math.min(coupon.discountValue, productPrice);
    }
    return 0;
  };

  if (loading) {
    return (
      <div className='space-y-2'>
        <div className='flex items-center gap-2'>
          <div className='h-4 w-4 bg-muted rounded animate-pulse' />
          <div className='h-4 w-20 bg-muted rounded animate-pulse' />
        </div>
        <div className='h-10 bg-muted rounded-lg animate-pulse' />
      </div>
    );
  }

  const displayCoupons = expanded ? coupons : coupons.slice(0, 2);
  const hasMore = coupons.length > 2;

  return (
    <div className='space-y-3'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <span className='text-sm font-medium flex items-center gap-2'>
          <Tag className='h-4 w-4 text-muted-foreground' />
          {coupons.length > 0 ? "Apply Coupon" : "Have a Coupon?"}
        </span>
        {coupons.length > 0 && (
          <Badge variant='secondary' className='text-xs'>
            {coupons.length} available
          </Badge>
        )}
      </div>

      {/* Coupon Input Field */}
      {validatedCoupon?.success ? (
        <div className='flex items-center justify-between bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg p-3'>
          <div className='flex items-center gap-2'>
            <Badge className='bg-green-500 text-white flex items-center gap-1'>
              {getTypeIcon(validatedCoupon.discountType)}
              {validatedCoupon.coupon?.code}
            </Badge>
            <span className='text-sm text-green-700 dark:text-green-300 font-medium'>
              -{currencySymbol}
              {validatedCoupon.discount.toFixed(2)}
              {validatedCoupon.freeShipping && " + Free Shipping"}
            </span>
          </div>
          <Button variant='ghost' size='sm' onClick={clearValidation} className='h-7 w-7 p-0 text-muted-foreground hover:text-destructive'>
            <X className='h-4 w-4' />
          </Button>
        </div>
      ) : (
        <div className='flex gap-2'>
          <Input
            placeholder='Enter code'
            value={inputCode}
            onChange={(e) => setInputCode(e.target.value.toUpperCase())}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                validateCoupon();
              }
            }}
            className='font-mono uppercase h-10'
            disabled={validating}
          />
          <Button onClick={validateCoupon} disabled={validating || !inputCode.trim()} size='default' className='shrink-0'>
            {validating ? (
              <Spinner className='h-4 w-4' />
            ) : (
              <>
                <Check className='h-4 w-4 mr-1' />
                Apply
              </>
            )}
          </Button>
        </div>
      )}

      {/* Available Coupons List */}
      {coupons.length > 0 && !validatedCoupon?.success && (
        <div className='space-y-2'>
          <p className='text-xs text-muted-foreground'>Or select from available coupons:</p>
          <div className='space-y-1.5'>
            {displayCoupons.map((coupon) => {
              const savings = calculateSavings(coupon);
              const isCopied = copiedCode === coupon.code;

              return (
                <div
                  key={coupon.id}
                  className='flex items-center justify-between gap-2 p-2.5 rounded-lg border bg-card hover:bg-accent/50 transition-colors group'
                >
                  <div className='flex items-center gap-2 flex-1 min-w-0'>
                    <code className='font-mono font-bold text-xs text-primary bg-primary/10 px-1.5 py-0.5 rounded'>{coupon.code}</code>
                    <span className='text-xs text-muted-foreground'>{formatDiscount(coupon)}</span>
                    {savings > 0 && (
                      <span className='text-xs text-green-600 font-medium hidden sm:inline'>
                        (Save {currencySymbol}
                        {savings.toFixed(2)})
                      </span>
                    )}
                  </div>
                  <div className='flex items-center gap-1 shrink-0'>
                    <Button variant='ghost' size='sm' onClick={() => applyToInput(coupon.code)} className='h-7 px-2 text-xs'>
                      Use
                    </Button>
                    <Button variant='ghost' size='sm' onClick={() => copyCode(coupon.code)} className='h-7 w-7 p-0'>
                      {isCopied ? <Check className='h-3 w-3 text-green-600' /> : <Copy className='h-3 w-3 text-muted-foreground' />}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>

          {hasMore && (
            <Button variant='ghost' size='sm' onClick={() => setExpanded(!expanded)} className='w-full text-xs text-muted-foreground'>
              {expanded ? (
                <>
                  <ChevronUp className='h-3 w-3 mr-1' />
                  Show less
                </>
              ) : (
                <>
                  <ChevronDown className='h-3 w-3 mr-1' />
                  Show {coupons.length - 2} more
                </>
              )}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
