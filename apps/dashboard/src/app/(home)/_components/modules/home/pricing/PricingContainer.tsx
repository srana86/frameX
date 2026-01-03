"use client";

import React, { useRef, useState, useEffect } from "react";
import SectionHeader from "../../../shared/SectionHeader";
import PricingCard from "./PricingCard";
import StarIcon from "./icons/StarIcon";
import GridIcon from "./icons/GridIcon";
import SparklesIcon from "./icons/SparklesIcon";
import { cn } from "@/utils";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { getCurrencySymbol, DEFAULT_CURRENCY } from "@/lib/currency";
import { api } from "@/lib/api-client";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

// Plan interface matching the database structure
interface Plan {
  id: string;
  name: string;
  description?: string;
  price: number;
  billingCycleMonths: number;
  featuresList: string[];
  isActive: boolean;
  isPopular?: boolean;
  sortOrder?: number;
  buttonText?: string;
  buttonVariant?: "default" | "outline" | "gradient";
  iconType?: "star" | "grid" | "sparkles";
}

// Default fallback plans - 3 monthly plans
const DEFAULT_PLANS: Plan[] = [
  {
    id: "starter",
    name: "Starter",
    description: "For individuals who just need to launch fast.",
    price: 0,
    billingCycleMonths: 1,
    featuresList: [
      "1 Website",
      "Basic Templates",
      "Standard Hosting",
      "Drag & Drop Editor",
      "Basic SEO Tools",
      "Email Support",
    ],
    buttonText: "Get Started",
    buttonVariant: "outline",
    iconType: "star",
    isActive: true,
    sortOrder: 1,
  },
  {
    id: "professional",
    name: "Professional",
    description: "For creators and small teams wanting control.",
    price: 29,
    billingCycleMonths: 1,
    featuresList: [
      "10 Websites",
      "All Premium Templates",
      "Priority Hosting",
      "Advanced SEO",
      "Custom Domains",
      "Analytics Dashboard",
      "Priority Support",
    ],
    buttonText: "Upgrade Now",
    buttonVariant: "gradient",
    isPopular: true,
    iconType: "grid",
    isActive: true,
    sortOrder: 2,
  },
  {
    id: "business",
    name: "Business",
    description: "For teams and businesses scaling without limit.",
    price: 79,
    billingCycleMonths: 1,
    featuresList: [
      "Unlimited Websites",
      "Full Template Library",
      "High-Performance Hosting",
      "Team Collaboration",
      "Advanced Integrations",
      "Custom Code Support",
      "Dedicated Success Manager",
    ],
    buttonText: "Start Scaling",
    buttonVariant: "outline",
    iconType: "sparkles",
    isActive: true,
    sortOrder: 3,
  },
];

// Get icon component based on iconType
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

// Get icon background based on index
function getIconBg(index: number, isPopular: boolean) {
  if (isPopular)
    return "bg-linear-to-br from-blue-100 via-purple-100 to-purple-200";
  return "bg-linear-to-br from-purple-100 to-purple-200";
}

export default function PricingContainer() {
  const [currencySymbol, setCurrencySymbol] = useState(
    getCurrencySymbol(DEFAULT_CURRENCY)
  );
  const sectionRef = useRef<HTMLElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);

  // Always use the 3 default plans for homepage
  const plans = DEFAULT_PLANS;

  // Fetch currency settings only
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const settings = await api
          .get<any>("settings/general")
          .catch(() => null);
        if (settings?.defaultCurrency) {
          setCurrencySymbol(getCurrencySymbol(settings.defaultCurrency));
        }
      } catch (error) {
        console.error("Failed to fetch settings:", error);
      }
    };

    fetchSettings();
  }, []);

  useGSAP(
    () => {
      if (!sectionRef.current) return;

      // Clean fade-up for header
      if (headerRef.current) {
        gsap.fromTo(
          headerRef.current,
          { opacity: 0, y: 30 },
          {
            opacity: 1,
            y: 0,
            duration: 0.7,
            ease: "power3.out",
            scrollTrigger: {
              trigger: headerRef.current,
              start: "top 85%",
              toggleActions: "play none none none",
            },
          }
        );
      }
    },
    { scope: sectionRef }
  );

  return (
    <section
      ref={sectionRef}
      className="w-full py-10 xs:py-12 sm:py-16 md:py-20 lg:py-24"
    >
      <div className="max-w-7xl mx-auto px-3">
        {/* Header */}
        <div ref={headerRef} className="mb-6 xs:mb-8 sm:mb-12 md:mb-16">
          <SectionHeader
            title="Choose a Plan That Matches Your Growth"
            subtitle="Straightforward tiers with the features you need now — and room to scale when your product demands it."
          />
        </div>

        {/* Pricing Cards - Always show 3 cards */}
        <div
          className={cn(
            "grid grid-cols-1 gap-8 items-stretch lg:grid-cols-3 lg:gap-9"
          )}
        >
          {plans.map((plan, index) => (
            <div key={plan.id} className="flex lg:h-full">
              <PricingCard
                plan={{
                  id: plan.id,
                  name: plan.name,
                  description: plan.description || "",
                  price: plan.price,
                  billingCycleMonths: plan.billingCycleMonths,
                  icon: getIconComponent(plan.iconType, "w-full h-full"),
                  features: plan.featuresList,
                  buttonText: plan.buttonText || "Get Started",
                  buttonVariant: plan.buttonVariant || "outline",
                  isPopular: plan.isPopular,
                  iconBg: getIconBg(index, plan.isPopular || false),
                }}
                index={index}
                isVisible={true}
                currencySymbol={currencySymbol}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
