"use client";

import React, { useRef } from "react";
import Image from "next/image";
import { StartBuildingButton } from "../../../ui/button";
import { ArrowRight } from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export default function ExploreContainer() {
  const sectionRef = useRef<HTMLElement>(null);
  const leftContentRef = useRef<HTMLDivElement>(null);
  const rightImageRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (!sectionRef.current) return;

      // Clean fade-up for left content
      if (leftContentRef.current) {
        gsap.fromTo(
          leftContentRef.current,
          { opacity: 0, y: 30 },
          {
            opacity: 1,
            y: 0,
            duration: 0.7,
            ease: "power3.out",
            scrollTrigger: {
              trigger: leftContentRef.current,
              start: "top 85%",
              toggleActions: "play none none none",
            },
          }
        );
      }

      // Clean fade-up for right image
      if (rightImageRef.current) {
        gsap.fromTo(
          rightImageRef.current,
          { opacity: 0, y: 30 },
          {
            opacity: 1,
            y: 0,
            duration: 0.7,
            ease: "power3.out",
            scrollTrigger: {
              trigger: rightImageRef.current,
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
    <section ref={sectionRef} className='w-full pt-2 xs:pt-3 sm:pt-4 md:pt-5 lg:pt-6 pb-8 relative overflow-x-hidden overflow-y-visible'>
      <div className='w-full relative'>
        <div className='w-full'>
          {/* Card Container with rounded corners and border */}
          <div className='relative border border-gray-200 overflow-hidden bg-linear-to-b from-[rgba(232,236,253,0.6)] from-12% to-[rgba(32,120,255,0.6)] pt-[clamp(0.5rem,1vw,1rem)] pb-0 pl-[clamp(1rem,2.5vw,3rem)] pr-[clamp(1rem,2.5vw,3rem)]'>
            <div className='grid grid-cols-1 lg:grid-cols-2 md:gap-6 items-center justify-center lg:justify-start lg:items-center max-w-7xl mx-auto px-4 py-10 lg:py-0'>
              {/* Left Side - Content */}
              <div
                ref={leftContentRef}
                className='flex flex-col items-center justify-center lg:justify-start lg:items-start space-y-3 xs:space-y-4 sm:space-y-5 md:space-y-6 lg:space-y-8 text-left order-2 lg:order-1 mt-[clamp(1.25rem,2.5vw,1.25rem)] mb-[clamp(1.25rem,2.5vw,1.25rem)]'
              >
                {/* Title */}
                <h2
                  className='text-gray-900 font-bold text-[clamp(24px,4.5vw,48px)] leading-[clamp(32px,5.5vw,62px)] tracking-[0.02em text-center lg:text-start'
                  style={{ fontFamily: "var(--font-urbanist), sans-serif" }}
                >
                  Powerful features to simplify your web building
                </h2>

                {/* Description */}
                <p className='text-gray-700 max-w-lg font-normal text-[clamp(14px,2.2vw,18px)] leading-[clamp(22px,3.5vw,30.6px)] tracking-normal font-["Segoe_UI",system-ui,-apple-system,sans-serif] text-center lg:text-start'>
                  Explore powerful features crafted to make your website easier to build, customize, and manage.
                </p>

                {/* Button */}
                <div className='flex justify-start pt-2'>
                  <StartBuildingButton
                    text='Explore Demo'
                    icon={ArrowRight}
                    iconPosition='right'
                    className='text-xs xs:text-sm sm:text-base'
                  />
                </div>
              </div>

              {/* Right Side - iPhone Mockup */}
              <div
                ref={rightImageRef}
                className='w-full flex items-end justify-center lg:justify-end order-1 lg:order-2 self-end mt-2 xs:mt-4 sm:mt-6 md:mt-8 lg:mt-10 xl:mt-12 mb-0 pb-0'
              >
                <div className='relative overflow-hidden w-[clamp(180px,35vw,450px)] max-w-full h-[clamp(200px,40vh,580px)] lg:h-[clamp(200px,65vh,580px)] min-h-[280px] mb-0 pb-0 drop-shadow-[0_10px_30px_rgba(0,0,0,0.15)]'>
                  <Image
                    src='/mock/iphone.png'
                    alt='iPhone E-commerce App Mockup'
                    width={400}
                    height={800}
                    className='w-full h-auto object-bottom block mb-0 pb-0'
                    priority
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
