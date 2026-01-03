"use client";

import React, { useRef } from "react";
import { ShoppingCart, Zap, Shield, TrendingUp, Users, Globe, BarChart3, CreditCard } from "lucide-react";
import { cn } from "@/utils";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export interface Benefit {
  id: string;
  icon: React.ElementType;
  title: string;
  description: string;
  gradient: string;
  iconBg: string;
}

const defaultBenefits: Benefit[] = [
  {
    id: "1",
    icon: ShoppingCart,
    title: "Easy Store Management",
    description: "Manage your entire store from one intuitive dashboard. Add products, track inventory, and process orders effortlessly.",
    gradient: "from-blue-50 to-indigo-50",
    iconBg: "bg-linear-to-br from-[#0448FD] to-[#0038d4]",
  },
  {
    id: "2",
    icon: Zap,
    title: "Lightning Fast Performance",
    description: "Built for speed with optimized infrastructure that ensures your store loads instantly and keeps customers engaged.",
    gradient: "from-purple-50 to-pink-50",
    iconBg: "bg-linear-to-br from-purple-500 to-pink-500",
  },
  {
    id: "3",
    icon: Shield,
    title: "Secure & Reliable",
    description: "Enterprise-grade security with SSL encryption, secure payments, and regular backups to protect your business.",
    gradient: "from-green-50 to-emerald-50",
    iconBg: "bg-linear-to-br from-green-500 to-emerald-500",
  },
  {
    id: "4",
    icon: TrendingUp,
    title: "Scale Your Business",
    description: "Grow without limits. Our platform scales with you, handling everything from small shops to enterprise stores.",
    gradient: "from-orange-50 to-amber-50",
    iconBg: "bg-linear-to-br from-orange-500 to-amber-500",
  },
  {
    id: "5",
    icon: Users,
    title: "Customer Management",
    description: "Build lasting relationships with advanced CRM tools, customer profiles, and personalized shopping experiences.",
    gradient: "from-cyan-50 to-blue-50",
    iconBg: "bg-linear-to-br from-cyan-500 to-blue-500",
  },
  {
    id: "6",
    icon: Globe,
    title: "Multi-Channel Selling",
    description: "Sell everywhere your customers are. Integrate with marketplaces, social media, and physical stores seamlessly.",
    gradient: "from-violet-50 to-purple-50",
    iconBg: "bg-linear-to-br from-violet-500 to-purple-500",
  },
  {
    id: "7",
    icon: BarChart3,
    title: "Advanced Analytics",
    description: "Make data-driven decisions with comprehensive analytics, sales reports, and customer insights at your fingertips.",
    gradient: "from-red-50 to-rose-50",
    iconBg: "bg-linear-to-br from-red-500 to-rose-500",
  },
  {
    id: "8",
    icon: CreditCard,
    title: "Flexible Payments",
    description: "Accept payments from customers worldwide with support for multiple payment gateways and currencies.",
    gradient: "from-teal-50 to-cyan-50",
    iconBg: "bg-linear-to-br from-teal-500 to-cyan-500",
  },
];

interface PlatformBenefitsProps {
  title?: string;
  subtitle?: string;
  benefits?: Benefit[];
  columns?: 2 | 3 | 4;
  showHeader?: boolean;
  className?: string;
}

export default function PlatformBenefits({
  title = "Why Choose Our Platform",
  subtitle = "Everything you need to build, grow, and scale your online store successfully.",
  benefits = defaultBenefits,
  columns = 4,
  showHeader = true,
  className = "",
}: PlatformBenefitsProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<(HTMLDivElement | null)[]>([]);

  const gridCols = {
    2: "md:grid-cols-2",
    3: "md:grid-cols-3",
    4: "md:grid-cols-2 lg:grid-cols-4",
  };

  useGSAP(
    () => {
      if (!sectionRef.current) return;

      // Clean fade-up for header
      if (showHeader && headerRef.current) {
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

      // Clean fade-up for cards
      cardsRef.current.forEach((card, index) => {
        if (!card) return;
        gsap.fromTo(
          card,
          { opacity: 0, y: 25 },
          {
            opacity: 1,
            y: 0,
            duration: 0.5,
            ease: "power3.out",
            delay: index * 0.05,
            scrollTrigger: {
              trigger: card,
              start: "top 90%",
              toggleActions: "play none none none",
            },
          }
        );
      });
    },
    { scope: sectionRef }
  );

  return (
    <section ref={sectionRef} className={cn("w-full py-6 sm:py-8 md:py-10 bg-white", className)}>
      <div className='max-w-7xl mx-auto px-3'>
        {/* Header */}
        {showHeader && (
          <div ref={headerRef} className='mb-6 sm:mb-8 md:mb-10 text-center'>
            <h2
              className='text-gray-900 font-semibold mb-2 text-lg sm:text-xl md:text-2xl lg:text-3xl'
              style={{
                fontFamily: "var(--font-nunito-sans)",
                fontWeight: 600,
                lineHeight: "120%",
                letterSpacing: "-0.02em",
              }}
            >
              {title}
            </h2>
            {subtitle && (
              <p
                className='text-gray-600 max-w-2xl mx-auto text-xs sm:text-sm'
                style={{
                  fontFamily: "var(--font-urbanist)",
                  fontWeight: 400,
                  lineHeight: "1.5",
                }}
              >
                {subtitle}
              </p>
            )}
          </div>
        )}

        {/* Benefits Grid */}
        <div className={cn("grid grid-cols-1 gap-3 sm:gap-4", gridCols[columns])}>
          {benefits.map((benefit, index) => {
            const Icon = benefit.icon;
            return (
              <div
                key={benefit.id}
                ref={(el) => {
                  cardsRef.current[index] = el;
                }}
                className='group relative p-4 sm:p-5 rounded-lg border border-gray-200/60 hover:border-[#0448FD]/40 bg-white hover:bg-gray-50/50 transition-all duration-200'
              >
                {/* Content */}
                <div className='flex items-start gap-3 sm:gap-4'>
                  {/* Icon */}
                  <div
                    className={cn(
                      "w-10 h-10 sm:w-11 sm:h-11 rounded-lg flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-105",
                      benefit.iconBg
                    )}
                  >
                    <Icon className='w-5 h-5 sm:w-6 sm:h-6 text-white' />
                  </div>

                  {/* Text Content */}
                  <div className='flex-1 min-w-0'>
                    <h3
                      className='text-sm sm:text-base font-semibold text-gray-900 mb-1.5 group-hover:text-[#0448FD] transition-colors duration-200'
                      style={{
                        fontFamily: "var(--font-urbanist), sans-serif",
                        fontWeight: 600,
                        lineHeight: "1.4",
                      }}
                    >
                      {benefit.title}
                    </h3>
                    <p
                      className='text-xs sm:text-sm text-gray-600 leading-relaxed'
                      style={{
                        fontFamily: '"Segoe UI", system-ui, -apple-system, sans-serif',
                        lineHeight: "1.5",
                      }}
                    >
                      {benefit.description}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
