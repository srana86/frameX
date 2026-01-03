"use client";

import { useRef } from "react";
import Image from "next/image";
import { StartBuildingButton, WatchDemoButton } from "../../../ui/button";
import { ArrowRight, Play } from "lucide-react";
import WhiteShades from "../svg";
import { DashboardPreview } from "./DashboardPreview";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

const { WhiteShadeLeft1, WhiteShadeLeft2, WhiteShadeRight1, WhiteShadeRight2 } = WhiteShades;

export default function HeroContainer() {
  const containerRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const descriptionRef = useRef<HTMLParagraphElement>(null);
  const buttonsRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (!containerRef.current) return;

      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

      // Heading - clean fade up
      if (headingRef.current) {
        gsap.set(headingRef.current, { opacity: 0, y: 30 });
        tl.to(headingRef.current, { opacity: 1, y: 0, duration: 0.8 }, 0);
      }

      // Description - fade up with slight delay
      if (descriptionRef.current) {
        gsap.set(descriptionRef.current, { opacity: 0, y: 20 });
        tl.to(descriptionRef.current, { opacity: 1, y: 0, duration: 0.6 }, 0.15);
      }

      // Buttons - fade up
      if (buttonsRef.current) {
        gsap.set(buttonsRef.current, { opacity: 0, y: 15 });
        tl.to(buttonsRef.current, { opacity: 1, y: 0, duration: 0.6 }, 0.3);
      }

      // Image - fade up
      if (imageRef.current) {
        gsap.set(imageRef.current, { opacity: 0, y: 25 });
        tl.to(imageRef.current, { opacity: 1, y: 0, duration: 0.8 }, 0.4);
      }
    },
    { scope: containerRef }
  );

  return (
    <div
      ref={containerRef}
      className='w-full relative flex flex-col items-center px-3 pt-28 md:pt-32 lg:pt-48 overflow-hidden lg:max-h-[1215px]'
      style={{
        background:
          "linear-gradient(180deg, transparent 0%, rgba(39, 124, 255, 0.2) 30%, rgba(39, 124, 255, 0.5) 60%, rgba(39, 124, 255, 0.8) 85%, #277CFF 100%)",
        height: "auto",
      }}
    >
      {/* Left White Shades - Close together - Hidden on mobile */}
      <div className='hidden md:block absolute left-0 top-0 h-full pointer-events-none z-0' style={{ width: "auto" }}>
        <div className='absolute' style={{ top: 0, left: 0, height: "calc(62% - 5px)" }}>
          <WhiteShadeLeft2 className='h-full w-auto' style={{ height: "100%", width: "auto", display: "block" }} />
        </div>
        <div className='absolute' style={{ bottom: 0, left: 0, height: "calc(100% - 5px)" }}>
          <WhiteShadeLeft1 className='h-full w-auto' style={{ height: "100%", width: "auto", display: "block" }} />
        </div>
      </div>

      {/* Right White Shades - Close together - Hidden on mobile */}
      <div className='hidden md:block absolute right-0 top-0 h-full pointer-events-none z-0' style={{ width: "auto" }}>
        <div className='absolute' style={{ top: 0, right: 0, height: "calc(62% - 5px)" }}>
          <WhiteShadeRight2 className='h-full w-auto' style={{ height: "100%", width: "auto", display: "block" }} />
        </div>
        <div className='absolute' style={{ bottom: 0, right: 0, height: "calc(100% - 5px)" }}>
          <WhiteShadeRight1 className='h-full w-auto' style={{ height: "100%", width: "auto", display: "block" }} />
        </div>
      </div>
      {/* Hero Content */}
      <div className='w-full max-w-4xl mx-auto text-center space-y-3 sm:space-y-4 md:space-y-6 lg:space-y-8 shrink-0 relative z-10 px-2 sm:px-4'>
        {/* Main Heading */}
        <h1
          ref={headingRef}
          className='text-gray-900 text-center'
          style={{
            fontFamily: "var(--font-nunito-sans)",
            fontWeight: 600,
            fontSize: "clamp(40px, 8vw, 64px)",
            lineHeight: "120%",
            letterSpacing: "-0.03em",
            textAlign: "center",
          }}
        >
          <span style={{ display: "inline-block" }}>Build Stunning Websites</span>
          <br className='hidden sm:block' />
          <span className='block sm:inline'> </span>
          <span className='bg-linear-to-r from-[#2078FF] to-[#4000FF] bg-clip-text text-transparent' style={{ display: "inline-block" }}>
            In Minutes Not Hours
          </span>
        </h1>

        {/* Description */}
        <p
          ref={descriptionRef}
          className='text-gray-600 max-w-full md:max-w-2xl mx-auto text-center'
          style={{
            fontFamily: "var(--font-urbanist)",
            fontWeight: 400,
            fontSize: "clamp(14px, 2.5vw, 20px)",
            lineHeight: "1.5",
            letterSpacing: "0%",
            textAlign: "center",
            padding: "0 0.5rem",
          }}
        >
          Create professional websites instantly with our no-code platform. Powerful, intuitive, and designed for creators.
        </p>

        {/* CTA Buttons - Always flex */}
        <div
          ref={buttonsRef}
          className='flex flex-row items-center justify-center gap-3 sm:gap-4 md:gap-6 pt-2 sm:pt-3 md:pt-4 flex-wrap mb-12 md:mb-20'
        >
          <StartBuildingButton text='Start Building' icon={ArrowRight} iconPosition='right' className='text-xs sm:text-sm md:text-base' />
          <WatchDemoButton text='Watch Demo' icon={Play} iconPosition='left' className='text-xs sm:text-sm md:text-base' />
        </div>
      </div>

      {/* Image Frame with Gradient Border */}
      <div ref={imageRef} className='w-full max-w-[1100px] mx-auto px-2 sm:px-3 md:px-4 shrink-0 relative z-10 mt-auto mb-0'>
        {/* White background with padding - only top, left, right */}
        {/* Reduced padding for mobile and tablet */}
        <div className='bg-white pt-0.5 px-0.5 rounded-t-lg sm:rounded-t-xl'>
          {/* Gradient Border Container - no bottom border */}
          {/* Reduced padding for mobile and tablet, full padding for large devices */}
          <div
            className='relative overflow-hidden rounded-t-lg sm:rounded-t-xl gradient-border-lg'
            style={{
              paddingTop: "4px",
              paddingLeft: "4px",
              paddingRight: "4px",
              paddingBottom: "0px",
              background:
                "linear-gradient(131.19deg, #2078FF -0.77%, #2078FF 5.73%, #2078FF 9.8%, #2078FF 14.16%, rgba(32, 120, 255, 0.8) 60.97%,rgba(32, 120, 255, 0.7) 70.72%, rgba(32, 120, 255, 0.6) 90.94%)",
            }}
          >
            <style
              dangerouslySetInnerHTML={{
                __html: `
                  @media (min-width: 1024px) {
                    .gradient-border-lg {
                      padding-top: 10px !important;
                      padding-left: 10px !important;
                      padding-right: 10px !important;
                    }
                  }
                `,
              }}
            />
            <div className='relative overflow-hidden bg-white rounded-t-lg sm:rounded-t-xl'>
              {/* Dashboard Image for Mobile and Tablet */}
              <div className='w-full h-[200px] sm:h-[260px] md:h-72 lg:hidden overflow-hidden'>
                <Image
                  src='/mock/dashboard.png'
                  alt='Dashboard Preview'
                  width={1100}
                  height={600}
                  className='w-full h-full object-cover object-top'
                  priority
                />
              </div>

              {/* Dashboard Preview Component for Large Devices */}
              <div className='hidden lg:block w-full h-[400px] xl:h-[450px] overflow-hidden'>
                <DashboardPreview />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
