"use client";

import React, { useRef } from "react";
import SectionHeader from "../../shared/SectionHeader";
import PageBottom from "../../shared/PageBottom";
import { FileText, Scale, AlertTriangle, CheckCircle2, Shield, Gavel } from "lucide-react";
import { cn } from "@/utils";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

interface TermSection {
  id: string;
  title: string;
  icon: React.ElementType;
  content: string[];
  highlight?: boolean;
}

const termSections: TermSection[] = [
  {
    id: "1",
    title: "Acceptance of Terms",
    icon: CheckCircle2,
    content: [
      "By accessing and using FrameX services, you accept and agree to be bound by these Terms of Service.",
      "If you do not agree to these terms, you may not use our services. We reserve the right to modify these terms at any time.",
      "Your continued use of our services after any changes constitutes acceptance of the modified terms.",
    ],
  },
  {
    id: "2",
    title: "Service Description",
    icon: FileText,
    content: [
      "FrameX provides an e-commerce platform that allows you to create, manage, and operate online stores.",
      "We offer various features including store management, payment processing, inventory management, and customer relationship tools.",
      "We reserve the right to modify, suspend, or discontinue any aspect of our services at any time without prior notice.",
    ],
  },
  {
    id: "3",
    title: "User Accounts and Responsibilities",
    icon: Shield,
    content: [
      "You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.",
      "You agree to provide accurate, current, and complete information during registration and to update such information to keep it accurate.",
      "You are responsible for all content you post, upload, or transmit through our services and must comply with all applicable laws and regulations.",
    ],
    highlight: true,
  },
  {
    id: "4",
    title: "Payment Terms",
    icon: Scale,
    content: [
      "Subscription fees are billed in advance on a monthly or annual basis, depending on your chosen plan.",
      "All fees are non-refundable except as required by law or as explicitly stated in our refund policy.",
      "We reserve the right to change our pricing at any time, but we will provide notice of any price changes before they take effect.",
    ],
  },
  {
    id: "5",
    title: "Intellectual Property",
    icon: Gavel,
    content: [
      "All content, features, and functionality of our services are owned by FrameX and are protected by international copyright, trademark, and other intellectual property laws.",
      "You may not copy, modify, distribute, sell, or lease any part of our services without our prior written consent.",
      "You retain ownership of any content you create using our services, but grant us a license to use, display, and distribute such content.",
    ],
  },
  {
    id: "6",
    title: "Limitation of Liability",
    icon: AlertTriangle,
    content: [
      "FrameX shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of our services.",
      "Our total liability to you for any claims arising from or related to our services shall not exceed the amount you paid us in the twelve months preceding the claim.",
      "We do not guarantee that our services will be uninterrupted, secure, or error-free, or that defects will be corrected.",
    ],
  },
];

export default function TermsOfServiceContainer() {
  const sectionRef = useRef<HTMLElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const introRef = useRef<HTMLDivElement>(null);
  const sectionsRef = useRef<(HTMLDivElement | null)[]>([]);
  const lastUpdatedRef = useRef<HTMLDivElement>(null);

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

      // Clean fade-up for intro
      if (introRef.current) {
        gsap.fromTo(
          introRef.current,
          { opacity: 0, y: 25 },
          {
            opacity: 1,
            y: 0,
            duration: 0.6,
            ease: "power3.out",
            scrollTrigger: {
              trigger: introRef.current,
              start: "top 90%",
              toggleActions: "play none none none",
            },
          }
        );
      }

      // Clean fade-up for term sections
      sectionsRef.current.forEach((section, index) => {
        if (!section) return;
        gsap.fromTo(
          section,
          { opacity: 0, y: 25 },
          {
            opacity: 1,
            y: 0,
            duration: 0.5,
            ease: "power3.out",
            delay: index * 0.06,
            scrollTrigger: {
              trigger: section,
              start: "top 90%",
              toggleActions: "play none none none",
            },
          }
        );
      });

      // Clean fade-up for last updated
      if (lastUpdatedRef.current) {
        gsap.fromTo(
          lastUpdatedRef.current,
          { opacity: 0, y: 15 },
          {
            opacity: 1,
            y: 0,
            duration: 0.5,
            ease: "power3.out",
            scrollTrigger: {
              trigger: lastUpdatedRef.current,
              start: "top 90%",
              toggleActions: "play none none none",
            },
          }
        );
      }
    },
    { scope: sectionRef }
  );

  return (
    <>
      <section ref={sectionRef} className='w-full pt-28 md:pt-32 lg:pt-48 space-y-8 md:space-y-16 bg-white'>
        <div className='max-w-5xl mx-auto px-3'>
          {/* Header */}
          <div ref={headerRef} className='mb-8 sm:mb-10 md:mb-12'>
            <SectionHeader
              title='Terms of Service'
              subtitle='Please read these terms carefully before using our services. By using FrameX, you agree to be bound by these terms and conditions.'
            />
          </div>

          {/* Last Updated */}
          <div ref={lastUpdatedRef} className='mb-8 sm:mb-10 text-center'>
            <p
              className='text-xs sm:text-sm text-gray-500'
              style={{
                fontFamily: '"Segoe UI", system-ui, -apple-system, sans-serif',
              }}
            >
              Last Updated: January 2025
            </p>
          </div>

          {/* Introduction */}
          <div ref={introRef} className='mb-10 sm:mb-12 md:mb-16'>
            <div className='bg-linear-to-br from-blue-50 to-indigo-50 rounded-xl p-6 sm:p-8 border border-blue-100'>
              <p
                className='text-sm sm:text-base md:text-lg text-gray-700 leading-relaxed'
                style={{
                  fontFamily: '"Segoe UI", system-ui, -apple-system, sans-serif',
                  lineHeight: "1.8",
                }}
              >
                These Terms of Service ("Terms") govern your access to and use of FrameX's website, platform, and services. By accessing or
                using our services, you agree to comply with and be bound by these Terms. If you do not agree to these Terms, you may not
                use our services.
              </p>
            </div>
          </div>

          {/* Terms Sections */}
          <div className='space-y-6 sm:space-y-8'>
            {termSections.map((section, index) => {
              const Icon = section.icon;
              return (
                <div
                  key={section.id}
                  ref={(el) => {
                    sectionsRef.current[index] = el;
                  }}
                  className={cn(
                    "relative rounded-xl p-6 sm:p-8 border transition-all duration-300 hover:shadow-lg",
                    section.highlight
                      ? "bg-linear-to-br from-blue-50 to-indigo-50 border-blue-200 shadow-md"
                      : "bg-white border-gray-200 hover:border-gray-300"
                  )}
                >
                  {/* Section Header */}
                  <div className='flex items-start gap-4 sm:gap-5 mb-4 sm:mb-5'>
                    <div
                      className={cn(
                        "w-12 h-12 sm:w-14 sm:h-14 rounded-lg flex items-center justify-center shrink-0 shadow-md transition-transform duration-300 hover:scale-110",
                        section.highlight ? "bg-linear-to-br from-[#0448FD] to-[#0038d4]" : "bg-linear-to-br from-gray-700 to-gray-900"
                      )}
                    >
                      <Icon className='w-6 h-6 sm:w-7 sm:h-7 text-white' />
                    </div>
                    <div className='flex-1'>
                      <h3
                        className={cn(
                          "text-lg sm:text-xl md:text-2xl font-semibold mb-2 transition-colors duration-300",
                          section.highlight ? "text-[#0448FD]" : "text-gray-900"
                        )}
                        style={{
                          fontFamily: "var(--font-urbanist), sans-serif",
                          fontWeight: 600,
                          lineHeight: "1.3",
                        }}
                      >
                        {section.title}
                      </h3>
                      {section.highlight && <div className='w-20 h-1 bg-linear-to-r from-[#0448FD] to-[#0038d4] rounded-full' />}
                    </div>
                  </div>

                  {/* Section Content */}
                  <div className='space-y-3 sm:space-y-4 pl-0 sm:pl-[calc(3.5rem+1.25rem)]'>
                    {section.content.map((paragraph, pIndex) => (
                      <p
                        key={pIndex}
                        className='text-sm sm:text-base text-gray-700 leading-relaxed'
                        style={{
                          fontFamily: '"Segoe UI", system-ui, -apple-system, sans-serif',
                          lineHeight: "1.7",
                        }}
                      >
                        {paragraph}
                      </p>
                    ))}
                  </div>

                  {/* Decorative Element for Highlighted Section */}
                  {section.highlight && (
                    <div className='absolute top-0 right-0 w-32 h-32 bg-linear-to-br from-blue-500/5 to-purple-500/5 rounded-full blur-3xl' />
                  )}
                </div>
              );
            })}
          </div>

          {/* Contact Section */}
          <div className='mt-12 sm:mt-16 md:mt-20'>
            <div className='bg-gray-50 rounded-xl p-6 sm:p-8 border border-gray-200'>
              <h3
                className='text-lg sm:text-xl md:text-2xl font-semibold text-gray-900 mb-4'
                style={{
                  fontFamily: "var(--font-urbanist), sans-serif",
                  fontWeight: 600,
                }}
              >
                Questions About Terms?
              </h3>
              <p
                className='text-sm sm:text-base text-gray-700 leading-relaxed mb-4'
                style={{
                  fontFamily: '"Segoe UI", system-ui, -apple-system, sans-serif',
                  lineHeight: "1.7",
                }}
              >
                If you have any questions about these Terms of Service, please contact us at:
              </p>
              <div className='space-y-2'>
                <p
                  className='text-sm sm:text-base text-[#0448FD] font-medium'
                  style={{
                    fontFamily: '"Segoe UI", system-ui, -apple-system, sans-serif',
                  }}
                >
                  Email: legal@framex.com
                </p>
                <p
                  className='text-sm sm:text-base text-[#0448FD] font-medium'
                  style={{
                    fontFamily: '"Segoe UI", system-ui, -apple-system, sans-serif',
                  }}
                >
                  Address: Sajahanpur, Bogura, Bangladesh
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Page Bottom CTA */}
        <PageBottom
          title='Need Help Understanding Our Terms?'
          subtitle='Our support team is available to answer any questions you may have about our Terms of Service.'
          buttonText='Contact Support'
          buttonHref='/contact-us'
          variant='gradient'
        />
      </section>
    </>
  );
}
