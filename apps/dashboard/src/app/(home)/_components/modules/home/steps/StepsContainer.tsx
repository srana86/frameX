"use client";

import React, { useEffect, useState, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import Image from "next/image";
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
  image: string;
}

const steps: Step[] = [
  {
    number: "01",
    title: "Get Your E-Commerce Website",
    description: "Purchase your fully-featured online store and get it ready in minutes with professional e-commerce templates.",
    bullets: ["Instant setup", "Complete store structure", "Mobile optimized"],
    image: "/flow/pointone.avif",
  },
  {
    number: "02",
    title: "Customize Your Store Branding",
    description: "Personalize your store with your logo, brand colors, and style to match your business identity.",
    bullets: ["Brand colors & fonts", "Logo upload", "Store customization"],
    image: "/flow/pointtwo.avif",
  },
  {
    number: "03",
    title: "Add Your Products & Inventory",
    description: "Upload products with images, prices, descriptions, and manage your inventory efficiently.",
    bullets: ["Bulk product upload", "Inventory management", "Product variants"],
    image: "/flow/pointthree.avif",
  },
  {
    number: "04",
    title: "Go Live & Start Selling",
    description: "Publish your store and start accepting orders with secure payment processing and order management.",
    bullets: ["One-click publish", "Payment gateway ready", "Order management"],
    image: "/flow/pointfour.avif",
  },
];

export default function StepsContainer() {
  const [activeStep, setActiveStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
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
              onEnter: () => {
                setIsVisible(true);
              },
            },
          }
        );
      }

      // Set steps visible
      stepRefs.current.forEach((stepRef) => {
        if (!stepRef) return;
        gsap.set(stepRef, { opacity: 1, y: 0 });
      });

      // Refresh ScrollTrigger after setup
      ScrollTrigger.refresh();
    },
    { scope: sectionRef, dependencies: [refsReady] }
  );

  const mobileStepRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Infinite auto-advance loop
  useEffect(() => {
    if (!isVisible || isHovered) return;

    // Check if on desktop
    if (typeof window !== "undefined" && window.innerWidth < 768) return;

    const timer = setTimeout(() => {
      setActiveStep((prev) => (prev + 1) % steps.length);
    }, 3000);

    return () => clearTimeout(timer);
  }, [activeStep, isVisible, isHovered]);

  const handleStepClick = (index: number) => {
    // Only set the step, do not stop future animations
    setActiveStep(index);
  };

  return (
    <section ref={sectionRef} className='w-full py-12 sm:py-16 sm:pb-24 bg-white'>
      <div className='max-w-7xl mx-auto px-3'>
        {/* Header Section */}
        <div className='section-header'>
          <SectionHeader
            title='Start Your E-Commerce Business in 4 Simple Steps'
            subtitle='From setup to sales — launch your online store and start selling today.'
            className='mb-12 sm:mb-0'
          />
        </div>

        {/* Mobile-first stepper */}
        <div className='md:hidden mb-10'>
          <div className='space-y-0'>
            {steps.map((step, index) => {
              const isMobileActive = index === activeStep;

              return (
                <div
                  key={step.number}
                  className='flex w-full'
                  ref={(el) => {
                    mobileStepRefs.current[index] = el;
                  }}
                >
                  <div className='flex flex-col items-center mr-4 min-w-14'>
                    {/* Top Line */}
                    {index > 0 && (
                      <div className='w-0.5 h-6 bg-gray-100 relative overflow-hidden'>
                        <div
                          className={`absolute top-0 left-0 w-full bg-blue-200 transition-all duration-500 origin-top
                            ${activeStep >= index - 1 ? "h-full" : "h-0"}`}
                        />
                      </div>
                    )}
                    {index === 0 && <div className='h-6' />}

                    <div className='relative'>
                      <div
                        onClick={() => handleStepClick(index)}
                        className={`flex h-14 w-14 cursor-pointer items-center justify-center rounded-full text-[12px] font-semibold transition-all z-10 relative ${isMobileActive
                            ? "bg-[#0448FD] text-white shadow-[0_6px_16px_rgba(4,72,253,0.35)] scale-105"
                            : "bg-white text-gray-700 border border-gray-200"
                          }`}
                      >
                        {step.number}
                      </div>
                    </div>

                    {/* Bottom Line */}
                    <div className='w-0.5 flex-1 bg-gray-100 relative overflow-hidden'>
                      <div
                        className={`absolute top-0 left-0 w-full bg-blue-200 transition-all duration-500 origin-top
                            ${activeStep >= index ? "h-full" : "h-0"}`}
                      />
                    </div>
                  </div>

                  <div className='flex-1 pb-4 pt-10'>
                    <button
                      type='button'
                      className={`w-full text-left transition-all duration-300 ${isMobileActive ? "opacity-100" : "opacity-75"}`}
                      onClick={() => handleStepClick(index)}
                    >
                      <h3 className={`text-base font-semibold ${isMobileActive ? "text-gray-900" : "text-gray-700"}`}>{step.title}</h3>

                      <div
                        className={`grid transition-all duration-700 ease-in-out ${isMobileActive ? "grid-rows-[1fr] opacity-100 mt-2" : "grid-rows-[0fr] opacity-0 mt-0"
                          }`}
                      >
                        <div className='overflow-hidden'>
                          <p className='text-sm leading-relaxed text-gray-600'>{step.description}</p>
                          <div className='mt-3 flex flex-wrap gap-2'>
                            {step.bullets.map((bullet) => (
                              <span
                                key={bullet}
                                className='inline-flex items-center px-3 py-1.5 bg-blue-50 text-blue-700 text-xs font-semibold rounded-full border border-blue-100'
                              >
                                {bullet}
                              </span>
                            ))}
                          </div>
                          <div className='mt-3 relative h-48 w-full overflow-hidden rounded-2xl border border-blue-100 bg-blue-50/40'>
                            <Image src={step.image} alt={step.title} fill className='object-contain p-3' sizes='(max-width: 768px) 100vw' />
                          </div>
                        </div>
                      </div>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className='grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-12 items-start lg:items-center'>
          {/* Left Side - Steps */}
          <div className='w-full hidden md:block' onMouseEnter={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)}>
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
                onClick={() => handleStepClick(index)}
              />
            ))}
          </div>

          {/* Right Side - Clean Image Display */}
          <div className='hidden lg:flex w-full h-full min-h-[400px] lg:min-h-[600px] items-center justify-center relative lg:sticky lg:top-24'>
            <div className='step-image-container relative w-full h-[400px] sm:h-[500px] lg:h-[600px] overflow-hidden rounded-2xl'>
              {/* Image Stack */}
              {steps.map((step, index) => (
                <div
                  key={index}
                  className='absolute inset-0 transition-all duration-700 ease-out'
                  style={{
                    opacity: index === activeStep ? 1 : 0,
                    transform: `scale(${index === activeStep ? 1 : 0.95})`,
                    zIndex: index === activeStep ? 10 : 1,
                    pointerEvents: index === activeStep ? "auto" : "none",
                  }}
                >
                  <Image
                    src={step.image}
                    alt={step.title}
                    fill
                    className='object-contain transition-transform duration-700 ease-out'
                    priority={index === 0}
                  />
                </div>
              ))}
            </div>
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
>(({ step, index, isActive, activeStep, onClick }, ref) => {
  return (
    <div ref={ref} className={`relative cursor-pointer group w-full`} onClick={onClick}>
      <div className='flex w-full'>
        {/* Timeline indicator */}
        <div className='flex flex-col items-center mr-8 min-w-14'>
          {/* Top connecting line for non-first items */}
          {index > 0 && (
            <div className='w-0.5 h-6 bg-gray-100 relative overflow-hidden'>
              <div
                className={`absolute top-0 left-0 w-full bg-blue-200 transition-all duration-500 origin-top
                  ${activeStep >= index - 1 ? "h-full" : "h-0"}`}
              />
            </div>
          )}
          {/* Spacer for first item to align circle */}
          {index === 0 && <div className='h-6' />}

          {/* Step number circle */}
          <div
            className={`
              relative z-10 flex items-center justify-center
              w-14 h-14 rounded-full font-semibold text-lg
              transition-all duration-500 ease-out shrink-0
              ${isActive
                ? "bg-blue-600 text-white scale-110 shadow-lg shadow-blue-600/30"
                : "bg-gray-100 text-gray-500 group-hover:bg-gray-200"
              }
            `}
          >
            {step.number}
          </div>

          {/* Connecting line to next step */}
          <div
            className={`
                w-0.5 flex-1 bg-gray-100 relative overflow-hidden
            `}
          >
            <div
              className={`absolute top-0 left-0 w-full bg-blue-200 transition-all duration-500 origin-top
                ${activeStep >= index ? "h-full" : "h-0"}`}
            />
          </div>
        </div>

        {/* Content */}
        <div className='flex-1 pb-10 pt-8'>{index === steps.length - 1 && <div className='flex-1' />}</div>

        {/* Content */}
        <div className='pb-4 pt-8'>
          <h3
            className={`
              font-semibold text-xl sm:text-2xl lg:text-3xl
              transition-colors duration-300
              ${isActive ? "text-gray-900" : "text-gray-600 group-hover:text-gray-800"}
            `}
          >
            {step.title}
          </h3>

          {/* Expandable content */}
          <div
            className={`
              grid transition-all duration-700 ease-in-out
              ${isActive ? "grid-rows-[1fr] opacity-100 mt-3" : "grid-rows-[0fr] opacity-0 mt-0"}
            `}
          >
            <div className='overflow-hidden'>
              <p className='text-gray-500 text-base leading-relaxed mb-4'>{step.description}</p>

              <div className='flex flex-wrap gap-2'>
                {step.bullets.map((bullet, idx) => (
                  <span
                    key={idx}
                    className='inline-flex items-center px-3 py-1.5 bg-blue-50 text-blue-700 text-sm font-medium rounded-full'
                  >
                    {bullet}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

StepItem.displayName = "StepItem";
