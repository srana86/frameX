"use client";

import Link from "next/link";
import CloudImage from "@/components/site/CloudImage";
import { useCart } from "@/components/providers/cart-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { useCurrencySymbol } from "@/hooks/use-currency";

export default function CartTab() {
  const { items, updateQuantity, removeItem, subtotal, shipping, total, isEmpty } = useCart();
  const currencySymbol = useCurrencySymbol();

  const handleQuantityChange = (productId: string, newQuantity: number, size?: string) => {
    if (newQuantity < 1) return;
    updateQuantity(productId, newQuantity, size);
  };

  const handleRemoveItem = (productId: string, size?: string) => {
    removeItem(productId, size);
  };

  if (isEmpty) {
    return (
      <Card>
        <CardContent className='p-8 text-center'>
          <ShoppingBag className='w-16 h-16 mx-auto mb-4 text-muted-foreground' />
          <h2 className='text-xl font-semibold mb-2'>Your cart is empty</h2>
          <p className='text-muted-foreground mb-6'>Add some products to get started!</p>
          <Button asChild size='lg'>
            <Link href='/'>Start Shopping</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className='grid grid-cols-1 gap-6 lg:grid-cols-3'>
      {/* Cart Items */}
      <div className='lg:col-span-2 space-y-4'>
        {items.map((item) => (
          <Card key={`${item.productId}-${item.size ?? "_"}`} className='overflow-hidden'>
            <CardContent className='p-4 sm:p-6'>
              <div className='flex gap-4'>
                {/* Product Image */}
                <div className='relative w-20 h-20 sm:w-24 sm:h-24 overflow-hidden rounded-lg border bg-accent/30 flex-shrink-0'>
                  <CloudImage src={item.image} alt={item.name} fill className='object-contain p-2' />
                </div>

                {/* Product Details */}
                <div className='flex-1 min-w-0'>
                  <div className='flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2'>
                    <div className='flex-1'>
                      <Link
                        href={`/products/${item.slug}`}
                        className='font-semibold text-base sm:text-lg hover:text-primary transition-colors line-clamp-2'
                      >
                        {item.name}
                      </Link>
                      <div className='flex items-center gap-2 mt-1'>
                        <span className='text-lg font-bold text-primary'>
                          {currencySymbol}
                          {item.price.toFixed(2)}
                        </span>
                        {item.size && (
                          <Badge variant='outline' className='text-xs'>
                            Size {item.size}
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Remove Button - Desktop */}
                    <Button
                      variant='ghost'
                      size='sm'
                      onClick={() => handleRemoveItem(item.productId, item.size)}
                      className='hidden sm:flex text-muted-foreground hover:text-destructive'
                    >
                      <Trash2 className='w-4 h-4' />
                    </Button>
                  </div>

                  {/* Quantity Controls & Total */}
                  <div className='flex items-center justify-between mt-4'>
                    <div className='flex items-center border rounded-lg overflow-hidden'>
                      <Button
                        variant='ghost'
                        size='sm'
                        onClick={() => handleQuantityChange(item.productId, item.quantity - 1, item.size)}
                        disabled={item.quantity <= 1}
                        className='h-10 w-10 rounded-none hover:bg-accent'
                      >
                        <Minus className='w-4 h-4' />
                      </Button>
                      <div className='flex items-center justify-center w-12 h-10 text-sm font-medium bg-accent/20'>{item.quantity}</div>
                      <Button
                        variant='ghost'
                        size='sm'
                        onClick={() => handleQuantityChange(item.productId, item.quantity + 1, item.size)}
                        className='h-10 w-10 rounded-none hover:bg-accent'
                      >
                        <Plus className='w-4 h-4' />
                      </Button>
                    </div>

                    <div className='flex items-center gap-4'>
                      <div className='text-right'>
                        <p className='text-sm text-muted-foreground'>Total</p>
                        <p className='text-lg font-bold'>
                          {currencySymbol}
                          {(item.price * item.quantity).toFixed(2)}
                        </p>
                      </div>

                      {/* Remove Button - Mobile */}
                      <Button
                        variant='ghost'
                        size='sm'
                        onClick={() => handleRemoveItem(item.productId, item.size)}
                        className='sm:hidden text-muted-foreground hover:text-destructive'
                      >
                        <Trash2 className='w-4 h-4' />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Order Summary */}
      <div className='lg:col-span-1'>
        <Card className='sticky top-8'>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <ShoppingBag className='w-5 h-5' />
              Cart Summary
            </CardTitle>
            <CardDescription>
              {items.length} item{items.length !== 1 ? "s" : ""} in your cart
            </CardDescription>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='space-y-3 text-sm'>
              <div className='flex items-center justify-between'>
                <span className='text-muted-foreground'>
                  Subtotal ({items.length} item{items.length !== 1 ? "s" : ""})
                </span>
                <span className='font-medium'>
                  {currencySymbol}
                  {subtotal.toFixed(2)}
                </span>
              </div>
              <div className='flex items-center justify-between'>
                <span className='text-muted-foreground'>Shipping</span>
                <span className='font-medium'>{shipping === 0 ? "Free" : `${currencySymbol}${shipping.toFixed(2)}`}</span>
              </div>
              <div className='border-t pt-3 flex items-center justify-between text-lg font-bold'>
                <span>Total</span>
                <span>
                  {currencySymbol}
                  {total.toFixed(2)}
                </span>
              </div>
            </div>

            <div className='space-y-3'>
              <Button asChild size='lg' className='w-full h-12'>
                <Link href='/checkout' className='flex items-center justify-center'>
                  Proceed to Checkout
                  <ArrowRight className='w-4 h-4 ml-2' />
                </Link>
              </Button>

              <Button asChild variant='outline' size='lg' className='w-full'>
                <Link href='/cart'>View Full Cart</Link>
              </Button>

              <div className='text-center'>
                <p className='text-xs text-muted-foreground'>Secure checkout • Free returns • 30-day guarantee</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
