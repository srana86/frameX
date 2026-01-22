"use client";

import React, { useRef } from "react";
import { Users, TrendingUp, Globe, Zap } from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

interface Stat {
  id: string;
  number: string;
  label: string;
  icon: React.ElementType;
}

const stats: Stat[] = [
  {
    id: "1",
    number: "10K+",
    label: "Active Stores",
    icon: Users,
  },
  {
    id: "2",
    number: "50+",
    label: "Countries",
    icon: Globe,
  },
  {
    id: "3",
    number: "99.9%",
    label: "Uptime",
    icon: Zap,
  },
  {
    id: "4",
    number: "24/7",
    label: "Support",
    icon: TrendingUp,
  },
];

export default function StatsSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const statsRef = useRef<(HTMLDivElement | null)[]>([]);
  const numberRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Helper function to parse number from string
  const parseNumber = (numStr: string): { value: number; suffix: string } => {
    // Handle "10K+" format
    if (numStr.includes("K+")) {
      const num = parseFloat(numStr.replace("K+", ""));
      return { value: num * 1000, suffix: "K+" };
    }
    // Handle "50+" format
    if (numStr.endsWith("+")) {
      const num = parseFloat(numStr.replace("+", ""));
      return { value: num, suffix: "+" };
    }
    // Handle "99.9%" format
    if (numStr.endsWith("%")) {
      const num = parseFloat(numStr.replace("%", ""));
      return { value: num, suffix: "%" };
    }
    // Handle "24/7" - return as is (no animation)
    if (numStr.includes("/")) {
      return { value: 0, suffix: numStr };
    }
    return { value: parseFloat(numStr) || 0, suffix: "" };
  };

  // Helper function to format number with suffix
  const formatNumber = (value: number, suffix: string): string => {
    if (suffix === "K+") {
      const kValue = value / 1000;
      return `${kValue.toFixed(kValue >= 10 ? 0 : 1)}${suffix}`;
    }
    if (suffix === "+") {
      return `${Math.floor(value)}${suffix}`;
    }
    if (suffix === "%") {
      return `${value.toFixed(1)}${suffix}`;
    }
    if (suffix.includes("/")) {
      return suffix; // Return as is for "24/7"
    }
    return `${Math.floor(value)}${suffix}`;
  };

  useGSAP(
    () => {
      if (!sectionRef.current) return;

      // Clean fade-up for stats cards
      statsRef.current.forEach((stat, index) => {
        if (!stat) return;
        gsap.fromTo(
          stat,
          { opacity: 0, y: 25 },
          {
            opacity: 1,
            y: 0,
            duration: 0.5,
            ease: "power3.out",
            delay: index * 0.08,
            scrollTrigger: {
              trigger: stat,
              start: "top 90%",
              toggleActions: "play none none none",
            },
          }
        );
      });

      // Animate numbers counting up
      numberRefs.current.forEach((numberEl, index) => {
        if (!numberEl) return;
        const stat = stats[index];
        const { value, suffix } = parseNumber(stat.number);

        // Skip animation for "24/7" format
        if (suffix.includes("/")) {
          return;
        }

        const obj = { count: 0 };
        gsap.to(obj, {
          count: value,
          duration: 1.5,
          ease: "power3.out",
          delay: 0.2 + index * 0.1,
          scrollTrigger: {
            trigger: statsRef.current[index],
            start: "top 90%",
            toggleActions: "play none none none",
          },
          onUpdate: () => {
            if (numberEl) {
              numberEl.textContent = formatNumber(obj.count, suffix);
            }
          },
        });
      });
    },
    { scope: sectionRef }
  );

  return (
    <div ref={sectionRef} className='mb-12 sm:mb-16 md:mb-20'>
      <div className='bg-linear-to-br from-gray-50 to-blue-50 rounded-2xl p-6 sm:p-8 md:p-10 border border-gray-200'>
        <div className='grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 md:gap-8'>
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.id}
                ref={(el) => {
                  statsRef.current[index] = el;
                }}
                className='text-center'
              >
                <div className='flex justify-center mb-3'>
                  <div className='w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-linear-to-br from-[#0448FD] to-[#0038d4] flex items-center justify-center shadow-md'>
                    <Icon className='w-6 h-6 sm:w-7 sm:h-7 text-white' />
                  </div>
                </div>
                <div
                  ref={(el) => {
                    numberRefs.current[index] = el;
                  }}
                  className='text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-1'
                  style={{
                    fontFamily: "var(--font-urbanist), sans-serif",
                    fontWeight: 700,
                  }}
                >
                  {(() => {
                    // Initialize display value - show 0 for animated numbers, original for 24/7
                    if (stat.number.includes("/")) {
                      return stat.number;
                    }
                    const { suffix } = parseNumber(stat.number);
                    return formatNumber(0, suffix);
                  })()}
                </div>
                <p
                  className='text-xs sm:text-sm text-gray-600'
                  style={{
                    fontFamily: '"Segoe UI", system-ui, -apple-system, sans-serif',
                  }}
                >
                  {stat.label}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
