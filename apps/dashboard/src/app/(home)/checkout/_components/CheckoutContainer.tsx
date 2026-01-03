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
import { api } from "@/lib/api-client";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

// Billing cycle types
type BillingCycleMonths = 1 | 6 | 12;
type BillingCycle = "monthly" | "semi_annual" | "yearly";

const BILLING_CYCLES: {
  months: BillingCycleMonths;
  name: string;
  label: string;
  discount: number;
}[] = [
  { months: 1, name: "monthly", label: "1 Month", discount: 0 },
  { months: 6, name: "semi_annual", label: "6 Months", discount: 10 },
  { months: 12, name: "yearly", label: "1 Year", discount: 20 },
];

interface PlanInfo {
  id: string;
  name: string;
  price: number;
  billingCycleMonths: number;
  featuresList: string[];
  description?: string;
}

// Get billing cycle label
function getBillingCycleLabel(months: number): string {
  switch (months) {
    case 1:
      return "Monthly";
    case 6:
      return "6 Months";
    case 12:
      return "Yearly";
    default:
      return `${months} Months`;
  }
}

function CheckoutContainerInner() {
  const searchParams = useSearchParams();
  const planId = searchParams.get("plan") || "";
  const cycleParam = searchParams.get("cycle") || "1";
  const initialCycle = (parseInt(cycleParam) as BillingCycleMonths) || 1;

  const [allPlans, setAllPlans] = useState<PlanInfo[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<PlanInfo | null>(null);
  const [billingCycle, setBillingCycle] =
    useState<BillingCycleMonths>(initialCycle);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [loading, setLoading] = useState(false);
  const [currencySymbol, setCurrencySymbol] = useState(
    getCurrencySymbol(DEFAULT_CURRENCY)
  );
  const [formData, setFormData] = useState({
    // Merchant Info
    merchantName: "",
    merchantEmail: "",
    merchantPhone: "",
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
  });

  const sectionRef = useRef<HTMLElement>(null);
  const formRef = useRef<HTMLDivElement>(null);
  const summaryRef = useRef<HTMLDivElement>(null);

  // Fetch plans and settings from API
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch plans and settings in parallel
        const [plansData, settingsData] = await Promise.all([
          api.get<PlanInfo[]>("plans?active=true").catch(() => []),
          api.get<any>("settings/general").catch(() => null),
        ]);

        setAllPlans(plansData);

        // Find the specific plan if planId is provided
        if (planId) {
          const plan = plansData.find((p: PlanInfo) => p.id === planId);
          if (plan) {
            setSelectedPlan(plan);
            setBillingCycle(plan.billingCycleMonths as BillingCycleMonths);
          }
        }

        if (settingsData?.defaultCurrency) {
          setCurrencySymbol(getCurrencySymbol(settingsData.defaultCurrency));
        }
      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setLoadingPlans(false);
      }
    };

    fetchData();
  }, [planId]);

  // Get available billing cycles
  const availableCycles = [
    ...new Set(allPlans.map((p) => p.billingCycleMonths)),
  ].sort((a, b) => a - b);

  // When billing cycle changes, update selected plan to matching cycle
  useEffect(() => {
    if (selectedPlan && selectedPlan.billingCycleMonths !== billingCycle) {
      // Find a plan with same name but different billing cycle
      const samePlanDifferentCycle = allPlans.find(
        (p) =>
          p.name === selectedPlan.name && p.billingCycleMonths === billingCycle
      );
      if (samePlanDifferentCycle) {
        setSelectedPlan(samePlanDifferentCycle);
      } else {
        // Just select the first plan for this cycle
        const firstPlanForCycle = allPlans.find(
          (p) => p.billingCycleMonths === billingCycle
        );
        if (firstPlanForCycle) {
          setSelectedPlan(firstPlanForCycle);
        }
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

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlan) return;

    const cycleInfo = BILLING_CYCLES.find((c) => c.months === billingCycle);

    setLoading(true);
    try {
      const data = await api.post<{
        tranId: string;
        GatewayPageURL?: string;
        success?: boolean;
        message?: string;
      }>("checkout/init", {
        ...formData,
        planId: selectedPlan.id,
        planName: selectedPlan.name,
        planPrice: selectedPlan.price,
        billingCycle: cycleInfo?.name || "monthly",
        billingCycleMonths: selectedPlan.billingCycleMonths,
      });

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
      toast.error(error?.message || "Payment initialization failed");
    } finally {
      setLoading(false);
    }
  };

  const displayPrice = selectedPlan?.price || 0;
  const monthlyEquivalent = selectedPlan
    ? selectedPlan.price / (selectedPlan.billingCycleMonths || 1)
    : 0;
  const selectedCycle = BILLING_CYCLES.find((c) => c.months === billingCycle);

  // Show loading state while fetching plans
  if (loadingPlans) {
    return (
      <section className="min-h-screen py-24 sm:py-28 md:py-32 bg-gradient-to-b from-white via-blue-50/30 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex justify-center items-center min-h-[400px]">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          </div>
        </div>
      </section>
    );
  }

  return (
    <section
      ref={sectionRef}
      className="min-h-screen py-24 sm:py-28 md:py-32 bg-gradient-to-b from-white via-blue-50/30 to-white"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="mb-12 md:mb-16">
          <SectionHeader
            title="Complete Your Order"
            subtitle="You're one step away from launching your online store. Fill in your details below to proceed with payment."
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          {/* Left: Checkout Form */}
          <div ref={formRef} className="lg:col-span-7">
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Billing Cycle Selector */}
              <div
                className="bg-white rounded-2xl p-6 md:p-8 shadow-lg shadow-blue-500/5 border border-gray-100"
                style={{
                  boxShadow: "0px 6px 60px 0px rgba(103, 103, 103, 0.1)",
                }}
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-green-500/30">
                    <CreditCard className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3
                      className="text-lg font-semibold text-gray-900"
                      style={{
                        fontFamily: "var(--font-nunito-sans), sans-serif",
                      }}
                    >
                      Billing Period
                    </h3>
                    <p
                      className="text-sm text-gray-500"
                      style={{ fontFamily: "var(--font-urbanist), sans-serif" }}
                    >
                      Choose how long you want to subscribe
                    </p>
                  </div>
                </div>

                <div
                  className={cn(
                    "grid gap-3",
                    availableCycles.length <= 3
                      ? `grid-cols-${availableCycles.length}`
                      : "grid-cols-3"
                  )}
                >
                  {availableCycles.map((cycleMonths) => {
                    const cycle = BILLING_CYCLES.find(
                      (c) => c.months === cycleMonths
                    );
                    if (!cycle) return null;

                    const isSelected = billingCycle === cycleMonths;
                    // Find a plan for this cycle to show the price
                    const planForCycle = selectedPlan?.name
                      ? allPlans.find(
                          (p) =>
                            p.name === selectedPlan.name &&
                            p.billingCycleMonths === cycleMonths
                        )
                      : allPlans.find(
                          (p) => p.billingCycleMonths === cycleMonths
                        );
                    const cyclePrice = planForCycle?.price || 0;
                    const monthlyEq = cyclePrice / cycleMonths;

                    return (
                      <button
                        key={cycleMonths}
                        type="button"
                        onClick={() =>
                          setBillingCycle(cycleMonths as BillingCycleMonths)
                        }
                        className={cn(
                          "relative p-4 rounded-xl border-2 transition-all text-left",
                          isSelected
                            ? "border-blue-500 bg-blue-50/50"
                            : "border-gray-200 hover:border-gray-300 bg-white"
                        )}
                      >
                        {cycle.discount > 0 && (
                          <span className="absolute -top-2 right-2 px-2 py-0.5 bg-green-500 text-white text-xs font-semibold rounded-full">
                            Save {cycle.discount}%
                          </span>
                        )}
                        <p
                          className={cn(
                            "font-semibold text-sm mb-1",
                            isSelected ? "text-blue-700" : "text-gray-900"
                          )}
                          style={{
                            fontFamily: "var(--font-nunito-sans), sans-serif",
                          }}
                        >
                          {cycle.label}
                        </p>
                        <p
                          className={cn(
                            "text-lg font-bold",
                            isSelected ? "text-blue-600" : "text-gray-700"
                          )}
                          style={{
                            fontFamily: "var(--font-nunito-sans), sans-serif",
                          }}
                        >
                          {currencySymbol}
                          {cyclePrice}
                        </p>
                        {cycleMonths > 1 && cyclePrice > 0 && (
                          <p
                            className="text-xs text-gray-500"
                            style={{
                              fontFamily: "var(--font-urbanist), sans-serif",
                            }}
                          >
                            {currencySymbol}
                            {monthlyEq.toFixed(2)}/mo
                          </p>
                        )}
                        {isSelected && (
                          <div className="absolute top-3 right-3">
                            <CheckCircle2 className="w-5 h-5 text-blue-500" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Merchant Information */}
              <div
                className="bg-white rounded-2xl p-6 md:p-8 shadow-lg shadow-blue-500/5 border border-gray-100"
                style={{
                  boxShadow: "0px 6px 60px 0px rgba(103, 103, 103, 0.1)",
                }}
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
                    <Building2 className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3
                      className="text-lg font-semibold text-gray-900"
                      style={{
                        fontFamily: "var(--font-nunito-sans), sans-serif",
                      }}
                    >
                      Store Information
                    </h3>
                    <p
                      className="text-sm text-gray-500"
                      style={{ fontFamily: "var(--font-urbanist), sans-serif" }}
                    >
                      Details for your new online store
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label
                      className="text-sm font-medium text-gray-700"
                      style={{ fontFamily: "var(--font-urbanist), sans-serif" }}
                    >
                      Store Name *
                    </label>
                    <div className="relative">
                      <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        name="merchantName"
                        value={formData.merchantName}
                        onChange={handleInputChange}
                        required
                        placeholder="My Awesome Store"
                        className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all text-gray-900 placeholder:text-gray-400"
                        style={{
                          fontFamily: "var(--font-urbanist), sans-serif",
                        }}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label
                      className="text-sm font-medium text-gray-700"
                      style={{ fontFamily: "var(--font-urbanist), sans-serif" }}
                    >
                      Business Email *
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="email"
                        name="merchantEmail"
                        value={formData.merchantEmail}
                        onChange={handleInputChange}
                        required
                        placeholder="business@example.com"
                        className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all text-gray-900 placeholder:text-gray-400"
                        style={{
                          fontFamily: "var(--font-urbanist), sans-serif",
                        }}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label
                      className="text-sm font-medium text-gray-700"
                      style={{ fontFamily: "var(--font-urbanist), sans-serif" }}
                    >
                      Business Phone *
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="tel"
                        name="merchantPhone"
                        value={formData.merchantPhone}
                        onChange={handleInputChange}
                        required
                        placeholder="+880 1XXX-XXXXXX"
                        className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all text-gray-900 placeholder:text-gray-400"
                        style={{
                          fontFamily: "var(--font-urbanist), sans-serif",
                        }}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label
                      className="text-sm font-medium text-gray-700"
                      style={{ fontFamily: "var(--font-urbanist), sans-serif" }}
                    >
                      Custom Subdomain{" "}
                      <span className="text-gray-400 font-normal">
                        (Optional)
                      </span>
                    </label>
                    <div className="relative">
                      <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        name="customSubdomain"
                        value={formData.customSubdomain}
                        onChange={handleInputChange}
                        placeholder="mystore"
                        className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all text-gray-900 placeholder:text-gray-400"
                        style={{
                          fontFamily: "var(--font-urbanist), sans-serif",
                        }}
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-gray-400">
                        .framextech.com
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Billing Information */}
              <div
                className="bg-white rounded-2xl p-6 md:p-8 shadow-lg shadow-blue-500/5 border border-gray-100"
                style={{
                  boxShadow: "0px 6px 60px 0px rgba(103, 103, 103, 0.1)",
                }}
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/30">
                    <CreditCard className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3
                      className="text-lg font-semibold text-gray-900"
                      style={{
                        fontFamily: "var(--font-nunito-sans), sans-serif",
                      }}
                    >
                      Billing Information
                    </h3>
                    <p
                      className="text-sm text-gray-500"
                      style={{ fontFamily: "var(--font-urbanist), sans-serif" }}
                    >
                      Required for payment processing
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label
                      className="text-sm font-medium text-gray-700"
                      style={{ fontFamily: "var(--font-urbanist), sans-serif" }}
                    >
                      Full Name *
                    </label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        name="customerName"
                        value={formData.customerName}
                        onChange={handleInputChange}
                        required
                        placeholder="John Doe"
                        className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all text-gray-900 placeholder:text-gray-400"
                        style={{
                          fontFamily: "var(--font-urbanist), sans-serif",
                        }}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label
                      className="text-sm font-medium text-gray-700"
                      style={{ fontFamily: "var(--font-urbanist), sans-serif" }}
                    >
                      Email *
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="email"
                        name="customerEmail"
                        value={formData.customerEmail}
                        onChange={handleInputChange}
                        required
                        placeholder="john@example.com"
                        className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all text-gray-900 placeholder:text-gray-400"
                        style={{
                          fontFamily: "var(--font-urbanist), sans-serif",
                        }}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label
                      className="text-sm font-medium text-gray-700"
                      style={{ fontFamily: "var(--font-urbanist), sans-serif" }}
                    >
                      Phone *
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="tel"
                        name="customerPhone"
                        value={formData.customerPhone}
                        onChange={handleInputChange}
                        required
                        placeholder="+880 1XXX-XXXXXX"
                        className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all text-gray-900 placeholder:text-gray-400"
                        style={{
                          fontFamily: "var(--font-urbanist), sans-serif",
                        }}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label
                      className="text-sm font-medium text-gray-700"
                      style={{ fontFamily: "var(--font-urbanist), sans-serif" }}
                    >
                      Address *
                    </label>
                    <div className="relative">
                      <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        name="customerAddress"
                        value={formData.customerAddress}
                        onChange={handleInputChange}
                        required
                        placeholder="123 Main Street"
                        className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all text-gray-900 placeholder:text-gray-400"
                        style={{
                          fontFamily: "var(--font-urbanist), sans-serif",
                        }}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label
                      className="text-sm font-medium text-gray-700"
                      style={{ fontFamily: "var(--font-urbanist), sans-serif" }}
                    >
                      City *
                    </label>
                    <input
                      type="text"
                      name="customerCity"
                      value={formData.customerCity}
                      onChange={handleInputChange}
                      required
                      placeholder="Dhaka"
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all text-gray-900 placeholder:text-gray-400"
                      style={{ fontFamily: "var(--font-urbanist), sans-serif" }}
                    />
                  </div>

                  <div className="space-y-2">
                    <label
                      className="text-sm font-medium text-gray-700"
                      style={{ fontFamily: "var(--font-urbanist), sans-serif" }}
                    >
                      State/Division *
                    </label>
                    <input
                      type="text"
                      name="customerState"
                      value={formData.customerState}
                      onChange={handleInputChange}
                      required
                      placeholder="Dhaka"
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all text-gray-900 placeholder:text-gray-400"
                      style={{ fontFamily: "var(--font-urbanist), sans-serif" }}
                    />
                  </div>

                  <div className="space-y-2">
                    <label
                      className="text-sm font-medium text-gray-700"
                      style={{ fontFamily: "var(--font-urbanist), sans-serif" }}
                    >
                      Postal Code *
                    </label>
                    <input
                      type="text"
                      name="customerPostcode"
                      value={formData.customerPostcode}
                      onChange={handleInputChange}
                      required
                      placeholder="1200"
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all text-gray-900 placeholder:text-gray-400"
                      style={{ fontFamily: "var(--font-urbanist), sans-serif" }}
                    />
                  </div>

                  <div className="space-y-2">
                    <label
                      className="text-sm font-medium text-gray-700"
                      style={{ fontFamily: "var(--font-urbanist), sans-serif" }}
                    >
                      Country *
                    </label>
                    <select
                      name="customerCountry"
                      value={formData.customerCountry}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all text-gray-900 bg-white"
                      style={{ fontFamily: "var(--font-urbanist), sans-serif" }}
                    >
                      <option value="Bangladesh">Bangladesh</option>
                      <option value="India">India</option>
                      <option value="Pakistan">Pakistan</option>
                      <option value="United States">United States</option>
                      <option value="United Kingdom">United Kingdom</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
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
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    {displayPrice === 0
                      ? "Start Free"
                      : `Pay ${currencySymbol}${displayPrice}`}
                    <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                  </>
                )}
              </button>

              {/* Security Badge */}
              <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                <Shield className="w-4 h-4 text-green-500" />
                <span
                  style={{ fontFamily: "var(--font-urbanist), sans-serif" }}
                >
                  Secured by SSLCommerz - 256-bit SSL encryption
                </span>
              </div>
            </form>
          </div>

          {/* Right: Order Summary */}
          <div ref={summaryRef} className="lg:col-span-5">
            <div className="sticky top-24">
              {/* Plan Summary Card */}
              <div
                className="bg-white rounded-2xl p-6 md:p-8 shadow-lg border border-gray-100 mb-6"
                style={{
                  boxShadow: "0px 6px 60px 0px rgba(103, 103, 103, 0.1)",
                }}
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/30">
                    <Star className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3
                      className="text-lg font-semibold text-gray-900"
                      style={{
                        fontFamily: "var(--font-nunito-sans), sans-serif",
                      }}
                    >
                      Order Summary
                    </h3>
                    <p
                      className="text-sm text-gray-500"
                      style={{ fontFamily: "var(--font-urbanist), sans-serif" }}
                    >
                      Review your selection
                    </p>
                  </div>
                </div>

                {selectedPlan ? (
                  <>
                    {/* Plan Header */}
                    <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                      <div>
                        <h4
                          className="text-xl font-semibold text-gray-900"
                          style={{
                            fontFamily: "var(--font-nunito-sans), sans-serif",
                          }}
                        >
                          {selectedPlan.name}
                        </h4>
                        <p
                          className="text-sm text-gray-500"
                          style={{
                            fontFamily: "var(--font-urbanist), sans-serif",
                          }}
                        >
                          {getBillingCycleLabel(
                            selectedPlan.billingCycleMonths
                          )}{" "}
                          subscription
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="flex items-baseline gap-1">
                          <span
                            className="text-3xl font-bold text-gray-900"
                            style={{
                              fontFamily: "var(--font-nunito-sans), sans-serif",
                            }}
                          >
                            {currencySymbol}
                            {displayPrice}
                          </span>
                        </div>
                        {selectedPlan.billingCycleMonths > 1 &&
                          selectedPlan.price > 0 && (
                            <p
                              className="text-xs text-gray-500"
                              style={{
                                fontFamily: "var(--font-urbanist), sans-serif",
                              }}
                            >
                              {currencySymbol}
                              {monthlyEquivalent.toFixed(2)}/mo
                            </p>
                          )}
                      </div>
                    </div>

                    {/* Features List */}
                    <div className="py-4">
                      <p
                        className="text-sm font-semibold text-gray-700 mb-3"
                        style={{
                          fontFamily: "var(--font-nunito-sans), sans-serif",
                        }}
                      >
                        What&apos;s included:
                      </p>
                      <ul className="space-y-2.5">
                        {(selectedPlan.featuresList || []).map(
                          (feature, index) => (
                            <li
                              key={index}
                              className="flex items-center gap-2.5"
                            >
                              <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                                <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                              </div>
                              <span
                                className="text-sm text-gray-600"
                                style={{
                                  fontFamily:
                                    "var(--font-urbanist), sans-serif",
                                }}
                              >
                                {feature}
                              </span>
                            </li>
                          )
                        )}
                      </ul>
                    </div>

                    {/* Total */}
                    <div className="pt-4 border-t border-gray-100">
                      <div className="flex items-center justify-between">
                        <span
                          className="text-lg font-semibold text-gray-900"
                          style={{
                            fontFamily: "var(--font-nunito-sans), sans-serif",
                          }}
                        >
                          Total Today
                        </span>
                        <span
                          className="text-2xl font-bold text-[#0448FD]"
                          style={{
                            fontFamily: "var(--font-nunito-sans), sans-serif",
                          }}
                        >
                          {currencySymbol}
                          {displayPrice}
                        </span>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8">
                    <p
                      className="text-gray-500"
                      style={{ fontFamily: "var(--font-urbanist), sans-serif" }}
                    >
                      Select a billing cycle to see plan details
                    </p>
                  </div>
                )}
              </div>

              {/* Info Card */}
              <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-6 border border-blue-100/50">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                    <Sparkles className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <h4
                      className="text-sm font-semibold text-gray-900 mb-1"
                      style={{
                        fontFamily: "var(--font-nunito-sans), sans-serif",
                      }}
                    >
                      What happens next?
                    </h4>
                    <ul
                      className="text-xs text-gray-600 space-y-1.5"
                      style={{ fontFamily: "var(--font-urbanist), sans-serif" }}
                    >
                      <li className="flex items-center gap-2">
                        <Zap className="w-3 h-3 text-yellow-500" />
                        Your store will be deployed automatically
                      </li>
                      <li className="flex items-center gap-2">
                        <Zap className="w-3 h-3 text-yellow-500" />
                        You&apos;ll receive login credentials via email
                      </li>
                      <li className="flex items-center gap-2">
                        <Zap className="w-3 h-3 text-yellow-500" />
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
        <section className="min-h-screen py-24 sm:py-28 md:py-32 bg-gradient-to-b from-white via-blue-50/30 to-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="flex justify-center items-center min-h-[400px]">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
          </div>
        </section>
      }
    >
      <CheckoutContainerInner />
    </Suspense>
  );
}
