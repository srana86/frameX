"use client";

import React, { memo, useCallback, useState, useEffect } from "react";
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
  const [isLargeScreen, setIsLargeScreen] = useState(false);

  // Pre-compute conditional values once
  const isMiddleCard = index === 1;
  const isPopular = plan.isPopular ?? false;
  const isPrimaryButton = isMiddleCard || isPopular;

  useEffect(() => {
    const checkScreenSize = () => {
      setIsLargeScreen(window.innerWidth >= 1024); // lg breakpoint
    };

    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);
    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  const handleGetStarted = useCallback(() => {
    router.push(`/checkout?plan=${plan.id}&cycle=${billingCycleMonths}`);
  }, [router, plan.id, billingCycleMonths]);

  // Pre-compute card style object
  const cardStyle = {
    background: "rgba(255, 255, 255, 1)",
    boxShadow: `
      0px 2px 4px 0px rgba(0, 0, 0, 0.02),
      0px 6px 60px 0px rgba(103, 103, 103, 0.1)
    `,
  };

  // Pre-compute gradient color based on index
  const gradientColor = isMiddleCard
    ? "radial-gradient(ellipse 120% 100% at 80% 20%, rgba(32, 120, 255, 1) 0%, rgba(32, 120, 255, 0.8) 30%, rgba(32, 120, 255, 0.5) 50%, rgba(199, 210, 253, 0.2) 70%, rgba(199, 210, 253, 0.08) 100%)"
    : "rgba(199, 211, 253, 1)";

  // Pre-compute gradient overlay left position
  const gradientLeft = isMiddleCard ? (isLargeScreen ? "clamp(-10%, 0vw, 0%)" : "clamp(40%, 50vw, 0%)") : "clamp(5%, 12vw, 0%)";

  // Pre-compute gradient overlay styles
  const gradientOverlayStyles = {
    top: isMiddleCard ? "clamp(-20px, -3vw, -30px)" : "clamp(-30px, -4vw, -40px)",
    right: isMiddleCard ? "clamp(-20px, -3vw, -40px)" : "clamp(-40px, -6vw, -90px)",
    left: gradientLeft,
    width: isMiddleCard ? "clamp(220px, 50vw, 550px)" : "clamp(180px, 35vw, 450px)",
    height: isMiddleCard ? "clamp(180px, 30vw, 280px)" : "clamp(140px, 20vw, 220px)",
    background: gradientColor,
    backdropFilter: isMiddleCard ? "blur(30px)" : "blur(50px)",
    WebkitBackdropFilter: isMiddleCard ? "blur(30px)" : "blur(50px)",
    filter: isMiddleCard ? "blur(30px)" : "blur(50px)",
    opacity: isMiddleCard ? 50 : 0.8,
    borderRadius: "0 0 0 clamp(60px, 10vw, 100px)",
  };

  // Pre-compute transform value
  const transformValue = isVisible ? (isPopular ? "translateY(0) lg:scale(1.05)" : "translateY(0)") : "translateY(20px)";

  // Pre-compute button styles
  const buttonShadowStyles = isPrimaryButton
    ? {
        boxShadow: `
          0px 1px 1px 0px rgba(4, 72, 253, 0.18),
          0px 2px 2.8px 0px rgba(4, 72, 253, 0.44),
          0px 5px 12.8px 0px rgba(4, 72, 253, 0.49),
          0px 14px 10.6px 0px rgba(4, 72, 253, 0.18),
          0px -5px 11.1px 0px rgba(255, 255, 255, 0.52) inset,
          0px 1px 12.4px 0px rgba(4, 72, 253, 0.2)
        `,
        transition: "all 0.3s ease-in-out",
      }
    : {};
  return (
    <div
      className={cn(
        "relative rounded-xl p-3 md:p-5 pb-3 border transition-all duration-300 flex flex-col w-full h-full overflow-hidden",
        isPopular ? "border-blue-200 lg:scale-105 z-10" : "border-gray-200"
      )}
      style={{
        ...cardStyle,
        opacity: isVisible ? 1 : 0,
        transform: transformValue,
        transition: `opacity 0.6s ease-out ${index * 0.15}s, transform 0.6s ease-out ${index * 0.15}s`,
      }}
    >
      {/* Gradient Overlay - Right Corner with Blur */}
      <div className='absolute pointer-events-none z-0' style={gradientOverlayStyles} />

      {/* W Shape with Stars - Only for popular card */}
      {isPopular && (
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
        {isPopular && (
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
          fontSize: "clamp(18px, 4.8vw, 30px)",
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
          fontSize: "clamp(14px, 3.2vw, 18px)",
          lineHeight: "clamp(18px, 3.8vw, 26px)",
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
            className='text-lg sm:text-xl'
            style={{
              fontFamily: "var(--font-nunito-sans), sans-serif",
              fontWeight: 500,
              fontStyle: "normal",
              lineHeight: "120%",
              letterSpacing: "0%",
              color: "#111827",
            }}
          >
            {currencySymbol}
          </span>
          <span
            className='text-4xl sm:text-5xl md:text-6xl lg:text-4xl'
            style={{
              fontFamily: "var(--font-nunito-sans), sans-serif",
              fontWeight: 700,
              fontStyle: "normal",
              lineHeight: "120%",
              letterSpacing: "-0.02em",
              color: "#111827",
            }}
          >
            {plan.price}
          </span>
          <span
            className='text-base sm:text-lg'
            style={{
              fontFamily: "var(--font-urbanist), sans-serif",
              fontWeight: 400,
              fontStyle: "normal",
              lineHeight: "24px",
              letterSpacing: "0%",
              color: "#111827",
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
              color: "rgb(21, 128, 61)",
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
          "w-full h-[52px] sm:h-[54px] md:h-[56px] lg:h-[58px] px-4 xs:px-5 sm:px-5 md:px-6 rounded-full font-semibold text-sm xs:text-base sm:text-base md:text-lg transition-all duration-300 mb-3 xs:mb-4 sm:mb-5 md:mb-6 cursor-pointer active:scale-[0.98] flex items-center justify-center",
          isPrimaryButton
            ? "text-white bg-[#0448FD] hover:bg-[#0548FD] md:hover:scale-[1.02] transform group overflow-hidden"
            : "bg-blue-100/30 border border-gray-300/40 text-gray-900 md:hover:bg-blue-200/50"
        )}
        style={{
          fontFamily: "var(--font-urbanist), sans-serif",
          fontWeight: 600,
          ...buttonShadowStyles,
        }}
      >
        {plan.buttonText}
      </button>

      {/* Features List */}
      <div className='space-y-2 xs:space-y-2.5 sm:space-y-2.5 md:space-y-3 flex-1 flex flex-col'>
        <p
          className='text-gray-900 font-semibold text-sm xs:text-base sm:text-base md:text-lg mb-2 xs:mb-2.5 sm:mb-3'
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
                  fontSize: "clamp(14px, 3.1vw, 17px)",
                  lineHeight: "clamp(18px, 3.6vw, 26px)",
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
