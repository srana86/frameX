"use client";

import React, { useRef } from "react";
import { Target, Eye, Heart, Award } from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

interface Value {
  id: string;
  icon: React.ElementType;
  title: string;
  description: string;
}

const values: Value[] = [
  {
    id: "1",
    icon: Target,
    title: "Mission-Driven",
    description: "We're committed to empowering businesses of all sizes with powerful e-commerce solutions.",
  },
  {
    id: "2",
    icon: Eye,
    title: "Vision",
    description: "To become the leading platform that makes online selling accessible to everyone worldwide.",
  },
  {
    id: "3",
    icon: Heart,
    title: "Customer First",
    description: "Your success is our success. We prioritize your needs and work tirelessly to exceed expectations.",
  },
  {
    id: "4",
    icon: Award,
    title: "Excellence",
    description: "We strive for excellence in everything we do, from product development to customer support.",
  },
];

export default function ValuesSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const valuesRef = useRef<(HTMLDivElement | null)[]>([]);

  useGSAP(
    () => {
      if (!sectionRef.current) return;

      // Clean fade-up for values
      valuesRef.current.forEach((value, index) => {
        if (!value) return;
        gsap.fromTo(
          value,
          { opacity: 0, y: 25 },
          {
            opacity: 1,
            y: 0,
            duration: 0.5,
            ease: "power3.out",
            delay: index * 0.08,
            scrollTrigger: {
              trigger: value,
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
    <div ref={sectionRef} className='mb-12 sm:mb-16 md:mb-20'>
      <div className='mb-8 sm:mb-10 md:mb-12 text-center'>
        <h2
          className='text-2xl sm:text-3xl md:text-4xl font-semibold text-gray-900 mb-3'
          style={{
            fontFamily: "var(--font-nunito-sans)",
            fontWeight: 600,
            lineHeight: "120%",
            letterSpacing: "-0.02em",
          }}
        >
          Our Values
        </h2>
        <p
          className='text-sm sm:text-base text-gray-600 max-w-2xl mx-auto'
          style={{
            fontFamily: "var(--font-urbanist)",
            lineHeight: "1.5",
          }}
        >
          The principles that guide everything we do
        </p>
      </div>

      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5'>
        {values.map((value, index) => {
          const Icon = value.icon;
          return (
            <div
              key={value.id}
              ref={(el) => {
                valuesRef.current[index] = el;
              }}
              className='group relative p-4 sm:p-5 rounded-lg border border-gray-200 hover:border-[#0448FD]/40 bg-white hover:bg-gray-50/50 transition-all duration-200'
            >
              <div className='flex items-start gap-3 sm:gap-4'>
                <div className='w-10 h-10 sm:w-11 sm:h-11 rounded-lg bg-linear-to-br from-[#0448FD] to-[#0038d4] flex items-center justify-center shrink-0 shadow-sm group-hover:shadow-md transition-all duration-200 group-hover:scale-105'>
                  <Icon className='w-5 h-5 sm:w-6 sm:h-6 text-white' />
                </div>
                <div className='flex-1 min-w-0'>
                  <h3
                    className='text-sm sm:text-base font-semibold text-gray-900 mb-1.5 group-hover:text-[#0448FD] transition-colors duration-200'
                    style={{
                      fontFamily: "var(--font-urbanist), sans-serif",
                      fontWeight: 600,
                      lineHeight: "1.4",
                    }}
                  >
                    {value.title}
                  </h3>
                  <p
                    className='text-xs sm:text-sm text-gray-600 leading-relaxed'
                    style={{
                      fontFamily: '"Segoe UI", system-ui, -apple-system, sans-serif',
                      lineHeight: "1.5",
                    }}
                  >
                    {value.description}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
