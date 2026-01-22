"use client";

import Link from "next/link";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Star } from "lucide-react";
import type { Product } from "@/lib/types";
import { useCart } from "@/components/providers/cart-provider";
import { AddToWishlist } from "@/components/site/AddToWishlist";
import CloudImage from "@/components/site/CloudImage";
import { useCurrencySymbol } from "@/hooks/use-currency";

interface ProductCardProps {
  product: Product;
  layout?: "grid" | "single";
  singleColumn?: boolean;
}

export function ProductCard({ product, layout = "grid", singleColumn = false }: ProductCardProps) {
  const { addItem } = useCart();
  const currencySymbol = useCurrencySymbol();
  const image = product.images[0] ?? "/file.svg";
  const [adding, setAdding] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const isOutOfStock = product.stock !== undefined && product.stock <= 0;
  const isSingleView = layout === "single";
  // Use desktop sizes when in single column view (even on mobile)
  const useDesktopSizes = singleColumn;
  const hasDiscount = Boolean(product.discountPercentage && product.discountPercentage > 0);
  const colorsToShow = product.colors?.slice(0, 3) ?? [];
  const extraColors = Math.max((product.colors?.length ?? 0) - colorsToShow.length, 0);
  const categoryLabel = product.category || "Product";
  const descriptionText =
    (product.description
      ? product.description
          .replace(/<[^>]+>/g, "")
          .replace(/\s+/g, " ")
          .trim()
      : "") || "Thoughtfully crafted footwear built for daily comfort.";

  // Calculate final price (discounted if discountPercentage exists)
  const price = Number(product.price) || 0;
  const discountPct = Number(product.discountPercentage) || 0;
  const finalPrice = discountPct > 0 ? price * (1 - discountPct / 100) : price;

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (adding || isOutOfStock) return;
    setAdding(true);

    addItem({ productId: product.id, slug: product.slug, name: product.name, price: finalPrice, image, category: product.category }, 1);

    // Show success toast
    import("sonner").then(({ toast }) => {
      let toastId: string | number | undefined;
      toastId = toast.success(
        <div className='flex items-center gap-3 max-w-md'>
          <div className='relative w-11 h-11 overflow-hidden rounded-md border bg-background shrink-0'>
            <img src={image} alt={product.name} className='w-full h-full object-contain p-1' />
          </div>
          <div className='flex-1 min-w-0 max-w-[140px]'>
            <p className='font-semibold text-sm leading-tight'>Added to cart!</p>
            <p className='text-xs text-muted-foreground truncate'>{product.name}</p>
            <p className='text-[11px] font-semibold text-primary mt-0.5'>
              {currencySymbol}
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
        {
          duration: 2400,
        }
      );
    });

    setTimeout(() => setAdding(false), 600);
  };

  // Single view layout (horizontal)
  if (isSingleView) {
    return (
      <Card
        className={`group relative overflow-hidden bg-white dark:bg-card border border-border/50 rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 ${
          adding ? "scale-[0.98]" : "scale-100"
        }`}
      >
        {/* Featured Badge */}
        {product.featured && (
          <Badge className='absolute top-2 left-2 z-10 bg-linear-to-r from-amber-500 to-orange-500 text-white text-xs px-2 py-1 rounded-md shadow-sm'>
            <Star className='w-3 h-3 mr-1' />
            Featured
          </Badge>
        )}
        {/* Out of Stock Badge */}
        {isOutOfStock && (
          <Badge className='absolute top-2 right-2 z-10 bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-700 text-xs px-2 py-1 rounded-md shadow-sm'>
            Restocking Soon
          </Badge>
        )}

        <div className='flex flex-row gap-4'>
          {/* Image Container - Left Side */}
          <Link href={`/products/${product.slug}`} className='shrink-0 cursor-pointer focus:outline-none'>
            <div
              className={`relative w-24 aspect-4/3 overflow-hidden bg-gray-50 dark:bg-gray-800/50 rounded-lg ${
                isOutOfStock ? "opacity-75" : ""
              }`}
            >
              <CloudImage
                src={image}
                alt={product.name}
                fill
                className='object-contain transition-transform duration-500 group-hover:scale-105'
                sizes='96px'
              />
              {isOutOfStock && (
                <div className='absolute inset-0 bg-amber-50/30 dark:bg-amber-950/20 flex items-center justify-center'>
                  <span className='text-xs font-semibold text-amber-700 dark:text-amber-300'>Unavailable</span>
                </div>
              )}
              {adding && (
                <div className='absolute inset-0 bg-primary/10 flex items-center justify-center'>
                  <div className='w-8 h-8 rounded-full bg-primary animate-bounce flex items-center justify-center'>
                    <ShoppingCart className='w-4 h-4 text-primary-foreground' />
                  </div>
                </div>
              )}
            </div>
          </Link>

          {/* Content - Right Side */}
          <div className='flex-1 flex flex-col min-w-0'>
            <Link href={`/products/${product.slug}`} className='flex-1 flex flex-col cursor-pointer focus:outline-none'>
              <div className='space-y-1.5 flex-1'>
                <h3 className='font-semibold text-sm text-foreground line-clamp-2 leading-tight transition-colors duration-200 group-hover:text-primary'>
                  {product.name}
                </h3>
                <div className='flex items-center gap-2 text-xs text-muted-foreground'>
                  <span className='font-medium text-primary'>{product.brand}</span>
                  <span>•</span>
                  <span className='capitalize'>{product.category}</span>
                </div>
                <div className='flex items-center justify-between mt-2'>
                  <div>
                      {discountPct > 0 ? (
                      <>
                        <p className='text-lg font-bold text-foreground'>
                          {currencySymbol}
                          {finalPrice.toFixed(2)}
                        </p>
                        <p className='text-xs text-muted-foreground line-through'>
                          {currencySymbol}
                          {price.toFixed(2)}
                        </p>
                      </>
                    ) : (
                      <p className='text-lg font-bold text-foreground'>
                        {currencySymbol}
                        {price.toFixed(2)}
                      </p>
                    )}
                  </div>
                  <div className='flex items-center gap-1'>
                    <div className='flex'>
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className={`w-3 h-3 ${i < 4 ? "fill-yellow-400 text-yellow-400" : "fill-gray-200 text-gray-200"}`} />
                      ))}
                    </div>
                    <span className='text-xs text-muted-foreground'>4.2</span>
                  </div>
                </div>
              </div>
            </Link>

            {/* Action Buttons */}
            <div className='flex items-center gap-2'>
              <Button
                size='sm'
                onClick={handleAdd}
                disabled={adding || isOutOfStock}
                className={`flex-1 h-9 text-xs font-medium relative overflow-hidden transition-all duration-300 focus:outline-none focus:ring-0 ${
                  isOutOfStock
                    ? "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-700"
                    : adding
                    ? "bg-green-600 hover:bg-green-700 text-white"
                    : "bg-primary hover:bg-primary/90 text-primary-foreground"
                }`}
              >
                {adding && <div className='absolute inset-0 bg-linear-to-r from-green-500 to-green-600 animate-pulse' />}
                <div className='relative flex items-center justify-center gap-1.5'>
                  <ShoppingCart className={`w-3.5 h-3.5 ${adding ? "animate-bounce" : ""}`} />
                  <span>{adding ? "Added!" : isOutOfStock ? "Notify" : "Add to Cart"}</span>
                </div>
              </Button>
              <AddToWishlist product={product} className='h-9 w-9' />
            </div>
          </div>
        </div>
      </Card>
    );
  }

  // Grid view layout (default) - Mobile optimized for 2 columns
  return (
    <Card
      className={`group relative flex h-full flex-col overflow-hidden rounded-2xl border border-border/60 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm shadow-[0_20px_45px_-28px_rgba(15,23,42,0.55)] transition-all duration-300 !py-0 ${
        adding ? "ring-2 ring-primary/25 shadow-[0_25px_50px_-25px_rgba(59,130,246,0.45)]" : ""
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Soft hover glow */}
      <div className='pointer-events-none absolute inset-0'>
        <div className='absolute inset-0 opacity-0 transition duration-500 group-hover:opacity-100'>
          <div className='absolute -inset-12 bg-[radial-gradient(circle_at_20%_20%,rgba(59,130,246,0.16),transparent_32%),radial-gradient(circle_at_80%_0%,rgba(16,185,129,0.12),transparent_28%),radial-gradient(circle_at_50%_80%,rgba(99,102,241,0.12),transparent_32%)] blur-3xl' />
        </div>
      </div>

      <div className='relative flex-1 flex flex-col'>
        <Link
          href={`/products/${product.slug}`}
          aria-label={product.name}
          className='flex-1 flex flex-col cursor-pointer focus:outline-none'
        >
          {/* Image */}
          <div
            className={`relative mx-2 sm:mx-3 mt-2 sm:mt-3 aspect-4/3 overflow-hidden rounded-xl border border-border/60 bg-linear-to-b from-slate-50 to-white shadow-inner dark:from-slate-900/70 dark:to-slate-950 ${
              isOutOfStock ? "opacity-90" : ""
            }`}
          >
            {product.featured && (
              <Badge className='absolute left-2 top-2 z-20 bg-linear-to-r from-amber-500 to-orange-500 text-white shadow-sm'>
                <Star className='mr-1 h-3 w-3' />
                Featured
              </Badge>
            )}
            {isOutOfStock && (
              <Badge className='absolute right-2 top-2 z-20 bg-amber-100 text-amber-700 shadow-sm dark:bg-amber-900/50 dark:text-amber-200'>
                Restocking soon
              </Badge>
            )}

            <CloudImage
              src={image}
              alt={product.name}
              fill
              className={`object-cover transition-transform duration-500 ${isHovered && !isOutOfStock ? "md:scale-[1.06]" : "scale-100"}`}
              sizes={useDesktopSizes ? "100vw" : "(max-width: 640px) 50vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"}
            />

            {isOutOfStock && (
              <div className='absolute inset-0 z-10 flex items-center justify-center bg-amber-50/30 dark:bg-amber-950/20'>
                <div className='rounded-lg border border-amber-300/60 bg-amber-100/90 px-4 py-2 text-xs font-semibold text-amber-700 shadow-lg dark:border-amber-800/60 dark:bg-amber-900/70 dark:text-amber-200'>
                  Temporarily unavailable
                </div>
              </div>
            )}

            {adding && (
              <div className='absolute inset-0 z-20 flex items-center justify-center bg-primary/5'>
                <div className='relative flex items-center justify-center'>
                  <div className='h-14 w-14 rounded-full bg-primary/20 animate-ping' />
                  <div className='absolute h-10 w-10 rounded-full bg-primary text-primary-foreground animate-bounce shadow-lg shadow-primary/40 flex items-center justify-center'>
                    <ShoppingCart className='h-4 w-4' />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Content */}
          <div className='flex flex-col gap-1.5 px-2 sm:px-3 pt-2.5 sm:pt-3'>
            <h3 className='line-clamp-2 text-[13px] sm:text-[15px] font-semibold leading-tight text-foreground transition-colors duration-200 group-hover:text-primary'>
              {product.name}
            </h3>
            <p className='line-clamp-1 text-[11px] sm:text-[12px] text-muted-foreground leading-tight'>{descriptionText}</p>
          </div>
        </Link>

        {/* Price, Rating & Actions - Static positioned */}
        <div className='mt-auto px-2 sm:px-3 pb-2 sm:pb-3'>
          {/* Colors */}
          {colorsToShow.length > 0 && (
            <div className='flex items-center gap-1.5 mb-2'>
              {colorsToShow.map((color) => (
                <span
                  key={color}
                  className='h-3.5 w-3.5 sm:h-4 sm:w-4 rounded-full border border-border/70 shadow-sm'
                  style={{ backgroundColor: color }}
                  aria-label={color}
                  title={color}
                />
              ))}
              {extraColors > 0 && <span className='text-[10px] text-muted-foreground'>+{extraColors}</span>}
            </div>
          )}

          {/* Price and Rating */}
          <div className='flex items-end justify-between gap-1 mb-2'>
            <div className='min-w-0'>
              {hasDiscount ? (
                <>
                  <p className='text-sm sm:text-base font-bold text-foreground leading-tight'>
                    {currencySymbol}
                    {finalPrice.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                  </p>
                  <div className='flex items-center gap-1 flex-wrap'>
                    <span className='text-[10px] sm:text-[11px] text-muted-foreground line-through'>
                      {currencySymbol}
                      {price.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                    </span>
                    <span className='text-[9px] sm:text-[10px] font-semibold text-emerald-600 dark:text-emerald-400'>
                      Save {currencySymbol}
                      {(price - finalPrice).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                    </span>
                  </div>
                </>
              ) : (
                <p className='text-sm sm:text-base font-bold text-foreground'>
                  {currencySymbol}
                  {price.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                </p>
              )}
            </div>

            <div className='flex items-center gap-0.5 shrink-0'>
              <div className='flex'>
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className={`h-2.5 w-2.5 sm:h-3 sm:w-3 ${i < 4 ? "fill-yellow-400 text-yellow-400" : "fill-gray-200 text-gray-200"}`} />
                ))}
              </div>
            </div>
          </div>

          {/* Actions - Desktop only */}
          <div className='hidden sm:flex items-center gap-2 pt-2 border-t border-border/50'>
            <Button
              size='sm'
              onClick={handleAdd}
              disabled={adding || isOutOfStock}
              className={`flex-1 h-9 rounded-xl text-xs font-semibold transition-all duration-200 ${
                isOutOfStock
                  ? "bg-amber-100 text-amber-700 hover:bg-amber-100/80 dark:bg-amber-900/40 dark:text-amber-200"
                  : adding
                  ? "bg-green-600 text-white hover:bg-green-700"
                  : "bg-primary text-primary-foreground hover:bg-primary/90"
              }`}
            >
              <div className='flex items-center justify-center gap-1.5'>
                <ShoppingCart className={`h-3.5 w-3.5 ${adding ? "animate-bounce" : ""}`} />
                <span>{adding ? "Added" : isOutOfStock ? "Notify me" : "Add to bag"}</span>
              </div>
            </Button>
            <AddToWishlist
              product={product}
              className='h-9 w-9 rounded-xl border border-border/70 bg-white/60 text-foreground shadow-sm transition hover:-translate-y-px hover:shadow-md dark:bg-slate-900/60'
            />
          </div>
        </div>
      </div>
    </Card>
  );
}

export default ProductCard;
