"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useCart } from "@/components/providers/cart-provider";
import type { CustomerInfo, Order, PaymentMethod } from "@/lib/types";
import { toast } from "sonner";
import {
  ArrowLeft,
  CreditCard,
  User,
  Phone,
  Mail,
  ShoppingBag,
  CheckCircle,
  Truck,
  Globe,
  ExternalLink,
  Loader2,
  Tag,
  Trash2,
  AlertTriangle,
  Undo2,
  Plus,
  Minus,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import CloudImage from "@/components/site/CloudImage";
import { useCurrencySymbol } from "@/hooks/use-currency";
import { CouponInput } from "@/components/site/CouponInput";
import type { ApplyCouponResponse } from "@/lib/coupon-types";
import { getSourceTrackingForOrder } from "@/lib/source-tracking";
import { storeUserData, getUserDataForTracking } from "@/lib/tracking/user-data-store";
import apiClient, { apiRequest } from "@/lib/api-client";
import { useSession } from "@/lib/auth-client";

type FormValues = CustomerInfo & {
  paymentMethod: PaymentMethod;
  paymentMode?: "redirect" | "inline"; // For online payment: redirect to gateway or pay on page
};

export default function CheckoutClient() {
  const { items, subtotal, shipping, total, clear, isEmpty, baseShippingFee, freeShippingThreshold, removeItem, addItem, updateQuantity } =
    useCart();
  const currencySymbol = useCurrencySymbol();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [placing, setPlacing] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [onlinePaymentEnabled, setOnlinePaymentEnabled] = useState(false);
  const [checkingPayment, setCheckingPayment] = useState(true);
  const [paymentMode, setPaymentMode] = useState<"redirect" | "inline">("redirect");
  const [easyCheckoutReady, setEasyCheckoutReady] = useState(false);
  const [paymentSession, setPaymentSession] = useState<{ sessionkey: string; gatewayURL: string } | null>(null);
  const [initializingPayment, setInitializingPayment] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<ApplyCouponResponse | null>(null);
  const [isCustomerBlocked, setIsCustomerBlocked] = useState(false);
  const [blockReason, setBlockReason] = useState<string | null>(null);
  const [checkingBlockStatus, setCheckingBlockStatus] = useState(false);
  const [dynamicShipping, setDynamicShipping] = useState<number | null>(null);
  const [calculatingShipping, setCalculatingShipping] = useState(false);
  const [defaultDeliveryCharge, setDefaultDeliveryCharge] = useState<number | null>(null);
  const [configFreeShippingThreshold, setConfigFreeShippingThreshold] = useState<number | null>(null);
  const { data: session } = useSession();

  // Load default delivery charge and free shipping threshold on mount
  useEffect(() => {
    const loadDeliveryConfig = async () => {
      try {
        const response: any = await apiRequest("GET", "/delivery-config");
        if (response && response.data) {
          const configData = response.data;
          if (typeof configData.defaultDeliveryCharge === "number") {
            setDefaultDeliveryCharge(configData.defaultDeliveryCharge);
          }
          // If freeShippingThreshold is provided in config, use it; otherwise disable free shipping
          if (typeof configData.freeShippingThreshold === "number") {
            setConfigFreeShippingThreshold(configData.freeShippingThreshold);
          } else {
            // If not configured, set to a very high value to effectively disable free shipping
            setConfigFreeShippingThreshold(Number.MAX_SAFE_INTEGER);
          }
        }
      } catch (error) {
        console.error("Error loading delivery config:", error);
        // On error, disable free shipping by setting threshold to max value
        setConfigFreeShippingThreshold(Number.MAX_SAFE_INTEGER);
      }
    };
    loadDeliveryConfig();
  }, []);

  // Calculate totals with coupon discount
  const couponDiscount = appliedCoupon?.success ? appliedCoupon.discount : 0;
  const freeShippingFromCoupon = appliedCoupon?.freeShipping || false;
  // Use dynamic shipping if available, otherwise use default delivery charge from API, then fall back to baseShippingFee from cart
  // baseShippingFee from cart provider should already have the correct default delivery charge loaded
  // Ensure we always have a valid shipping cost (prioritize loaded values)
  const effectiveShipping =
    dynamicShipping !== null
      ? dynamicShipping
      : defaultDeliveryCharge !== null && defaultDeliveryCharge > 0
        ? defaultDeliveryCharge
        : baseShippingFee > 0
          ? baseShippingFee
          : 0;
  // Apply free shipping threshold (if subtotal meets threshold, shipping is free)
  // Use config threshold if available, otherwise disable free shipping (use max value)
  // Only use cart provider's threshold as a fallback if config hasn't loaded yet and we need a value
  // If threshold is set to max value, free shipping is effectively disabled
  const activeFreeShippingThreshold = configFreeShippingThreshold !== null ? configFreeShippingThreshold : Number.MAX_SAFE_INTEGER; // Disable free shipping by default until config loads
  const shippingBeforeCoupon = subtotal >= activeFreeShippingThreshold ? 0 : effectiveShipping;
  const finalShipping = freeShippingFromCoupon ? 0 : shippingBeforeCoupon;
  const finalTotal = subtotal - couponDiscount + finalShipping;

  // Calculate the original shipping cost before any discounts (for display in free shipping message)
  // This represents what the shipping would cost before free shipping threshold is applied
  // Use the same priority as effectiveShipping but ensure we have the correct value
  const originalShippingCost =
    dynamicShipping !== null
      ? dynamicShipping
      : defaultDeliveryCharge !== null && defaultDeliveryCharge > 0
        ? defaultDeliveryCharge
        : baseShippingFee > 0
          ? baseShippingFee
          : 0;

  // Check for payment errors from URL
  useEffect(() => {
    const error = searchParams.get("error");
    const orderId = searchParams.get("orderId");
    if (error) {
      if (error === "payment_failed") {
        toast.error("Payment failed. Please try again.");
      } else if (error === "payment_cancelled") {
        toast.error("Payment was cancelled.");
      } else if (error === "payment_validation_failed") {
        toast.error("Payment validation failed. Please contact support.");
      }
    }
  }, [searchParams]);

  // Check if online payment is enabled
  useEffect(() => {
    const checkPaymentConfig = async () => {
      try {
        const response: any = await apiRequest("GET", "/sslcommerz-config");
        if (response && response.data) {
          setOnlinePaymentEnabled(response.data.enabled === true);
        }
      } catch (error) {
        console.error("Failed to check payment config:", error);
      } finally {
        setCheckingPayment(false);
      }
    };
    checkPaymentConfig();
  }, []);

  const form = useForm<FormValues>({
    defaultValues: {
      fullName: "",
      email: "",
      phone: "",
      addressLine1: "",
      addressLine2: "",
      city: "",
      postalCode: "",
      notes: "",
      paymentMethod: "cod" as PaymentMethod,
      paymentMode: "redirect" as "redirect" | "inline",
    },
  });

  // Pre-fill form values when session data is available
  useEffect(() => {
    if (session?.user) {
      if (!form.getValues("fullName") && (session.user.fullName || session.user.name)) {
        form.setValue("fullName", session.user.fullName || session.user.name || "");
      }
      if (!form.getValues("email") && session.user.email) {
        form.setValue("email", session.user.email);
      }
      if (!form.getValues("phone") && session.user.phone) {
        form.setValue("phone", session.user.phone);
      }
    }
  }, [session, form]);

  // Watch phone and email for blocked customer check
  const watchedPhone = form.watch("phone");
  const watchedEmail = form.watch("email");
  const watchedCity = form.watch("city");

  // Check if customer is blocked when phone/email changes
  useEffect(() => {
    const checkBlockedStatus = async () => {
      // Only check if we have a valid phone number (at least 10 digits)
      const cleanPhone = watchedPhone?.replace(/\D/g, "") || "";
      if (cleanPhone.length < 10 && !watchedEmail) {
        setIsCustomerBlocked(false);
        setBlockReason(null);
        return;
      }

      setCheckingBlockStatus(true);
      try {
        const response: any = await apiRequest("POST", "/blocked-customers/check", {
          phone: watchedPhone,
          email: watchedEmail,
        });

        if (response && response.data) {
          const blockData = response.data;
          setIsCustomerBlocked(blockData.isBlocked);
          if (blockData.isBlocked && blockData.customer) {
            const reasonText =
              blockData.customer.reason === "fraud"
                ? "fraudulent activity"
                : blockData.customer.reason === "abuse"
                  ? "policy violations"
                  : blockData.customer.reason === "chargeback"
                    ? "payment disputes"
                    : "policy violations";
            setBlockReason(reasonText);
          } else {
            setBlockReason(null);
          }
        }
      } catch (error) {
        console.error("Error checking blocked status:", error);
      } finally {
        setCheckingBlockStatus(false);
      }
    };

    // Debounce the check
    const timeoutId = setTimeout(checkBlockedStatus, 500);
    return () => clearTimeout(timeoutId);
  }, [watchedPhone, watchedEmail]);

  // Store user data for tracking when form fields change
  // This ensures better event matching for all subsequent pixel events
  const watchedFullName = form.watch("fullName");
  useEffect(() => {
    // Store user data when they fill in the form (for better pixel matching)
    if (watchedPhone || watchedEmail || watchedFullName) {
      const userData: Parameters<typeof storeUserData>[0] = {};
      if (watchedEmail) userData.email = watchedEmail;
      if (watchedPhone) userData.phone = watchedPhone;
      if (watchedFullName) userData.fullName = watchedFullName;
      if (watchedCity) userData.city = watchedCity;

      // Only store if we have meaningful data
      if (Object.keys(userData).length > 0) {
        storeUserData(userData);
      }
    }
  }, [watchedPhone, watchedEmail, watchedFullName, watchedCity]);

  // Calculate shipping based on city changes
  useEffect(() => {
    const calculateShipping = async () => {
      // Only calculate if we have a city
      if (!watchedCity || watchedCity.trim().length === 0) {
        setDynamicShipping(null);
        setCalculatingShipping(false);
        return;
      }

      setCalculatingShipping(true);
      try {
        const response: any = await apiRequest("POST", "/delivery/storefront/calculate-shipping", {
          city: watchedCity.trim(),
        });

        if (response && response.data && typeof response.data.shipping === "number") {
          setDynamicShipping(response.data.shipping);
        }
      } catch (error) {
        console.error("Error calculating shipping:", error);
        // Keep using default shipping on error
        setDynamicShipping(null);
      } finally {
        setCalculatingShipping(false);
      }
    };

    // Debounce shipping calculation
    const timeoutId = setTimeout(calculateShipping, 500);
    return () => clearTimeout(timeoutId);
  }, [watchedCity]);

  // Load SSLCommerz Easy Checkout script
  useEffect(() => {
    if (onlinePaymentEnabled && paymentMode === "inline") {
      const script = document.createElement("script");
      const isLive = false; // This should come from config, but for now using sandbox
      script.src = isLive ? "https://seamless-epay.sslcommerz.com/embed.min.js" : "https://sandbox.sslcommerz.com/embed.min.js";
      script.async = true;
      script.onload = () => {
        setEasyCheckoutReady(true);
      };
      document.body.appendChild(script);

      return () => {
        // Cleanup script on unmount
        const existingScript = document.querySelector(`script[src*="sslcommerz.com/embed.min.js"]`);
        if (existingScript) {
          existingScript.remove();
        }
      };
    }
  }, [onlinePaymentEnabled, paymentMode]);

  // Redirect if cart is empty (but not if we just placed an order)
  useEffect(() => {
    if (isEmpty && !orderPlaced) {
      router.push("/cart");
    }
  }, [isEmpty, orderPlaced, router]);

  // Track begin_checkout event when checkout page loads
  useEffect(() => {
    if (items.length > 0 && typeof window !== "undefined") {
      // Initialize dataLayer if not exists
      if (!(window as any).dataLayer) {
        (window as any).dataLayer = [];
      }

      // Prepare items for dataLayer
      const dataLayerItems = items.map((item) => ({
        item_id: item.productId,
        item_name: item.name,
        item_category: "Shoes", // You might want to get this from product data
        price: item.price,
        quantity: item.quantity,
      }));

      // Push begin_checkout event to dataLayer
      (window as any).dataLayer.push({
        event: "begin_checkout",
        ecommerce: {
          currency: "USD", // You might want to get this from config
          value: total,
          items: dataLayerItems,
        },
      });

      // Meta Pixel - BeginCheckout
      if ((window as any).fbq) {
        (window as any).fbq("track", "InitiateCheckout", {
          content_name: "Checkout",
          content_category: "Shoes",
          value: total,
          currency: "USD",
          num_items: items.reduce((sum, item) => sum + item.quantity, 0),
        });
      }

      // TikTok Pixel - BeginCheckout
      if ((window as any).ttq) {
        (window as any).ttq.track("InitiateCheckout", {
          content_type: "product",
          value: total,
          currency: "USD",
          quantity: items.reduce((sum, item) => sum + item.quantity, 0),
        });
      }

      // Pinterest Pixel - BeginCheckout
      if ((window as any).pintrk) {
        (window as any).pintrk("track", "InitiateCheckout", {
          value: total,
          currency: "USD",
          line_items: dataLayerItems,
        });
      }

      // Snapchat Pixel - BeginCheckout
      if ((window as any).snaptr) {
        (window as any).snaptr("track", "INITIATE_CHECKOUT", {
          currency: "USD",
          value: total,
        });
      }

      // Server-side tracking - InitiateCheckout
      apiRequest("GET", "/brand-config")
        .then((response: any) => {
          const brandConfig = response?.data;
          const currency = brandConfig?.currency?.iso || "USD";
          return import("@/lib/tracking/server-side-tracking").then(({ trackInitiateCheckout }) => {
            trackInitiateCheckout({
              value: total,
              currency: currency,
              contentIds: items.map((item) => item.productId),
              numItems: items.reduce((sum, item) => sum + item.quantity, 0),
            }).catch(() => { }); // Fail silently
          });
        })
        .catch(() => { }); // Fail silently if module not available
    }
  }, []); // Only run once on mount

  // Track add_payment_info when payment method is selected
  useEffect(() => {
    const paymentMethod = form.watch("paymentMethod");
    if (paymentMethod && items.length > 0 && typeof window !== "undefined") {
      // Initialize dataLayer if not exists
      if (!(window as any).dataLayer) {
        (window as any).dataLayer = [];
      }

      // Push add_payment_info event to dataLayer
      (window as any).dataLayer.push({
        event: "add_payment_info",
        ecommerce: {
          currency: "USD",
          value: total,
          payment_type: paymentMethod === "online" ? "online" : "cash_on_delivery",
        },
      });

      // Meta Pixel - AddPaymentInfo
      if ((window as any).fbq) {
        (window as any).fbq("track", "AddPaymentInfo", {
          content_name: "Checkout",
          value: total,
          currency: "USD",
        });
      }

      // Server-side tracking - AddPaymentInfo
      apiRequest("GET", "/brand-config")
        .then((response: any) => {
          const brandConfig = response?.data;
          const currency = brandConfig?.currency?.iso || "USD";
          // Get stored user data for better event matching
          const storedUserData = getUserDataForTracking();
          return import("@/lib/tracking/server-side-tracking").then(({ trackAddPaymentInfo }) => {
            trackAddPaymentInfo({
              value: total,
              currency: currency,
              paymentMethod: paymentMethod === "online" ? "online" : "cash_on_delivery",
              userData: storedUserData,
            }).catch(() => { }); // Fail silently
          });
        })
        .catch(() => { }); // Fail silently if module not available
    }
  }, [form.watch("paymentMethod"), items.length, total]);

  const onSubmit = async (values: FormValues) => {
    if (items.length === 0) return;
    setPlacing(true);
    setInitializingPayment(false);

    try {
      const paymentMethod = values.paymentMethod || "cod";
      const { paymentMethod: _, ...customerInfo } = values;

      // Create order first
      const order: Order = {
        id: "", // will be assigned by API
        createdAt: new Date().toISOString(),
        status: "pending",
        items,
        subtotal,
        discountAmount: couponDiscount,
        shipping: finalShipping,
        total: finalTotal,
        paymentMethod: paymentMethod,
        paymentStatus: paymentMethod === "online" ? "pending" : undefined,
        customer: customerInfo,
      };

      // Include coupon info in order metadata
      const orderWithCoupon = appliedCoupon?.success
        ? { ...order, couponCode: appliedCoupon.coupon?.code, couponId: appliedCoupon.coupon?.id }
        : order;

      // Include source tracking data (fbclid, UTM parameters, etc.)
      const sourceTracking = getSourceTrackingForOrder();
      const orderWithSource = sourceTracking ? { ...orderWithCoupon, sourceTracking } : orderWithCoupon;

      const response: any = await apiRequest("POST", "/orders", orderWithSource);
      const saved = response?.data;

      if (!saved || !saved.id) {
        toast.dismiss("place-order");
        throw new Error("Order was created but no order ID was returned");
      }

      // Handle online payment
      if (paymentMethod === "online") {
        const currentPaymentMode = form.getValues("paymentMode") || "redirect";

        if (currentPaymentMode === "inline") {
          // Initialize Easy Checkout (Pay on Page)
          setInitializingPayment(true);
          toast.loading("Initializing payment...", { id: "place-order" });

          try {
            const paymentData: any = await apiRequest("POST", "/payment/easy-checkout", {
              orderId: saved.id,
              customer: customerInfo,
            });

            if (paymentData.gatewayPageURL && paymentData.sessionkey) {
              setPaymentSession({
                sessionkey: paymentData.sessionkey,
                gatewayURL: paymentData.gatewayPageURL,
              });
              setOrderPlaced(true);
              setPlacing(false);
              setInitializingPayment(false);
              toast.dismiss("place-order");
              toast.success("Order created! Please complete payment below.");
              // The payment form will be shown inline via the SSLCommerz embed script
              return;
            } else {
              toast.dismiss("place-order");
              throw new Error("Failed to initialize payment");
            }
          } catch (error: any) {
            setInitializingPayment(false);
            throw error;
          }
        } else {
          // Redirect to payment gateway (Hosted Payment)
          toast.loading("Redirecting to payment gateway...", { id: "place-order" });

          try {
            const paymentData: any = await apiRequest("POST", "/payment/init", {
              orderId: saved.id,
              customer: customerInfo,
            });

            if (paymentData.gatewayPageURL) {
              // Set flag to prevent redirect to cart
              setOrderPlaced(true);
              setPlacing(false);
              toast.dismiss("place-order");
              // Redirect to payment gateway
              window.location.href = paymentData.gatewayPageURL;
              return;
            } else {
              toast.dismiss("place-order");
              throw new Error("Failed to get payment gateway URL");
            }
          } catch (error: any) {
            throw error;
          }
        }
      }

      // For COD, proceed normally
      setOrderPlaced(true);
      clear();
      toast.dismiss("place-order");
      toast.success("Order placed successfully!");

      // Record coupon usage if applied
      if (appliedCoupon?.success && appliedCoupon.coupon) {
        apiRequest("POST", "/coupons/record-usage", {
          couponId: appliedCoupon.coupon.id,
          couponCode: appliedCoupon.coupon.code,
          orderId: saved.id,
          customerEmail: customerInfo.email,
          customerPhone: customerInfo.phone,
          discountApplied: couponDiscount,
          orderTotal: finalTotal,
        }).catch(() => { }); // Silent fail
      }

      // Use setTimeout to ensure state updates before navigation
      setTimeout(() => {
        try {
          router.replace(`/checkout/success?orderId=${encodeURIComponent(saved.id)}`);
        } catch (navError) {
          // Fallback to window.location if router fails
          window.location.href = `/checkout/success?orderId=${encodeURIComponent(saved.id)}`;
        }
      }, 100);
    } catch (error: any) {
      console.error("Order placement error:", error);
      toast.error(error?.message || "Failed to place order. Please try again.", { id: "place-order" });
      setPlacing(false);
      setInitializingPayment(false);
    }
  };

  if (items.length === 0) {
    return null; // Will redirect via useEffect
  }

  return (
    <div className='min-h-screen bg-linear-to-br from-background to-accent/5'>
      <div className='mx-auto max-w-[1440px] px-4 py-6 sm:px-6 lg:px-8'>
        {/* Header */}
        <div className='mb-6 space-y-4'>
          {/* Back Button */}
          <div className='flex items-center justify-between'>
            <Button asChild variant='ghost' size='sm'>
              <Link href='/cart' className='flex items-center gap-2'>
                <ArrowLeft className='w-4 h-4' />
                <span className='hidden sm:inline'>Back to Cart</span>
                <span className='sm:hidden'>Back</span>
              </Link>
            </Button>
          </div>

          {/* Blocked Customer Alert */}
          {isCustomerBlocked && (
            <Alert variant='destructive' className='border-red-500/50 bg-red-50 dark:bg-red-950/30'>
              <AlertTriangle className='h-5 w-5' />
              <AlertTitle className='text-lg font-semibold'>Unable to Process Order</AlertTitle>
              <AlertDescription className='mt-2'>
                <p>We're sorry, but we are unable to process orders for this account due to {blockReason || "policy violations"}.</p>
                <p className='mt-2 text-sm'>If you believe this is an error, please contact our customer support team for assistance.</p>
              </AlertDescription>
            </Alert>
          )}
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className='grid grid-cols-1 gap-6 lg:grid-cols-3'>
            {/* Checkout Form */}
            <div className='lg:col-span-2 space-y-6'>
              {/* Customer & Delivery */}
              <Card>
                <CardHeader className='pb-3'>
                  <CardTitle className='flex items-center gap-2'>
                    <User className='w-5 h-5' />
                    Customer & Delivery Details
                  </CardTitle>
                </CardHeader>
                <CardContent className='space-y-4'>
                  <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
                    <FormField
                      control={form.control}
                      name='fullName'
                      rules={{ required: "Full name is required" }}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full Name *</FormLabel>
                          <FormControl>
                            <Input placeholder='Your full name' {...field} className='h-11' />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name='phone'
                      rules={{
                        required: "Phone is required",
                        validate: (value) => {
                          if (!value) return "Phone is required";
                          const digitsOnly = value.replace(/[^\d+]/g, "").replace(/^\+/, "");
                          if (digitsOnly.length >= 10 && digitsOnly.length <= 15) return true;
                          return "Please enter a valid phone number";
                        },
                      }}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone Number *</FormLabel>
                          <FormControl>
                            <Input placeholder='01XXXXXXXXX' {...field} className='h-11' />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
                    <FormField
                      control={form.control}
                      name='email'
                      rules={{
                        pattern: {
                          value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                          message: "Invalid email address",
                        },
                      }}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email (optional)</FormLabel>
                          <FormControl>
                            <Input type='email' placeholder='name@example.com' {...field} className='h-11' />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name='city'
                      rules={{ required: "City is required" }}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>City *</FormLabel>
                          <FormControl>
                            <Input placeholder='e.g. Dhaka' {...field} className='h-11' />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className='grid grid-cols-1 gap-4 sm:grid-cols-3'>
                    <div className='sm:col-span-2'>
                      <FormField
                        control={form.control}
                        name='addressLine1'
                        rules={{ required: "Address is required" }}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Street Address *</FormLabel>
                            <FormControl>
                              <Input placeholder='House, Road, Area...' {...field} className='h-11' />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div>
                      <FormField
                        control={form.control}
                        name='postalCode'
                        rules={{ required: "Postal code is required" }}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Postal Code *</FormLabel>
                            <FormControl>
                              <Input placeholder='1234' {...field} className='h-11' />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  <FormField
                    control={form.control}
                    name='notes'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Delivery Notes (optional)</FormLabel>
                        <FormControl>
                          <Textarea placeholder='Any delivery instructions' {...field} className='min-h-20' />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Easy Checkout Payment Form (shown inline when payment is initialized) */}
              {paymentSession && paymentMode === "inline" && easyCheckoutReady && (
                <Card className='border-primary/20 bg-primary/5'>
                  <CardHeader>
                    <CardTitle className='flex items-center gap-2 text-lg'>
                      <CreditCard className='w-5 h-5' />
                      Complete Payment
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className='space-y-4'>
                      <p className='text-sm text-muted-foreground'>
                        Please complete your payment using the form below. Your order has been created and will be processed once payment is
                        confirmed.
                      </p>
                      <div id='sslczPayBtn' className='w-full'>
                        <button
                          id='sslczPayBtn'
                          className='w-full h-14 rounded-lg bg-primary text-primary-foreground font-semibold text-lg hover:bg-primary/90 transition-colors flex items-center justify-center gap-2'
                          {...({
                            token: "",
                            postdata: JSON.stringify({ orderId: paymentSession.sessionkey }),
                            order: paymentSession.sessionkey,
                            endpoint: `${typeof window !== "undefined" ? window.location.origin : ""}/api/payment/easy-checkout`,
                          } as any)}
                        >
                          {initializingPayment ? (
                            <>
                              <Loader2 className='w-5 h-5 animate-spin' />
                              Loading Payment...
                            </>
                          ) : (
                            <>
                              <CreditCard className='w-5 h-5' />
                              Pay {currencySymbol}
                              {finalTotal.toFixed(2)}
                            </>
                          )}
                        </button>
                      </div>
                      <p className='text-xs text-muted-foreground text-center'>Secure payment powered by SSLCommerz</p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Order Summary */}
            <div className='lg:col-span-1'>
              <Card className='sticky top-28 border'>
                <CardHeader className='pb-3'>
                  <CardTitle className='flex items-center gap-2 text-lg'>
                    <ShoppingBag className='w-5 h-5' />
                    Order Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className='space-y-4'>
                  {/* Items */}
                  <div className='space-y-3'>
                    {items.map((item) => (
                      <div key={`${item.productId}-${item.size ?? "_"}`} className='flex gap-3'>
                        <div className='relative w-16 h-16 overflow-hidden rounded-lg border bg-accent/30 shrink-0'>
                          <CloudImage src={item.image} alt={item.name} fill className='object-contain p-1' />
                        </div>
                        <div className='flex-1 min-w-0'>
                          <div className='flex items-start justify-between gap-2'>
                            <p className='font-medium text-sm line-clamp-2 flex-1'>{item.name}</p>
                            <Button
                              variant='ghost'
                              size='sm'
                              onClick={() => {
                                const stored = {
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
                                removeItem(item.productId, item.size);
                                const toastId = toast.success(
                                  <div className='flex items-center justify-between gap-3 w-full'>
                                    <div className='flex items-center gap-2 flex-1'>
                                      <CheckCircle className='w-4 h-4 text-green-600 shrink-0' />
                                      <span className='text-sm font-medium'>Item removed from cart</span>
                                    </div>
                                    <Button
                                      variant='outline'
                                      size='sm'
                                      onClick={() => {
                                        addItem(stored.item, stored.quantity);
                                        toast.dismiss(toastId);
                                      }}
                                      className='shrink-0 h-8 px-3 gap-2'
                                    >
                                      <Undo2 className='w-3.5 h-3.5' />
                                      <span>Undo</span>
                                    </Button>
                                  </div>,
                                  { duration: 4000 }
                                );
                              }}
                              className='h-6 w-6 p-0 text-muted-foreground hover:text-destructive shrink-0'
                            >
                              <Trash2 className='h-3.5 w-3.5' />
                            </Button>
                          </div>
                          <div className='flex items-center gap-2 mt-1'>
                            {item.size && (
                              <Badge variant='outline' className='text-xs'>
                                Size {item.size}
                              </Badge>
                            )}
                            {item.color && (
                              <Badge variant='outline' className='text-xs'>
                                {item.color}
                              </Badge>
                            )}
                          </div>
                          <div className='flex items-center justify-between mt-2'>
                            {/* Quantity Controls */}
                            <div className='flex items-center border border-border rounded-lg overflow-hidden bg-background'>
                              <Button
                                type='button'
                                variant='ghost'
                                size='sm'
                                onClick={() => {
                                  if (item.quantity > 1) {
                                    updateQuantity(item.productId, item.quantity - 1, item.size);
                                  }
                                }}
                                disabled={item.quantity <= 1}
                                className='h-8 w-8 rounded-none hover:bg-accent disabled:opacity-40'
                              >
                                <Minus className='h-3.5 w-3.5' />
                              </Button>
                              <span className='w-10 text-center text-sm font-bold bg-accent/40 border-x border-border'>
                                {item.quantity}
                              </span>
                              <Button
                                type='button'
                                variant='ghost'
                                size='sm'
                                onClick={() => updateQuantity(item.productId, item.quantity + 1, item.size)}
                                className='h-8 w-8 rounded-none hover:bg-accent'
                              >
                                <Plus className='h-3.5 w-3.5' />
                              </Button>
                            </div>
                            <p className='text-sm font-bold text-primary'>
                              {currencySymbol}
                              {(item.price * item.quantity).toFixed(2)}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <Separator />

                  {/* Coupon Code */}
                  <CouponInput
                    cartSubtotal={subtotal}
                    cartItems={items.map((item) => ({
                      productId: item.productId,
                      quantity: item.quantity,
                      price: item.price,
                    }))}
                    customerEmail={form.watch("email")}
                    customerPhone={form.watch("phone")}
                    onCouponApplied={(response) => setAppliedCoupon(response)}
                    onCouponRemoved={() => setAppliedCoupon(null)}
                    appliedCoupon={appliedCoupon}
                  />

                  <Separator />

                  {/* Payment Method (moved into summary) */}
                  <div className='space-y-3'>
                    <div className='flex items-center gap-2'>
                      <CreditCard className='w-4 h-4' />
                      <p className='font-semibold text-sm'>Payment Method</p>
                    </div>
                    {checkingPayment ? (
                      <div className='flex items-center justify-center py-6'>
                        <div className='w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin' />
                      </div>
                    ) : (
                      <FormField
                        control={form.control}
                        name='paymentMethod'
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <RadioGroup
                                onValueChange={(value) => field.onChange(value as PaymentMethod)}
                                value={field.value}
                                className='space-y-3'
                              >
                                <div className='flex items-start gap-3 rounded-lg border border-primary/20 bg-primary/5 p-3'>
                                  <RadioGroupItem value='cod' id='cod' className='mt-1' />
                                  <Label htmlFor='cod' className='flex-1 cursor-pointer'>
                                    <div className='flex items-center justify-between'>
                                      <div className='flex items-center gap-3'>
                                        <div className='w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center'>
                                          <CreditCard className='w-5 h-5 text-primary' />
                                        </div>
                                        <div>
                                          <p className='font-medium'>Cash on Delivery</p>
                                          <p className='text-sm text-muted-foreground'>Pay when you receive your order</p>
                                        </div>
                                      </div>
                                      <Badge variant='secondary'>Secure</Badge>
                                    </div>
                                  </Label>
                                </div>

                                {onlinePaymentEnabled && (
                                  <>
                                    <div className='flex items-start gap-3 rounded-lg border border-primary/20 bg-primary/5 p-3'>
                                      <RadioGroupItem value='online' id='online' className='mt-1' />
                                      <Label htmlFor='online' className='flex-1 cursor-pointer'>
                                        <div className='flex items-center justify-between'>
                                          <div className='flex items-center gap-3'>
                                            <div className='w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center'>
                                              <Globe className='w-5 h-5 text-primary' />
                                            </div>
                                            <div>
                                              <p className='font-medium'>Online Payment</p>
                                              <p className='text-sm text-muted-foreground'>Pay securely with SSLCommerz</p>
                                            </div>
                                          </div>
                                          <Badge variant='secondary'>Secure</Badge>
                                        </div>
                                      </Label>
                                    </div>

                                    {/* Payment Mode Selection (shown when online payment is selected) */}
                                    {field.value === "online" && (
                                      <div className='ml-8 mt-3 space-y-3 border-l border-primary/20 pl-4'>
                                        <p className='text-sm font-medium text-muted-foreground'>Choose how to pay:</p>
                                        <div className='space-y-2'>
                                          <label
                                            className={`flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-colors ${paymentMode === "redirect"
                                              ? "border-primary bg-primary/5"
                                              : "border-border hover:bg-accent/40"
                                              }`}
                                          >
                                            <input
                                              type='radio'
                                              name='paymentMode'
                                              value='redirect'
                                              checked={paymentMode === "redirect"}
                                              onChange={() => {
                                                setPaymentMode("redirect");
                                                form.setValue("paymentMode", "redirect");
                                              }}
                                              className='h-4 w-4 text-primary focus:ring-primary'
                                            />
                                            <div className='flex-1'>
                                              <div className='flex items-center gap-2'>
                                                <ExternalLink className='w-4 h-4 text-muted-foreground' />
                                                <p className='font-medium text-sm'>Redirect to Gateway</p>
                                              </div>
                                              <p className='text-xs text-muted-foreground mt-1'>
                                                You'll be redirected to SSLCommerz payment page
                                              </p>
                                            </div>
                                          </label>

                                          <label
                                            className={`flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-colors ${paymentMode === "inline" ? "border-primary bg-primary/5" : "border-border hover:bg-accent/40"
                                              }`}
                                          >
                                            <input
                                              type='radio'
                                              name='paymentMode'
                                              value='inline'
                                              checked={paymentMode === "inline"}
                                              onChange={() => {
                                                setPaymentMode("inline");
                                                form.setValue("paymentMode", "inline");
                                              }}
                                              className='h-4 w-4 text-primary focus:ring-primary'
                                            />
                                            <div className='flex-1'>
                                              <div className='flex items-center gap-2'>
                                                <CreditCard className='w-4 h-4 text-muted-foreground' />
                                                <p className='font-medium text-sm'>Pay on Page</p>
                                                <Badge variant='outline' className='text-xs'>
                                                  Easy Checkout
                                                </Badge>
                                              </div>
                                              <p className='text-xs text-muted-foreground mt-1'>
                                                Complete payment without leaving this page
                                              </p>
                                            </div>
                                          </label>
                                        </div>
                                      </div>
                                    )}
                                  </>
                                )}
                              </RadioGroup>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                  </div>

                  <Separator />

                  {/* Totals */}
                  <div className='space-y-2 text-sm'>
                    <div className='flex items-center justify-between'>
                      <span className='text-muted-foreground'>
                        Subtotal ({items.length} item{items.length !== 1 ? "s" : ""})
                      </span>
                      <span className='font-medium'>
                        {currencySymbol}
                        {subtotal.toFixed(2)}
                      </span>
                    </div>

                    {/* Coupon Discount */}
                    {couponDiscount > 0 && (
                      <div className='flex items-center justify-between text-green-600'>
                        <span className='flex items-center gap-1'>
                          <Tag className='h-3 w-3' />
                          Coupon ({appliedCoupon?.coupon?.code})
                        </span>
                        <span className='font-medium'>
                          -{currencySymbol}
                          {couponDiscount.toFixed(2)}
                        </span>
                      </div>
                    )}

                    <div className='flex items-center justify-between'>
                      <span className='text-muted-foreground flex items-center gap-2'>
                        Shipping
                        {calculatingShipping && <Loader2 className='w-3 h-3 animate-spin text-muted-foreground' />}
                      </span>
                      <span className='font-medium'>
                        {calculatingShipping ? (
                          <span className='text-muted-foreground'>Calculating...</span>
                        ) : effectiveShipping === 0 ? (
                          "Free"
                        ) : (
                          `${currencySymbol}${effectiveShipping.toFixed(2)}`
                        )}
                      </span>
                    </div>

                    {/* Free shipping messages */}
                    {freeShippingFromCoupon && effectiveShipping > 0 && (
                      <div className='flex items-center justify-between text-green-600'>
                        <span className='text-sm flex items-center gap-1'>
                          <Truck className='h-3 w-3' />
                          Free shipping (coupon)
                        </span>
                        <span className='font-medium'>
                          -{currencySymbol}
                          {effectiveShipping.toFixed(2)}
                        </span>
                      </div>
                    )}
                    {!freeShippingFromCoupon &&
                      finalShipping === 0 &&
                      subtotal > 0 &&
                      subtotal >= activeFreeShippingThreshold &&
                      activeFreeShippingThreshold < Number.MAX_SAFE_INTEGER &&
                      shippingBeforeCoupon === 0 &&
                      effectiveShipping > 0 && (
                        <div className='flex items-center justify-between text-green-600'>
                          <span className='text-sm'>Free shipping applied!</span>
                          <span className='font-medium'>
                            -{currencySymbol}
                            {effectiveShipping.toFixed(2)}
                          </span>
                        </div>
                      )}

                    <Separator />
                    <div className='flex items-center justify-between text-lg font-bold'>
                      <span>Total</span>
                      <span>
                        {currencySymbol}
                        {finalTotal.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* Shipping Info */}
                  {effectiveShipping > 0 &&
                    subtotal < activeFreeShippingThreshold &&
                    activeFreeShippingThreshold < Number.MAX_SAFE_INTEGER && (
                      <div className='rounded-lg bg-blue-50 dark:bg-blue-950/20 p-3 text-sm'>
                        <div className='flex items-center gap-2 text-blue-700 dark:text-blue-300 mb-1'>
                          <Truck className='w-4 h-4' />
                          <span className='font-medium'>Free Shipping Available</span>
                        </div>
                        <p className='text-blue-600 dark:text-blue-400 text-xs'>
                          Add{" "}
                          <strong>
                            {currencySymbol}
                            {Math.max(0, activeFreeShippingThreshold - subtotal).toFixed(2)}
                          </strong>{" "}
                          more for free shipping!
                        </p>
                      </div>
                    )}

                  {/* Place Order Button (hidden when inline payment is active) */}
                  {!(paymentSession && paymentMode === "inline") && (
                    <Button
                      type='submit'
                      disabled={placing || initializingPayment || isCustomerBlocked}
                      size='lg'
                      className='w-full h-14 text-lg font-semibold'
                    >
                      {placing || initializingPayment ? (
                        <>
                          <Loader2 className='w-5 h-5 animate-spin mr-2' />
                          {initializingPayment ? "Initializing Payment..." : "Placing Order..."}
                        </>
                      ) : isCustomerBlocked ? (
                        <>
                          <AlertTriangle className='w-5 h-5 mr-2' />
                          Unable to Place Order
                        </>
                      ) : (
                        <>
                          <CheckCircle className='w-5 h-5 mr-2' />
                          {form.getValues("paymentMethod") === "online" && paymentMode === "inline"
                            ? `Initialize Payment - ${currencySymbol}${finalTotal.toFixed(2)}`
                            : `Place Order - ${currencySymbol}${finalTotal.toFixed(2)}`}
                        </>
                      )}
                    </Button>
                  )}
                </CardContent>
              </Card>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}
