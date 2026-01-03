"use client";

import React, { useEffect, useState, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import SectionHeader from "@/app/(home)/_components/shared/SectionHeader";

// Register ScrollTrigger plugin
if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

interface Step {
  number: string;
  title: string;
  description: string;
  bullets: string[];
}

const steps: Step[] = [
  {
    number: "01",
    title: "Choose a Template",
    description: "Build faster with a layout crafted for your industry.",
    bullets: ["100+ modern, responsive templates", "Pre-built blocks & sections", "Fully customizable styles"],
  },
  {
    number: "02",
    title: "Customize Everything",
    description: "Make it yours with easy-to-use customization tools.",
    bullets: ["Drag-and-drop editor", "Live preview", "No coding required"],
  },
  {
    number: "03",
    title: "Add Your Content",
    description: "Upload your images, text, and branding in minutes.",
    bullets: ["Media library", "Content management", "SEO optimization"],
  },
  {
    number: "04",
    title: "Publish in One Click",
    description: "Go live instantly with our one-click publishing.",
    bullets: ["Instant deployment", "SSL certificate", "Custom domain support"],
  },
];

export default function StepsContainer() {
  const [activeStep, setActiveStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);
  const stepRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Check if all refs are ready
  const [refsReady, setRefsReady] = useState(false);

  useEffect(() => {
    const checkRefs = () => {
      const allRefsSet =
        stepRefs.current.length === steps.length && stepRefs.current.every((ref) => ref !== null) && sectionRef.current !== null;
      if (allRefsSet) {
        setRefsReady(true);
      }
    };

    checkRefs();
    const timer = setTimeout(checkRefs, 200);
    return () => clearTimeout(timer);
  }, []);

  // Clean GSAP ScrollTrigger animations
  useGSAP(
    () => {
      if (!sectionRef.current || !refsReady) return;

      // Clean fade-up for section header
      const headerElement = sectionRef.current.querySelector(".section-header");
      if (headerElement) {
        gsap.fromTo(
          headerElement,
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

      // Set steps visible
      stepRefs.current.forEach((stepRef) => {
        if (!stepRef) return;
        gsap.set(stepRef, { opacity: 1, y: 0 });
        setIsVisible(true);
      });

      // Refresh ScrollTrigger after setup
      ScrollTrigger.refresh();
    },
    { scope: sectionRef, dependencies: [refsReady] }
  );

  // Auto-advance steps when visible
  useEffect(() => {
    if (!isVisible) return;

    const interval = setInterval(() => {
      setActiveStep((prev) => (prev < steps.length - 1 ? prev + 1 : prev));
    }, 4000);

    return () => clearInterval(interval);
  }, [isVisible]);

  return (
    <section ref={sectionRef} className='w-full py-12 sm:py-16 md:py-20 lg:py-24 bg-white'>
      <style
        dangerouslySetInnerHTML={{
          __html: `
          @keyframes pulseGlow {
            0%, 100% {
              box-shadow: 0 0 10px rgba(59, 130, 246, 0.5), 0 0 20px rgba(59, 130, 246, 0.3);
            }
            50% {
              box-shadow: 0 0 20px rgba(59, 130, 246, 0.8), 0 0 30px rgba(59, 130, 246, 0.5), 0 0 40px rgba(59, 130, 246, 0.3);
            }
          }
          @keyframes shimmer {
            0% {
              transform: translateY(-100%);
              opacity: 0;
            }
            50% {
              opacity: 1;
            }
            100% {
              transform: translateY(100%);
              opacity: 0;
            }
          }
          @keyframes growBorder {
            0% {
              height: 0%;
              opacity: 0;
            }
            100% {
              height: 100%;
              opacity: 1;
            }
          }
          @keyframes slideInFromLeft {
            0% {
              opacity: 0;
              transform: translateX(-30px);
            }
            100% {
              opacity: 1;
              transform: translateX(0);
            }
          }
          @keyframes fadeInUp {
            0% {
              opacity: 0;
              transform: translateY(20px);
            }
            100% {
              opacity: 1;
              transform: translateY(0);
            }
          }
        `,
        }}
      />
      <div className='max-w-7xl mx-auto px-3'>
        {/* Header Section */}
        <div className='section-header'>
          <SectionHeader
            title='Create a website in 4 easy Steps'
            subtitle='From choosing a template to publishing live—everything is designed to be fast, intuitive, and creator-friendly.'
            className='mb-8 sm:mb-10 md:mb-12'
          />
        </div>

        <div className='grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-start'>
          {/* Left Side - Steps */}
          <div className='w-full ml-4'>
            {/* Steps List */}
            <div className='space-y-0'>
              {steps.map((step, index) => (
                <StepItem
                  key={index}
                  ref={(el) => {
                    stepRefs.current[index] = el;
                  }}
                  step={step}
                  index={index}
                  isActive={index === activeStep}
                  activeStep={activeStep}
                  isVisible={isVisible}
                  onClick={() => setActiveStep(index)}
                />
              ))}
            </div>
          </div>

          {/* Right Side - Placeholder for Image */}
          <div className='w-full h-full min-h-[400px] lg:min-h-[600px] flex items-center justify-center bg-gray-50 rounded-lg'>
            <div className='text-gray-400 text-sm'>Image Placeholder</div>
          </div>
        </div>
      </div>
    </section>
  );
}

const StepItem = React.forwardRef<
  HTMLDivElement,
  {
    step: Step;
    index: number;
    isActive: boolean;
    activeStep: number;
    isVisible: boolean;
    onClick: () => void;
  }
>(({ step, index, isActive, activeStep, isVisible, onClick }, ref) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const [contentHeight, setContentHeight] = useState(0);

  useEffect(() => {
    if (contentRef.current) {
      const updateHeight = () => {
        if (contentRef.current) {
          setContentHeight(contentRef.current.offsetHeight);
        }
      };
      updateHeight();
      // Update height when active state changes or content expands
      const timeout = setTimeout(updateHeight, 100);
      const resizeObserver = new ResizeObserver(updateHeight);
      resizeObserver.observe(contentRef.current);
      return () => {
        clearTimeout(timeout);
        resizeObserver.disconnect();
      };
    }
  }, [isActive, isVisible]);

  return (
    <div ref={ref} className='relative cursor-pointer group' onClick={onClick}>
      <div ref={contentRef} className='flex gap-4 sm:gap-6 pb-8 sm:pb-10 items-start'>
        {/* Number Container with Left Border */}
        <div className='shrink-0 relative z-10 flex items-start'>
          {/* Bold Border on Left Side - Shows for all steps with gap */}
          <div
            className='absolute -left-3 top-0 w-1.5 flex flex-col transition-all duration-500'
            style={{
              height: contentHeight > 0 ? `calc(${contentHeight}px - 2rem)` : "auto", // Subtract padding to create gap between steps
            }}
          >
            {isActive ? (
              <>
                {/* Bold Blue animated border with grow animation - expands to full content height */}
                <div
                  className='absolute top-0 left-0 w-full bg-linear-to-b from-blue-500 via-blue-400 to-blue-500 rounded-full opacity-100'
                  style={{
                    height: "100%",
                    boxShadow: "0 0 10px rgba(59, 130, 246, 0.5), 0 0 20px rgba(59, 130, 246, 0.3)",
                    animation: "growBorder 1s ease-out forwards, pulseGlow 2s ease-in-out infinite 1s",
                  }}
                />
                {/* Animated shimmer effect */}
                <div
                  className='absolute top-0 left-0 w-full h-full bg-linear-to-b from-transparent via-white/30 to-transparent rounded-full'
                  style={{
                    animation: "shimmer 2s ease-in-out infinite 1s",
                  }}
                />
              </>
            ) : (
              /* Black border for inactive steps */
              <div className='absolute top-0 left-0 w-full h-full bg-gray-900 rounded-full' />
            )}
          </div>

          {/* Number - Border/Outline Style - Fully Responsive */}
          {isActive ? (
            <div
              className='step-number font-bold transition-all duration-500 relative leading-none mt-3'
              style={{
                fontSize: "clamp(24px, 5vw, 48px)",
                fontFamily: "Nunito Sans",
                fontWeight: 600,
                letterSpacing: "2%",
                fontStyle: "normal",
                lineHeight: "120%",
                WebkitTextStroke: "1px #3b82f6",
                color: "transparent",
                textShadow: "none",
              }}
            >
              {step.number}
              {/* Glow effect around active number */}
              <div
                className='absolute inset-0 font-bold blur-sm opacity-50'
                style={{
                  fontSize: "clamp(24px, 5vw, 48px)",
                  fontFamily: "Nunito Sans",
                  fontWeight: 600,
                  letterSpacing: "2%",
                  fontStyle: "normal",
                  lineHeight: "120%",
                  WebkitTextStroke: "1px #3b82f6",
                  color: "transparent",
                  zIndex: -1,
                }}
              >
                {step.number}
              </div>
            </div>
          ) : (
            <div
              className='step-number font-bold text-gray-900 group-hover:text-gray-800 transition-colors duration-300 leading-none mt-3'
              style={{
                fontSize: "clamp(24px, 5vw, 48px)",
                fontFamily: "Nunito Sans",
                fontWeight: 600,
                letterSpacing: "2%",
                fontStyle: "normal",
                lineHeight: "120%",
                WebkitTextStroke: "1px #000000",
                color: "transparent",
              }}
            >
              {step.number}
            </div>
          )}
        </div>

        {/* Content */}
        <div className='flex-1'>
          <h3
            className={`step-title mt-2 transition-colors duration-300 ${isActive ? "text-blue-600" : "text-gray-900"}`}
            style={{
              fontFamily: "Nunito Sans, sans-serif",
              fontWeight: 500,
              fontSize: "clamp(20px, 4vw, 48.04px)",
              lineHeight: "clamp(26px, 5vw, 62.05px)",
              letterSpacing: "0.02em",
            }}
          >
            {step.title}
          </h3>

          {/* Description and Bullets - Only show for active step */}
          {isActive && (
            <div
              className='space-y-3'
              style={{
                animation: "fadeInUp 0.5s ease-out",
              }}
            >
              <p className='text-sm sm:text-base text-gray-600 leading-relaxed'>{step.description}</p>
              <ul className='space-y-2'>
                {step.bullets.map((bullet, idx) => (
                  <li
                    key={idx}
                    className='flex items-start gap-2 text-sm sm:text-base text-gray-600'
                    style={{
                      animation: `fadeInUp 0.5s ease-out ${idx * 0.1 + 0.2}s both`,
                    }}
                  >
                    <span className='text-blue-500 font-bold mt-0.5'>•</span>
                    <span>{bullet}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

StepItem.displayName = "StepItem";
