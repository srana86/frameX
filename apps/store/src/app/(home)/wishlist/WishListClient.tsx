"use client";

import Link from "next/link";
import { useWishlist } from "@/components/providers/wishlist-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Heart, ArrowLeft } from "lucide-react";
import { ProductCard } from "@/components/site/ProductCard";
import type { Product } from "@/lib/types";

export default function WishListClient() {
  const { items, isEmpty } = useWishlist();

  // Convert wishlist items to Product format for ProductCard
  const products: Product[] = items.map((item) => ({
    id: item.productId,
    slug: item.slug,
    name: item.name,
    brand: item.brand,
    category: item.category,
    description: "", // Wishlist items don't have description
    price: item.price,
    images: [item.image],
    discountPercentage: undefined,
    featured: false,
    stock: undefined,
  }));

  return (
    <div className='min-h- bg-gradient-to-br from-background to-accent/5'>
      <div className='mx-auto max-w-[1440px] px-4 py-6 sm:px-6 lg:px-8'>
        {/* Header */}
        <div className='mb-8 space-y-6'>
          {/* Back Button */}
          <div>
            <Button asChild variant='ghost' size='sm' className='-ml-2'>
              <Link href='/' className='flex items-center gap-2'>
                <ArrowLeft className='w-4 h-4' />
                <span className='hidden sm:inline'>Continue Shopping</span>
                <span className='sm:hidden'>Back</span>
              </Link>
            </Button>
          </div>
        </div>

        {isEmpty ? (
          <Card className='mx-auto max-w-md border-none shadow-none'>
            <CardContent className='p-8 text-center'>
              <Heart className='w-16 h-16 mx-auto mb-4 text-muted-foreground' />
              <h2 className='text-xl font-semibold mb-2'>Your wishlist is empty</h2>
              <p className='text-muted-foreground mb-6'>Start adding products you love to your wishlist!</p>
              <Button asChild size='lg' className='w-full'>
                <Link href='/'>Start Shopping</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'>
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
