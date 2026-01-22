"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { cn } from "@/utils/cn";
import SectionHeader from "../../_components/shared/SectionHeader";
import {
  CreditCard,
  Building2,
  User,
  Mail,
  Phone,
  MapPin,
  Globe,
  Sparkles,
  ArrowRight,
  Loader2,
  CheckCircle2,
  Shield,
  Zap,
  Star,
} from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { toast } from "sonner";
import { getCurrencySymbol, DEFAULT_CURRENCY } from "@/lib/currency";
import { DEFAULT_PLANS, type Plan } from "@/lib/pricing-plans";
import StarIcon from "../../_components/modules/home/pricing/icons/StarIcon";
import GridIcon from "../../_components/modules/home/pricing/icons/GridIcon";
import SparklesIcon from "../../_components/modules/home/pricing/icons/SparklesIcon";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

// Billing cycle types
type BillingCycleMonths = 1 | 3 | 6 | 12;
const BILLING_CYCLES: { months: BillingCycleMonths; name: string; label: string; discount: number }[] = [
  { months: 1, name: "monthly", label: "1 Month", discount: 0 },
  { months: 3, name: "quarterly", label: "3 Months", discount: 13 },
  { months: 6, name: "semi_annual", label: "6 Months", discount: 17 },
  { months: 12, name: "yearly", label: "1 Year", discount: 20 },
];

// Get billing cycle label
function getBillingCycleLabel(months: number): string {
  switch (months) {
    case 1:
      return "Monthly";
    case 3:
      return "3 Months";
    case 6:
      return "6 Months";
    case 12:
      return "Yearly";
    default:
      return `${months} Months`;
  }
}

function getIconComponent(iconType: string | undefined, className: string) {
  switch (iconType) {
    case "grid":
      return <GridIcon className={className} />;
    case "sparkles":
      return <SparklesIcon className={className} />;
    case "star":
    default:
      return <StarIcon className={className} />;
  }
}

function getIconBg(isPopular: boolean) {
  if (isPopular) return "bg-linear-to-br from-blue-100 via-purple-100 to-purple-200";
  return "bg-linear-to-br from-purple-100 to-purple-200";
}

function formatAmount(value: number, decimals = 0) {
  return new Intl.NumberFormat("en-BD", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

function CheckoutContainerInner() {
  const searchParams = useSearchParams();
  const planId = searchParams.get("plan") || "";
  const cycleParam = searchParams.get("cycle") || "1";
  const parsedCycle = (parseInt(cycleParam) as BillingCycleMonths) || 1;

  const allPlans = DEFAULT_PLANS;
  const initialPlan =
    allPlans.find((plan) => plan.id === planId) || allPlans.find((plan) => plan.billingCycleMonths === parsedCycle) || allPlans[0] || null;
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(initialPlan);
  const [billingCycle, setBillingCycle] = useState<BillingCycleMonths>(
    (initialPlan?.billingCycleMonths as BillingCycleMonths) || parsedCycle
  );
  const [loading, setLoading] = useState(false);
  const [currencySymbol, setCurrencySymbol] = useState(getCurrencySymbol(DEFAULT_CURRENCY));
  const [formData, setFormData] = useState({
    // Tenant Info
    tenantName: "",
    tenantEmail: "",
    tenantPhone: "",
    customSubdomain: "",
    // Customer Info (for payment)
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    customerAddress: "",
    customerCity: "",
    customerState: "",
    customerPostcode: "",
    customerCountry: "Bangladesh",
    couponCode: "",
  });

  const sectionRef = useRef<HTMLElement>(null);
  const formRef = useRef<HTMLDivElement>(null);
  const summaryRef = useRef<HTMLDivElement>(null);

  // Fetch currency settings only
  useEffect(() => {
    const fetchData = async () => {
      try {
        const settingsRes = await fetch("/api/v1/settings/general");
        if (!settingsRes.ok) {
          return;
        }
        const settings = await settingsRes.json();
        if (settings.defaultCurrency) {
          setCurrencySymbol(getCurrencySymbol(settings.defaultCurrency));
        }
      } catch (error) {
        console.error("Failed to fetch data:", error);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (!planId) {
      return;
    }
    const plan = allPlans.find((item) => item.id === planId);
    if (plan) {
      setSelectedPlan(plan);
      setBillingCycle(plan.billingCycleMonths as BillingCycleMonths);
    }
  }, [planId, allPlans]);

  // Get available billing cycles
  const availableCycles = [...new Set(allPlans.map((p) => p.billingCycleMonths))].sort((a, b) => a - b);
  const plansForCycle = allPlans.filter((plan) => plan.billingCycleMonths === billingCycle);
  const getPlanForCycle = (cycleMonths: BillingCycleMonths) => {
    const plans = allPlans.filter((plan) => plan.billingCycleMonths === cycleMonths);
    if (plans.length === 0) {
      return null;
    }
    return [...plans].sort((a, b) => (a.sortOrder ?? 999) - (b.sortOrder ?? 999))[0] || plans[0];
  };

  // When billing cycle changes, update selected plan to matching cycle
  useEffect(() => {
    if (!selectedPlan) {
      const firstPlanForCycle = allPlans.find((p) => p.billingCycleMonths === billingCycle) || allPlans[0] || null;
      setSelectedPlan(firstPlanForCycle);
      return;
    }

    if (selectedPlan.billingCycleMonths !== billingCycle) {
      const samePlanDifferentCycle = allPlans.find((p) => p.name === selectedPlan.name && p.billingCycleMonths === billingCycle);
      if (samePlanDifferentCycle) {
        setSelectedPlan(samePlanDifferentCycle);
        return;
      }

      const firstPlanForCycle = allPlans.find((p) => p.billingCycleMonths === billingCycle);
      if (firstPlanForCycle) {
        setSelectedPlan(firstPlanForCycle);
      }
    }
  }, [billingCycle, allPlans, selectedPlan]);

  useGSAP(
    () => {
      if (!sectionRef.current) return;

      if (formRef.current) {
        gsap.fromTo(
          formRef.current,
          { opacity: 0, x: -30 },
          {
            opacity: 1,
            x: 0,
            duration: 0.8,
            ease: "power2.out",
            scrollTrigger: {
              trigger: formRef.current,
              start: "top 85%",
              toggleActions: "play none none none",
            },
          }
        );
      }

      if (summaryRef.current) {
        gsap.fromTo(
          summaryRef.current,
          { opacity: 0, x: 30 },
          {
            opacity: 1,
            x: 0,
            duration: 0.8,
            ease: "power2.out",
            delay: 0.2,
            scrollTrigger: {
              trigger: summaryRef.current,
              start: "top 85%",
              toggleActions: "play none none none",
            },
          }
        );
      }
    },
    { scope: sectionRef }
  );

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    if (window.innerWidth >= 768) {
      return;
    }
    const timer = window.setTimeout(() => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }, 200);
    return () => window.clearTimeout(timer);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlan) return;

    const cycleInfo = BILLING_CYCLES.find((c) => c.months === billingCycle);

    setLoading(true);
    try {
      const response = await fetch("/api/checkout/init", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          planId: selectedPlan.id,
          planName: selectedPlan.name,
          planPrice: selectedPlan.price,
          billingCycle: cycleInfo?.name || "monthly",
          billingCycleMonths: selectedPlan.billingCycleMonths,
        }),
      });

      const data = await response.json();

      if (data.GatewayPageURL) {
        // Redirect to SSLCommerz payment page
        window.location.href = data.GatewayPageURL;
      } else if (data.success && selectedPlan.price === 0) {
        // Free plan - redirect to success directly
        window.location.href = `/checkout/success?tran_id=${data.tranId}`;
      } else {
        throw new Error(data.message || "Failed to initialize payment");
      }
    } catch (error: any) {
      toast.error(error.message || "Payment initialization failed");
    } finally {
      setLoading(false);
    }
  };

  const activePlan = selectedPlan || plansForCycle[0] || null;
  const displayPrice = activePlan?.price || 0;
  const monthlyEquivalent = activePlan ? activePlan.price / (activePlan.billingCycleMonths || 1) : 0;

  return (
    <section
      ref={sectionRef}
      className='min-h-screen bg-gradient-to-b from-white via-blue-50/30 to-white pt-28 pb-16 sm:pt-32 sm:pb-20 lg:pt-36 lg:pb-24'
    >
      <div className='max-w-7xl mx-auto px-4 sm:px-6'>
        {/* Header */}
        <div className='mb-10 sm:mb-12 lg:mb-16'>
          <SectionHeader
            title='Complete Your Order'
            subtitle="You're one step away from launching your online store. Fill in your details below to proceed with payment."
          />
        </div>

        <div className='grid grid-cols-1 gap-6 sm:gap-8 lg:grid-cols-12 lg:gap-10'>
          {/* Left: Checkout Form */}
          <div ref={formRef} className='lg:col-span-7'>
            <form onSubmit={handleSubmit} className='space-y-4 sm:space-y-8'>
              {/* Billing Cycle Selector */}
              <div className='bg-white rounded-2xl p-5 sm:p-6 md:p-8 border border-slate-200 shadow-sm'>
                <div className='flex items-center gap-3 mb-5 sm:mb-6'>
                  <div className='w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-green-500/30'>
                    <CreditCard className='w-4 h-4 sm:w-5 sm:h-5 text-white' />
                  </div>
                  <div>
                    <h3 className='text-base sm:text-lg font-semibold text-gray-900' style={{ fontFamily: "var(--font-nunito-sans), sans-serif" }}>
                      Billing Period
                    </h3>
                    <p className='text-xs sm:text-sm text-gray-500' style={{ fontFamily: "var(--font-urbanist), sans-serif" }}>
                      Choose how long you want to subscribe
                    </p>
                  </div>
                </div>

                <div className='grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-3'>
                  {availableCycles.map((cycleMonths) => {
                    const cycle = BILLING_CYCLES.find((c) => c.months === cycleMonths);
                    if (!cycle) return null;

                    const isSelected = billingCycle === cycleMonths;
                    // Find a plan for this cycle to show the price
                    const planForCycle = getPlanForCycle(cycleMonths as BillingCycleMonths);
                    const cyclePrice = planForCycle?.price ?? 0;
                    const monthlyEq = cyclePrice / cycleMonths;

                    return (
                      <button
                        key={cycleMonths}
                        type='button'
                        onClick={() => setBillingCycle(cycleMonths as BillingCycleMonths)}
                        className={cn(
                          "relative rounded-xl border px-3 py-2.5 sm:px-5 sm:py-4 text-left transition-all",
                          isSelected
                            ? "border-blue-500 bg-blue-50/40"
                            : "border-slate-200 bg-white hover:border-slate-300"
                        )}
                      >
                        {cycle.discount > 0 && (
                          <span className='absolute -top-2 right-2 rounded-full bg-emerald-500 px-2 py-0.5 text-[10px] font-semibold text-white'>
                            Save {cycle.discount}%
                          </span>
                        )}
                        <div className='flex items-center justify-between gap-3'>
                          <div>
                            <p
                              className={cn("text-xs sm:text-sm font-semibold", isSelected ? "text-blue-700" : "text-slate-900")}
                              style={{ fontFamily: "var(--font-nunito-sans), sans-serif" }}
                            >
                              {cycle.label}
                            </p>
                            <p className='text-[10px] sm:text-[11px] text-slate-500' style={{ fontFamily: "var(--font-urbanist), sans-serif" }}>
                              billed every {cycleMonths} mo{cycleMonths > 1 ? "s" : ""}
                            </p>
                          </div>
                          <div className='text-right'>
                            <p
                              className={cn("text-base sm:text-lg font-semibold", isSelected ? "text-blue-600" : "text-slate-800")}
                              style={{ fontFamily: "var(--font-nunito-sans), sans-serif" }}
                            >
                              {currencySymbol}
                              {formatAmount(cyclePrice)}
                            </p>
                            {cycleMonths > 1 && cyclePrice > 0 ? (
                              <p className='text-[10px] sm:text-[11px] text-slate-500' style={{ fontFamily: "var(--font-urbanist), sans-serif" }}>
                                {currencySymbol}
                                {formatAmount(monthlyEq, 2)}/mo
                              </p>
                            ) : (
                              <p className='text-[10px] sm:text-[11px] text-slate-400' style={{ fontFamily: "var(--font-urbanist), sans-serif" }}>
                                total per month
                              </p>
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Tenant Information */}
              <div className='bg-white rounded-2xl p-5 sm:p-6 md:p-8 border border-slate-200 shadow-sm'>
                <div className='flex items-center gap-3 mb-5 sm:mb-6'>
                  <div className='w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/30'>
                    <Building2 className='w-4 h-4 sm:w-5 sm:h-5 text-white' />
                  </div>
                  <div>
                    <h3 className='text-base sm:text-lg font-semibold text-gray-900' style={{ fontFamily: "var(--font-nunito-sans), sans-serif" }}>
                      Store Information
                    </h3>
                    <p className='text-xs sm:text-sm text-gray-500' style={{ fontFamily: "var(--font-urbanist), sans-serif" }}>
                      Details for your new online store
                    </p>
                  </div>
                </div>

                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                  <div className='space-y-2'>
                    <label className='text-sm font-semibold text-slate-700' style={{ fontFamily: "var(--font-urbanist), sans-serif" }}>
                      Store Name *
                    </label>
                    <div className='relative'>
                      <Building2 className='absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600 pointer-events-none z-10' />
                      <input
                        type='text'
                        name='tenantName'
                        value={formData.tenantName}
                        onChange={handleInputChange}
                        required
                        placeholder='My Awesome Store'
                        className='w-full pl-11 pr-4 h-11 rounded-xl border border-slate-200 bg-white/90 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all text-base text-gray-900 placeholder:text-gray-400 shadow-sm'
                        style={{ fontFamily: "var(--font-urbanist), sans-serif" }}
                      />
                    </div>
                  </div>

                  <div className='space-y-2'>
                    <label className='text-sm font-semibold text-slate-700' style={{ fontFamily: "var(--font-urbanist), sans-serif" }}>
                      Business Email *
                    </label>
                    <div className='relative'>
                      <Mail className='absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600 pointer-events-none z-10' />
                      <input
                        type='email'
                        name='tenantEmail'
                        value={formData.tenantEmail}
                        onChange={handleInputChange}
                        required
                        placeholder='business@example.com'
                        className='w-full pl-11 pr-4 h-11 rounded-xl border border-slate-200 bg-white/90 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all text-base text-gray-900 placeholder:text-gray-400 shadow-sm'
                        style={{ fontFamily: "var(--font-urbanist), sans-serif" }}
                      />
                    </div>
                  </div>

                  <div className='space-y-2'>
                    <label className='text-sm font-semibold text-slate-700' style={{ fontFamily: "var(--font-urbanist), sans-serif" }}>
                      Business Phone *
                    </label>
                    <div className='relative'>
                      <Phone className='absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600 pointer-events-none z-10' />
                      <input
                        type='tel'
                        name='tenantPhone'
                        value={formData.tenantPhone}
                        onChange={handleInputChange}
                        required
                        placeholder='+880 1XXX-XXXXXX'
                        className='w-full pl-11 pr-4 h-11 rounded-xl border border-slate-200 bg-white/90 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all text-base text-gray-900 placeholder:text-gray-400 shadow-sm'
                        style={{ fontFamily: "var(--font-urbanist), sans-serif" }}
                      />
                    </div>
                  </div>

                  <div className='space-y-2'>
                    <label className='text-sm font-semibold text-slate-700' style={{ fontFamily: "var(--font-urbanist), sans-serif" }}>
                      Custom Subdomain <span className='text-gray-400 font-normal'>(Optional)</span>
                    </label>
                    <div className='relative'>
                      <Globe className='absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600 pointer-events-none z-10' />
                      <input
                        type='text'
                        name='customSubdomain'
                        value={formData.customSubdomain}
                        onChange={handleInputChange}
                        placeholder='mystore'
                        className='w-full pl-11 pr-4 h-11 rounded-xl border border-slate-200 bg-white/90 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all text-base text-gray-900 placeholder:text-gray-400 shadow-sm'
                        style={{ fontFamily: "var(--font-urbanist), sans-serif" }}
                      />
                      <span className='absolute right-4 top-1/2 -translate-y-1/2 text-sm text-gray-400'>.framextech.com</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Billing Information */}
              <div className='bg-white rounded-2xl p-5 sm:p-6 md:p-8 border border-slate-200 shadow-sm'>
                <div className='flex items-center gap-3 mb-5 sm:mb-6'>
                  <div className='w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/30'>
                    <CreditCard className='w-4 h-4 sm:w-5 sm:h-5 text-white' />
                  </div>
                  <div>
                    <h3 className='text-base sm:text-lg font-semibold text-gray-900' style={{ fontFamily: "var(--font-nunito-sans), sans-serif" }}>
                      Billing Information
                    </h3>
                    <p className='text-xs sm:text-sm text-gray-500' style={{ fontFamily: "var(--font-urbanist), sans-serif" }}>
                      Required for payment processing
                    </p>
                  </div>
                </div>

                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                  <div className='space-y-2 md:col-span-2'>
                    <label className='text-sm font-semibold text-slate-700' style={{ fontFamily: "var(--font-urbanist), sans-serif" }}>
                      Coupon Code <span className='text-slate-400 font-normal'>(Optional)</span>
                    </label>
                    <input
                      type='text'
                      name='couponCode'
                      value={formData.couponCode}
                      onChange={handleInputChange}
                      placeholder='Enter coupon code'
                      className='w-full px-4 h-11 rounded-xl border border-slate-200 bg-white/90 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all text-base text-gray-900 placeholder:text-gray-400 shadow-sm'
                      style={{ fontFamily: "var(--font-urbanist), sans-serif" }}
                    />
                  </div>
                  <div className='space-y-2'>
                    <label className='text-sm font-semibold text-slate-700' style={{ fontFamily: "var(--font-urbanist), sans-serif" }}>
                      Full Name *
                    </label>
                    <div className='relative'>
                      <User className='absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600 pointer-events-none z-10' />
                      <input
                        type='text'
                        name='customerName'
                        value={formData.customerName}
                        onChange={handleInputChange}
                        required
                        placeholder='John Doe'
                        className='w-full pl-11 pr-4 h-11 rounded-xl border border-slate-200 bg-white/90 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all text-base text-gray-900 placeholder:text-gray-400 shadow-sm'
                        style={{ fontFamily: "var(--font-urbanist), sans-serif" }}
                      />
                    </div>
                  </div>

                  <div className='space-y-2'>
                    <label className='text-sm font-semibold text-slate-700' style={{ fontFamily: "var(--font-urbanist), sans-serif" }}>
                      Email *
                    </label>
                    <div className='relative'>
                      <Mail className='absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600 pointer-events-none z-10' />
                      <input
                        type='email'
                        name='customerEmail'
                        value={formData.customerEmail}
                        onChange={handleInputChange}
                        required
                        placeholder='john@example.com'
                        className='w-full pl-11 pr-4 h-11 rounded-xl border border-slate-200 bg-white/90 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all text-base text-gray-900 placeholder:text-gray-400 shadow-sm'
                        style={{ fontFamily: "var(--font-urbanist), sans-serif" }}
                      />
                    </div>
                  </div>

                  <div className='space-y-2'>
                    <label className='text-sm font-semibold text-slate-700' style={{ fontFamily: "var(--font-urbanist), sans-serif" }}>
                      Phone *
                    </label>
                    <div className='relative'>
                      <Phone className='absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600 pointer-events-none z-10' />
                      <input
                        type='tel'
                        name='customerPhone'
                        value={formData.customerPhone}
                        onChange={handleInputChange}
                        required
                        placeholder='+880 1XXX-XXXXXX'
                        className='w-full pl-11 pr-4 py-2.5 sm:py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all text-sm sm:text-base text-gray-900 placeholder:text-gray-400'
                        style={{ fontFamily: "var(--font-urbanist), sans-serif" }}
                      />
                    </div>
                  </div>

                  <div className='space-y-2'>
                    <label className='text-sm font-medium text-gray-700' style={{ fontFamily: "var(--font-urbanist), sans-serif" }}>
                      Address *
                    </label>
                    <div className='relative'>
                      <MapPin className='absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600 pointer-events-none z-10' />
                      <input
                        type='text'
                        name='customerAddress'
                        value={formData.customerAddress}
                        onChange={handleInputChange}
                        required
                        placeholder='123 Main Street'
                        className='w-full pl-11 pr-4 py-2.5 sm:py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all text-sm sm:text-base text-gray-900 placeholder:text-gray-400'
                        style={{ fontFamily: "var(--font-urbanist), sans-serif" }}
                      />
                    </div>
                  </div>

                  <div className='space-y-2'>
                    <label className='text-sm font-medium text-gray-700' style={{ fontFamily: "var(--font-urbanist), sans-serif" }}>
                      City *
                    </label>
                    <input
                      type='text'
                      name='customerCity'
                      value={formData.customerCity}
                      onChange={handleInputChange}
                      required
                      placeholder='Dhaka'
                      className='w-full px-4 h-11 rounded-xl border border-slate-200 bg-white/90 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all text-base text-gray-900 placeholder:text-gray-400 shadow-sm'
                      style={{ fontFamily: "var(--font-urbanist), sans-serif" }}
                    />
                  </div>

                  <div className='space-y-2'>
                    <label className='text-sm font-semibold text-slate-700' style={{ fontFamily: "var(--font-urbanist), sans-serif" }}>
                      State/Division *
                    </label>
                    <input
                      type='text'
                      name='customerState'
                      value={formData.customerState}
                      onChange={handleInputChange}
                      required
                      placeholder='Dhaka'
                      className='w-full px-4 h-11 rounded-xl border border-slate-200 bg-white/90 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all text-base text-gray-900 placeholder:text-gray-400 shadow-sm'
                      style={{ fontFamily: "var(--font-urbanist), sans-serif" }}
                    />
                  </div>

                  <div className='space-y-2'>
                    <label className='text-sm font-semibold text-slate-700' style={{ fontFamily: "var(--font-urbanist), sans-serif" }}>
                      Postal Code *
                    </label>
                    <input
                      type='text'
                      name='customerPostcode'
                      value={formData.customerPostcode}
                      onChange={handleInputChange}
                      required
                      placeholder='1200'
                      className='w-full px-4 h-11 rounded-xl border border-slate-200 bg-white/90 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all text-base text-gray-900 placeholder:text-gray-400 shadow-sm'
                      style={{ fontFamily: "var(--font-urbanist), sans-serif" }}
                    />
                  </div>

                  <div className='space-y-2'>
                    <label className='text-sm font-semibold text-slate-700' style={{ fontFamily: "var(--font-urbanist), sans-serif" }}>
                      Country *
                    </label>
                    <select
                      name='customerCountry'
                      value={formData.customerCountry}
                      onChange={handleInputChange}
                      required
                      className='w-full px-4 h-11 rounded-xl border border-slate-200 bg-white/90 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all text-base text-gray-900 shadow-sm'
                      style={{ fontFamily: "var(--font-urbanist), sans-serif" }}
                    >
                      <option value='Bangladesh'>Bangladesh</option>
                      <option value='India'>India</option>
                      <option value='Pakistan'>Pakistan</option>
                      <option value='United States'>United States</option>
                      <option value='United Kingdom'>United Kingdom</option>
                      <option value='Other'>Other</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type='submit'
                disabled={loading}
                className={cn(
                  "w-full py-4 rounded-2xl font-semibold text-base transition-all duration-300 flex items-center justify-center gap-3 group",
                  "bg-[#0448FD] text-white hover:scale-[1.02] active:scale-[0.98]",
                  loading && "opacity-70 cursor-not-allowed"
                )}
                style={{
                  fontFamily: "var(--font-urbanist), sans-serif",
                  fontWeight: 600,
                  boxShadow: `
                    0px 1px 1px 0px rgba(4, 72, 253, 0.18),
                    0px 2px 2.8px 0px rgba(4, 72, 253, 0.44),
                    0px 5px 12.8px 0px rgba(4, 72, 253, 0.49),
                    0px -5px 11.1px 0px rgba(255, 255, 255, 0.52) inset
                  `,
                }}
              >
                {loading ? (
                  <>
                    <Loader2 className='w-5 h-5 animate-spin' />
                    Processing...
                  </>
                ) : (
                  <>
                    {displayPrice === 0 ? "Start Free" : `Pay ${currencySymbol}${formatAmount(displayPrice)}`}
                    <ArrowRight className='w-5 h-5 transition-transform group-hover:translate-x-1' />
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Right: Order Summary */}
          <div ref={summaryRef} className='lg:col-span-5'>
            <div className='lg:sticky lg:top-24'>
              {/* Plan Summary Card */}
              <div className='bg-white rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm border border-slate-200 mb-6'>
                <div className='flex items-center gap-3 mb-5 sm:mb-6'>
                  <div className='w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/30'>
                    <Star className='w-4 h-4 sm:w-5 sm:h-5 text-white' />
                  </div>
                  <div>
                    <h3 className='text-base sm:text-lg font-semibold text-gray-900' style={{ fontFamily: "var(--font-nunito-sans), sans-serif" }}>
                      Order Summary
                    </h3>
                    <p className='text-xs sm:text-sm text-gray-500' style={{ fontFamily: "var(--font-urbanist), sans-serif" }}>
                      Review your selection
                    </p>
                  </div>
                </div>

                {activePlan ? (
                  <>
                    {/* Plan Header */}
                    <div className='flex items-center justify-between pb-4 border-b border-gray-100'>
                      <div>
                        <h4 className='text-base sm:text-xl font-semibold text-gray-900' style={{ fontFamily: "var(--font-nunito-sans), sans-serif" }}>
                          {activePlan.name}
                        </h4>
                        <p className='text-xs sm:text-sm text-gray-500' style={{ fontFamily: "var(--font-urbanist), sans-serif" }}>
                          {getBillingCycleLabel(activePlan.billingCycleMonths)} subscription
                        </p>
                      </div>
                      <div className='text-right'>
                        <div className='flex items-baseline gap-1'>
                          <span className='text-2xl sm:text-3xl font-bold text-gray-900' style={{ fontFamily: "var(--font-nunito-sans), sans-serif" }}>
                            {currencySymbol}
                            {formatAmount(displayPrice)}
                          </span>
                        </div>
                        {activePlan.billingCycleMonths > 1 && activePlan.price > 0 && (
                          <p className='text-[11px] sm:text-xs text-gray-500' style={{ fontFamily: "var(--font-urbanist), sans-serif" }}>
                            {currencySymbol}
                            {formatAmount(monthlyEquivalent, 2)}/mo
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Features List */}
                    <div className='py-4'>
                      <p className='text-xs sm:text-sm font-semibold text-gray-700 mb-3' style={{ fontFamily: "var(--font-nunito-sans), sans-serif" }}>
                        What's included:
                      </p>
                      <ul className='space-y-2'>
                        {(activePlan.featuresList || []).map((feature, index) => (
                          <li key={index} className='flex items-center gap-2.5'>
                            <div className='w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0'>
                              <CheckCircle2 className='w-3.5 h-3.5 text-blue-600' />
                            </div>
                            <span className='text-xs sm:text-sm text-gray-600' style={{ fontFamily: "var(--font-urbanist), sans-serif" }}>
                              {feature}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Total */}
                    <div className='pt-4 border-t border-gray-100'>
                      <div className='flex items-center justify-between'>
                        <span className='text-base sm:text-lg font-semibold text-gray-900' style={{ fontFamily: "var(--font-nunito-sans), sans-serif" }}>
                          Total Today
                        </span>
                        <span className='text-xl sm:text-2xl font-bold text-[#0448FD]' style={{ fontFamily: "var(--font-nunito-sans), sans-serif" }}>
                          {currencySymbol}
                          {formatAmount(displayPrice)}
                        </span>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className='text-center py-8'>
                    <p className='text-gray-500' style={{ fontFamily: "var(--font-urbanist), sans-serif" }}>
                      Select a billing cycle to see plan details
                    </p>
                  </div>
                )}
              </div>

              {/* Info Card */}
              <div className='rounded-2xl p-4 sm:p-6 border border-slate-200 bg-white shadow-sm'>
                <div className='flex items-start gap-3'>
                  <div className='w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0'>
                    <Sparkles className='w-4 h-4 text-blue-600' />
                  </div>
                  <div>
                    <h4 className='text-xs sm:text-sm font-semibold text-gray-900 mb-1' style={{ fontFamily: "var(--font-nunito-sans), sans-serif" }}>
                      What happens next?
                    </h4>
                    <ul className='text-[11px] sm:text-xs text-gray-600 space-y-1.5' style={{ fontFamily: "var(--font-urbanist), sans-serif" }}>
                      <li className='flex items-center gap-2'>
                        <Zap className='w-3 h-3 text-yellow-500' />
                        Your store will be deployed automatically
                      </li>
                      <li className='flex items-center gap-2'>
                        <Zap className='w-3 h-3 text-yellow-500' />
                        You'll receive login credentials via email
                      </li>
                      <li className='flex items-center gap-2'>
                        <Zap className='w-3 h-3 text-yellow-500' />
                        Database & hosting setup instantly
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function CheckoutContainer() {
  return (
    <Suspense
      fallback={
        <section className='min-h-screen py-24 sm:py-28 md:py-32 bg-gradient-to-b from-white via-blue-50/30 to-white'>
          <div className='max-w-7xl mx-auto px-4 sm:px-6'>
            <div className='flex justify-center items-center min-h-[400px]'>
              <Loader2 className='w-8 h-8 animate-spin text-blue-500' />
            </div>
          </div>
        </section>
      }
    >
      <CheckoutContainerInner />
    </Suspense>
  );
}
