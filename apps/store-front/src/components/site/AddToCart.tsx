"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Product } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCart } from "@/components/providers/cart-provider";
import { toast } from "sonner";

import {
  ShoppingCart,
  Plus,
  Minus,
  Check,
  Share2,
  LucideShoppingCart,
} from "lucide-react";
import { AddToWishlist } from "./AddToWishlist";
import { useCurrencySymbol } from "@/hooks/use-currency";
import { generateEventId } from "@/lib/tracking/server-side-tracking";
import { getUserDataForTracking } from "@/lib/tracking/user-data-store";

export function AddToCart({ product, currencyCode }: { product: Product; currencyCode: string }) {
  const { addItem } = useCart();
  const currencySymbol = useCurrencySymbol();
  const router = useRouter();
  const [size, setSize] = useState<string | undefined>(product.sizes?.[0]);
  const [color, setColor] = useState<string | undefined>(product.colors?.[0]);
  const [qty, setQty] = useState(1);
  const image = product.images[0] ?? "/file.svg";
  const [adding, setAdding] = useState(false);
  const [justAdded, setJustAdded] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const isOutOfStock = product.stock !== undefined && product.stock <= 0;

  // Calculate final price (discounted if discountPercentage exists)
  const price = Number(product.price) || 0;
  const discountPct = Number(product.discountPercentage) || 0;
  const finalPrice = discountPct > 0 ? price * (1 - discountPct / 100) : price;

  // Track product detail page views for Meta Pixel (ViewContent)
  useEffect(() => {
    if (typeof window === "undefined") return;

    const eventId = generateEventId();
    let attempts = 0;

    // Get stored user data for better event matching
    const storedUserData = getUserDataForTracking();

    // Always send server-side ViewContent (deduped with client via eventId)
    import("@/lib/tracking/server-side-tracking")
      .then(({ trackViewContent }) =>
        trackViewContent({
          productId: product.id,
          productName: product.name,
          price: finalPrice,
          currency: currencyCode,
          category: product.category,
          eventId,
          userData: storedUserData,
        }).catch(() => { })
      )
      .catch(() => { });

    const sendPixelViewEvent = () => {
      const fbq = (window as any).fbq;
      if (!fbq) return false;

      fbq("track", "ViewContent", {
        content_ids: [product.id],
        content_type: "product",
        content_name: product.name,
        content_category: product.category || "Product",
        value: finalPrice,
        currency: currencyCode,
        contents: [
          {
            id: product.id,
            quantity: 1,
            item_price: finalPrice,
            item_name: product.name,
            item_category: product.category || "Product",
          },
        ],
        eventID: eventId,
      });
      return true;
    };

    // Try immediately, then retry a few times in case pixel script isn't ready yet
    const initialSent = sendPixelViewEvent();
    if (initialSent) return;

    const interval = window.setInterval(() => {
      attempts += 1;
      const sent = sendPixelViewEvent();
      if (sent || attempts >= 6) {
        window.clearInterval(interval);
      }
    }, 300);

    return () => {
      window.clearInterval(interval);
    };
  }, [product.id, product.name, product.category, finalPrice, currencyCode]);

  const sendAddToCartPixel = (eventId: string, quantity: number) => {
    if (typeof window === "undefined") return;
    const fbq = (window as any).fbq;
    if (!fbq) return;

    // Pass eventID in the options object (4th parameter) for proper deduplication
    fbq(
      "track",
      "AddToCart",
      {
        content_ids: [product.id],
        content_type: "product",
        content_name: product.name,
        content_category: product.category || "Product",
        value: finalPrice * quantity,
        currency: currencyCode,
        contents: [
          {
            id: product.id,
            quantity,
            item_price: finalPrice,
            item_name: product.name,
            item_category: product.category || "Product",
          },
        ],
      },
      { eventID: eventId }
    );
  };

  const handleAdd = () => {
    if (adding || isOutOfStock) return;

    // Validate size selection if product has sizes
    if (product.sizes && product.sizes.length > 0 && !size) {
      toast.error("Please select a size before adding to cart", {
        duration: 3000,
      });
      return;
    }

    // Validate color selection if product has colors
    if (product.colors && product.colors.length > 0 && !color) {
      toast.error("Please select a color before adding to cart", {
        duration: 3000,
      });
      return;
    }

    // Validate stock before adding
    if (product.stock !== undefined) {
      const availableStock = product.stock;
      if (qty > availableStock) {
        toast.error(`Only ${availableStock} item${availableStock !== 1 ? "s" : ""} available in stock`, {
          duration: 3000,
        });
        return;
      }
    }

    setAdding(true);

    const eventId = generateEventId();

    addItem(
      {
        productId: product.id,
        slug: product.slug,
        name: product.name,
        price: finalPrice,
        image,
        size,
        color,
        category: product.category,
      },
      qty,
      { eventId }
    );

    // Track client-side Meta Pixel AddToCart (deduplicated with server via eventId)
    sendAddToCartPixel(eventId, qty);

    // Show success toast with product info
    let toastId: string | number | undefined;
    toastId = toast.success(
      <div className='flex items-center gap-3 max-w-md'>
        <div className='relative w-11 h-11 overflow-hidden rounded-md border bg-background shrink-0'>
          <img src={image} alt={product.name} className='w-full h-full object-contain p-1' />
        </div>
        <div className='flex-1 min-w-0 max-w-[140px]'>
          <p className='font-semibold text-sm leading-tight'>Added to cart!</p>
          <p className='text-xs text-muted-foreground truncate'>{product.name}</p>
          <p className='text-xs font-medium text-primary mt-0.5'>
            {qty} × {currencySymbol}
            {finalPrice.toFixed(2)}
          </p>
        </div>
        <Button asChild size='sm' variant='outline' className='h-8 px-3 shrink-0'>
          <Link
            href='/cart'
            onClick={() => {
              if (toastId !== undefined) toast.dismiss(toastId);
            }}
          >
            View
          </Link>
        </Button>
      </div>,
      { duration: 2600 }
    );

    setJustAdded(true);
    setTimeout(() => {
      setAdding(false);
      setTimeout(() => setJustAdded(false), 2000);
    }, 600);
  };

  const incrementQty = () => {
    if (isOutOfStock) return;
    setQty((prev) => {
      if (product.stock !== undefined && prev >= product.stock) return prev;
      return prev + 1;
    });
  };
  const decrementQty = () => setQty((prev) => Math.max(1, prev - 1));

  const handleBuyNow = () => {
    if (isOutOfStock) return;

    // Validate size selection if product has sizes
    if (product.sizes && product.sizes.length > 0 && !size) {
      toast.error("Please select a size before buying", {
        duration: 3000,
      });
      return;
    }

    // Validate color selection if product has colors
    if (product.colors && product.colors.length > 0 && !color) {
      toast.error("Please select a color before buying", {
        duration: 3000,
      });
      return;
    }

    // Validate stock before checkout to avoid redirecting with an empty cart
    if (product.stock !== undefined && qty > product.stock) {
      const availableStock = product.stock;
      toast.error(`Only ${availableStock} item${availableStock !== 1 ? "s" : ""} available in stock`, {
        duration: 3000,
      });
      return;
    }

    const eventId = generateEventId();

    addItem(
      {
        productId: product.id,
        slug: product.slug,
        name: product.name,
        price: finalPrice,
        image,
        size,
        color,
        category: product.category,
      },
      qty,
      { eventId, skipCartOpen: true }
    );

    // Track AddToCart before moving to checkout (for Buy Now)
    sendAddToCartPixel(eventId, qty);

    // Use client navigation so cart state stays intact on checkout
    router.push("/checkout");
  };

  const handleShare = async () => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    const shareData = {
      title: product.name,
      text: "Check out this product",
      url,
    };
    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch {
        /* ignore */
      }
    } else {
      navigator.clipboard?.writeText(url);
      toast.success("Link copied to clipboard");
    }
  };

  return (
    <div className='space-y-4'>
      {/* Size Selection */}
      {product.sizes && product.sizes.length > 0 && (
        <div className='space-y-2.5'>
          <div className='flex items-center justify-between'>
            <label className='text-sm font-medium'>Size</label>
            {size && (
              <span className='text-xs text-muted-foreground'>
                Selected: <span className='font-medium text-foreground'>{size}</span>
              </span>
            )}
          </div>
          <div className='flex flex-wrap gap-1.5 sm:gap-2'>
            {product.sizes.map((s) => (
              <button
                key={s}
                type='button'
                onClick={() => setSize(s)}
                className={`relative h-9 sm:h-10 px-2.5 sm:px-3 min-w-[40px] sm:min-w-[44px] whitespace-nowrap rounded-lg sm:rounded-xl border-2 text-xs sm:text-sm font-medium transition-all duration-200 ${size === s
                    ? "border-primary bg-primary/10 text-primary shadow-md scale-105"
                    : "border-border hover:border-primary/50 hover:bg-accent/50"
                  }`}
              >
                {s}
                {size === s && (
                  <div className='absolute -top-1 -right-1 w-3.5 h-3.5 sm:w-4 sm:h-4 bg-green-500 rounded-full flex items-center justify-center'>
                    <Check className='w-2 h-2 sm:w-2.5 sm:h-2.5 text-white' />
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Color Selection */}
      {product.colors && product.colors.length > 0 && (
        <div className='space-y-2.5'>
          <div className='flex items-center justify-between'>
            <label className='text-sm font-medium'>Color</label>
            {color && (
              <span className='text-xs text-muted-foreground'>
                Selected: <span className='font-medium text-foreground'>{color}</span>
              </span>
            )}
          </div>
          <div className='flex flex-wrap gap-2'>
            {product.colors.map((c) => {
              const isColorName = /^[a-zA-Z]+$/.test(c);
              return (
                <button
                  key={c}
                  type='button'
                  onClick={() => setColor(c)}
                  className={`relative h-10 px-3 sm:px-4 rounded-xl border-2 text-xs sm:text-sm font-medium transition-all duration-200 flex items-center gap-2 ${color === c
                      ? "border-primary bg-primary/10 text-primary shadow-md scale-105"
                      : "border-border hover:border-primary/50 hover:bg-accent/50 hover:scale-102"
                    }`}
                >
                  {isColorName && (
                    <span
                      className='w-4 h-4 sm:w-5 sm:h-5 rounded-full border-2 border-gray-300 dark:border-gray-600 shrink-0 shadow-inner'
                      style={{ backgroundColor: c.toLowerCase() }}
                    />
                  )}
                  <span>{c}</span>
                  {color === c && (
                    <div className='absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center'>
                      <Check className='w-2.5 h-2.5 text-white' />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Quantity & Add to Cart Section */}
      <div className='space-y-3'>
        <label className='text-sm font-medium'>Quantity</label>
        <div className='flex items-center gap-3 mt-2.5'>
          {/* Quantity Selector */}
          <div className='flex items-center border border-border rounded-lg overflow-hidden bg-background shrink-0'>
            <Button
              variant='ghost'
              size='icon'
              onClick={decrementQty}
              disabled={qty <= 1}
              className='h-9 w-9 sm:h-10 sm:w-10 rounded-none hover:bg-accent disabled:opacity-40'
            >
              <Minus className='w-3.5 h-3.5 sm:w-4 sm:h-4' />
            </Button>
            <span className='w-10 sm:w-12 text-center text-sm sm:text-base font-bold bg-accent/40 border-x border-border'>{qty}</span>
            <Button
              variant='ghost'
              size='icon'
              onClick={incrementQty}
              disabled={isOutOfStock || (product.stock !== undefined && qty >= product.stock)}
              className='h-9 w-9 sm:h-10 sm:w-10 rounded-none hover:bg-accent disabled:opacity-40'
            >
              <Plus className='w-3.5 h-3.5 sm:w-4 sm:h-4' />
            </Button>
          </div>

          {/* Add to Cart Button - Secondary CTA */}
          <Button
            ref={buttonRef}
            onClick={handleAdd}
            disabled={adding || isOutOfStock}
            variant='outline'
            className={`flex-1 h-8! sm:h-10! text-xs sm:text-sm font-medium rounded-xl border-border/60 hover:border-primary/40 hover:bg-primary/5 transition-all duration-200 ${isOutOfStock ? "opacity-60 cursor-not-allowed" : ""
              }`}
          >
            <div className='flex items-center justify-center gap-1.5 sm:gap-2'>
              {adding ? (
                <>
                  <div className='w-3.5 h-3.5 sm:w-4 sm:h-4 border-2 border-muted-foreground/30 border-t-primary rounded-full animate-spin' />
                  <span className='animate-pulse'>Adding...</span>
                </>
              ) : justAdded ? (
                <>
                  <Check className='w-3.5 h-3.5 sm:w-4 sm:h-4' />
                  <span>Added</span>
                </>
              ) : (
                <>
                  <LucideShoppingCart className='w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0' />
                  <span className='truncate'>Add to Cart</span>
                </>
              )}
            </div>
          </Button>
        </div>
      </div>

      {/* Buy Now Button - Primary CTA with Psychological Triggers */}
      <div className='relative'>
        <Button
          onClick={handleBuyNow}
          disabled={isOutOfStock}
          className={`w-full h-12 sm:h-14 text-base sm:text-lg font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 ${isOutOfStock
              ? "opacity-60 cursor-not-allowed"
              : "bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary animate-pulse-once"
            }`}
        >
          <ShoppingCart className='w-5 h-5 mr-2' />
          <span className='font-extrabold'>Buy Now</span>
          <span className='ml-2 font-semibold'>
            – {currencySymbol}
            {(finalPrice * qty).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
          </span>
        </Button>
        {!isOutOfStock && (
          <div className='absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full animate-bounce'>
            HOT
          </div>
        )}
      </div>

      {/* COD Message under Buy Now - Enhanced trust signals */}
      <div className='text-center space-y-1'>
        <p className='text-sm font-medium text-emerald-600 dark:text-emerald-400'>✓ Cash on Delivery Available</p>
        <p className='text-xs text-muted-foreground'>Pay when you receive • No advance payment • Fast delivery</p>
      </div>

      {/* Stock Status */}
      {isOutOfStock && (
        <div className='flex items-center justify-between gap-2 rounded-lg border border-amber-200/70 bg-amber-50/70 dark:bg-amber-950/30 dark:border-amber-800/50 px-3 py-2 text-amber-700 dark:text-amber-400'>
          <div className='flex items-center gap-2'>
            <div className='w-2 h-2 bg-amber-500 rounded-full animate-pulse' />
            <span className='text-xs font-semibold'>Out of stock</span>
          </div>
          <Badge
            variant='secondary'
            className='h-6 px-2 text-[11px] bg-amber-100 dark:bg-amber-900/50 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400'
          >
            Restocking soon
          </Badge>
        </div>
      )}

      {/* Share & Wishlist Section - Bottom */}
      <div className='pt-2 border-t border-border/50'>
        <div className='flex items-center justify-between gap-3'>
          <span className='text-xs sm:text-sm font-medium text-muted-foreground'>Share this product</span>
          <div className='flex items-center gap-2'>
            <button
              type='button'
              onClick={handleShare}
              className='inline-flex items-center gap-1.5 rounded-full border border-border/80 px-3 py-1.5 sm:py-2 hover:bg-accent hover:border-primary/30 transition-all duration-200 shadow-xs cursor-pointer text-xs sm:text-sm'
            >
              <Share2 className='h-3.5 w-3.5 sm:h-4 sm:w-4' />
              <span className='font-medium hidden sm:inline'>Share</span>
            </button>
            <AddToWishlist product={product} className='h-8 w-8 sm:h-9 sm:w-9' />
          </div>
        </div>
      </div>
    </div>
  );
}

export default AddToCart;
