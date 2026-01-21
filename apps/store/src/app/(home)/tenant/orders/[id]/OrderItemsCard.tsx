"use client";

import { format } from "date-fns";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Package, Calendar, CheckCircle2, XCircle, Plus, Minus } from "lucide-react";
import CloudImage from "@/components/site/CloudImage";
import type { Order, Product, OrderStatus, PaymentStatus } from "@/lib/types";

interface OrderItemsCardProps {
  order: Order;
  productMap: Map<string, Product>;
  currencySymbol: string;
  onUpdateItemPrice: (index: number, price: number) => void;
  onUpdateItemQuantity: (index: number, quantity: number) => void;
  getPaymentStatusColor: (status: PaymentStatus) => string;
  getPaymentStatusLabel: (status: PaymentStatus) => string;
  getStatusColor: (status: OrderStatus) => string;
  getStatusLabel: (status: OrderStatus) => string;
}

export function OrderItemsCard({
  order,
  productMap,
  currencySymbol,
  onUpdateItemPrice,
  onUpdateItemQuantity,
  getPaymentStatusColor,
  getPaymentStatusLabel,
  getStatusColor,
  getStatusLabel,
}: OrderItemsCardProps) {
  const router = useRouter();

  return (
    <Card className='border shadow-md overflow-hidden gap-0 !pt-0 gap-0'>
      <CardHeader className='sm:pb-4 px-3 sm:px-4 pt-3 sm:pt-4 !pb-4 border-b'>
        <div className='flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 md:gap-3'>
          <div className='flex-1 gap-1 min-w-0'>
            <CardTitle className='flex items-center gap-2 text-base sm:text-lg md:text-xl'>
              <div className='p-1.5 sm:p-2 bg-primary/10 rounded-lg'>
                <Package className='h-4 w-4 sm:h-5 sm:w-5 text-primary' />
              </div>
              <div className='flex flex-col items-start gap-1'>
                <h1> Order Items</h1>
                <div className='flex flex-wrap items-center gap-2 text-xs text-muted-foreground'>
                  <span className='font-medium'>#{order.id.slice(-7)}</span>
                  <span className='hidden sm:inline'>•</span>
                  <span className='flex items-center gap-1'>
                    <Calendar className='h-3 w-3' />
                    {format(new Date(order.createdAt), "hh:mm a MMM dd, yyyy")}
                  </span>
                  {order.orderType === "offline" && (
                    <>
                      <span className='hidden sm:inline'>•</span>
                      <Badge className='bg-purple-50 text-purple-700 dark:bg-purple-950/50 dark:text-purple-400 border-purple-200 dark:border-purple-800 text-xs font-medium'>
                        Offline Order
                      </Badge>
                    </>
                  )}
                </div>
              </div>
            </CardTitle>
          </div>
          <div className='flex items-center gap-2 shrink-0 flex-wrap'>
            {order.orderType === "offline" && (
              <Badge className='bg-purple-50 text-purple-700 dark:bg-purple-950/50 dark:text-purple-400 border-purple-200 dark:border-purple-800 text-xs font-semibold'>
                Offline
              </Badge>
            )}
            <Badge className={`text-xs border-2 font-semibold ${getPaymentStatusColor(order.paymentStatus || "pending")}`}>
              {order.paymentStatus === "completed" ? (
                <>
                  <CheckCircle2 className='h-3 w-3 sm:h-3.5 sm:w-3.5 mr-1' />
                  <span className='hidden md:inline'>{getPaymentStatusLabel(order.paymentStatus)}</span>
                  <span className='md:hidden'>Paid</span>
                </>
              ) : (
                <>
                  <XCircle className='h-3 w-3 sm:h-3.5 sm:w-3.5 mr-1' />
                  <span className='hidden md:inline'>{getPaymentStatusLabel(order.paymentStatus || "pending")}</span>
                  <span className='md:hidden'>Pending</span>
                </>
              )}
            </Badge>
            <Badge className={`text-xs border ${getStatusColor(order.status)}`}>{getStatusLabel(order.status)}</Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className='p-3 sm:p-4 space-y-3 sm:space-y-4'>
        {order.items.map((item, index) => {
          const product = productMap.get(item.productId);
          return (
            <div
              key={index}
              className='group border rounded-lg sm:rounded-xl p-3 sm:p-4 bg-card hover:shadow-md hover:border-primary/30 transition-all duration-200 cursor-pointer'
              onClick={() => router.push(`/products/${item.slug}`)}
            >
              {/* Mobile Layout - Horizontal Card */}
              <div className='sm:hidden'>
                <div className='flex gap-3'>
                  {/* Compact Product Image */}
                  <div className='relative w-20 h-20 rounded-lg overflow-hidden bg-muted shrink-0'>
                    {item.image ? (
                      <CloudImage src={item.image} alt={item.name} fill className='object-cover' />
                    ) : (
                      <div className='w-full h-full flex items-center justify-center bg-muted/30'>
                        <Package className='h-6 w-6 text-muted-foreground/50' />
                      </div>
                    )}
                    {item.quantity > 1 && (
                      <Badge className='absolute -top-1 -right-1 bg-primary text-primary-foreground text-[9px] px-1.5 py-0.5 font-bold shadow-md'>
                        ×{item.quantity}
                      </Badge>
                    )}
                  </div>

                  {/* Product Info */}
                  <div className='flex-1 min-w-0 space-y-1.5'>
                    <h3 className='font-bold text-sm text-foreground leading-tight line-clamp-2'>{item.name}</h3>
                    <div className='flex flex-wrap items-center gap-1'>
                      {item.size && (
                        <span className='text-[10px] px-1.5 py-0.5 bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400 rounded'>
                          {item.size}
                        </span>
                      )}
                      {item.color && (
                        <span className='text-[10px] px-1.5 py-0.5 bg-purple-50 text-purple-700 dark:bg-purple-950/50 dark:text-purple-400 rounded flex items-center gap-1'>
                          <span
                            className='w-2 h-2 rounded-full border'
                            style={{ backgroundColor: item.color.toLowerCase() }}
                          />
                          {item.color}
                        </span>
                      )}
                    </div>
                    {/* Price Row */}
                    <div className='flex items-center justify-between pt-1'>
                      <span className='text-xs text-muted-foreground'>
                        {currencySymbol}{item.price} × {item.quantity}
                      </span>
                      <span className='text-sm font-bold text-primary'>
                        {currencySymbol}{(item.price * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Mobile Quantity Controls */}
                <div className='flex items-center justify-between mt-3 pt-3 border-t border-dashed'>
                  <div className='flex items-center gap-2'>
                    <Button
                      variant='outline'
                      size='sm'
                      onClick={(e) => {
                        e.stopPropagation();
                        onUpdateItemQuantity(index, item.quantity - 1);
                      }}
                      className='h-8 w-8 p-0 rounded-full'
                    >
                      <Minus className='h-3 w-3' />
                    </Button>
                    <span className='w-8 text-center font-bold text-sm'>{item.quantity}</span>
                    <Button
                      variant='outline'
                      size='sm'
                      onClick={(e) => {
                        e.stopPropagation();
                        onUpdateItemQuantity(index, item.quantity + 1);
                      }}
                      className='h-8 w-8 p-0 rounded-full'
                    >
                      <Plus className='h-3 w-3' />
                    </Button>
                  </div>
                  <div className='flex items-center gap-1'>
                    <span className='text-xs text-muted-foreground'>{currencySymbol}</span>
                    <Input
                      value={item.price}
                      onChange={(e) => {
                        e.stopPropagation();
                        const newPrice = parseFloat(e.target.value) || 0;
                        onUpdateItemPrice(index, newPrice);
                      }}
                      onClick={(e) => e.stopPropagation()}
                      className='w-20 h-8 text-sm font-semibold text-right border rounded-lg'
                      min='0'
                      step='0.01'
                    />
                  </div>
                </div>
              </div>

              {/* Desktop Layout - Original */}
              <div className='hidden sm:block'>
                <div className='flex flex-col sm:flex-row gap-3 sm:gap-4'>
                  {/* Product Image - Responsive */}
                  <div className='relative w-full sm:w-28 md:w-28 h-56 sm:h-24 md:h-28 rounded-lg sm:rounded-xl overflow-hidden bg-gradient-to-br from-muted to-muted/50 border border-muted shrink-0 shadow-sm'>
                    {item.image ? (
                      <CloudImage src={item.image} alt={item.name} fill className='object-cover' />
                    ) : (
                      <div className='w-full h-full flex items-center justify-center bg-muted/30'>
                        <Package className='h-8 w-8 sm:h-10 sm:w-10 text-muted-foreground/50' />
                      </div>
                    )}
                    {item.quantity > 1 && (
                      <Badge className='absolute top-1.5 right-1.5 sm:top-2 sm:right-2 bg-primary text-primary-foreground text-[10px] md:text-xs px-1.5 sm:px-2.5 py-0.5 sm:py-1 font-semibold shadow-md'>
                        ×{item.quantity}
                      </Badge>
                    )}
                  </div>

                  {/* Product Details - Responsive */}
                  <div className='flex-1 space-y-2 sm:space-y-3 min-w-0'>
                    {/* Product Name & Variants */}
                    <div className='space-y-1.5'>
                      <h3 className='font-bold text-sm sm:text-base md:text-lg text-foreground leading-tight line-clamp-2'>{item.name}</h3>
                      <div className='flex flex-wrap items-center gap-1.5 sm:gap-2'>
                        {product?.brand && (
                          <Badge variant='outline' className='text-[10px] md:text-xs'>
                            {product.brand}
                          </Badge>
                        )}
                        {item.size && (
                          <Badge
                            variant='secondary'
                            className='text-[10px] md:text-xs bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400 border-blue-200 dark:border-blue-800'
                          >
                            Size: {item.size}
                          </Badge>
                        )}
                        {item.color && (
                          <Badge
                            variant='secondary'
                            className='text-[10px] md:text-xs bg-purple-50 text-purple-700 dark:bg-purple-950/50 dark:text-purple-400 border-purple-200 dark:border-purple-800 flex items-center gap-1.5'
                          >
                            <span
                              className='w-3 h-3 rounded-full border border-gray-300 dark:border-gray-600 shrink-0'
                              style={{ backgroundColor: item.color.toLowerCase() }}
                            />
                            {item.color}
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Price & Quantity Row - Responsive Grid */}
                    <div className='grid grid-cols-1 md:grid-cols-3 gap-2 sm:gap-3'>
                      {/* Unit Price */}
                      <div className='p-2 sm:p-3 bg-muted/30 rounded-lg border border-muted'>
                        <Label className='text-[10px] md:text-xs font-semibold text-muted-foreground mb-1 sm:mb-2 block uppercase tracking-wide'>
                          Unit Price
                        </Label>
                        <div className='flex items-baseline gap-1'>
                          <span className='text-xs sm:text-sm font-medium text-muted-foreground'>{currencySymbol}</span>
                          <Input
                            value={item.price}
                            onChange={(e) => {
                              e.stopPropagation();
                              const newPrice = parseFloat(e.target.value) || 0;
                              onUpdateItemPrice(index, newPrice);
                            }}
                            onClick={(e) => e.stopPropagation()}
                            className='border-0 shadow-none bg-transparent px-0 py-0 h-auto text-sm sm:text-base md:text-lg font-bold focus-visible:ring-0 focus-visible:ring-offset-0 w-full'
                            min='0'
                            step='0.01'
                          />
                        </div>
                      </div>

                      {/* Quantity Selector */}
                      <div className='p-2 sm:p-3 bg-primary/5 rounded-lg border border-primary/20'>
                        <Label className='text-[10px] md:text-xs font-semibold text-muted-foreground mb-1 sm:mb-2 block uppercase tracking-wide'>
                          Quantity
                        </Label>
                        <div className='flex items-center gap-1.5 sm:gap-2'>
                          <Button
                            variant='outline'
                            size='sm'
                            onClick={(e) => {
                              e.stopPropagation();
                              onUpdateItemQuantity(index, item.quantity - 1);
                            }}
                            className='h-7 w-7 sm:h-8 sm:w-8 p-0 border hover:bg-primary hover:text-primary-foreground hover:border-primary'
                          >
                            <Minus className='h-3 w-3 sm:h-4 sm:w-4' />
                          </Button>
                          <span className='w-10 sm:w-12 text-center font-bold text-sm sm:text-base md:text-lg text-primary'>
                            {item.quantity}
                          </span>
                          <Button
                            variant='outline'
                            size='sm'
                            onClick={(e) => {
                              e.stopPropagation();
                              onUpdateItemQuantity(index, item.quantity + 1);
                            }}
                            className='h-7 w-7 sm:h-8 sm:w-8 p-0 border hover:bg-primary hover:text-primary-foreground hover:border-primary'
                          >
                            <Plus className='h-3 w-3 sm:h-4 sm:w-4' />
                          </Button>
                        </div>
                      </div>

                      {/* Total Price */}
                      <div className='p-2 sm:p-3 bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg border border-primary/30'>
                        <Label className='text-[10px] md:text-xs font-semibold text-muted-foreground mb-1 sm:mb-2 block uppercase tracking-wide'>
                          Line Total
                        </Label>
                        <div className='text-base sm:text-lg md:text-xl font-bold text-primary'>
                          {currencySymbol}
                          {(item.price * item.quantity).toFixed(2)}
                        </div>
                      </div>
                    </div>

                    {/* Warranty - If Available - Responsive */}
                    {product?.warranty && (
                      <div className='p-2 sm:p-3 bg-gradient-to-r from-blue-50 to-blue-100/50 dark:from-blue-950/30 dark:to-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800'>
                        <div className='flex items-center gap-2'>
                          <CheckCircle2 className='h-4 w-4 sm:h-5 sm:w-5 text-blue-600 dark:text-blue-400 shrink-0' />
                          <span className='text-xs sm:text-sm font-semibold text-blue-900 dark:text-blue-100'>Warranty:</span>
                          <span className='text-xs sm:text-sm font-bold text-blue-700 dark:text-blue-300'>{product.warranty}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
