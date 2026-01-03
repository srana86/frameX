"use client";

import React, { useRef } from "react";
import SectionHeader from "../../shared/SectionHeader";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import StatsSection from "./StatsSection";
import ValuesSection from "./ValuesSection";
import StorySection from "./StorySection";
import PlatformBenefits from "../../shared/PlatformBenefits";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export default function AboutUsContainer() {
  const sectionRef = useRef<HTMLElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const missionRef = useRef<HTMLDivElement>(null);

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

      // Clean fade-up for mission section
      if (missionRef.current) {
        gsap.fromTo(
          missionRef.current,
          { opacity: 0, y: 30 },
          {
            opacity: 1,
            y: 0,
            duration: 0.7,
            ease: "power3.out",
            scrollTrigger: {
              trigger: missionRef.current,
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
    <section ref={sectionRef} className='w-full pt-28 md:pt-32 lg:pt-48 space-y-8 md:space-y-16 pb-10 md:pb-16 bg-white'>
      <div className='max-w-7xl mx-auto px-3'>
        {/* Header Section */}
        <div ref={headerRef} className='mb-12 sm:mb-16 md:mb-20'>
          <SectionHeader
            title='About FrameX'
            subtitle="We're building the future of e-commerce, one store at a time. Learn more about our mission, values, and the team behind FrameX."
          />
        </div>

        {/* Mission Section */}
        <div ref={missionRef} className='mb-12 sm:mb-16 md:mb-20'>
          <div className='max-w-6xl mx-auto'>
            <div className='relative bg-white rounded-2xl p-4 md:p-6 border border-gray-200 shadow-lg shadow-blue-50/50 overflow-hidden'>
              {/* Decorative Background Elements */}
              <div className='absolute top-0 right-0 w-64 h-64 bg-linear-to-br from-blue-500/5 to-purple-500/5 rounded-full blur-3xl' />
              <div className='absolute bottom-0 left-0 w-48 h-48 bg-linear-to-tr from-indigo-500/5 to-blue-500/5 rounded-full blur-2xl' />

              {/* Content */}
              <div className='relative z-10'>
                {/* Header with Icon */}
                <div className='flex items-center gap-4 mb-6 sm:mb-8'>
                  <div>
                    <h3
                      className='text-xl sm:text-2xl md:text-3xl font-semibold text-gray-900'
                      style={{
                        fontFamily: "var(--font-urbanist), sans-serif",
                        fontWeight: 600,
                        lineHeight: "1.2",
                      }}
                    >
                      Our Mission
                    </h3>
                    <div className='w-16 h-1 bg-linear-to-r from-[#0448FD] to-[#0038d4] rounded-full mt-2' />
                  </div>
                </div>

                {/* Mission Content */}
                <div className='space-y-4 sm:space-y-5'>
                  <p
                    className='text-sm sm:text-base md:text-lg text-gray-700 leading-relaxed'
                    style={{
                      fontFamily: '"Segoe UI", system-ui, -apple-system, sans-serif',
                      lineHeight: "1.8",
                    }}
                  >
                    At FrameX, we believe that every business, regardless of size, deserves access to powerful e-commerce tools. Our mission
                    is to democratize online selling by providing an intuitive, scalable, and affordable platform that empowers
                    entrepreneurs and businesses to succeed in the digital marketplace.
                  </p>
                  <p
                    className='text-sm sm:text-base md:text-lg text-gray-700 leading-relaxed'
                    style={{
                      fontFamily: '"Segoe UI", system-ui, -apple-system, sans-serif',
                      lineHeight: "1.8",
                    }}
                  >
                    We're committed to continuous innovation, exceptional customer support, and building a platform that grows with your
                    business. Whether you're just starting out or scaling to new heights, FrameX is here to support your journey.
                  </p>
                </div>

                {/* Highlight Box */}
                <div className='mt-6 sm:mt-8 p-4 sm:p-5 bg-linear-to-r from-blue-50 to-indigo-50 rounded-xl border border-[#0448FD]'>
                  <p
                    className='text-sm sm:text-base text-gray-800 font-medium italic'
                    style={{
                      fontFamily: '"Segoe UI", system-ui, -apple-system, sans-serif',
                      lineHeight: "1.6",
                    }}
                  >
                    "Empowering businesses to thrive in the digital economy, one store at a time."
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <StatsSection />

        {/*  Ours Values */}
        <ValuesSection />

        {/* Our Story */}
        <StorySection />

        {/* Platform Benefits */}
        <PlatformBenefits
          title='Why Businesses Choose FrameX'
          subtitle='Discover the features and benefits that make FrameX the preferred choice for online stores.'
          columns={4}
        />
      </div>
    </section>
  );
}
