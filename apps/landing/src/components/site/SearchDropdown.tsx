"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search, Loader2, Package, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Product } from "@/lib/types";
import { useCurrencySymbol } from "@/hooks/use-currency";
import CloudImage from "@/components/site/CloudImage";
import { apiRequest } from "@/lib/api-client";

interface SearchDropdownProps {
  onClose?: () => void;
}

export function SearchDropdown({ onClose }: SearchDropdownProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Product[]>([]);
  const [defaultProducts, setDefaultProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [loadingDefaults, setLoadingDefaults] = useState(false);
  const router = useRouter();
  const currencySymbol = useCurrencySymbol();
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch default newest products
  const fetchDefaultProducts = useCallback(async () => {
    if (defaultProducts.length > 0) return; // Already loaded

    setLoadingDefaults(true);
    try {
      const data = await apiRequest<any>("/products/search?newest=true&limit=8", { method: "GET" });
      setDefaultProducts(data.products || []);
    } catch (error) {
      console.error("Error fetching default products:", error);
    } finally {
      setLoadingDefaults(false);
    }
  }, [defaultProducts.length]);

  // Load default products when dropdown opens
  useEffect(() => {
    if (isOpen && defaultProducts.length === 0 && !loadingDefaults) {
      fetchDefaultProducts();
    }
  }, [isOpen, defaultProducts.length, loadingDefaults, fetchDefaultProducts]);

  // Debounced search
  const performSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const data = await apiRequest<any>(`/products/search?q=${encodeURIComponent(searchQuery)}&limit=8`, { method: "GET" });
      setResults(data.products || []);
    } catch (error) {
      console.error("Search error:", error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Debounce search requests
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (query.trim()) {
      setLoading(true);
      debounceTimerRef.current = setTimeout(() => {
        performSearch(query);
      }, 300);
    } else {
      setResults([]);
      setLoading(false);
    }

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [query, performSearch]);

  // Keyboard shortcut: Ctrl+K or Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setIsOpen(true);
        setTimeout(() => inputRef.current?.focus(), 0);
      }
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
        setQuery("");
        setResults([]);
        onClose?.();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setQuery("");
        setResults([]);
        onClose?.();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen, onClose]);

  const handleProductClick = (product: Product) => {
    router.push(`/products/${product.slug}`);
    setIsOpen(false);
    setQuery("");
    setResults([]);
    onClose?.();
  };

  const handleViewAll = () => {
    if (query.trim()) {
      router.push(`/products?search=${encodeURIComponent(query.trim())}`);
    } else {
      router.push("/products");
    }
    setIsOpen(false);
    setQuery("");
    setResults([]);
    onClose?.();
  };

  const handleInputFocus = () => {
    setIsOpen(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    if (!isOpen) {
      setIsOpen(true);
    }
  };

  const displayProducts = query.trim() ? results : defaultProducts;
  const showDefault = !query.trim() && defaultProducts.length > 0;
  const isLoading = query.trim() ? loading : loading || loadingDefaults;

  return (
    <div ref={containerRef} className='relative w-full max-w-[280px] sm:max-w-sm md:max-w-xs lg:max-w-sm'>
      {/* Search Input - Responsive */}
      <div className='relative'>
        <Search className='absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground pointer-events-none' />
        <Input
          ref={inputRef}
          type='text'
          placeholder='Search...'
          value={query}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          className='w-full pl-8 sm:pl-9 pr-7 sm:pr-8 !h-8 text-xs sm:text-sm bg-background border focus:border-primary transition-colors'
          aria-label='Search products'
        />
        {query && (
          <Button
            type='button'
            variant='ghost'
            size='icon'
            onClick={() => {
              setQuery("");
              setResults([]);
              inputRef.current?.focus();
            }}
            className='absolute right-0.5 sm:right-1 top-1/2 -translate-y-1/2 h-7 w-7 rounded-md hover:bg-muted'
            aria-label='Clear search'
          >
            <X className='h-3 w-3 sm:h-3.5 sm:w-3.5' />
          </Button>
        )}
        <kbd className='pointer-events-none absolute right-1 sm:right-1.5 top-1/2 -translate-y-1/2 hidden h-4 sm:h-5 select-none items-center gap-0.5 sm:gap-1 rounded border bg-muted px-1 sm:px-1.5 font-mono text-[9px] sm:text-[10px] font-medium opacity-100 md:flex'>
          <span className='text-[10px] sm:text-xs'>⌘</span>K
        </kbd>
      </div>

      {/* Dropdown Results - Compact & Responsive */}
      {isOpen && (
        <div className='absolute top-full left-0 right-0 mt-1 bg-popover border border-border rounded-lg shadow-lg z-50 max-h-[280px] sm:max-h-80 md:max-h-[360px] overflow-hidden flex flex-col'>
          {isLoading ? (
            <div className='flex items-center justify-center py-4 sm:py-5'>
              <Loader2 className='h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin text-muted-foreground' />
            </div>
          ) : displayProducts.length > 0 ? (
            <>
              <div className='px-2 sm:px-2.5 py-1 sm:py-1.5 border-b bg-muted/30 shrink-0'>
                <p className='text-[9px] sm:text-[10px] font-medium text-muted-foreground'>
                  {query.trim() ? `${results.length} results` : "New Products"}
                </p>
              </div>
              <div className='overflow-y-auto max-h-[200px] sm:max-h-60 md:max-h-[280px]'>
                <div className='p-0.5'>
                  {displayProducts.map((product) => {
                    const finalPrice =
                      product.discountPercentage && product.discountPercentage > 0
                        ? product.price * (1 - product.discountPercentage / 100)
                        : product.price;
                    const image = product.images[0] ?? "/file.svg";

                    return (
                      <button
                        key={product.id}
                        type='button'
                        onClick={() => handleProductClick(product)}
                        className='w-full text-left p-1 sm:p-1.5 rounded-md transition-colors hover:bg-accent focus:bg-accent focus:outline-none flex items-start gap-1.5'
                      >
                        <div className='relative w-7 h-7 sm:w-8 sm:h-8 rounded overflow-hidden bg-muted shrink-0 border border-border/50'>
                          <CloudImage src={image} alt={product.name} fill className='object-cover' sizes='32px' />
                          {product.featured && (
                            <Badge className='absolute top-0 left-0 text-[6px] px-0.5 py-0 bg-amber-500 text-white leading-none'>⭐</Badge>
                          )}
                        </div>
                        <div className='flex-1 min-w-0 space-y-0'>
                          <div className='flex items-start justify-between gap-1.5'>
                            <div className='flex-1 min-w-0'>
                              <p className='font-semibold text-[10px] sm:text-[11px] line-clamp-1 leading-tight'>{product.name}</p>
                              <p className='text-[8px] sm:text-[9px] text-muted-foreground line-clamp-1 mt-0.5'>
                                {product.brand} • {product.category}
                              </p>
                            </div>
                            <div className='text-right shrink-0 ml-1'>
                              {product.discountPercentage && product.discountPercentage > 0 ? (
                                <div className='flex flex-col items-end'>
                                  <span className='font-bold text-[10px] sm:text-[11px] text-foreground leading-tight'>
                                    {currencySymbol}
                                    {finalPrice.toFixed(2)}
                                  </span>
                                  <span className='text-[7px] sm:text-[8px] text-muted-foreground line-through leading-tight'>
                                    {currencySymbol}
                                    {product.price.toFixed(2)}
                                  </span>
                                </div>
                              ) : (
                                <span className='font-bold text-[10px] sm:text-[11px] text-foreground leading-tight'>
                                  {currencySymbol}
                                  {product.price.toFixed(2)}
                                </span>
                              )}
                            </div>
                          </div>
                          {product.discountPercentage && product.discountPercentage > 0 && (
                            <Badge variant='secondary' className='text-[7px] sm:text-[8px] px-1 py-0 h-3 mt-0.5'>
                              -{product.discountPercentage}%
                            </Badge>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
              {(query.trim() || showDefault) && (
                <div className='border-t px-2 py-1 bg-muted/30 shrink-0'>
                  <Button
                    type='button'
                    variant='ghost'
                    size='sm'
                    className='w-full justify-start text-[9px] sm:text-[10px] h-6'
                    onClick={handleViewAll}
                  >
                    <Package className='h-2.5 w-2.5 sm:h-3 sm:w-3 mr-1' />
                    {query.trim() ? `View all results` : "View all products"}
                  </Button>
                </div>
              )}
            </>
          ) : query.trim() && !loading && results.length === 0 ? (
            <div className='py-3 sm:py-4 text-center'>
              <Package className='h-4 w-4 sm:h-5 sm:w-5 mx-auto text-muted-foreground mb-1 opacity-50' />
              <p className='text-[10px] sm:text-[11px] font-medium text-foreground mb-0.5'>No products found</p>
              <p className='text-[8px] sm:text-[9px] text-muted-foreground'>Try a different search term</p>
            </div>
          ) : !query.trim() && !loading && !loadingDefaults && defaultProducts.length === 0 ? (
            <div className='py-3 sm:py-4 text-center'>
              <Package className='h-4 w-4 sm:h-5 sm:w-5 mx-auto text-muted-foreground mb-1 opacity-50' />
              <p className='text-[10px] sm:text-[11px] text-muted-foreground'>No products available</p>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
