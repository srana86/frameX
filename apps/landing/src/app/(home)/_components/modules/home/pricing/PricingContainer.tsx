"use client";

import React, { useRef, useState, useEffect } from "react";
import SectionHeader from "../../../shared/SectionHeader";
import PricingCard from "./PricingCard";
import StarIcon from "./icons/StarIcon";
import GridIcon from "./icons/GridIcon";
import SparklesIcon from "./icons/SparklesIcon";
import { cn } from "@/utils";
import { DEFAULT_PLANS } from "@/lib/pricing-plans";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { getCurrencySymbol, DEFAULT_CURRENCY } from "@/lib/currency";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

// Default fallback plans - Same plan with 3 billing cycles
// All plans include the same features, only billing cycle differs

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
  if (isPopular) return "bg-linear-to-br from-blue-100 via-purple-100 to-purple-200";
  return "bg-linear-to-br from-purple-100 to-purple-200";
}

export default function PricingContainer() {
  const [currencySymbol, setCurrencySymbol] = useState(getCurrencySymbol(DEFAULT_CURRENCY));
  const sectionRef = useRef<HTMLElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);

  // Always use the 3 default plans for homepage
  const plans = DEFAULT_PLANS;

  // Fetch currency settings only
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const settingsRes = await fetch("/api/v1/settings/general");
        if (settingsRes.ok) {
          const settings = await settingsRes.json();
          if (settings.defaultCurrency) {
            setCurrencySymbol(getCurrencySymbol(settings.defaultCurrency));
          }
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
    <section ref={sectionRef} className='w-full py-12 sm:py-16 md:py-20 lg:py-24'>
      <div className='max-w-7xl mx-auto px-3'>
        {/* Header */}
        <div ref={headerRef} className='mb-12 sm:mb-16 md:mb-20'>
          <SectionHeader
            title='Choose Your Billing Cycle'
            subtitle='Start your e-commerce store at the most affordable price. Save more with longer commitments - all plans include the same features.'
          />
        </div>

        {/* Pricing Cards - Always show 3 cards */}
        <div className={cn("grid grid-cols-1 gap-8 items-stretch lg:grid-cols-3 lg:gap-9")}>
          {plans.map((plan, index) => (
            <div key={plan.id} className='flex lg:h-full'>
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
