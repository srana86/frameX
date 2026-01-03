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
    label: "Active Subscriptions",
  },
  {
    value: 500,
    suffix: "K+",
    label: "Monthly Revenue",
  },
  {
    value: 2500,
    suffix: "+",
    label: "Active Stores",
  },
  {
    value: 95,
    suffix: "%",
    label: "Satisfaction Rate",
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
    <div ref={sectionRef} className='w-full'>
      <div className='max-w-7xl mx-auto px-3'>
        <div className='grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3'>
          {stats.map((stat, idx) => {
            // Make all cards bigger (span 2 columns on large screens)
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
      }, index * 80);
      return () => clearTimeout(timer);
    }
  }, [isVisible, index]);

  const formatNumber = (num: number): string => {
    if (num >= 1000) {
      return (num / 1000).toFixed(num % 1000 === 0 ? 0 : 1) + "K";
    }
    return num.toString();
  };

  return (
    <div
      className='bg-white rounded-lg border border-gray-200 px-3 sm:px-4 py-6 md:py-8 text-center'
      style={{
        opacity: cardVisible ? 1 : 0,
        transform: cardVisible ? "translateY(0)" : "translateY(20px)",
        transition: `opacity 0.5s ease-out ${index * 0.08}s, transform 0.5s ease-out ${index * 0.08}s`,
      }}
    >
      {/* Number */}
      <div className='mb-1'>
        <span className='text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 tabular-nums'>{formatNumber(animatedValue)}</span>
        <span className='text-base sm:text-lg md:text-xl font-bold text-gray-900'>{stat.suffix}</span>
      </div>

      {/* Label */}
      <p className='text-xs sm:text-sm text-gray-600 font-medium'>{stat.label}</p>
    </div>
  );
}
