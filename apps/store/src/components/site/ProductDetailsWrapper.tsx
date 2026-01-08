"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { ShoppingCart, Check, Loader2, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/components/providers/cart-provider";
import { useCurrencySymbol } from "@/hooks/use-currency";
import { toast } from "sonner";
import { generateEventId } from "@/lib/tracking/server-side-tracking";
import type { Product } from "@/lib/types";
import { cn } from "@/lib/utils";

interface ProductDetailsWrapperProps {
  product: Product;
  currencyCode: string;
  children: React.ReactNode;
}

export function ProductDetailsWrapper({
  product,
  currencyCode,
  children,
}: ProductDetailsWrapperProps) {
  const { addItem } = useCart();
  const currencySymbol = useCurrencySymbol();
  const router = useRouter();
  const [isBarVisible, setIsBarVisible] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [justAdded, setJustAdded] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);

  const isOutOfStock = product.stock !== undefined && product.stock <= 0;
  const finalPrice =
    product.discountPercentage && product.discountPercentage > 0
      ? product.price * (1 - product.discountPercentage / 100)
      : product.price;
  const image = product.images[0] ?? "/file.svg";

  // Show sticky bar when scrolled past the main add to cart button
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      // Show after scrolling 500px (roughly past the main product info)
      setIsBarVisible(scrollY > 500);
      setShowScrollTop(scrollY > 800);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const sendAddToCartPixel = (eventId: string, qty: number) => {
    if (typeof window === "undefined") return;
    const fbq = (window as any).fbq;
    if (!fbq) return;

    fbq(
      "track",
      "AddToCart",
      {
        content_ids: [product.id],
        content_type: "product",
        content_name: product.name,
        content_category: product.category || "Product",
        value: finalPrice * qty,
        currency: currencyCode,
        contents: [
          {
            id: product.id,
            quantity: qty,
            item_price: finalPrice,
            item_name: product.name,
            item_category: product.category || "Product",
          },
        ],
      },
      { eventID: eventId }
    );
  };

  const handleBuyNow = () => {
    if (isOutOfStock || isAdding) return;

    setIsAdding(true);
    const eventId = generateEventId();

    // Use first available size/color as default for quick buy
    const defaultSize = product.sizes?.[0];
    const defaultColor = product.colors?.[0];

    addItem(
      {
        productId: product.id,
        slug: product.slug,
        name: product.name,
        price: finalPrice,
        image,
        size: defaultSize,
        color: defaultColor,
        category: product.category,
      },
      1,
      { eventId, skipCartOpen: true }
    );

    sendAddToCartPixel(eventId, 1);
    setJustAdded(true);

    setTimeout(() => {
      router.push("/checkout");
      setIsAdding(false);
      setJustAdded(false);
    }, 300);
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="relative">
      {/* Main content */}
      {children}

      {/* Mobile Sticky Buy Bar */}
      <div
        className={cn(
          "fixed bottom-20 left-0 right-0 z-40 md:hidden",
          "transform transition-all duration-300 ease-out",
          isBarVisible ? "translate-y-0 opacity-100" : "translate-y-full opacity-0"
        )}
      >
        <div className="mx-3 rounded-2xl overflow-hidden shadow-2xl">
          <div className="relative bg-background/95 backdrop-blur-xl border border-border/50 p-3">
            <div className="flex items-center gap-3">
              {/* Price info */}
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground truncate">{product.name}</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-lg font-bold text-foreground">
                    {currencySymbol}
                    {finalPrice.toLocaleString(undefined, {
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 0,
                    })}
                  </span>
                  {product.discountPercentage && product.discountPercentage > 0 && (
                    <span className="text-xs text-red-500 font-medium">
                      {product.discountPercentage}% off
                    </span>
                  )}
                </div>
              </div>

              {/* Buy Now button */}
              <Button
                onClick={handleBuyNow}
                disabled={isOutOfStock || isAdding}
                className={cn(
                  "h-12 px-6 rounded-xl font-semibold text-base",
                  "bg-primary hover:bg-primary/90",
                  "shadow-lg shadow-primary/25",
                  "transition-all duration-200",
                  isAdding && "opacity-80"
                )}
              >
                {isAdding ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : justAdded ? (
                  <>
                    <Check className="w-5 h-5 mr-1.5" />
                    Added
                  </>
                ) : (
                  <>
                    <ShoppingCart className="w-5 h-5 mr-1.5" />
                    Buy Now
                  </>
                )}
              </Button>
            </div>

            {/* COD indicator */}
            <div className="mt-2 flex items-center justify-center gap-1.5 text-[10px] text-emerald-600 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Cash on Delivery Available
            </div>
          </div>
        </div>
      </div>

      {/* Scroll to top button */}
      <button
        onClick={scrollToTop}
        className={cn(
          "fixed bottom-24 right-4 z-30 md:bottom-8",
          "w-10 h-10 rounded-full",
          "bg-background/90 backdrop-blur-sm border border-border/50",
          "shadow-lg flex items-center justify-center",
          "transition-all duration-300 ease-out",
          showScrollTop
            ? "translate-y-0 opacity-100"
            : "translate-y-4 opacity-0 pointer-events-none"
        )}
        aria-label="Scroll to top"
      >
        <ChevronUp className="w-5 h-5 text-muted-foreground" />
      </button>
    </div>
  );
}

export default ProductDetailsWrapper;

