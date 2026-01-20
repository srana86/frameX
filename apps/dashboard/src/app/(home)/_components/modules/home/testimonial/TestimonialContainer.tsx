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
    quote:
      "Started my online store in just 30 minutes. The setup was so simple and affordable. I've already made my first sale within a week! The payment integration worked perfectly.",
    name: "Rashida Begum",
    title: "Fashion Store Owner",
    rating: 5,
    avatar: "/testimonials/rashida.avif",
  },
  {
    id: "2",
    quote:
      "Finally launched my e-commerce business without breaking the bank. Everything I need is included - product management, order tracking, and customer support. My sales have doubled in the first month.",
    name: "Karim Hossain",
    title: "Electronics Merchant",
    rating: 5,
    avatar: "/testimonials/karim.avif",
  },
  {
    id: "3",
    quote:
      "Best investment for my business. The mobile-friendly design helped me reach more customers, and the analytics show exactly what's selling. Customer support responded quickly when I needed help.",
    name: "Fatima Akter",
    title: "Beauty Products Seller",
    rating: 5,
    avatar: "/testimonials/fatima.avif",
  },
  {
    id: "4",
    quote:
      "Uploaded all my products easily with bulk import. Inventory tracking saved me so much time. The store looks professional and my customers love the smooth checkout process.",
    name: "Mahmudul Hasan",
    title: "Home Decor Merchant",
    rating: 5,
    avatar: "/testimonials/mahmudul.avif",
  },
  {
    id: "5",
    quote:
      "I was skeptical at first, but this platform exceeded my expectations. The conversion tracking for Facebook ads helped me optimize my marketing spend. Sales increased by 300% in 2 months.",
    name: "Ayesha Rahman",
    title: "Accessories Store Owner",
    rating: 5,
    avatar: "/testimonials/ayesha.avif",
  },
  {
    id: "6",
    quote:
      "Perfect solution for small businesses like mine. The affordable price made it possible to start online. Now I'm selling to customers nationwide and managing everything from one dashboard.",
    name: "Tarek Ahmed",
    title: "Grocery Store Owner",
    rating: 5,
    avatar: "/testimonials/tarek.avif",
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
            title='Trusted by Thousands of Merchants'
            subtitle='Join thousands of successful merchants who started their e-commerce business with our affordable platform — everything you need to launch and grow your online store.'
          />
        </div>

        {/* Testimonials Container */}
        <div className='relative'>
          {/* Mobile/Tablet - Horizontal Slider with side gradients */}
          <div className='lg:hidden relative'>
            {/* Left Gradient - White to Transparent */}
            <div
              className='absolute left-0 top-0 bottom-0 w-12 z-10 pointer-events-none'
              style={{
                background: "linear-gradient(to right, rgba(255, 255, 255, 1) 0%, rgba(255, 255, 255, 0) 100%)",
              }}
            />

            {/* Right Gradient - Transparent to White */}
            <div
              className='absolute right-0 top-0 bottom-0 w-12 z-10 pointer-events-none'
              style={{
                background: "linear-gradient(to left, rgba(255, 255, 255, 1) 0%, rgba(255, 255, 255, 0) 100%)",
              }}
            />

            <MobileTestimonialSlider testimonials={testimonials} />
          </div>

          {/* Large Device - Vertical Slider Grid with 3 Columns */}
          <div className='hidden lg:block relative'>
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

            <div className='grid lg:grid-cols-3 gap-6 sm:gap-8 relative z-0'>
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
      </div>
    </section>
  );
}

// Mobile Horizontal Slider Component
function MobileTestimonialSlider({ testimonials }: { testimonials: Testimonial[] }) {
  const sliderRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<gsap.core.Tween | null>(null);

  // Duplicate testimonials for infinite scroll effect (scroll 50% = one full set)
  const duplicatedTestimonials = [...testimonials, ...testimonials];

  useGSAP(
    () => {
      if (!sliderRef.current) return;

      animationRef.current = gsap.to(sliderRef.current, {
        x: "-50%",
        duration: 40,
        ease: "none",
        repeat: -1,
      });
    },
    { scope: sliderRef }
  );

  return (
    <div className='lg:hidden relative overflow-x-hidden py-4' style={{ height: "auto" }}>
      <div
        ref={sliderRef}
        className='flex gap-4 sm:gap-6 md:gap-8'
        style={{
          willChange: "transform",
          width: "fit-content",
        }}
      >
        {duplicatedTestimonials.map((testimonial, index) => (
          <div key={`${testimonial.id}-${index}`} className='shrink-0 w-[calc(100vw-3rem)] sm:w-[calc(50vw-2rem)] max-w-[500px]'>
            <TestimonialCard testimonial={testimonial} index={index % testimonials.length} isVisible={true} />
          </div>
        ))}
      </div>
    </div>
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
