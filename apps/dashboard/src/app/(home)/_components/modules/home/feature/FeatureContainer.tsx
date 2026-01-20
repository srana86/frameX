"use client";

import React, { useRef } from "react";
import Image from "next/image";
import SectionHeader from "../../../shared/SectionHeader";
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
    title: "Quick Store Setup & Product Management",
    description: "Get your e-commerce store up and running instantly. Add products, manage inventory, and organize your catalog with ease.",
    visual: (
      <div className='w-full h-full flex items-center justify-center relative'>
        <Image src='/feature/storesetup.avif' alt='Store Setup & Structure' fill className='object-contain scale-115' loading='lazy' />
      </div>
    ),
  },
  {
    title: "Marketing Friendly",
    description:
      "Facebook, Instagram, and TikTok Conversion API with server-side tracking. Optimize ad performance and increase sales up to 10x with conversion tracking and SEO.",
    visual: <MarketingUi />,
  },
  {
    title: "Sales Analytics & Reporting",
    description:
      "Monitor your e-commerce performance with detailed sales reports, customer insights, and revenue tracking to make data-driven decisions.",
    visual: (
      <div className='w-full h-full flex items-center justify-center relative'>
        <Image
          src='/feature/analytics.avif'
          alt='Real-Time Analytics & Insights'
          fill
          className='object-contain scale-110'
          loading='lazy'
        />
      </div>
    ),
  },
  {
    title: "Payment & Shipping Integration",
    description:
      "Accept payments securely with multiple payment gateways and manage deliveries with integrated shipping solutions for seamless order fulfillment.",
    visual: (
      <div className='w-full h-full flex items-center justify-center relative'>
        <Image src='/feature/integration.avif' alt='Seamless Integrations' fill className='object-contain scale-115 mt-3' loading='lazy' />
      </div>
    ),
  },
  {
    title: "Mobile-Optimized Shopping Experience",
    description:
      "Your store works perfectly on all devices. Customers can browse and shop seamlessly on mobile, tablet, or desktop for maximum sales potential.",
    visual: (
      <div className='w-full h-full flex items-center justify-center relative'>
        <Image src='/feature/lastone.avif' alt='Fully Responsive Design' fill className='object-contain scale-105' loading='lazy' />
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
    <section ref={sectionRef} className='w-full flex flex-col pt-4 sm:pt-6 md:pt-8 lg:pt-8 pb-12 sm:pb-16 md:pb-20 lg:pb-24 bg-white'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6'>
        {/* Header */}
        <div ref={headerRef} className='mb-12 sm:mb-16 md:mb-20'>
          <SectionHeader
            title='Everything you need to launch your e-commerce business'
            subtitle='Complete features included to help you start selling online and manage your store efficiently.'
          />
        </div>

        {/* Top Row - 2 Cards */}
        <div className='grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6 mb-5 sm:mb-6'>
          {topFeatures.map((feature, index) => (
            <div
              key={index}
              ref={(el) => {
                topCardsRef.current[index] = el;
              }}
              // className='group relative bg-gray-50 rounded-2xl p-5 sm:p-6 border border-gray-100 hover:border-blue-200 transition-all duration-300 overflow-hidden'
              className='group relative rounded-2xl sm:rounded-3xl p-6 border border-gray-200/80 hover:border-blue-400/60 shadow-sm overflow-hidden'
              style={{
                background: "linear-gradient(170.09deg, rgba(32,120,255,0.8) 30.71%, #FFFFFF 9.33%)",
              }}
            >
              {/* Visual Container */}
              <div className='w-full h-72 sm:h-80 mb-5 sm:mb-6 relative overflow-hidden rounded-xl bg-white border border-gray-100'>
                {feature.visual}
              </div>

              {/* Content */}
              <div className='space-y-2'>
                <h3 className='text-lg sm:text-xl md:text-2xl font-semibold text-gray-900 group-hover:text-blue-600 transition-colors duration-300'>
                  {feature.title}
                </h3>
                <p className='text-sm sm:text-base text-gray-500 leading-relaxed'>{feature.description}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom Row - 3 Cards */}
        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6'>
          {bottomFeatures.map((feature, index) => (
            <div
              key={index + 2}
              ref={(el) => {
                bottomCardsRef.current[index] = el;
              }}
              // className='group relative bg-gray-50 rounded-2xl p-5 sm:p-6 border border-gray-100 hover:border-blue-200 transition-all duration-300 overflow-hidden'
              className='group relative rounded-2xl sm:rounded-3xl p-6 border border-gray-200/80 hover:border-blue-400/60 shadow-sm overflow-hidden'
              style={{
                // background: "linear-gradient(218.09deg, #D4E5FF 10.71%, #FFFFFF 99.33%)",
                background: "linear-gradient(170.09deg, rgba(32,120,255,0.8) 35.71%, #FFFFFF 9.33%)",
              }}
            >
              {/* Visual Container */}
              <div className='w-full h-48  sm:h-56 md:h-52 mb-5 relative overflow-hidden rounded-xl bg-blue-100 border border-gray-100'>
                {feature.visual}
              </div>

              {/* Content */}
              <div className='space-y-2'>
                <h3 className='text-lg sm:text-xl font-semibold text-gray-900 group-hover:text-blue-600 transition-colors duration-300'>
                  {feature.title}
                </h3>
                <p className='text-sm sm:text-base text-gray-500 leading-relaxed'>{feature.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className='mt-12 sm:mt-16 md:mt-20'>
        <CardsUi />
      </div>
    </section>
  );
}
