"use client";

import React, { memo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/utils";
import WShapeWithStars from "./icons/WShapeWithStars";

export interface PricingPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  billingCycleMonths?: number;
  icon: React.ReactNode;
  features: string[];
  buttonText: string;
  buttonVariant?: "default" | "outline" | "gradient";
  isPopular?: boolean;
  iconBg?: string;
}

interface PricingCardProps {
  plan: PricingPlan;
  index: number;
  isVisible: boolean;
  currencySymbol?: string;
}

function getBillingLabel(months: number) {
  switch (months) {
    case 1:
      return "per month";
    case 6:
      return "for 6 months";
    case 12:
      return "per year";
    default:
      return `for ${months} months`;
  }
}

function PricingCard({ plan, index, isVisible, currencySymbol = "৳" }: PricingCardProps) {
  const router = useRouter();
  const billingCycleMonths = plan.billingCycleMonths || 1;
  const monthlyEquivalent = plan.price / billingCycleMonths;

  const handleGetStarted = useCallback(() => {
    router.push(`/checkout?plan=${plan.id}&cycle=${billingCycleMonths}`);
  }, [router, plan.id, billingCycleMonths]);

  // Card styling based on index (0, 1, 2)
  const getCardStyle = () => {
    return {
      background: "rgba(255, 255, 255, 1)",
      boxShadow: `
        0px 2px 4px 0px rgba(0, 0, 0, 0.02),
        0px 6px 60px 0px rgba(103, 103, 103, 0.1)
      `,
    };
  };

  // Get gradient color for right corner based on index
  const getGradientColor = () => {
    if (index === 0) return "rgba(199, 211, 253, 1)"; // Card 1: Light purple
    if (index === 1) {
      // Card 2: Gradient - deep at right/top, light at left/bottom with lighter corners
      return "radial-gradient(ellipse 120% 100% at 80% 20%, rgba(32, 120, 255, 1) 0%, rgba(32, 120, 255, 0.8) 30%, rgba(32, 120, 255, 0.5) 50%, rgba(199, 210, 253, 0.2) 70%, rgba(199, 210, 253, 0.08) 100%)";
    }
    return "rgba(199, 211, 253, 1)"; // Card 3: Light purple
  };
  return (
    <div
      className={cn(
        "relative rounded-xl p-3 md:p-5 pb-3 border transition-all duration-300 flex flex-col w-full h-full overflow-hidden",
        plan.isPopular ? "border-blue-200 lg:scale-105 z-10" : "border-gray-200"
      )}
      style={{
        ...getCardStyle(),
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? (plan.isPopular ? "translateY(0) lg:scale(1.05)" : "translateY(0)") : "translateY(20px)",
        transition: `opacity 0.6s ease-out ${index * 0.15}s, transform 0.6s ease-out ${index * 0.15}s`,
      }}
    >
      {/* Gradient Overlay - Right Corner with Blur */}
      <div
        className='absolute pointer-events-none z-0'
        style={{
          top: index === 1 ? "clamp(-20px, -3vw, -30px)" : "clamp(-30px, -4vw, -40px)",
          right: index === 1 ? "clamp(-20px, -3vw, -40px)" : "clamp(-40px, -6vw, -90px)",
          left: index === 1 ? "clamp(-10%, 0vw, 0%)" : "clamp(5%, 12vw, 0%)",
          width: index === 1 ? "clamp(220px, 50vw, 550px)" : "clamp(180px, 35vw, 450px)",
          height: index === 1 ? "clamp(180px, 30vw, 280px)" : "clamp(140px, 20vw, 220px)",
          background: getGradientColor(),
          backdropFilter: index === 1 ? "blur(30px)" : "blur(50px)",
          WebkitBackdropFilter: index === 1 ? "blur(30px)" : "blur(50px)",
          filter: index === 1 ? "blur(30px)" : "blur(50px)",
          opacity: index === 1 ? 50 : 0.8,
          borderRadius: index === 1 ? "0 0 0 clamp(60px, 10vw, 100px)" : "0 0 0 clamp(60px, 10vw, 100px)",
        }}
      />

      {/* W Shape with Stars - Only for popular card */}
      {plan.isPopular && (
        <div className='absolute pointer-events-none z-10 top-0 right-8'>
          <WShapeWithStars />
        </div>
      )}

      {/* Icon and Badge Container */}
      <div className='relative mb-3 xs:mb-3.5 sm:mb-4 md:mb-5 z-10 flex items-center justify-between'>
        {/* Icon */}
        <div className='w-10 h-10 xs:w-11 xs:h-11 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-lg flex items-center justify-center shrink-0'>
          {plan.icon}
        </div>

        {/* Most Popular Badge - Aligned with Icon */}
        {plan.isPopular && (
          <div className='px-2 py-0.5 xs:px-2.5 xs:py-0.5 sm:px-3 sm:py-1 rounded-full border border-white/50 bg-white/30 backdrop-blur-sm text-white text-[10px] xs:text-xs sm:text-sm font-normal z-20 whitespace-nowrap'>
            Most Popular
          </div>
        )}
      </div>

      {/* Title */}
      <h3
        className='text-gray-900 mb-2 xs:mb-2.5 sm:mb-3 relative z-10'
        style={{
          fontFamily: "var(--font-nunito-sans), sans-serif",
          fontWeight: 500,
          fontStyle: "normal",
          fontSize: "clamp(16px, 3.5vw, 28px)",
          lineHeight: "120%",
          letterSpacing: "0%",
          textAlign: "left",
        }}
      >
        {plan.name}
      </h3>

      {/* Description */}
      <p
        className='mb-3 xs:mb-4 sm:mb-5 md:mb-6 relative z-10'
        style={{
          fontFamily: "var(--font-urbanist), sans-serif",
          fontWeight: 400,
          fontStyle: "normal",
          fontSize: "clamp(13px, 2.2vw, 16px)",
          lineHeight: "clamp(16px, 3vw, 24px)",
          letterSpacing: "0%",
          color: "rgba(98, 98, 98, 1)",
          textAlign: "left",
        }}
      >
        {plan.description}
      </p>

      {/* Price */}
      <div className='mb-3 xs:mb-4 sm:mb-5 md:mb-6 flex flex-col items-start justify-start relative z-10'>
        <div className='flex items-baseline gap-0.5 xs:gap-1'>
          <span
            style={{
              fontFamily: "var(--font-nunito-sans), sans-serif",
              fontWeight: 500,
              fontStyle: "normal",
              fontSize: "clamp(14px, 2vw, 16px)",
              lineHeight: "120%",
              letterSpacing: "0%",
              color: "rgba(98, 98, 98, 1)",
            }}
          >
            {currencySymbol}
          </span>
          <span
            style={{
              fontFamily: "var(--font-nunito-sans), sans-serif",
              fontWeight: 500,
              fontStyle: "normal",
              fontSize: "clamp(22px, 3.5vw, 36px)",
              lineHeight: "120%",
              letterSpacing: "0%",
              color: "rgba(98, 98, 98, 1)",
            }}
          >
            {plan.price}
          </span>
          <span
            style={{
              fontFamily: "var(--font-urbanist), sans-serif",
              fontWeight: 400,
              fontStyle: "normal",
              fontSize: "clamp(12px, 2vw, 16px)",
              lineHeight: "24px",
              letterSpacing: "0%",
              color: "rgba(98, 98, 98, 1)",
            }}
          >
            / {getBillingLabel(billingCycleMonths)}
          </span>
        </div>
        {/* Show monthly equivalent for non-monthly plans */}
        {billingCycleMonths > 1 && (
          <span
            className='mt-1'
            style={{
              fontFamily: "var(--font-urbanist), sans-serif",
              fontWeight: 400,
              fontSize: "clamp(11px, 1.8vw, 14px)",
              color: "rgba(34, 197, 94, 1)",
            }}
          >
            {currencySymbol}
            {monthlyEquivalent.toFixed(2)}/month
          </span>
        )}
      </div>

      {/* CTA Button */}
      <button
        onClick={handleGetStarted}
        className={cn(
          "w-full py-2.5 xs:py-3 sm:py-3 md:py-3.5 px-4 xs:px-5 sm:px-5 md:px-6 rounded-full font-semibold text-xs xs:text-sm sm:text-sm md:text-base transition-all duration-300 mb-3 xs:mb-4 sm:mb-5 md:mb-6 cursor-pointer active:scale-[0.98]",
          plan.buttonVariant === "gradient"
            ? "text-white md:hover:scale-[1.02]"
            : plan.buttonVariant === "outline"
            ? "bg-blue-100/30 border border-gray-300/40 text-gray-900 md:hover:bg-blue-200/50"
            : "bg-blue-100/30 border border-gray-300/40 text-gray-900 md:hover:bg-blue-200/50"
        )}
        style={{
          fontFamily: "var(--font-urbanist), sans-serif",
          fontWeight: 600,
          ...(plan.buttonVariant === "gradient"
            ? {
                background: "rgba(1, 1, 12, 1)",
                boxShadow: `
                  0px 1px 1px 0px rgba(0, 0, 0, 0.18),
                  0px 2px 2.8px 0px rgba(0, 0, 0, 0.44),
                  0px 5px 12.8px 0px rgba(0, 0, 0, 0.49),
                  0px -5px 11.5px 0px rgba(255, 255, 255, 0.5) inset
                `,
              }
            : {}),
        }}
      >
        {plan.buttonText}
      </button>

      {/* Features List */}
      <div className='space-y-2 xs:space-y-2.5 sm:space-y-2.5 md:space-y-3 flex-1 flex flex-col'>
        <p
          className='text-gray-900 font-semibold text-xs xs:text-sm sm:text-sm md:text-base mb-2 xs:mb-2.5 sm:mb-3'
          style={{
            fontFamily: "var(--font-nunito-sans), sans-serif",
            fontWeight: 600,
          }}
        >
          What's Included
        </p>
        <ul className='space-y-2 xs:space-y-2.5 sm:space-y-2.5 md:space-y-3 flex-1'>
          {plan.features.map((feature, idx) => (
            <li key={idx} className='flex items-start gap-2 xs:gap-2.5 sm:gap-2.5'>
              <svg
                className='w-4 h-4 xs:w-5 xs:h-5 sm:w-6 sm:h-6 shrink-0 mt-0.5 xs:mt-1'
                viewBox='0 0 22 22'
                fill='none'
                xmlns='http://www.w3.org/2000/svg'
              >
                <rect width={22} height={22} rx={11} fill='#EDF1FF' />
                <path
                  d='M16.5837 7C16.2503 6.66667 15.7503 6.66667 15.417 7L9.16699 13.25L6.58366 10.6667C6.25033 10.3333 5.75033 10.3333 5.41699 10.6667C5.08366 11 5.08366 11.5 5.41699 11.8333L8.58366 15C8.75033 15.1667 8.91699 15.25 9.16699 15.25C9.41699 15.25 9.58366 15.1667 9.75033 15L16.5837 8.16667C16.917 7.83333 16.917 7.33333 16.5837 7Z'
                  fill='#6468F0'
                />
              </svg>
              <span
                style={{
                  fontFamily: "var(--font-urbanist), sans-serif",
                  fontWeight: 400,
                  fontStyle: "normal",
                  fontSize: "clamp(13px, 2.2vw, 16px)",
                  lineHeight: "clamp(16px, 3vw, 24px)",
                  letterSpacing: "0%",
                  color: "rgba(98, 98, 98, 1)",
                }}
              >
                {feature}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default memo(PricingCard);
