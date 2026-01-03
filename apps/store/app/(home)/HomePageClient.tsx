"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ProductGrid } from "@/components/site/ProductGrid";
import type { Product } from "@/lib/types";
import type { ProductCategory } from "@/app/api/products/categories/route";
import CloudImage from "@/components/site/CloudImage";
import { useCurrencySymbol } from "@/hooks/use-currency";

interface HomePageClientProps {
  categories: ProductCategory[];
  productsByCategory: Record<string, Product[]>;
  allProducts: Product[];
  mostLovedProducts: Product[];
}

export function HomePageClient({ categories, productsByCategory, allProducts, mostLovedProducts }: HomePageClientProps) {
  const currencySymbol = useCurrencySymbol();
  const searchParams = useSearchParams();
  const selectedCategory = searchParams?.get("category");

  // Filter products by selected category if any
  let filteredProducts = allProducts;
  if (selectedCategory) {
    filteredProducts = productsByCategory[selectedCategory] || [];
  }

  // Get products for "Popular Collection" (first category or featured products)
  const popularProducts = selectedCategory
    ? filteredProducts.slice(0, 4)
    : categories.length > 0 && categories[0]
    ? (productsByCategory[categories[0].name] || []).slice(0, 4)
    : allProducts.filter((p) => p.featured).slice(0, 4);

  // Use fetched most loved products, or fallback to filtered products
  const displayMostLovedProducts = selectedCategory
    ? filteredProducts.slice(4, 8)
    : mostLovedProducts.length > 0
    ? mostLovedProducts
    : categories.length > 1 && categories[1]
    ? (productsByCategory[categories[1].name] || []).slice(0, 4)
    : allProducts.filter((p) => !p.featured).slice(0, 4) || allProducts.slice(4, 8);

  const hasProducts = filteredProducts.length > 0;

  // Helper function to get color hex value - use actual color from product
  const getColorHex = (color: string): string => {
    // If it's already a hex color, return it
    if (color.startsWith("#")) return color;

    // Try to parse as hex without #
    if (/^[0-9A-Fa-f]{6}$/.test(color)) return `#${color}`;

    // Map common color names to hex values
    const colorMap: Record<string, string> = {
      black: "#000000",
      white: "#ffffff",
      brown: "#8B4513",
      blue: "#4169E1",
      pink: "#FFC0CB",
      taupe: "#D2B48C",
      beige: "#F5F5DC",
      navy: "#000080",
      gray: "#808080",
      grey: "#808080",
      red: "#FF0000",
      green: "#008000",
      yellow: "#FFFF00",
      orange: "#FFA500",
      purple: "#800080",
      cyan: "#00FFFF",
      magenta: "#FF00FF",
    };

    return colorMap[color.toLowerCase()] || color; // Return original if not found (might be a valid CSS color)
  };

  if (!hasProducts) {
    return (
      <div className='rounded-2xl border border-border/60 bg-card/70 p-6 sm:p-8 shadow-sm'>
        <div className='flex flex-col items-center text-center space-y-4'>
          <div className='w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center text-primary'>
            <svg
              xmlns='http://www.w3.org/2000/svg'
              className='w-10 h-10'
              viewBox='0 0 24 24'
              fill='none'
              stroke='currentColor'
              strokeWidth='1.6'
            >
              <path d='M3 7h18M3 7l1.5 12h15L21 7M3 7l2.4-3h13.2L21 7m-9 4v3m-3-3v3m6-3v3' strokeLinecap='round' strokeLinejoin='round' />
            </svg>
          </div>
          <div className='space-y-1'>
            <h2 className='text-xl sm:text-2xl font-semibold text-foreground'>No products available</h2>
            <p className='text-sm text-muted-foreground'>
              We&apos;re refreshing our catalog. Please check back soon or clear filters to browse everything.
            </p>
          </div>
          <div className='flex flex-col sm:flex-row gap-3'>
            <Link
              href='/'
              className='inline-flex items-center justify-center rounded-full bg-primary px-4 py-2 text-primary-foreground font-semibold shadow-sm hover:shadow-md transition'
            >
              Clear filters
            </Link>
            <Link
              href='/contact'
              className='inline-flex items-center justify-center rounded-full border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-accent transition'
            >
              Contact support
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Mobile Layout */}
      <div className='md:hidden space-y-8'>
        {/* Most Loved Section - Show at the top */}
        {displayMostLovedProducts.length > 0 ? (
          <section>
            <h2 className='text-xl font-bold mb-4'>Most Loved</h2>
            <div className='grid grid-cols-2 gap-3'>
              {displayMostLovedProducts.map((product) => {
                const finalPrice =
                  product.discountPercentage && product.discountPercentage > 0
                    ? product.price * (1 - product.discountPercentage / 100)
                    : product.price;

                return (
                  <div
                    key={product.id}
                    className='bg-white dark:bg-card rounded-lg overflow-hidden shadow-sm border border-gray-100 dark:border-border/50'
                  >
                    <Link href={`/products/${product.slug}`} className='block'>
                      {/* Product Image */}
                      <div className='relative aspect-square w-full bg-gray-50 dark:bg-gray-800/50'>
                        <CloudImage
                          src={product.images[0] || "/file.svg"}
                          alt={product.name}
                          fill
                          className='object-cover'
                          sizes='(max-width: 640px) 50vw, 50vw'
                        />
                      </div>

                      {/* Product Info */}
                      <div className='p-3 space-y-2'>
                        <h3 className='text-sm font-medium line-clamp-1 text-foreground'>{product.name}</h3>
                        <p className='text-base font-semibold text-foreground'>
                          {currencySymbol}
                          {finalPrice.toFixed(2)}
                          {product.discountPercentage && product.discountPercentage > 0 && (
                            <span className='text-xs text-muted-foreground line-through ml-1'>
                              {currencySymbol}
                              {product.price.toFixed(2)}
                            </span>
                          )}
                        </p>

                        {/* Color Swatches - Use actual product colors */}
                        {product.colors && product.colors.length > 0 && (
                          <div className='flex gap-1.5'>
                            {product.colors.slice(0, 4).map((color, idx) => {
                              const colorValue = getColorHex(color);
                              return (
                                <div
                                  key={idx}
                                  className='w-4 h-4 rounded-full border border-gray-300 dark:border-gray-600'
                                  style={{ backgroundColor: colorValue }}
                                  title={color}
                                />
                              );
                            })}
                          </div>
                        )}

                        {/* Rating */}
                        <div className='flex items-center gap-1'>
                          <span className='text-xs font-medium text-muted-foreground'>4.6</span>
                          <div className='flex'>
                            {[...Array(5)].map((_, i) => (
                              <svg
                                key={i}
                                className={`w-3 h-3 ${
                                  i < 4
                                    ? "fill-yellow-400 text-yellow-400"
                                    : i === 4
                                    ? "fill-yellow-400/50 text-yellow-400"
                                    : "fill-gray-200 text-gray-200"
                                }`}
                                viewBox='0 0 20 20'
                              >
                                <path d='M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z' />
                              </svg>
                            ))}
                          </div>
                        </div>
                      </div>
                    </Link>
                  </div>
                );
              })}
            </div>
          </section>
        ) : null}

        {/* Popular Collection Section */}
        {popularProducts.length > 0 ? (
          <section>
            <h2 className='text-xl font-bold mb-4'>Popular Collection</h2>
            <div className='grid grid-cols-2 gap-3'>
              {popularProducts.map((product) => {
                const finalPrice =
                  product.discountPercentage && product.discountPercentage > 0
                    ? product.price * (1 - product.discountPercentage / 100)
                    : product.price;

                return (
                  <div
                    key={product.id}
                    className='bg-white dark:bg-card rounded-lg overflow-hidden shadow-sm border border-gray-100 dark:border-border/50'
                  >
                    <Link href={`/products/${product.slug}`} className='block'>
                      {/* Product Image */}
                      <div className='relative aspect-square w-full bg-gray-50 dark:bg-gray-800/50'>
                        <CloudImage
                          src={product.images[0] || "/file.svg"}
                          alt={product.name}
                          fill
                          className='object-cover'
                          sizes='(max-width: 640px) 50vw, 50vw'
                        />
                      </div>

                      {/* Product Info */}
                      <div className='p-3 space-y-2'>
                        <h3 className='text-sm font-medium line-clamp-1 text-foreground'>{product.name}</h3>
                        <p className='text-base font-semibold text-foreground'>
                          {currencySymbol}
                          {finalPrice.toFixed(2)}
                          {product.discountPercentage && product.discountPercentage > 0 && (
                            <span className='text-xs text-muted-foreground line-through ml-1'>
                              {currencySymbol}
                              {product.price.toFixed(2)}
                            </span>
                          )}
                        </p>

                        {/* Color Swatches - Use actual product colors */}
                        {product.colors && product.colors.length > 0 && (
                          <div className='flex gap-1.5'>
                            {product.colors.slice(0, 4).map((color, idx) => {
                              const colorValue = getColorHex(color);
                              return (
                                <div
                                  key={idx}
                                  className='w-4 h-4 rounded-full border border-gray-300 dark:border-gray-600'
                                  style={{ backgroundColor: colorValue }}
                                  title={color}
                                />
                              );
                            })}
                          </div>
                        )}

                        {/* Rating */}
                        <div className='flex items-center gap-1'>
                          <span className='text-xs font-medium text-muted-foreground'>4.6</span>
                          <div className='flex'>
                            {[...Array(5)].map((_, i) => (
                              <svg
                                key={i}
                                className={`w-3 h-3 ${
                                  i < 4
                                    ? "fill-yellow-400 text-yellow-400"
                                    : i === 4
                                    ? "fill-yellow-400/50 text-yellow-400"
                                    : "fill-gray-200 text-gray-200"
                                }`}
                                viewBox='0 0 20 20'
                              >
                                <path d='M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z' />
                              </svg>
                            ))}
                          </div>
                        </div>
                      </div>
                    </Link>
                  </div>
                );
              })}
            </div>
          </section>
        ) : null}
      </div>

      {/* Desktop Layout */}
      <div className='hidden md:block space-y-12'>
        {/* Most Loved Section - Show first on desktop */}
        {displayMostLovedProducts.length > 0 ? (
          <ProductGrid products={displayMostLovedProducts} categoryName='Most Loved' maxProducts={4} showViewAll={false} />
        ) : null}

        {/* Other Category Sections */}
        {categories.length > 0 ? (
          categories.map((category) => {
            const categoryProducts = productsByCategory[category.name] || [];
            if (categoryProducts.length === 0) return null;

            return (
              <ProductGrid key={category.id} products={categoryProducts} categoryName={category.name} maxProducts={4} showViewAll={true} />
            );
          })
        ) : allProducts.length > 0 ? (
          <ProductGrid products={allProducts.slice(0, 4)} maxProducts={4} showViewAll={true} />
        ) : null}
      </div>
    </>
  );
}
