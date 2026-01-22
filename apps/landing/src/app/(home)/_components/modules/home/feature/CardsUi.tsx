"use client";

import React, { useEffect, useState, useRef } from "react";

interface StatCard {
  value: number;
  suffix: string;
  label: string;
}

const stats: StatCard[] = [
  {
    value: 10000,
    suffix: "+",
    label: "Active Tenants",
  },
  {
    value: 830000000,
    suffix: "+",
    label: "Total Revenue (All Tenants)",
  },
  {
    value: 13500,
    suffix: "+",
    label: "Active E-Commerce Stores",
  },
  {
    value: 99,
    suffix: "%",
    label: "Customer Satisfaction",
  },
];

function useCountUp(end: number, duration: number = 2000, start: number = 0): number {
  const [count, setCount] = useState(start);
  const frameRef = useRef<number | undefined>(undefined);
  const startTimeRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    startTimeRef.current = Date.now();
    const animate = () => {
      const now = Date.now();
      const elapsed = now - (startTimeRef.current || now);
      const progress = Math.min(elapsed / duration, 1);

      // Easing function for smooth animation
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      const current = Math.floor(start + (end - start) * easeOutQuart);

      setCount(current);

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animate);
      } else {
        setCount(end);
      }
    };

    frameRef.current = requestAnimationFrame(animate);

    return () => {
      if (frameRef.current !== undefined) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, [end, duration, start]);

  return count;
}

export function CardsUi() {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
          }
        });
      },
      { threshold: 0.1 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => {
      if (sectionRef.current) {
        observer.unobserve(sectionRef.current);
      }
    };
  }, []);

  return (
    <div ref={sectionRef} className='w-full bg-linear-to-l from-[rgba(232,236,253,0.2)] to-[rgba(32,120,255,0.5)]'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 md:py-20'>
        <div className='grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 md:gap-6 lg:gap-8'>
          {stats.map((stat, idx) => {
            return <Card key={idx} stat={stat} index={idx} isVisible={isVisible} />;
          })}
        </div>
      </div>
    </div>
  );
}

function Card({ stat, index, isVisible }: { stat: StatCard; index: number; isVisible: boolean }) {
  const [cardVisible, setCardVisible] = useState(false);
  const animatedValue = useCountUp(cardVisible ? stat.value : 0, 1500, 0);

  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        setCardVisible(true);
      }, index * 100);
      return () => clearTimeout(timer);
    }
  }, [isVisible, index]);

  const formatNumber = (num: number): { value: string; unit: string } => {
    if (num >= 1000000000) {
      const billions = num / 1000000000;
      return {
        value: billions % 1 === 0 ? billions.toFixed(0) : billions.toFixed(1),
        unit: "B",
      };
    } else if (num >= 1000000) {
      const millions = num / 1000000;
      return {
        value: millions % 1 === 0 ? millions.toFixed(0) : millions.toFixed(1),
        unit: "M",
      };
    } else if (num >= 1000) {
      const thousands = num / 1000;
      return {
        value: thousands % 1 === 0 ? thousands.toFixed(0) : thousands.toFixed(1),
        unit: "K",
      };
    }
    return {
      value: num.toString(),
      unit: "",
    };
  };

  const formatted = formatNumber(animatedValue);
  // Combine formatted unit (K/M/B) with original suffix (+, %, etc.)
  const displayUnit = formatted.unit ? `${formatted.unit}${stat.suffix}` : stat.suffix;

  return (
    <div
      className='bg-white rounded-xl border border-gray-200 px-4 sm:px-5 md:px-6 py-6 sm:py-7 md:py-8 text-center'
      style={{
        opacity: cardVisible ? 1 : 0,
        transform: cardVisible ? "translateY(0)" : "translateY(20px)",
        transition: `opacity 0.5s ease-out ${index * 0.1}s, transform 0.5s ease-out ${index * 0.1}s`,
        boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
      }}
    >
      {/* Number with suffix on same line */}
      <div className='mb-3 sm:mb-4'>
        <span
          className='text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 tabular-nums leading-tight inline-block'
          style={{
            fontFamily: "var(--font-nunito-sans), sans-serif",
            fontWeight: 700,
          }}
        >
          {formatted.value}
          {displayUnit && <span className='text-blue-600 ml-0.5'>{displayUnit}</span>}
        </span>
      </div>

      {/* Label */}
      <p
        className='text-xs sm:text-sm md:text-base text-gray-600 font-medium leading-relaxed'
        style={{
          fontFamily: "var(--font-urbanist), sans-serif",
          fontWeight: 500,
        }}
      >
        {stat.label}
      </p>
    </div>
  );
}
