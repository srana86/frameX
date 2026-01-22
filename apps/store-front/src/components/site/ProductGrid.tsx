"use client";

import Link from "next/link";
import type { Product } from "@/lib/types";
import ProductCard from "@/components/site/ProductCard";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

interface ProductGridProps {
  products: Product[];
  categoryName?: string;
  maxProducts?: number;
  showViewAll?: boolean;
}

export function ProductGrid({ products, categoryName, maxProducts, showViewAll = false }: ProductGridProps) {
  if (products.length === 0) return null;

  const displayProducts = maxProducts ? products.slice(0, maxProducts) : products;
  const hasMore = maxProducts ? products.length > maxProducts : false;

  return (
    <section className='mb-12'>
      <div className='mb-4 flex items-center justify-between'>
        <h2 className='text-xl font-semibold'>{categoryName || "Latest Products"}</h2>
        {showViewAll && hasMore && (
          <Button variant='outline' size='sm' asChild>
            <Link href={`/products${categoryName ? `?category=${encodeURIComponent(categoryName)}` : ""}`}>
              View All
              <ArrowRight className='ml-2 h-4 w-4' />
            </Link>
          </Button>
        )}
      </div>

      {/* Grid View - 2 columns on mobile, more on larger screens */}
      <div className='grid grid-cols-2 gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'>
        {displayProducts.map((product) => (
          <ProductCard key={product.id} product={product} layout='grid' />
        ))}
      </div>
    </section>
  );
}
