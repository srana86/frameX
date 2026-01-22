"use client";

import { useState } from "react";
import Link from "next/link";
import CloudImage from "@/components/site/CloudImage";
import { useCart } from "@/components/providers/cart-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Minus, Plus, Trash2, ShoppingBag, ArrowLeft, Check, Truck, Shield, RefreshCw, Sparkles, Undo2 } from "lucide-react";
import { toast } from "sonner";
import { useFormatPrice } from "@/hooks/use-currency";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";

export default function CartClient() {
  const { items, updateQuantity, removeItem, addItem, subtotal, shipping, total, count, freeShippingThreshold, baseShippingFee } =
    useCart();
  const formatPrice = useFormatPrice();
  const [editingQuantities, setEditingQuantities] = useState<Record<string, string>>({});

  const handleQuantityChange = (productId: string, newQuantity: number, size?: string) => {
    if (newQuantity < 1) return;
    updateQuantity(productId, newQuantity, size);
  };

  const getItemKey = (productId: string, size?: string) => `${productId}-${size ?? ""}`;

  const handleQuantityInput = (productId: string, value: string, size?: string) => {
    const itemKey = getItemKey(productId, size);
    // Store the editing value locally
    setEditingQuantities((prev) => ({ ...prev, [itemKey]: value }));
  };

  const handleQuantityBlur = (productId: string, value: string, size?: string) => {
    const itemKey = getItemKey(productId, size);
    // Clear editing state
    setEditingQuantities((prev) => {
      const newState = { ...prev };
      delete newState[itemKey];
      return newState;
    });

    // On blur, validate and set to 1 if invalid
    const numValue = parseInt(value);
    if (isNaN(numValue) || numValue < 1) {
      updateQuantity(productId, 1, size);
    } else {
      updateQuantity(productId, numValue, size);
    }
  };

  const handleRemoveItem = (productId: string, size?: string) => {
    const item = items.find((i) => i.productId === productId && i.size === size);
    if (item) {
      // Store the item before removing for undo functionality
      const itemToStore = {
        item: {
          productId: item.productId,
          slug: item.slug,
          name: item.name,
          price: item.price,
          image: item.image,
          size: item.size,
          color: item.color,
        },
        quantity: item.quantity,
      };

      removeItem(productId, size);

      // Show toast with undo button
      const toastId = toast.success(
        <div className='flex items-center justify-between gap-4 w-full'>
          <div className='flex items-center gap-2 flex-1'>
            <Check className='w-4 h-4 text-green-600 shrink-0' />
            <span className='text-sm font-medium'>Item removed from cart</span>
          </div>
          <Button
            variant='outline'
            size='sm'
            onClick={() => {
              addItem(itemToStore.item, itemToStore.quantity);
              toast.dismiss(toastId);
            }}
            className='shrink-0 gap-2 h-8 px-3'
          >
            <Undo2 className='w-3.5 h-3.5' />
            <span>Undo</span>
          </Button>
        </div>,
        {
          duration: 5000,
        }
      );
    }
  };

  const isFreeShippingEnabled = freeShippingThreshold < Number.MAX_SAFE_INTEGER;
  const freeShippingRemaining = isFreeShippingEnabled ? Math.max(0, freeShippingThreshold - subtotal) : 0;
  const freeShippingProgress =
    isFreeShippingEnabled && freeShippingThreshold > 0 ? Math.min(100, (subtotal / freeShippingThreshold) * 100) : 0;
  const hasFreeShipping = isFreeShippingEnabled && subtotal >= freeShippingThreshold;

  return (
    <div className='bg-linear-to-br from-background via-background to-accent/5'>
      <div className='mx-auto max-w-[1440px] px-4 py-6 sm:px-6 lg:px-8'>
        {/* Header */}
        <div className='mb-6 sm:mb-8 space-y-4 sm:space-y-6'>
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

        {items.length === 0 ? (
          <Card className='mx-auto max-w-md border-none shadow-none'>
            <CardContent className='p-8 text-center'>
              <ShoppingBag className='w-16 h-16 mx-auto mb-4 text-muted-foreground' />
              <h2 className='text-xl font-semibold mb-2'>Your cart is empty</h2>
              <p className='text-muted-foreground mb-6'>Start adding products to your cart!</p>
              <Button asChild size='lg' className='w-full'>
                <Link href='/'>Start Shopping</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className='grid grid-cols-1 gap-4 sm:gap-5 lg:grid-cols-3 lg:gap-7'>
            {/* Cart Items */}
            <div className='lg:col-span-2 space-y-3 sm:space-y-4'>
              {items.map((item, index) => {
                const itemTotal = item.price * item.quantity;
                const itemKey = getItemKey(item.productId, item.size);
                const displayQuantity = editingQuantities[itemKey] ?? item.quantity.toString();
                return (
                  <Card
                    key={`${item.productId}-${item.size ?? "_"}`}
                    className='overflow-hidden border transition-all duration-300 hover:shadow-lg hover:border-primary/20 animate-in slide-in-from-left-4 fade-in p-0!'
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <CardContent className='p-3 sm:p-4'>
                      <div className='flex flex-col sm:flex-row gap-3 sm:gap-5'>
                        {/* Product Image */}
                        <Link
                          href={`/products/${item.slug}`}
                          className='relative w-24 h-24 sm:w-24 sm:h-24 overflow-hidden rounded-lg border bg-accent/30 shrink-0 group mx-auto sm:mx-0'
                        >
                          <CloudImage
                            src={item.image}
                            alt={item.name}
                            fill
                            className='object-contain p-2 transition-transform duration-300 group-hover:scale-110'
                          />
                        </Link>

                        {/* Product Details */}
                        <div className='flex-1 min-w-0 flex flex-col'>
                          <Link
                            href={`/products/${item.slug}`}
                            className='font-semibold text-base sm:text-lg hover:text-primary transition-colors line-clamp-2'
                          >
                            {item.name}
                          </Link>
                          <div className='flex flex-wrap items-center gap-2'>
                            {item.size && (
                              <Badge variant='outline' className='text-xs font-medium'>
                                Size: {item.size}
                              </Badge>
                            )}
                            {item.color && (
                              <Badge variant='outline' className='text-xs font-medium'>
                                {item.color}
                              </Badge>
                            )}
                          </div>

                          <div className='flex flex-wrap items-center justify-between gap-3'>
                            <div className='flex items-baseline gap-2'>
                              <span className='text-base sm:text-lg font-bold text-foreground'>{formatPrice(item.price)}</span>
                              <span className='text-sm text-muted-foreground'>each</span>
                            </div>
                            <div className='flex flex-col items-end gap-1'>
                              <p className='text-sm text-muted-foreground'>Total</p>
                              <p className='text-lg font-bold text-primary'>{formatPrice(itemTotal)}</p>
                            </div>
                          </div>

                          {/* Quantity Controls & Actions */}
                          <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-3 mt-2 border-t'>
                            <div className='flex items-center border border-border rounded-lg overflow-hidden bg-background shadow-sm w-fit'>
                              <Button
                                variant='ghost'
                                size='sm'
                                onClick={() => handleQuantityChange(item.productId, item.quantity - 1, item.size)}
                                disabled={item.quantity <= 1}
                                className='h-9 w-9 rounded-none hover:bg-accent active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed'
                              >
                                <Minus className='w-4 h-4' />
                              </Button>
                              <input
                                type='text'
                                inputMode='numeric'
                                pattern='[0-9]*'
                                value={displayQuantity}
                                onChange={(e) => {
                                  const value = e.target.value;
                                  // Allow empty string or valid numbers
                                  if (value === "" || /^\d+$/.test(value)) {
                                    handleQuantityInput(item.productId, value, item.size);
                                  }
                                }}
                                onBlur={(e) => handleQuantityBlur(item.productId, e.target.value, item.size)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    e.currentTarget.blur();
                                  }
                                }}
                                className='w-12 h-9 text-center text-sm font-bold bg-accent/40 border-0 border-x border-border focus:outline-none focus:ring-0 focus:bg-accent/60 transition-colors'
                              />
                              <Button
                                variant='ghost'
                                size='sm'
                                onClick={() => handleQuantityChange(item.productId, item.quantity + 1, item.size)}
                                className='h-9 w-9 rounded-none hover:bg-accent active:scale-95 transition-all'
                              >
                                <Plus className='w-4 h-4' />
                              </Button>
                            </div>

                            <Button
                              variant='ghost'
                              size='sm'
                              onClick={() => handleRemoveItem(item.productId, item.size)}
                              className='text-muted-foreground hover:text-destructive hover:bg-destructive/10 h-9 px-3 sm:px-4'
                            >
                              <Trash2 className='w-4 h-4 mr-2' />
                              <span className='text-sm'>Remove</span>
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Order Summary */}
            <div className='lg:col-span-1'>
              <Card className='lg:sticky lg:top-28 border'>
                <CardHeader>
                  <CardTitle className='flex items-center gap-2 text-lg sm:text-xl'>
                    <ShoppingBag className='w-5 h-5 text-primary' />
                    Order Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className='space-y-5'>
                  {/* Free Shipping Progress */}
                  {isFreeShippingEnabled && freeShippingThreshold > 0 && (
                    <div className='space-y-2 p-4 rounded-lg bg-linear-to-br from-primary/5 to-primary/10 border border-primary/20'>
                      {hasFreeShipping ? (
                        <div className='flex items-center gap-2 text-sm font-semibold text-primary'>
                          <Sparkles className='w-4 h-4' />
                          <span>You've unlocked free shipping!</span>
                        </div>
                      ) : (
                        <>
                          <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-0 text-xs sm:text-sm mb-2'>
                            <span className='text-muted-foreground font-medium wrap-break-word'>
                              Add {formatPrice(freeShippingRemaining)} for free shipping
                            </span>
                            <span className='font-semibold text-primary'>{Math.round(freeShippingProgress)}%</span>
                          </div>
                          <Progress value={freeShippingProgress} className='h-2' />
                        </>
                      )}
                    </div>
                  )}

                  {/* Price Breakdown */}
                  <div className='space-y-3'>
                    <div className='flex items-center justify-between text-sm'>
                      <span className='text-muted-foreground'>
                        Subtotal ({count} {count === 1 ? "item" : "items"})
                      </span>
                      <span className='font-semibold text-base'>{formatPrice(subtotal)}</span>
                    </div>
                    <div className='flex items-center justify-between text-sm'>
                      <span className='text-muted-foreground flex items-center gap-1'>
                        <Truck className='w-3.5 h-3.5' />
                        Shipping
                      </span>
                      <span className='font-semibold text-base'>
                        {shipping === 0 ? <span className='text-green-600'>Free</span> : formatPrice(shipping)}
                      </span>
                    </div>
                    <Separator className='my-2' />
                    <div className='flex items-center justify-between'>
                      <span className='font-semibold text-base sm:text-lg'>Total</span>
                      <span className='font-bold text-xl sm:text-2xl text-primary'>{formatPrice(total)}</span>
                    </div>
                  </div>

                  {/* Checkout Button */}
                  <Button asChild size='lg' className='w-full h-12 text-base font-semibold shadow-md hover:shadow-lg transition-all'>
                    <Link href='/checkout' className='flex items-center justify-center gap-2'>
                      <span>Proceed to Checkout</span>
                      <ArrowLeft className='w-4 h-4 rotate-180' />
                    </Link>
                  </Button>

                  {/* Trust Badges */}
                  <div className='pt-2 space-y-2'>
                    <div className='flex items-center gap-2 text-xs text-muted-foreground'>
                      <Shield className='w-3.5 h-3.5 text-primary' />
                      <span>Secure checkout</span>
                    </div>
                    <div className='flex items-center gap-2 text-xs text-muted-foreground'>
                      <RefreshCw className='w-3.5 h-3.5 text-primary' />
                      <span>Free returns</span>
                    </div>
                    <div className='flex items-center gap-2 text-xs text-muted-foreground'>
                      <Truck className='w-3.5 h-3.5 text-primary' />
                      <span>Fast & reliable delivery</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
