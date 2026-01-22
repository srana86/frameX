"use client";

import React, { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export default function StorySection() {
  const storyRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      // Clean fade-up for story section
      if (storyRef.current) {
        gsap.fromTo(
          storyRef.current,
          { opacity: 0, y: 30 },
          {
            opacity: 1,
            y: 0,
            duration: 0.7,
            ease: "power3.out",
            scrollTrigger: {
              trigger: storyRef.current,
              start: "top 85%",
              toggleActions: "play none none none",
            },
          }
        );
      }
    },
    { scope: storyRef }
  );

  return (
    <div ref={storyRef} className='mb-12 sm:mb-16 md:mb-20'>
      <div className='max-w-4xl mx-auto'>
        <h2
          className='text-2xl sm:text-3xl md:text-4xl font-semibold text-gray-900 mb-6 sm:mb-8 text-center'
          style={{
            fontFamily: "var(--font-nunito-sans)",
            fontWeight: 600,
            lineHeight: "120%",
            letterSpacing: "-0.02em",
          }}
        >
          Our Story
        </h2>
        <div className='space-y-4 sm:space-y-5'>
          <p
            className='text-sm sm:text-base md:text-lg text-gray-700 leading-relaxed'
            style={{
              fontFamily: '"Segoe UI", system-ui, -apple-system, sans-serif',
              lineHeight: "1.7",
            }}
          >
            FrameX was born from a simple observation: building an online store shouldn't be complicated. In 2020, our founders noticed that
            existing e-commerce platforms were either too expensive, too complex, or lacked the features growing businesses needed.
          </p>
          <p
            className='text-sm sm:text-base md:text-lg text-gray-700 leading-relaxed'
            style={{
              fontFamily: '"Segoe UI", system-ui, -apple-system, sans-serif',
              lineHeight: "1.7",
            }}
          >
            Determined to change this, we set out to create a platform that combines powerful features with simplicity. Today, FrameX powers
            thousands of stores worldwide, helping businesses of all sizes reach their customers and grow their revenue.
          </p>
          <p
            className='text-sm sm:text-base md:text-lg text-gray-700 leading-relaxed'
            style={{
              fontFamily: '"Segoe UI", system-ui, -apple-system, sans-serif',
              lineHeight: "1.7",
            }}
          >
            We're constantly evolving, listening to our customers, and pushing the boundaries of what's possible in e-commerce. Our journey
            is just beginning, and we're excited to have you be part of it.
          </p>
        </div>
      </div>
    </div>
  );
}
