"use client";

import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import InfiniteScroll from "react-infinite-scroll-component";
import type { Product } from "@/lib/types";
import ProductCard from "@/components/site/ProductCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useCurrencySymbol } from "@/hooks/use-currency";
import { X, SlidersHorizontal, Loader2 } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { SiteBreadcrumb } from "@/components/site/Breadcrumb";

interface ProductsListingClientProps {
  initialProducts: Product[];
  categories: string[];
  brands: string[];
}

const PRODUCTS_PER_PAGE = 40;

export function ProductsListingClient({ initialProducts, categories, brands }: ProductsListingClientProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const currencySymbol = useCurrencySymbol();

  // Initialize state from URL params
  const getInitialCategories = () => {
    const categoryParam = searchParams.get("category");
    return categoryParam ? [decodeURIComponent(categoryParam)] : [];
  };

  const getInitialBrands = () => {
    const brandParam = searchParams.get("brand");
    return brandParam ? [decodeURIComponent(brandParam)] : [];
  };

  const getInitialPriceRange = () => {
    const minPrice = searchParams.get("minPrice");
    const maxPrice = searchParams.get("maxPrice");
    return {
      min: minPrice || "",
      max: maxPrice || "",
    };
  };

  const [selectedCategories, setSelectedCategories] = useState<string[]>(getInitialCategories);
  const [selectedBrands, setSelectedBrands] = useState<string[]>(getInitialBrands);
  const [priceRange, setPriceRange] = useState<{ min: string; max: string }>(getInitialPriceRange);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [displayedProducts, setDisplayedProducts] = useState<Product[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const searchQuery = searchParams.get("search") || "";

  // Sync URL params with state when URL changes
  useEffect(() => {
    const categoryParam = searchParams.get("category");
    const brandParam = searchParams.get("brand");
    const minPrice = searchParams.get("minPrice");
    const maxPrice = searchParams.get("maxPrice");

    const newCategories = categoryParam ? [decodeURIComponent(categoryParam)] : [];
    const newBrands = brandParam ? [decodeURIComponent(brandParam)] : [];
    const newPriceRange = {
      min: minPrice || "",
      max: maxPrice || "",
    };

    setSelectedCategories(newCategories);
    setSelectedBrands(newBrands);
    setPriceRange(newPriceRange);
  }, [searchParams]);

  // Filter products
  const filteredProducts = useMemo(() => {
    let filtered = [...initialProducts];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.description.toLowerCase().includes(query) ||
          p.brand?.toLowerCase().includes(query) ||
          p.category?.toLowerCase().includes(query) ||
          p.tags?.some((tag) => tag.toLowerCase().includes(query))
      );
    }

    // Category filter
    if (selectedCategories.length > 0) {
      filtered = filtered.filter((p) => p.category && selectedCategories.includes(p.category));
    }

    // Brand filter
    if (selectedBrands.length > 0) {
      filtered = filtered.filter((p) => p.brand && selectedBrands.includes(p.brand));
    }

    // Price range filter
    if (priceRange.min) {
      const min = Number(priceRange.min);
      if (!isNaN(min)) {
        filtered = filtered.filter((p) => {
          const finalPrice = p.discountPercentage ? p.price * (1 - p.discountPercentage / 100) : p.price;
          return finalPrice >= min;
        });
      }
    }
    if (priceRange.max) {
      const max = Number(priceRange.max);
      if (!isNaN(max)) {
        filtered = filtered.filter((p) => {
          const finalPrice = p.discountPercentage ? p.price * (1 - p.discountPercentage / 100) : p.price;
          return finalPrice <= max;
        });
      }
    }

    return filtered;
  }, [initialProducts, searchQuery, selectedCategories, selectedBrands, priceRange]);

  // Load more products for infinite scroll
  const loadMoreProducts = useCallback(() => {
    if (loading || !hasMore) return;

    setLoading(true);

    // Use functional update to get current length and calculate next batch
    setDisplayedProducts((prev) => {
      const startIndex = prev.length;
      const endIndex = startIndex + PRODUCTS_PER_PAGE;
      const newProducts = filteredProducts.slice(startIndex, endIndex);

      if (newProducts.length === 0) {
        // No more products to load
        setHasMore(false);
        setLoading(false);
        return prev;
      }

      // Calculate the new total length after adding products
      const updatedProducts = [...prev, ...newProducts];
      const newLength = updatedProducts.length;

      // Check if there are more products after this batch
      // hasMore should be true if newLength is still less than total filtered products
      const hasMoreData = newLength < filteredProducts.length;

      // Update hasMore and page state
      setHasMore(hasMoreData);
      setPage((prevPage) => prevPage + 1);
      setLoading(false);

      // Return updated products array
      return updatedProducts;
    });
  }, [filteredProducts, loading, hasMore]);

  // Reset and load initial products when filters change
  useEffect(() => {
    setDisplayedProducts([]);
    setPage(1);
    setHasMore(true);
    const initialProducts = filteredProducts.slice(0, PRODUCTS_PER_PAGE);
    setDisplayedProducts(initialProducts);
    if (filteredProducts.length <= PRODUCTS_PER_PAGE) {
      setHasMore(false);
    }
  }, [filteredProducts]);

  // Update URL when filters change
  const updateURL = useCallback(
    (newCategories: string[], newBrands: string[], newPriceRange?: { min: string; max: string }) => {
      const params = new URLSearchParams();

      // Preserve search query if exists
      if (searchQuery) {
        params.set("search", searchQuery);
      }

      // Add category if selected
      if (newCategories.length > 0) {
        params.set("category", encodeURIComponent(newCategories[0])); // Support single category for now
      }

      // Add brand if selected
      if (newBrands.length > 0) {
        params.set("brand", encodeURIComponent(newBrands[0])); // Support single brand for now
      }

      // Add price range if set
      const rangeToUse = newPriceRange || priceRange;
      if (rangeToUse.min) {
        params.set("minPrice", rangeToUse.min);
      }
      if (rangeToUse.max) {
        params.set("maxPrice", rangeToUse.max);
      }

      const queryString = params.toString();
      const newUrl = queryString ? `/products?${queryString}` : "/products";
      router.push(newUrl, { scroll: false });
    },
    [searchQuery, priceRange, router]
  );

  const toggleCategory = (category: string) => {
    setSelectedCategories((prev) => {
      const newCategories = prev.includes(category) ? prev.filter((c) => c !== category) : [category];
      // Update URL with new categories and current brands
      updateURL(newCategories, selectedBrands);
      return newCategories;
    });
  };

  const toggleBrand = (brand: string) => {
    setSelectedBrands((prev) => {
      const newBrands = prev.includes(brand) ? prev.filter((b) => b !== brand) : [brand];
      // Update URL with current categories and new brands
      updateURL(selectedCategories, newBrands);
      return newBrands;
    });
  };

  const clearFilters = () => {
    setSelectedCategories([]);
    setSelectedBrands([]);
    setPriceRange({ min: "", max: "" });
    const params = new URLSearchParams();
    if (searchQuery) {
      params.set("search", searchQuery);
    }
    const queryString = params.toString();
    router.push(queryString ? `/products?${queryString}` : "/products", { scroll: false });
  };

  const hasActiveFilters = selectedCategories.length > 0 || selectedBrands.length > 0 || priceRange.min !== "" || priceRange.max !== "";

  const activeFilterCount = selectedCategories.length + selectedBrands.length + (priceRange.min ? 1 : 0) + (priceRange.max ? 1 : 0);

  // Build breadcrumb items
  const breadcrumbItems = useMemo(() => {
    const items: Array<{ label: string; href?: string }> = [{ label: "Home", href: "/" }];

    if (searchQuery) {
      items.push({ label: "Products", href: "/products" });
      items.push({ label: `Search: "${searchQuery}"` });
    } else if (selectedCategories.length === 1) {
      items.push({ label: selectedCategories[0] });
    } else {
      items.push({ label: "Products" });
    }

    return items;
  }, [searchQuery, selectedCategories]);

  return (
    <div className='mx-auto max-w-[1440px] px-4 py-6 sm:px-6 lg:px-8'>
      {/* Breadcrumb */}
      <div className='mb-2'>
        <SiteBreadcrumb items={breadcrumbItems} />
      </div>

      {/* Mobile Filter Button */}
      <div className='mb-6 flex justify-end lg:hidden'>
        <Sheet open={mobileFiltersOpen} onOpenChange={setMobileFiltersOpen}>
          <SheetTrigger asChild>
            <Button variant='outline'>
              <SlidersHorizontal className='mr-2 h-4 w-4' />
              Filters
              {activeFilterCount > 0 && (
                <Badge variant='secondary' className='ml-2 h-5 min-w-5 rounded-full px-1.5'>
                  {activeFilterCount}
                </Badge>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent side='left' className='w-[85vw] sm:w-[400px] overflow-y-auto p-0'>
            <SheetHeader className='px-6 py-5 border-b bg-gradient-to-br from-primary/5 via-background to-background'>
              <div className='flex items-center justify-between'>
                <div className='flex items-center gap-2'>
                  <SlidersHorizontal className='size-4 text-primary' />
                  <SheetTitle className='text-xl font-bold'>Filters</SheetTitle>
                </div>
                {hasActiveFilters && (
                  <Button
                    variant='ghost'
                    size='sm'
                    onClick={clearFilters}
                    className='h-8 px-3 text-xs font-medium rounded-lg hover:bg-destructive/10 hover:text-destructive'
                  >
                    <X className='h-3.5 w-3.5 mr-1.5' />
                    Clear All
                  </Button>
                )}
              </div>
              {activeFilterCount > 0 && (
                <p className='text-xs text-muted-foreground mt-2'>
                  {activeFilterCount} {activeFilterCount === 1 ? "filter" : "filters"} active
                </p>
              )}
            </SheetHeader>
            <div className='px-6 py-6'>
              <FiltersContent
                categories={categories}
                brands={brands}
                selectedCategories={selectedCategories}
                selectedBrands={selectedBrands}
                priceRange={priceRange}
                currencySymbol={currencySymbol}
                initialProducts={initialProducts}
                searchQuery={searchQuery}
                toggleCategory={toggleCategory}
                toggleBrand={toggleBrand}
                setPriceRange={setPriceRange}
                updatePriceRangeURL={updateURL.bind(null, selectedCategories, selectedBrands)}
              />
            </div>
          </SheetContent>
        </Sheet>
      </div>

      <div className='flex flex-col lg:flex-row gap-6'>
        {/* Desktop Filters Sidebar - Sticky positioning */}
        <aside className='hidden lg:block w-64 shrink-0'>
          <div className='sticky top-44 z-10'>
            <Card className='max-h-[calc(100vh-5rem)] overflow-y-auto !px-0 !py-4'>
              <CardHeader className='pb-0'>
                <div className='flex items-center justify-between'>
                  <CardTitle className='text-lg flex items-center gap-2'>
                    <SlidersHorizontal className='size-4' />
                    Filters
                  </CardTitle>
                  {hasActiveFilters && (
                    <Button variant='ghost' size='sm' onClick={clearFilters} className='h-7 px-2 text-xs'>
                      <X className='h-3 w-3 mr-1' />
                      Clear
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <FiltersContent
                  categories={categories}
                  brands={brands}
                  selectedCategories={selectedCategories}
                  selectedBrands={selectedBrands}
                  priceRange={priceRange}
                  currencySymbol={currencySymbol}
                  initialProducts={initialProducts}
                  searchQuery={searchQuery}
                  toggleCategory={toggleCategory}
                  toggleBrand={toggleBrand}
                  setPriceRange={setPriceRange}
                  updatePriceRangeURL={updateURL.bind(null, selectedCategories, selectedBrands)}
                />
              </CardContent>
            </Card>
          </div>
        </aside>

        {/* Products Grid with Infinite Scroll */}
        <div className='flex-1 min-w-0'>
          {displayedProducts.length > 0 ? (
            <InfiniteScroll
              dataLength={displayedProducts.length}
              next={loadMoreProducts}
              hasMore={hasMore}
              loader={
                <div className='flex justify-center items-center py-8'>
                  <div className='flex items-center gap-2 text-muted-foreground'>
                    <Loader2 className='size-5 animate-spin' />
                    <span className='text-sm font-medium'>Loading more products...</span>
                  </div>
                </div>
              }
              endMessage={
                displayedProducts.length > PRODUCTS_PER_PAGE ? (
                  <div className='py-8 text-center'>
                    <p className='text-sm text-muted-foreground font-medium'>🎉 You've seen all products!</p>
                  </div>
                ) : null
              }
              scrollThreshold={0.8}
            >
              <div className='grid grid-cols-2 gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'>
                {displayedProducts.map((product) => (
                  <ProductCard key={product.id} product={product} layout='grid' />
                ))}
              </div>
            </InfiniteScroll>
          ) : (
            <div className='text-center py-16'>
              <div className='mx-auto max-w-md'>
                <div className='mb-4 flex justify-center'>
                  <div className='rounded-full bg-muted p-6'>
                    <SlidersHorizontal className='h-12 w-12 text-muted-foreground' />
                  </div>
                </div>
                <h3 className='text-lg font-semibold mb-2'>No products found</h3>
                <p className='text-sm text-muted-foreground mb-6'>
                  Try adjusting your filters or search query to find what you're looking for.
                </p>
                {hasActiveFilters && (
                  <Button variant='outline' onClick={clearFilters}>
                    <X className='mr-2 h-4 w-4' />
                    Clear All Filters
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Extracted Filters Content Component
interface FiltersContentProps {
  categories: string[];
  brands: string[];
  selectedCategories: string[];
  selectedBrands: string[];
  priceRange: { min: string; max: string };
  currencySymbol: string;
  initialProducts: Product[];
  searchQuery: string;
  toggleCategory: (category: string) => void;
  toggleBrand: (brand: string) => void;
  setPriceRange: (range: { min: string; max: string }) => void;
  updatePriceRangeURL: (range: { min: string; max: string }) => void;
}

function FiltersContent({
  categories,
  brands,
  selectedCategories,
  selectedBrands,
  priceRange,
  currencySymbol,
  initialProducts,
  searchQuery,
  toggleCategory,
  toggleBrand,
  setPriceRange,
  updatePriceRangeURL,
}: FiltersContentProps) {
  const priceUpdateTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (priceUpdateTimeoutRef.current) {
        clearTimeout(priceUpdateTimeoutRef.current);
      }
    };
  }, []);

  const handlePriceChange = (field: "min" | "max", value: string) => {
    const newRange = { ...priceRange, [field]: value };
    setPriceRange(newRange);

    // Clear existing timeout
    if (priceUpdateTimeoutRef.current) {
      clearTimeout(priceUpdateTimeoutRef.current);
    }

    // Debounce URL update for price range (500ms)
    priceUpdateTimeoutRef.current = setTimeout(() => {
      updatePriceRangeURL(newRange);
    }, 500);
  };
  return (
    <div className='space-y-3'>
      {/* Categories */}
      <div className='space-y-4'>
        <Label className='text-sm font-bold text-foreground flex items-center gap-2'>
          <div className='h-1 w-1 rounded-full bg-primary'></div>
          Categories
        </Label>
        <div className='space-y-2.5 max-h-72 overflow-y-auto pr-2 -mr-2'>
          {categories.map((category) => {
            const count = initialProducts.filter((p) => p.category === category).length;
            const isSelected = selectedCategories.includes(category);
            return (
              <div
                key={category}
                className={`flex items-center gap-3 p-2 rounded-lg transition-colors ${
                  isSelected ? "bg-primary/5 border border-primary/20" : "hover:bg-muted/50"
                }`}
              >
                <Checkbox id={`cat-${category}`} checked={isSelected} onCheckedChange={() => toggleCategory(category)} className='size-4' />
                <Label htmlFor={`cat-${category}`} className='text-xs cursor-pointer flex-1'>
                  {category}
                </Label>
                <Badge variant='secondary' className='text-xs font-semibold min-w-8 justify-center'>
                  {count}
                </Badge>
              </div>
            );
          })}
        </div>
      </div>

      <Separator />

      {/* Brands */}
      {brands.length > 0 && (
        <>
          <div className='space-y-4'>
            <Label className='text-sm font-bold text-foreground flex items-center gap-2'>
              <div className='h-1 w-1 rounded-full bg-primary'></div>
              Brands
            </Label>
            <div className='space-y-2.5 max-h-72 overflow-y-auto pr-2 -mr-2'>
              {brands.map((brand) => {
                const count = initialProducts.filter((p) => p.brand === brand).length;
                const isSelected = selectedBrands.includes(brand);
                return (
                  <div
                    key={brand}
                    className={`flex items-center gap-3 p-2 rounded-lg transition-colors ${
                      isSelected ? "bg-primary/5 border border-primary/20" : "hover:bg-muted/50"
                    }`}
                  >
                    <Checkbox id={`brand-${brand}`} checked={isSelected} onCheckedChange={() => toggleBrand(brand)} className='size-4' />
                    <Label htmlFor={`brand-${brand}`} className='text-xs cursor-pointer flex-1'>
                      {brand}
                    </Label>
                    <Badge variant='secondary' className='text-xs font-semibold min-w-8 justify-center'>
                      {count}
                    </Badge>
                  </div>
                );
              })}
            </div>
          </div>
          <Separator />
        </>
      )}

      {/* Price Range */}
      <div className='space-y-4'>
        <Label className='text-base font-bold text-foreground flex items-center gap-2'>
          <div className='h-1 w-1 rounded-full bg-primary'></div>
          Price Range
        </Label>
        <div className='grid grid-cols-2 gap-4'>
          <div className='space-y-2.5'>
            <Label htmlFor='min-price' className='text-xs text-muted-foreground'>
              Min ({currencySymbol})
            </Label>
            <Input
              id='min-price'
              type='number'
              placeholder='0'
              value={priceRange.min}
              onChange={(e) => handlePriceChange("min", e.target.value)}
              className='!h-9 border-2 focus:border-primary transition-colors'
            />
          </div>
          <div className='space-y-2.5'>
            <Label htmlFor='max-price' className='text-xs text-muted-foreground'>
              Max ({currencySymbol})
            </Label>
            <Input
              id='max-price'
              type='number'
              placeholder='No limit'
              value={priceRange.max}
              onChange={(e) => handlePriceChange("max", e.target.value)}
              className='!h-9 border-2 focus:border-primary transition-colors'
            />
          </div>
        </div>
      </div>
    </div>
  );
}
