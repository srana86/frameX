"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "sonner";
import { Tag, X, Check, Percent, DollarSign, Truck, Gift } from "lucide-react";
import type { ApplyCouponResponse, CouponType } from "@/lib/coupon-types";
import { useCurrencySymbol } from "@/hooks/use-currency";
import { apiRequest } from "@/lib/api-client";

interface CartItem {
  productId: string;
  categoryId?: string;
  quantity: number;
  price: number;
}

interface CouponInputProps {
  cartSubtotal: number;
  cartItems: CartItem[];
  customerEmail?: string;
  customerPhone?: string;
  isFirstOrder?: boolean;
  onCouponApplied: (response: ApplyCouponResponse) => void;
  onCouponRemoved: () => void;
  appliedCoupon?: ApplyCouponResponse | null;
}

export function CouponInput({
  cartSubtotal,
  cartItems,
  customerEmail,
  customerPhone,
  isFirstOrder = false,
  onCouponApplied,
  onCouponRemoved,
  appliedCoupon,
}: CouponInputProps) {
  const currencySymbol = useCurrencySymbol();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [showInput, setShowInput] = useState(!appliedCoupon);

  const handleApplyCoupon = async () => {
    if (!code.trim()) {
      toast.error("Please enter a coupon code");
      return;
    }

    setLoading(true);
    try {
      const data: any = await apiRequest("POST", "/coupons/apply", {
        code: code.trim(),
        cartSubtotal,
        cartItems,
        customerEmail,
        customerPhone,
        isFirstOrder,
      });

      if (data && data.success) {
        onCouponApplied(data);
        setCode("");
        setShowInput(false);
        toast.success(data.message);
      } else {
        toast.error(data?.message || "Invalid coupon code");
      }
    } catch (error: any) {
      toast.error(error?.message || "Failed to apply coupon. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    onCouponRemoved();
    setShowInput(true);
    setCode("");
    toast.success("Coupon removed");
  };

  const getTypeIcon = (type: CouponType) => {
    switch (type) {
      case "percentage":
        return <Percent className="h-3 w-3" />;
      case "fixed_amount":
        return <DollarSign className="h-3 w-3" />;
      case "free_shipping":
        return <Truck className="h-3 w-3" />;
      case "buy_x_get_y":
        return <Gift className="h-3 w-3" />;
      default:
        return <Tag className="h-3 w-3" />;
    }
  };

  // If coupon is applied, show the applied coupon badge
  if (appliedCoupon && appliedCoupon.success && !showInput) {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium flex items-center gap-2">
            <Tag className="h-4 w-4 text-primary" />
            Coupon Applied
          </span>
        </div>
        <div className="flex items-center justify-between bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg p-3">
          <div className="flex items-center gap-2">
            <Badge className="bg-green-500 text-white flex items-center gap-1">
              {getTypeIcon(appliedCoupon.discountType)}
              {appliedCoupon.coupon?.code}
            </Badge>
            <span className="text-sm text-green-700 dark:text-green-300 font-medium">
              -{currencySymbol}{appliedCoupon.discount.toFixed(2)}
              {appliedCoupon.freeShipping && " + Free Shipping"}
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRemoveCoupon}
            className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium flex items-center gap-2">
          <Tag className="h-4 w-4 text-muted-foreground" />
          Have a coupon?
        </span>
      </div>
      <div className="flex gap-2">
        <Input
          placeholder="Enter code"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleApplyCoupon();
            }
          }}
          className="font-mono uppercase h-10"
          disabled={loading}
        />
        <Button
          onClick={handleApplyCoupon}
          disabled={loading || !code.trim()}
          size="default"
          className="shrink-0"
        >
          {loading ? (
            <Spinner className="h-4 w-4" />
          ) : (
            <>
              <Check className="h-4 w-4 mr-1" />
              Apply
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

