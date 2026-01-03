"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { toast } from "sonner";
import { Spinner } from "@/components/ui/spinner";
import { apiRequest } from "@/lib/api-client";
import {
  ArrowLeft,
  Plus,
  Minus,
  X,
  ShoppingBag,
  User,
  MapPin,
  Phone,
  Mail,
  DollarSign,
  Package,
  Search,
  Check,
  ChevronsUpDown,
} from "lucide-react";
import CloudImage from "@/components/site/CloudImage";
import { useCurrencySymbol } from "@/hooks/use-currency";
import type { Product, Order, PaymentMethod, PaymentStatus, OrderStatus, CartLineItem } from "@/lib/types";
import { cn } from "@/lib/utils";

const formSchema = z.object({
  customer: z.object({
    fullName: z.string().min(2, "Full name is required"),
    email: z.string().email("Valid email is required").optional().or(z.literal("")),
    phone: z.string().min(10, "Phone number is required"),
    addressLine1: z.string().min(5, "Address is required"),
    addressLine2: z.string().optional(),
    city: z.string().min(1, "City is required"),
    postalCode: z.string().min(4, "Postal code is required"),
    notes: z.string().optional(),
  }),
  paymentMethod: z.enum(["cod", "online"]),
  paymentStatus: z.enum(["pending", "completed", "failed", "cancelled"]).default("pending"),
  orderStatus: z.enum(["pending", "processing", "shipped", "delivered", "cancelled"]).default("pending"),
  orderType: z.enum(["online", "offline"]).default("offline"),
  shipping: z.coerce.number().min(0).default(0),
  discountAmount: z.coerce.number().min(0).default(0),
});

type FormValues = z.infer<typeof formSchema> & {
  discountAmount: number; // Ensure discountAmount is always a number, not optional
};

interface OrderItem extends CartLineItem {
  selectedSize?: string;
  selectedColor?: string;
}

export default function CreateOrderClient() {
  const router = useRouter();
  const currencySymbol = useCurrencySymbol();
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [productSearchOpen, setProductSearchOpen] = useState(false);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [creating, setCreating] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema) as any,
    defaultValues: {
      customer: {
        fullName: "",
        email: "",
        phone: "",
        addressLine1: "",
        addressLine2: "",
        city: "",
        postalCode: "",
        notes: "",
      },
      paymentMethod: "cod",
      paymentStatus: "pending",
      orderStatus: "pending",
      orderType: "offline",
      shipping: 0,
      discountAmount: 0,
    },
  });

  // Fetch products
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const data: any = await apiRequest("GET", "/products");
        // Handle both response formats: object with products property or direct array
        const productsArray = Array.isArray(data) ? data : data?.data?.products || data?.products || [];
        setProducts(Array.isArray(productsArray) ? productsArray : []);
      } catch (error) {
        toast.error("Failed to load products");
        setProducts([]); // Ensure products is always an array
      } finally {
        setLoadingProducts(false);
      }
    };
    fetchProducts();
  }, []);

  // Filter products for search
  const filteredProducts = useMemo(() => {
    // Ensure products is always an array before calling array methods
    if (!Array.isArray(products)) return [];
    if (!searchQuery) return products.slice(0, 10);
    const query = searchQuery.toLowerCase();
    return products.filter((p) => p?.name?.toLowerCase().includes(query) || p?.category?.toLowerCase().includes(query));
  }, [products, searchQuery]);

  // Calculate totals
  const subtotal = useMemo(() => {
    return orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }, [orderItems]);

  const discountAmount = form.watch("discountAmount") || 0;
  const shipping = form.watch("shipping") || 0;
  const total = subtotal - discountAmount + shipping;

  // Add product to order
  const addProduct = (product: Product) => {
    const sizes = product.sizes || [];
    const colors = product.colors || [];
    const defaultSize = sizes[0] || undefined;
    const defaultColor = colors[0] || undefined;

    // Check if product already exists in order with same size and color
    const existingIndex = orderItems.findIndex(
      (item) =>
        item.productId === product.id && (!defaultSize || item.size === defaultSize) && (!defaultColor || item.color === defaultColor)
    );

    if (existingIndex >= 0) {
      // Increase quantity
      setOrderItems((prev) => prev.map((item, idx) => (idx === existingIndex ? { ...item, quantity: item.quantity + 1 } : item)));
    } else {
      // Add new item
      const newItem: OrderItem = {
        productId: product.id,
        name: product.name,
        slug: product.slug || "",
        image: product.images[0] || "/file.svg",
        price: product.price,
        quantity: 1,
        size: defaultSize,
        selectedSize: defaultSize,
        color: defaultColor,
        selectedColor: defaultColor,
      };
      setOrderItems((prev) => [...prev, newItem]);
    }
    setProductSearchOpen(false);
    setSearchQuery("");
    toast.success(`${product.name} added to order`);
  };

  // Remove item from order
  const removeItem = (index: number) => {
    setOrderItems((prev) => prev.filter((_, i) => i !== index));
  };

  // Update item quantity
  const updateQuantity = (index: number, quantity: number) => {
    if (quantity < 1) {
      removeItem(index);
      return;
    }
    setOrderItems((prev) => prev.map((item, i) => (i === index ? { ...item, quantity } : item)));
  };

  // Update item size
  const updateSize = (index: number, size: string) => {
    setOrderItems((prev) => prev.map((item, i) => (i === index ? { ...item, size, selectedSize: size } : item)));
  };

  // Update item color
  const updateColor = (index: number, color: string) => {
    setOrderItems((prev) => prev.map((item, i) => (i === index ? { ...item, color, selectedColor: color } : item)));
  };

  // Create order
  const onSubmit = async (values: FormValues) => {
    if (orderItems.length === 0) {
      toast.error("Please add at least one product to the order");
      return;
    }

    setCreating(true);
    try {
      const order: Order = {
        id: "",
        createdAt: new Date().toISOString(),
        status: values.orderStatus,
        orderType: values.orderType,
        items: orderItems,
        subtotal,
        discountAmount: discountAmount > 0 ? discountAmount : undefined,
        shipping: values.shipping,
        total,
        paymentMethod: values.paymentMethod,
        paymentStatus: values.paymentStatus,
        customer: values.customer,
        paidAmount: values.paymentStatus === "completed" ? total : undefined,
      };

      const created: any = await apiRequest("POST", "/orders", order);
      toast.success("Order created successfully!");
      router.push(`/merchant/orders/${created?.data?.id || created?.id}`);
    } catch (error: any) {
      toast.error(error?.message || "Failed to create order");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className='min-h-screen bg-gradient-to-br from-background via-background to-muted/30'>
      <div className='mx-auto max-w-[1440px] px-4 py-6 sm:px-6 lg:px-8'>
        {/* Header */}
        <div className='mb-6'>
          <Button variant='ghost' size='sm' className='mb-4' asChild>
            <Link href='/merchant/orders' className='flex items-center gap-2'>
              <ArrowLeft className='w-4 h-4' />
              Back to Orders
            </Link>
          </Button>
          <h1 className='text-3xl font-bold tracking-tight'>Create New Order</h1>
          <p className='text-muted-foreground mt-2'>Manually create an order for a customer</p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6'>
            <div className='grid gap-6 lg:grid-cols-3'>
              {/* Left Column - Order Details */}
              <div className='lg:col-span-2 space-y-6'>
                {/* Products Selection */}
                <Card>
                  <CardHeader>
                    <CardTitle className='flex items-center gap-2'>
                      <ShoppingBag className='w-5 h-5' />
                      Products
                    </CardTitle>
                  </CardHeader>
                  <CardContent className='space-y-4'>
                    {/* Product Search */}
                    <Popover open={productSearchOpen} onOpenChange={setProductSearchOpen}>
                      <PopoverTrigger asChild>
                        <Button variant='outline' type='button' className='w-full justify-start text-left font-normal'>
                          <Search className='mr-2 h-4 w-4' />
                          {searchQuery || "Search and add products..."}
                          <ChevronsUpDown className='ml-auto h-4 w-4 shrink-0 opacity-50' />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className='w-[400px] p-0' align='start'>
                        <Command>
                          <CommandInput placeholder='Search products...' value={searchQuery} onValueChange={setSearchQuery} />
                          <CommandList>
                            <CommandEmpty>
                              {loadingProducts ? (
                                <div className='flex items-center justify-center p-4'>
                                  <Spinner className='h-4 w-4' />
                                </div>
                              ) : (
                                "No products found."
                              )}
                            </CommandEmpty>
                            <CommandGroup>
                              {filteredProducts.map((product) => (
                                <CommandItem
                                  key={product.id}
                                  value={product.id}
                                  onSelect={() => addProduct(product)}
                                  className='flex items-center gap-3 p-3'
                                >
                                  <div className='relative h-12 w-12 shrink-0 overflow-hidden rounded-md border bg-muted'>
                                    <CloudImage
                                      src={product.images[0] || "/file.svg"}
                                      alt={product.name}
                                      fill
                                      className='object-contain p-1'
                                    />
                                  </div>
                                  <div className='flex-1 min-w-0'>
                                    <div className='font-medium truncate'>{product.name}</div>
                                    <div className='text-sm text-muted-foreground'>
                                      {currencySymbol}
                                      {product.price.toFixed(2)}
                                    </div>
                                  </div>
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>

                    {/* Order Items */}
                    {orderItems.length === 0 ? (
                      <div className='text-center py-8 text-muted-foreground'>
                        <Package className='w-12 h-12 mx-auto mb-2 opacity-50' />
                        <p>No products added yet</p>
                        <p className='text-sm'>Click above to search and add products</p>
                      </div>
                    ) : (
                      <div className='space-y-3'>
                        {orderItems.map((item, index) => {
                          const product = products.find((p) => p.id === item.productId);
                          const availableSizes = product?.sizes || [];
                          const availableColors = product?.colors || [];

                          return (
                            <div key={index} className='flex gap-4 p-4 border rounded-lg'>
                              <div className='relative h-20 w-20 shrink-0 overflow-hidden rounded-md border bg-muted'>
                                <CloudImage src={item.image} alt={item.name} fill className='object-contain p-1' />
                              </div>
                              <div className='flex-1 min-w-0 space-y-2'>
                                <div className='flex items-start justify-between'>
                                  <div className='flex-1 min-w-0'>
                                    <h4 className='font-medium truncate'>{item.name}</h4>
                                    <div className='flex flex-wrap items-center gap-1.5 mt-1'>
                                      {item.size && (
                                        <Badge
                                          variant='secondary'
                                          className='text-[10px] bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400 border-blue-200 dark:border-blue-800'
                                        >
                                          Size: {item.size}
                                        </Badge>
                                      )}
                                      {item.color && (
                                        <Badge
                                          variant='secondary'
                                          className='text-[10px] bg-purple-50 text-purple-700 dark:bg-purple-950/50 dark:text-purple-400 border-purple-200 dark:border-purple-800 flex items-center gap-1.5'
                                        >
                                          <span
                                            className='w-3 h-3 rounded-full border border-gray-300 dark:border-gray-600 shrink-0'
                                            style={{ backgroundColor: item.color.toLowerCase() }}
                                          />
                                          Color: {item.color}
                                        </Badge>
                                      )}
                                    </div>
                                    <p className='text-sm text-muted-foreground mt-1'>
                                      {currencySymbol}
                                      {item.price.toFixed(2)} each
                                    </p>
                                  </div>
                                  <Button
                                    type='button'
                                    variant='ghost'
                                    size='sm'
                                    onClick={() => removeItem(index)}
                                    className='h-8 w-8 p-0 text-destructive'
                                  >
                                    <X className='h-4 w-4' />
                                  </Button>
                                </div>
                                <div className='flex flex-wrap items-center gap-2'>
                                  {availableSizes.length > 0 && (
                                    <Select
                                      value={item.selectedSize || item.size || ""}
                                      onValueChange={(value) => updateSize(index, value)}
                                    >
                                      <SelectTrigger className='w-32 h-8 text-xs'>
                                        <SelectValue placeholder='Size' />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {availableSizes.map((size) => (
                                          <SelectItem key={size} value={size}>
                                            {size}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  )}
                                  {availableColors.length > 0 && (
                                    <Select
                                      value={item.selectedColor || item.color || ""}
                                      onValueChange={(value) => updateColor(index, value)}
                                    >
                                      <SelectTrigger className='w-32 h-8 text-xs'>
                                        <SelectValue placeholder='Color' />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {availableColors.map((color) => {
                                          const isColorName = /^[a-zA-Z]+$/.test(color);
                                          return (
                                            <SelectItem key={color} value={color}>
                                              <div className='flex items-center gap-2'>
                                                {isColorName && (
                                                  <span
                                                    className='w-4 h-4 rounded-full border border-gray-300 dark:border-gray-600 shrink-0'
                                                    style={{ backgroundColor: color.toLowerCase() }}
                                                  />
                                                )}
                                                <span>{color}</span>
                                              </div>
                                            </SelectItem>
                                          );
                                        })}
                                      </SelectContent>
                                    </Select>
                                  )}
                                  <div className='flex items-center gap-2 border rounded-md'>
                                    <Button
                                      type='button'
                                      variant='ghost'
                                      size='sm'
                                      onClick={() => updateQuantity(index, item.quantity - 1)}
                                      className='h-8 w-8 p-0'
                                    >
                                      <Minus className='h-3 w-3' />
                                    </Button>
                                    <span className='w-8 text-center text-sm font-medium'>{item.quantity}</span>
                                    <Button
                                      type='button'
                                      variant='ghost'
                                      size='sm'
                                      onClick={() => updateQuantity(index, item.quantity + 1)}
                                      className='h-8 w-8 p-0'
                                    >
                                      <Plus className='h-3 w-3' />
                                    </Button>
                                  </div>
                                  <div className='ml-auto font-semibold'>
                                    {currencySymbol}
                                    {(item.price * item.quantity).toFixed(2)}
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Customer Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className='flex items-center gap-2'>
                      <User className='w-5 h-5' />
                      Customer Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className='space-y-4'>
                    <div className='grid gap-4 sm:grid-cols-2'>
                      <FormField
                        control={form.control}
                        name='customer.fullName'
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Full Name *</FormLabel>
                            <FormControl>
                              <Input placeholder='John Doe' {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name='customer.phone'
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Phone *</FormLabel>
                            <FormControl>
                              <Input placeholder='+1234567890' {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <FormField
                      control={form.control}
                      name='customer.email'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input type='email' placeholder='john@example.com' {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name='customer.addressLine1'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Address Line 1 *</FormLabel>
                          <FormControl>
                            <Input placeholder='Street address' {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name='customer.addressLine2'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Address Line 2</FormLabel>
                          <FormControl>
                            <Input placeholder='Apartment, suite, etc.' {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className='grid gap-4 sm:grid-cols-2'>
                      <FormField
                        control={form.control}
                        name='customer.city'
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>City *</FormLabel>
                            <FormControl>
                              <Input placeholder='City' {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name='customer.postalCode'
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Postal Code *</FormLabel>
                            <FormControl>
                              <Input placeholder='12345' {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <FormField
                      control={form.control}
                      name='customer.notes'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Notes</FormLabel>
                          <FormControl>
                            <Textarea placeholder='Special delivery instructions...' {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>
              </div>

              {/* Right Column - Order Summary & Settings */}
              <div className='lg:col-span-1 space-y-6'>
                {/* Order Settings */}
                <Card>
                  <CardHeader>
                    <CardTitle>Order Settings</CardTitle>
                  </CardHeader>
                  <CardContent className='space-y-4'>
                    <FormField
                      control={form.control}
                      name='orderType'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Order Type</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value='offline'>Offline</SelectItem>
                              <SelectItem value='online'>Online</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name='orderStatus'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Order Status</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value='pending'>Pending</SelectItem>
                              <SelectItem value='waiting_for_confirmation'>Waiting for Confirmation</SelectItem>
                              <SelectItem value='confirmed'>Confirmed</SelectItem>
                              <SelectItem value='processing'>Processing</SelectItem>
                              <SelectItem value='shipped'>Shipped</SelectItem>
                              <SelectItem value='delivered'>Delivered</SelectItem>
                              <SelectItem value='cancelled'>Cancelled</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name='paymentMethod'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Payment Method</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value='cod'>Cash on Delivery</SelectItem>
                              <SelectItem value='online'>Online Payment</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name='paymentStatus'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Payment Status</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value='pending'>Pending</SelectItem>
                              <SelectItem value='completed'>Completed</SelectItem>
                              <SelectItem value='failed'>Failed</SelectItem>
                              <SelectItem value='cancelled'>Cancelled</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>

                {/* Order Summary */}
                <Card>
                  <CardHeader>
                    <CardTitle>Order Summary</CardTitle>
                  </CardHeader>
                  <CardContent className='space-y-4'>
                    <div className='space-y-2'>
                      <div className='flex justify-between text-sm'>
                        <span className='text-muted-foreground'>Subtotal</span>
                        <span className='font-medium'>
                          {currencySymbol}
                          {subtotal.toFixed(2)}
                        </span>
                      </div>
                      <FormField
                        control={form.control}
                        name='discountAmount'
                        render={({ field }) => (
                          <FormItem>
                            <div className='flex justify-between items-center'>
                              <FormLabel className='text-sm'>Discount</FormLabel>
                              <FormControl>
                                <Input
                                  type='number'
                                  step='0.01'
                                  min='0'
                                  className='w-24 h-8 text-right'
                                  {...field}
                                  onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                />
                              </FormControl>
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      {discountAmount > 0 && (
                        <div className='flex justify-between text-sm text-emerald-600'>
                          <span>Discount Applied</span>
                          <span>
                            -{currencySymbol}
                            {discountAmount.toFixed(2)}
                          </span>
                        </div>
                      )}
                      <FormField
                        control={form.control}
                        name='shipping'
                        render={({ field }) => (
                          <FormItem>
                            <div className='flex justify-between items-center'>
                              <FormLabel className='text-sm'>Shipping</FormLabel>
                              <FormControl>
                                <Input
                                  type='number'
                                  step='0.01'
                                  min='0'
                                  className='w-24 h-8 text-right'
                                  {...field}
                                  onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                />
                              </FormControl>
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Separator />
                      <div className='flex justify-between text-lg font-bold'>
                        <span>Total</span>
                        <span className='text-primary'>
                          {currencySymbol}
                          {total.toFixed(2)}
                        </span>
                      </div>
                    </div>

                    <Button type='submit' className='w-full' size='lg' disabled={creating || orderItems.length === 0}>
                      {creating ? (
                        <>
                          <Spinner className='mr-2 h-4 w-4' />
                          Creating Order...
                        </>
                      ) : (
                        <>
                          <Check className='mr-2 h-4 w-4' />
                          Create Order
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}
