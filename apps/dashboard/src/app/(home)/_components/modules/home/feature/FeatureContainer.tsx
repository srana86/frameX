"use client";

import React, { useRef } from "react";
import Image from "next/image";
import SectionHeader from "../../../shared/SectionHeader";
import { SeamlessUi } from "./SeamlessUi";
import { StoreSetup } from "./StoreSetup";
import { RealTimeAnalytics } from "./RealTimeAnalytics";
import { CardsUi } from "./CardsUi";
import { MarketingUi } from "./MarketingUi";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

interface Feature {
  title: string;
  description: string;
  visual: React.ReactNode;
}

const features: Feature[] = [
  {
    title: "Store Setup & Structure",
    description: "A clean, well-planned store structure designed for smooth browsing and better user experience.",
    visual: <StoreSetup />,
  },
  {
    title: "Marketing Friendly",
    description: "Build your pages using flexible layout blocks you can freely customize to match your brand.",
    visual: <MarketingUi />,
  },
  {
    title: "Real-Time Analytics & Insights",
    description: "Track your store's performance with real-time analytics, sales metrics, and actionable insights to grow your business.",
    visual: <RealTimeAnalytics />,
  },
  {
    title: "Seamless Integrations",
    description: "Connect your store with key apps and services effortlessly.",
    visual: <SeamlessUi />,
  },
  {
    title: "Fully Responsive Design",
    description: "Enjoy a fully responsive website that adapts beautifully to any screen size or device.",
    visual: (
      <div className='w-full h-full flex items-center justify-center relative'>
        <Image
          src='/feature/responsive-ui.png'
          alt='Fully Responsive Design'
          width={800}
          height={600}
          className='w-full h-full object-contain'
          loading='lazy'
          placeholder='blur'
          blurDataURL='data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k='
        />
      </div>
    ),
  },
];

export default function FeatureContainer() {
  const sectionRef = useRef<HTMLElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const topCardsRef = useRef<(HTMLDivElement | null)[]>([]);
  const bottomCardsRef = useRef<(HTMLDivElement | null)[]>([]);

  // Split features into top 2 and bottom 3
  const topFeatures = features.slice(0, 2);
  const bottomFeatures = features.slice(2, 5);

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

      // Clean fade-up for top cards
      topCardsRef.current.forEach((card, index) => {
        if (!card) return;
        gsap.fromTo(
          card,
          { opacity: 0, y: 30 },
          {
            opacity: 1,
            y: 0,
            duration: 0.6,
            ease: "power3.out",
            delay: index * 0.1,
            scrollTrigger: {
              trigger: card,
              start: "top 85%",
              toggleActions: "play none none none",
            },
          }
        );
      });

      // Clean fade-up for bottom cards
      bottomCardsRef.current.forEach((card, index) => {
        if (!card) return;
        gsap.fromTo(
          card,
          { opacity: 0, y: 30 },
          {
            opacity: 1,
            y: 0,
            duration: 0.6,
            ease: "power3.out",
            delay: index * 0.1,
            scrollTrigger: {
              trigger: card,
              start: "top 85%",
              toggleActions: "play none none none",
            },
          }
        );
      });
    },
    { scope: sectionRef }
  );

  return (
    <section ref={sectionRef} className='w-full flex flex-col pt-12 sm:py-16 md:pt-20 lg:pt-24 bg-linear-to-b from-white to-gray-100/50'>
      <div className='max-w-7xl mx-auto px-3'>
        {/* Header */}
        <div ref={headerRef} className='mb-12 sm:mb-16 md:mb-20'>
          <SectionHeader
            title='Powerful features to simplify your web building'
            subtitle='Explore powerful features crafted to make your website easier to build, customize, and manage.'
          />
        </div>

        {/* Top Row - 2 Cards */}
        <div className='grid grid-cols-1 md:grid-cols-2 gap-6 mb-6'>
          {topFeatures.map((feature, index) => (
            <div
              key={index}
              ref={(el) => {
                topCardsRef.current[index] = el;
              }}
              className='group relative rounded-2xl sm:rounded-3xl p-6 border border-gray-200/80 hover:border-blue-400/60 shadow-xl overflow-hidden'
              style={{
                background: "linear-gradient(218.09deg, #D4E5FF 10.71%, #FFFFFF 99.33%)",
              }}
            >
              <div className='relative z-10'>
                {/* Visual Container */}
                <div
                  className='w-full h-80 mb-6 sm:mb-8 relative overflow-hidden rounded-[15px]'
                  style={{
                    padding: "1.5px",
                    background: "linear-gradient(180deg, #3b82f6 0%, #ffffff 100%)",
                    borderRadius: "15px",
                  }}
                >
                  <div className='w-full h-full rounded-xl overflow-hidden bg-white'>{feature.visual}</div>
                </div>

                {/* Content */}
                <div className='space-y-3 sm:space-y-4'>
                  <h3
                    className='text-xl sm:text-2xl md:text-3xl font-semibold text-gray-900 group-hover:text-blue-600'
                    style={{
                      fontFamily: "var(--font-nunito-sans)",
                      fontWeight: 600,
                    }}
                  >
                    {feature.title}
                  </h3>
                  <p
                    className='text-sm sm:text-base md:text-lg text-gray-600 leading-relaxed group-hover:text-gray-700'
                    style={{
                      fontFamily: "var(--font-urbanist)",
                      fontWeight: 400,
                    }}
                  >
                    {feature.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom Row - 3 Cards */}
        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 xs:gap-6'>
          {bottomFeatures.map((feature, index) => (
            <div
              key={index + 2}
              ref={(el) => {
                bottomCardsRef.current[index] = el;
              }}
              className='group relative rounded-lg sm:rounded-xl md:rounded-2xl p-4 xs:p-5 shadow-xl overflow-hidden'
              style={{
                background: "linear-gradient(218.09deg, #D4E5FF 10.71%, #FFFFFF 100%)",
              }}
            >
              <div className='relative z-10'>
                {/* Visual Container */}
                <div
                  className='w-full h-auto md:h-64 lg:h-72 xl:h-80 mb-4 sm:mb-5 md:mb-6 relative overflow-hidden rounded-xl'
                  style={{
                    padding: "1.5px",
                    background: "linear-gradient(180deg, #3b82f6 0%, #ffffff 100%)",
                    borderRadius: "15px",
                  }}
                >
                  <div className='w-full h-full rounded-xl overflow-hidden bg-white'>{feature.visual}</div>
                </div>

                {/* Content */}
                <div className='space-y-2 sm:space-y-3'>
                  <h3
                    className='text-lg sm:text-xl md:text-2xl font-semibold text-gray-900 group-hover:text-blue-600'
                    style={{
                      fontFamily: "var(--font-nunito-sans)",
                      fontWeight: 600,
                    }}
                  >
                    {feature.title}
                  </h3>
                  <p
                    className='text-sm sm:text-base text-gray-600 leading-relaxed group-hover:text-gray-700'
                    style={{
                      fontFamily: "var(--font-urbanist)",
                      fontWeight: 400,
                    }}
                  >
                    {feature.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className='my-10 md:mt-24 md:mb-16'>
        <CardsUi />
      </div>
    </section>
  );
}
