"use client";

import React, { useRef } from "react";
import Image from "next/image";
import { StartBuildingButton } from "../../../ui/button";
import { ArrowRight } from "lucide-react";
import { cn } from "@/utils";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export default function MockContainer() {
  const sectionRef = useRef<HTMLElement>(null);
  const mockupsRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (!sectionRef.current) return;

      // Clean fade-up for mockups container
      if (mockupsRef.current) {
        gsap.fromTo(
          mockupsRef.current,
          { opacity: 0, y: 40 },
          {
            opacity: 1,
            y: 0,
            duration: 0.8,
            ease: "power3.out",
            scrollTrigger: {
              trigger: mockupsRef.current,
              start: "top 85%",
              toggleActions: "play none none none",
            },
          }
        );
      }

      // Clean fade-up for content
      if (contentRef.current) {
        gsap.fromTo(
          contentRef.current,
          { opacity: 0, y: 30 },
          {
            opacity: 1,
            y: 0,
            duration: 0.7,
            ease: "power3.out",
            scrollTrigger: {
              trigger: contentRef.current,
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
    <section
      ref={sectionRef}
      className='w-full pb-16 pt-16 md:-mt-10 md:pt-0 md:pb-20 2xl:pb-24 relative overflow-x-hidden bg-linear-to-r from-white to-[#E8F4FF]'
    >
      <div className='w-full relative'>
        <div className='max-w-7xl mx-auto px-3 mb-16 lg:mb-20'>
          <div className='grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-0 items-center'>
            {/* Left Side - Device Mockups */}
            <div
              ref={mockupsRef}
              className={cn(
                "w-full relative overflow-visible order-2 lg:order-1",
                "h-[250px] xs:h-[300px] sm:h-[380px] md:h-[480px] lg:h-[550px] xl:h-[650px] 2xl:h-[800px]"
              )}
            >
              {/* Root Container for both images - relative */}
              <div className='relative w-full h-full'>
                {/* Laptop Mockup - Responsive sizing */}
                <div
                  className={cn(
                    "absolute left-0 xl:-left-[8%] bottom-0 h-auto z-10",
                    "w-full max-w-[90vw] sm:max-w-[85vw] md:max-w-[75vw] lg:max-w-[1000px] xl:max-w-[1100px] 2xl:max-w-[1300px]",
                    "lg:w-[clamp(400px,55vw,1200px)]",
                    "lg:-translate-x-[clamp(30%,20vw,50%)]",
                    "drop-shadow-[0_4px_12px_rgba(0,0,0,0.08)] sm:drop-shadow-[0_6px_16px_rgba(0,0,0,0.09)] md:drop-shadow-[0_8px_20px_rgba(0,0,0,0.1)]"
                  )}
                >
                  <Image
                    src='/mock/laptop-mock.png'
                    alt='Laptop Dashboard Mockup'
                    width={1600}
                    height={1200}
                    className='w-full h-auto object-contain'
                    priority
                  />
                </div>

                {/* iPhone Mockup - Responsive positioning */}
                <div
                  className={cn(
                    "absolute z-20",
                    "w-full max-w-24 xs:max-w-[140px] sm:max-w-[140px] md:max-w-[150px] lg:max-w-[150px] xl:max-w-[220px] 2xl:max-w-[280px]",
                    "lg:w-[clamp(100px,15vw,280px)]",
                    "right-[5%] xs:right-[8%] sm:right-[10%] md:right-[12%] 2xl:right-[10%]",
                    "top-[70%] xs:top-[70%] sm:top-[70%] md:top-[70%] lg:top-[73%]",
                    "-translate-y-1/2",
                    "drop-shadow-[0_4px_16px_rgba(0,0,0,0.12)] sm:drop-shadow-[0_6px_20px_rgba(0,0,0,0.13)] md:drop-shadow-[0_8px_24px_rgba(0,0,0,0.14)] lg:drop-shadow-[0_10px_30px_rgba(0,0,0,0.15)]"
                  )}
                >
                  <Image
                    src='/mock/iphone.png'
                    alt='iPhone E-commerce App Mockup'
                    width={300}
                    height={600}
                    className='w-full h-auto object-contain'
                    priority
                  />
                </div>
              </div>
            </div>

            {/* Right Side - Content */}
            <div
              ref={contentRef}
              className={cn("flex flex-col justify-center", "text-left lg:text-right order-1 lg:order-2", "px-2 xs:px-4 sm:px-0")}
            >
              {/* Title */}
              <h2
                className={cn(
                  "text-gray-900 leading-tight text-center lg:text-right font-bold",
                  "font-[var(--font-urbanist),sans-serif]",
                  "text-[clamp(20px,5vw,48px)] sm:text-[clamp(24px,4.5vw,48px)]",
                  "leading-[clamp(28px,6vw,62px)] sm:leading-[clamp(32px,5.5vw,62px)]",
                  "tracking-[0.01em] sm:tracking-[0.02em]",
                  "mb-2 xs:mb-3 sm:mb-4"
                )}
              >
                Powerful features to simplify your web building
              </h2>

              {/* Description */}
              <p
                className={cn(
                  "text-gray-700 leading-relaxed text-center lg:text-right",
                  "max-w-full  sm:max-w-2xl lg:max-w-lg lg:ml-auto",
                  "font-['Segoe_UI',system-ui,-apple-system,sans-serif] font-normal",
                  "text-[clamp(13px,3vw,18px)] sm:text-[clamp(14px,2.2vw,18px)]",
                  "leading-[clamp(20px,4vw,30.6px)] sm:leading-[clamp(22px,3.5vw,30.6px)]",
                  "tracking-normal",
                  "mb-3 xs:mb-4 sm:mb-5 md:mb-6"
                )}
              >
                Explore powerful features crafted to make your website easier to build, customize, and manage.
              </p>

              {/* Button */}
              <div className='flex justify-center lg:justify-end pt-1 xs:pt-2 sm:pt-3'>
                <StartBuildingButton
                  text='Explore Demo'
                  icon={ArrowRight}
                  iconPosition='right'
                  className='text-xs xs:text-sm sm:text-base md:text-lg w-auto'
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
