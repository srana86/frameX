"use client";

import React, { useRef } from "react";
import { StartBuildingButton } from "../ui/button";
import { ArrowRight, Sparkles } from "lucide-react";
import { cn } from "@/utils";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

interface PageBottomProps {
  title?: string;
  subtitle?: string;
  buttonText?: string;
  buttonHref?: string;
  showIcon?: boolean;
  className?: string;
  variant?: "default" | "gradient" | "minimal";
}

export default function PageBottom({
  title = "Ready to Get Started?",
  subtitle = "Join thousands of businesses already using FrameX to grow their online presence.",
  buttonText = "Start Building",
  buttonHref = "/",
  showIcon = true,
  className = "",
  variant = "default",
}: PageBottomProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (!sectionRef.current) return;

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
              trigger: sectionRef.current,
              start: "top 80%",
              toggleActions: "play none none none",
            },
          }
        );
      }

      // Clean fade-up for button
      if (buttonRef.current) {
        gsap.fromTo(
          buttonRef.current,
          { opacity: 0, y: 15 },
          {
            opacity: 1,
            y: 0,
            duration: 0.6,
            ease: "power3.out",
            delay: 0.2,
            scrollTrigger: {
              trigger: sectionRef.current,
              start: "top 80%",
              toggleActions: "play none none none",
            },
          }
        );
      }
    },
    { scope: sectionRef }
  );

  const variantStyles = {
    default: "bg-white border-t border-gray-200",
    gradient: "bg-linear-to-br from-blue-50 via-indigo-50 to-purple-50 border-t border-blue-100",
    minimal: "bg-transparent",
  };

  return (
    <section ref={sectionRef} className={cn("w-full py-8 sm:py-12 md:py-16", variantStyles[variant], className)}>
      <div className='max-w-4xl mx-auto px-3'>
        <div ref={contentRef} className='text-center space-y-4 sm:space-y-5 md:space-y-6'>
          {/* Icon */}
          {showIcon && (
            <div className='flex justify-center mb-2'>
              <div className='w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-linear-to-br from-[#0448FD] to-[#0038d4] flex items-center justify-center shadow-lg shadow-blue-500/20'>
                <Sparkles className='w-6 h-6 sm:w-7 sm:h-7 text-white' />
              </div>
            </div>
          )}

          {/* Title */}
          <h2
            className='text-gray-900 font-semibold text-xl sm:text-2xl md:text-3xl lg:text-4xl'
            style={{
              fontFamily: "var(--font-nunito-sans)",
              fontWeight: 600,
              lineHeight: "120%",
              letterSpacing: "-0.02em",
            }}
          >
            {title}
          </h2>

          {/* Subtitle */}
          {subtitle && (
            <p
              className='text-gray-600 max-w-2xl mx-auto text-sm sm:text-base md:text-lg'
              style={{
                fontFamily: "var(--font-urbanist)",
                fontWeight: 400,
                lineHeight: "1.5",
              }}
            >
              {subtitle}
            </p>
          )}

          {/* CTA Button */}
          <div ref={buttonRef} className='flex justify-center pt-2'>
            <StartBuildingButton text={buttonText} icon={ArrowRight} iconPosition='right' href={buttonHref} />
          </div>
        </div>
      </div>
    </section>
  );
}
