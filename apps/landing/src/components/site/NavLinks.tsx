"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { Logo } from "@/components/site/Logo";
import { apiRequest } from "@/lib/api-client";
import type { BrandConfig } from "@/lib/brand-config";

interface Category {
  id: string;
  name: string;
  order?: number;
}

interface CategoryNavProps {
  brandConfig?: BrandConfig;
  isNavbarVisible?: boolean;
  isScrolled?: boolean;
}

// Client-side cache for navigation data (5 minutes)
const navDataCache = {
  categories: null as Category[] | null,
  brands: null as string[] | null,
  timestamp: 0,
  TTL: 5 * 60 * 1000, // 5 minutes in milliseconds
};

export function NavLinks({ brandConfig, isNavbarVisible = true, isScrolled = false }: CategoryNavProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [hoveredCategory, setHoveredCategory] = useState<boolean>(false);
  const [hoveredBrand, setHoveredBrand] = useState<boolean>(false);
  const [mounted, setMounted] = useState(false);
  const categoryButtonRef = useRef<HTMLButtonElement>(null);
  const brandButtonRef = useRef<HTMLButtonElement>(null);
  const categoryDropdownRef = useRef<HTMLDivElement>(null);
  const brandDropdownRef = useRef<HTMLDivElement>(null);
  const categoryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const brandTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      // Check cache first
      const now = Date.now();
      if (navDataCache.categories && navDataCache.brands && now - navDataCache.timestamp < navDataCache.TTL) {
        setCategories(navDataCache.categories);
        setBrands(navDataCache.brands);
        setLoading(false);
        return;
      }

      try {
        const [categoriesData, brandsData] = await Promise.all([
          apiRequest<any>("/products/categories?limit=20", { method: "GET" }),
          apiRequest<any>("/products/brands", { method: "GET" }),
        ]);

        const fetchedCategories = categoriesData?.categories || [];
        setCategories(fetchedCategories);
        navDataCache.categories = fetchedCategories;

        const fetchedBrands = brandsData?.brands || [];
        setBrands(fetchedBrands);
        navDataCache.brands = fetchedBrands;

        // Update cache timestamp
        navDataCache.timestamp = Date.now();
      } catch (error: any) {
        console.error("Error fetching navigation data:", error);
        // Use cached data if available even if stale
        if (navDataCache.categories) setCategories(navDataCache.categories);
        if (navDataCache.brands) setBrands(navDataCache.brands);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Don't show on mobile or on certain pages
  if (pathname?.startsWith("/merchant") || pathname?.startsWith("/account") || pathname?.startsWith("/checkout")) {
    return null;
  }

  if (loading || !mounted) {
    return null;
  }

  const handleCategoryMouseEnter = () => {
    if (categoryTimeoutRef.current) {
      clearTimeout(categoryTimeoutRef.current);
    }
    setHoveredCategory(true);
  };

  const handleCategoryMouseLeave = () => {
    categoryTimeoutRef.current = setTimeout(() => {
      setHoveredCategory(false);
    }, 150);
  };

  const handleBrandMouseEnter = () => {
    if (brandTimeoutRef.current) {
      clearTimeout(brandTimeoutRef.current);
    }
    setHoveredBrand(true);
  };

  const handleBrandMouseLeave = () => {
    brandTimeoutRef.current = setTimeout(() => {
      setHoveredBrand(false);
    }, 150);
  };

  // Calculate dropdown position with better alignment
  // Using getBoundingClientRect() which gives viewport-relative coordinates
  // Since we use 'fixed' positioning, we don't need scroll offsets
  const getDropdownPosition = (buttonRef: React.RefObject<HTMLButtonElement | null>) => {
    if (!buttonRef.current) return null;
    const rect = buttonRef.current.getBoundingClientRect();
    const dropdownWidth = 224; // w-56 = 224px
    const viewportWidth = window.innerWidth;

    // Calculate left position - align to button left edge (viewport-relative for fixed positioning)
    let left = rect.left;

    // Ensure dropdown doesn't go off screen on the right
    if (left + dropdownWidth > viewportWidth) {
      left = viewportWidth - dropdownWidth - 16; // 16px padding from edge
    }

    // Ensure dropdown doesn't go off screen on the left
    if (left < 16) {
      left = 16;
    }

    // Calculate arrow position - center it above the button
    const buttonCenter = rect.left + rect.width / 2;
    const arrowLeft = Math.max(16, Math.min(buttonCenter - left, dropdownWidth - 20));

    return {
      top: rect.bottom + 4, // No scrollY needed for fixed positioning
      left: left, // No scrollX needed for fixed positioning
      arrowLeft: arrowLeft,
    };
  };

  const categoryPosition = hoveredCategory ? getDropdownPosition(categoryButtonRef) : null;
  const brandPosition = hoveredBrand ? getDropdownPosition(brandButtonRef) : null;

  return (
    <>
      <nav className='hidden md:block border-t border-border/50 bg-background/95 backdrop-blur-sm relative z-10'>
        <div className='mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8'>
          <div className='flex items-center gap-1 overflow-x-auto scrollbar-hide py-2.5'>
            {/* Logo - Appears when navbar is hidden */}
            {brandConfig && !isNavbarVisible && isScrolled && (
              <div
                className='shrink-0 mr-2 transition-all duration-500 ease-out'
                style={{
                  opacity: !isNavbarVisible ? 1 : 0,
                  transform: !isNavbarVisible ? "translateX(0)" : "translateX(-20px)",
                }}
              >
                <Logo brandConfig={brandConfig} className='scale-75 origin-left' />
              </div>
            )}

            {/* Categories Dropdown */}
            {categories.length > 0 && (
              <div className='relative' onMouseEnter={handleCategoryMouseEnter} onMouseLeave={handleCategoryMouseLeave}>
                <button
                  ref={categoryButtonRef}
                  className='flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-foreground hover:text-primary transition-colors whitespace-nowrap group focus:outline-none cursor-pointer'
                >
                  <span>Categories</span>
                  <ChevronDown className='h-3.5 w-3.5 opacity-60 group-hover:opacity-100 transition-opacity' />
                </button>
              </div>
            )}

            {/* Brands Dropdown */}
            {brands.length > 0 && (
              <div className='relative' onMouseEnter={handleBrandMouseEnter} onMouseLeave={handleBrandMouseLeave}>
                <button
                  ref={brandButtonRef}
                  className='flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-foreground hover:text-primary transition-colors whitespace-nowrap group focus:outline-none cursor-pointer'
                >
                  <span>Brands</span>
                  <ChevronDown className='h-3.5 w-3.5 opacity-60 group-hover:opacity-100 transition-opacity' />
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Portal for Category Dropdown */}
      {hoveredCategory && categoryPosition && mounted && (
        <>
          {createPortal(
            <div
              ref={categoryDropdownRef}
              className='fixed w-56 bg-popover border border-border rounded-md shadow-xl z-[9999] py-1.5 animate-in fade-in-0 zoom-in-95 duration-200'
              style={{
                top: `${categoryPosition.top}px`,
                left: `${categoryPosition.left}px`,
              }}
              onMouseEnter={handleCategoryMouseEnter}
              onMouseLeave={handleCategoryMouseLeave}
            >
              {/* Arrow indicator */}
              <div
                className='absolute -top-1.5 w-3 h-3 bg-popover border-l border-t border-border rotate-45'
                style={{ left: `${categoryPosition.arrowLeft}px` }}
              />
              <Link
                href='/products'
                onClick={() => setHoveredCategory(false)}
                className='block px-4 py-2.5 text-sm font-semibold text-foreground hover:bg-primary/5 hover:text-primary transition-colors rounded-sm mx-1'
              >
                All Categories
              </Link>
              <div className='border-t my-1' />
              <div className='max-h-80 overflow-y-auto'>
                {categories.map((category) => (
                  <Link
                    key={category.id}
                    href={`/products?category=${encodeURIComponent(category.name)}`}
                    onClick={() => setHoveredCategory(false)}
                    className='flex items-center gap-2 px-4 py-2 text-sm text-foreground hover:bg-primary/5 hover:text-primary transition-colors rounded-sm mx-1 group'
                  >
                    <ChevronDown className='h-3 w-3 opacity-0 group-hover:opacity-100 -rotate-90 transition-all' />
                    <span className='flex-1'>{category.name}</span>
                  </Link>
                ))}
              </div>
            </div>,
            document.body
          )}
        </>
      )}

      {/* Portal for Brand Dropdown */}
      {hoveredBrand && brandPosition && mounted && (
        <>
          {createPortal(
            <div
              ref={brandDropdownRef}
              className='fixed w-56 bg-popover border border-border rounded-md shadow-xl z-[9999] py-1.5 animate-in fade-in-0 zoom-in-95 duration-200'
              style={{
                top: `${brandPosition.top}px`,
                left: `${brandPosition.left}px`,
              }}
              onMouseEnter={handleBrandMouseEnter}
              onMouseLeave={handleBrandMouseLeave}
            >
              {/* Arrow indicator */}
              <div
                className='absolute -top-1.5 w-3 h-3 bg-popover border-l border-t border-border rotate-45'
                style={{ left: `${brandPosition.arrowLeft}px` }}
              />
              <Link
                href='/products'
                onClick={() => setHoveredBrand(false)}
                className='block px-4 py-2.5 text-sm font-semibold text-foreground hover:bg-primary/5 hover:text-primary transition-colors rounded-sm mx-1'
              >
                All Brands
              </Link>
              <div className='border-t my-1' />
              <div className='max-h-80 overflow-y-auto'>
                {brands.map((brand) => (
                  <Link
                    key={brand}
                    href={`/products?brand=${encodeURIComponent(brand)}`}
                    onClick={() => setHoveredBrand(false)}
                    className='flex items-center gap-2 px-4 py-2 text-sm text-foreground hover:bg-primary/5 hover:text-primary transition-colors rounded-sm mx-1 group'
                  >
                    <ChevronDown className='h-3 w-3 opacity-0 group-hover:opacity-100 -rotate-90 transition-all' />
                    <span className='flex-1'>{brand}</span>
                  </Link>
                ))}
              </div>
            </div>,
            document.body
          )}
        </>
      )}
    </>
  );
}
