"use client";

import React, { useRef, useState, useEffect } from "react";
import SectionHeader from "../../../shared/SectionHeader";
import TestimonialCard, { type Testimonial } from "./TestimonialCard";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

const testimonials: Testimonial[] = [
  {
    id: "1",
    quote: "matched my skills instead of random listings. It felt like having a personal career coach.",
    name: "Juwel Ahamed",
    title: "UX Designer",
    rating: 5,
  },
  {
    id: "2",
    quote:
      "We were spending hours manually filtering candidates. After switching to this platform, everything became faster — from outreach to final hiring decisions. Importing past applications saved so much time. Absolutely worth it.",
    name: "Sabbir Hasan",
    title: "Hiring Manager",
    rating: 5,
  },
  {
    id: "3",
    quote:
      "Customer support actually listens here. I suggested a feature and they added it within a week. The platform feels human, not robotic - even though it's AI-driven.",
    name: "Juwel Ahamed",
    title: "UX Designer",
    rating: 5,
  },
  {
    id: "4",
    quote: "interview tips to company insights - it felt like I had a personal coach.",
    name: "Mahadi Miraj",
    title: "Junior Architect",
    rating: 5,
  },
  {
    id: "5",
    quote:
      "Got hired without writing a single cover letter. I hate writing cover letters. This system automatically generated mine based on my skills and portfolio. I went from 0 replies to 5 interview calls in one week. It saved me time and stress.",
    name: "Fivro Studio",
    title: "Design Agency",
    rating: 5,
  },
  {
    id: "6",
    quote: "Never thought AI could understand my career goals better than I could.",
    name: "Olivia Chan",
    title: "Product Strategist",
    rating: 5,
  },
];

export default function TestimonialContainer() {
  const sectionRef = useRef<HTMLElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);

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
    <section ref={sectionRef} className='w-full py-12 sm:py-16 md:py-20 lg:py-24 bg-white'>
      <div className='max-w-7xl mx-auto px-3'>
        {/* Header */}
        <div ref={headerRef} className='mb-12 sm:mb-16 md:mb-20'>
          <SectionHeader
            title='Trusted by Thousands of Job Seekers'
            subtitle='Over 10,000 professionals have landed their dream careers faster using our AI-powered platform — built to match you with the right opportunity at the right time.'
          />
        </div>

        {/* Testimonials Grid */}
        <div className='relative'>
          {/* Top White Gradient - White to Transparent */}
          <div
            className='absolute top-0 left-0 right-0 h-24 z-10 pointer-events-none'
            style={{
              background: "linear-gradient(to bottom, rgba(255, 255, 255, 1) 0%, rgba(255, 255, 255, 0) 100%)",
            }}
          />

          {/* Bottom White Gradient - Transparent to White */}
          <div
            className='absolute bottom-0 left-0 right-0 h-24 z-10 pointer-events-none'
            style={{
              background: "linear-gradient(to top, rgba(255, 255, 255, 1) 0%, rgba(255, 255, 255, 0) 100%)",
            }}
          />

          {/* Mobile/Tablet Grid - Static */}
          <div className='grid grid-cols-1 md:grid-cols-2 lg:hidden gap-6 sm:gap-8 relative z-0'>
            {testimonials.map((testimonial, index) => (
              <TestimonialCard key={testimonial.id} testimonial={testimonial} index={index} isVisible={true} />
            ))}
          </div>

          {/* Large Device - Vertical Slider Grid with 3 Columns */}
          <div className='hidden lg:grid lg:grid-cols-3 gap-6 sm:gap-8 relative z-0'>
            {[0, 1, 2].map((columnIndex) => {
              // Split testimonials into 3 columns
              const columnTestimonials = testimonials.filter((_, index) => index % 3 === columnIndex);
              // Duplicate testimonials for infinite scroll effect
              const duplicatedTestimonials = [...columnTestimonials, ...columnTestimonials];

              return (
                <TestimonialColumn key={columnIndex} columnIndex={columnIndex} testimonials={duplicatedTestimonials} isVisible={true} />
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

// Separate component for each column to manage hover state
function TestimonialColumn({
  columnIndex,
  testimonials,
  isVisible,
}: {
  columnIndex: number;
  testimonials: Testimonial[];
  isVisible: boolean;
}) {
  const [isHovered, setIsHovered] = useState(false);
  const sliderRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<gsap.core.Tween | null>(null);

  useGSAP(
    () => {
      if (!sliderRef.current) return;

      const duration = 15 + columnIndex * 2;
      const delay = columnIndex * 2;

      animationRef.current = gsap.to(sliderRef.current, {
        y: "-50%",
        duration: duration,
        ease: "none",
        repeat: -1,
        delay: delay,
      });
    },
    { scope: sliderRef }
  );

  // Pause/resume on hover
  React.useEffect(() => {
    if (animationRef.current) {
      if (isHovered) {
        animationRef.current.pause();
      } else {
        animationRef.current.resume();
      }
    }
  }, [isHovered]);

  return (
    <div
      className='relative overflow-hidden'
      style={{ height: "600px" }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        ref={sliderRef}
        className='flex flex-col gap-6 sm:gap-8'
        style={{
          willChange: "transform",
        }}
      >
        {testimonials.map((testimonial, index) => (
          <div key={`${testimonial.id}-${index}`}>
            <TestimonialCard testimonial={testimonial} index={index} isVisible={isVisible} />
          </div>
        ))}
      </div>
    </div>
  );
}
