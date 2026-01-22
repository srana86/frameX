"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ShoppingCart, Minus, Plus, Trash2 } from "lucide-react";

import { useCart } from "@/components/providers/cart-provider";
import CloudImage from "@/components/site/CloudImage";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useCurrencySymbol } from "@/hooks/use-currency";

export function FloatingCart() {
  const { items, count, subtotal, updateQuantity, removeItem, isEmpty } = useCart();
  const currencySymbol = useCurrencySymbol();
  const [isOpen, setIsOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  // Auto-open cart when items are added
  useEffect(() => {
    const handleCartItemAdded = () => {
      if (!isVisible) return; // Don't open if cart is hidden on this page
      setIsOpen(true);
    };

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === "attributes" && mutation.attributeName === "class") {
          const target = mutation.target as HTMLElement;
          if (target.classList.contains("cart-item-added")) {
            handleCartItemAdded();
          }
        }
      });
    });

    if (document.body) {
      observer.observe(document.body, {
        attributes: true,
        attributeFilter: ["class"],
      });
    }

    return () => observer.disconnect();
  }, [isVisible]);

  // Hide on cart, checkout, and admin/tenant dashboard pages
  // Also check for mobile viewport
  useEffect(() => {
    const shouldHide =
      pathname === "/cart" ||
      pathname === "/checkout" ||
      pathname.startsWith("/checkout/") ||
      pathname.startsWith("/tenant") ||
      pathname.startsWith("/admin");
    
    // Check if mobile (hide floating cart on mobile since we have bottom nav)
    const checkMobile = () => {
      const isMobile = window.innerWidth < 768;
      setIsVisible(!shouldHide && !isMobile);
      if (shouldHide || isMobile) {
        setIsOpen(false);
      }
    };
    
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, [pathname]);

  const handleCheckout = async () => {
    if (isEmpty) return;

    setIsLoading(true);
    setIsOpen(false);

    // Small delay for smooth animation
    setTimeout(() => {
      router.push("/checkout");
      setIsLoading(false);
    }, 300);
  };

  const handleQuantityChange = (productId: string, newQuantity: number, size?: string) => {
    if (newQuantity < 1) return;
    updateQuantity(productId, newQuantity, size);
  };

  const handleRemoveItem = (productId: string, size?: string) => {
    removeItem(productId, size);
  };

  if (!isVisible) return null;

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetContent side='right' className='w-full p-0 sm:max-w-md'>
        <SheetHeader className='border-b p-4 pb-3'>
          <div className='flex items-center gap-2'>
            <ShoppingCart className='w-5 h-5 text-primary' />
            <SheetTitle className='text-lg'>Shopping Cart</SheetTitle>
            <Badge variant='secondary' className='ml-1'>
              {count}
            </Badge>
          </div>
          {!isEmpty && <p className='text-sm text-muted-foreground'>Review your items and proceed to checkout.</p>}
        </SheetHeader>

        <div className='flex-1 overflow-hidden'>
          {isEmpty ? (
            <div className='flex h-full flex-col items-center justify-center p-8 text-center'>
              <ShoppingCart className='mb-3 h-12 w-12 text-muted-foreground' />
              <p className='mb-4 text-muted-foreground'>Your cart is empty</p>
              <Button asChild variant='outline' size='sm' onClick={() => setIsOpen(false)}>
                <Link href='/'>Continue Shopping</Link>
              </Button>
            </div>
          ) : (
            <ScrollArea className='h-[calc(100vh-260px)]'>
              <div className='space-y-3 p-4'>
                {items.map((item) => (
                  <div
                    key={`${item.productId}-${item.size ?? "_"}`}
                    className='flex gap-3 rounded-lg border bg-card p-3 shadow-sm cursor-pointer hover:bg-accent/50 transition-colors'
                    onClick={() => {
                      setIsOpen(false);
                      router.push(`/products/${item.slug}`);
                    }}
                  >
                    <div className='relative h-16 w-16 shrink-0 overflow-hidden rounded-md border bg-accent/30'>
                      <CloudImage src={item.image} alt={item.name} fill className='object-contain p-1' />
                    </div>

                    <div className='flex-1 min-w-0'>
                      <p className='line-clamp-1 text-sm font-semibold'>{item.name}</p>
                      <div className='mt-1 flex items-center gap-2'>
                        <span className='text-sm font-bold text-primary'>
                          {currencySymbol}
                          {(Number(item.price) || 0).toFixed(2)}
                        </span>
                        {item.size && (
                          <Badge variant='outline' className='px-1 py-0 text-xs'>
                            {item.size}
                          </Badge>
                        )}
                      </div>

                      <div className='mt-3 flex items-center gap-2'>
                        <div className='flex items-center border border-border rounded-lg overflow-hidden bg-background'>
                          <Button
                            variant='ghost'
                            size='sm'
                            onClick={(e) => {
                              e.stopPropagation();
                              handleQuantityChange(item.productId, item.quantity - 1, item.size);
                            }}
                            disabled={item.quantity <= 1}
                            className='h-7 w-7 p-0 rounded-none hover:bg-accent disabled:opacity-40'
                          >
                            <Minus className='h-3 w-3' />
                          </Button>
                          <span className='w-8 text-center text-xs font-bold bg-accent/40 border-x border-border'>{item.quantity}</span>
                          <Button
                            variant='ghost'
                            size='sm'
                            onClick={(e) => {
                              e.stopPropagation();
                              handleQuantityChange(item.productId, item.quantity + 1, item.size);
                            }}
                            className='h-7 w-7 p-0 rounded-none hover:bg-accent'
                          >
                            <Plus className='h-3 w-3' />
                          </Button>
                        </div>
                        <Button
                          variant='ghost'
                          size='sm'
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveItem(item.productId, item.size);
                          }}
                          className='ml-auto h-7 w-7 p-0 text-muted-foreground hover:text-destructive'
                        >
                          <Trash2 className='h-3 w-3' />
                        </Button>
                      </div>
                    </div>

                    <div className='text-right'>
                      <p className='text-sm font-semibold'>
                        {currencySymbol}
                        {(item.price * item.quantity).toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>

        {!isEmpty && (
          <SheetFooter className='gap-3 border-t bg-muted/40 p-4'>
            <div className='flex items-center justify-between text-lg font-semibold'>
              <span>Subtotal</span>
              <span>
                {currencySymbol}
                {subtotal.toFixed(2)}
              </span>
            </div>
            <p className='text-xs text-muted-foreground'>Shipping and discounts calculated at checkout.</p>
            <div className='grid w-full grid-cols-2 gap-2'>
              <Button asChild variant='outline' size='sm' onClick={() => setIsOpen(false)}>
                <Link href='/cart'>View Cart</Link>
              </Button>
              <Button size='sm' onClick={handleCheckout} disabled={isLoading} className='relative'>
                {isLoading ? (
                  <>
                    <div className='mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white' />
                    Loading...
                  </>
                ) : (
                  "Checkout"
                )}
              </Button>
            </div>
          </SheetFooter>
        )}
      </SheetContent>

      <div className='floating-cart-container'>
        <SheetTrigger asChild>
          <div className='relative'>
            <Button
              size='lg'
              disabled={isLoading}
              className={`relative h-14 w-14 rounded-full shadow-2xl transition-all duration-300 hover:scale-110 ${
                isOpen ? "bg-primary/90 scale-105" : "bg-primary hover:bg-primary/90"
              } ${isLoading ? "cursor-not-allowed opacity-75" : ""}`}
            >
              {isLoading ? (
                <div className='h-6 w-6 animate-spin rounded-full border-2 border-white/30 border-t-white' />
              ) : (
                <ShoppingCart className='h-6 w-6' />
              )}
            </Button>

            {count > 0 && !isLoading && (
              <Badge className='absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-red-500 p-0 text-white hover:bg-red-500'>
                <span className='text-xs font-bold'>{count > 99 ? "99+" : count}</span>
              </Badge>
            )}

            {count > 0 && !isLoading && <div className='pointer-events-none absolute inset-0 animate-ping rounded-full bg-primary/30' />}
            {isLoading && <div className='pointer-events-none absolute inset-0 rounded-full bg-primary/20 animate-pulse' />}
          </div>
        </SheetTrigger>
      </div>
    </Sheet>
  );
}
