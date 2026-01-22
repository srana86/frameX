"use client";

import React, { useRef } from "react";
import SectionHeader from "../../shared/SectionHeader";
import PageBottom from "../../shared/PageBottom";
import { Shield, Lock, Eye, FileText, CheckCircle, AlertCircle } from "lucide-react";
import { cn } from "@/utils";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

interface PolicySection {
  id: string;
  title: string;
  icon: React.ElementType;
  content: string[];
  highlight?: boolean;
}

const policySections: PolicySection[] = [
  {
    id: "1",
    title: "Information We Collect",
    icon: FileText,
    content: [
      "We collect information that you provide directly to us, such as when you create an account, make a purchase, or contact us for support.",
      "This includes your name, email address, phone number, billing address, payment information, and any other information you choose to provide.",
      "We also automatically collect certain information about your device and how you interact with our services, including IP address, browser type, and usage data.",
    ],
  },
  {
    id: "2",
    title: "How We Use Your Information",
    icon: Eye,
    content: [
      "We use the information we collect to provide, maintain, and improve our services, process transactions, and send you related information.",
      "Your information helps us personalize your experience, respond to your inquiries, and provide customer support.",
      "We may use your information to send you promotional communications, but you can opt out at any time.",
    ],
  },
  {
    id: "3",
    title: "Data Security",
    icon: Lock,
    content: [
      "We implement appropriate technical and organizational security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.",
      "We use industry-standard encryption technologies and secure servers to safeguard your data.",
      "However, no method of transmission over the internet is 100% secure, and we cannot guarantee absolute security.",
    ],
    highlight: true,
  },
  {
    id: "4",
    title: "Your Rights",
    icon: CheckCircle,
    content: [
      "You have the right to access, update, or delete your personal information at any time through your account settings.",
      "You can opt out of marketing communications by clicking the unsubscribe link in our emails or contacting us directly.",
      "You may request a copy of your personal data or ask us to restrict or object to certain processing activities.",
    ],
  },
  {
    id: "5",
    title: "Cookies and Tracking",
    icon: Shield,
    content: [
      "We use cookies and similar tracking technologies to enhance your experience, analyze usage patterns, and improve our services.",
      "You can control cookies through your browser settings, but disabling cookies may limit some functionality of our services.",
      "We use both session cookies (which expire when you close your browser) and persistent cookies (which remain until deleted).",
    ],
  },
  {
    id: "6",
    title: "Third-Party Services",
    icon: AlertCircle,
    content: [
      "We may share your information with trusted third-party service providers who assist us in operating our platform and conducting our business.",
      "These third parties are contractually obligated to keep your information confidential and use it only for the purposes we specify.",
      "We do not sell your personal information to third parties for their marketing purposes.",
    ],
  },
];

export default function PrivacyPolicyContainer() {
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

      // Clean fade-up for policy sections
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
              title='Privacy Policy'
              subtitle='Your privacy is important to us. This policy explains how we collect, use, and protect your personal information when you use our services.'
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
                At FrameX, we are committed to protecting your privacy and ensuring the security of your personal information. This Privacy
                Policy describes how we collect, use, disclose, and safeguard your information when you visit our website or use our
                services. By using our services, you agree to the collection and use of information in accordance with this policy.
              </p>
            </div>
          </div>

          {/* Policy Sections */}
          <div className='space-y-6 sm:space-y-8'>
            {policySections.map((section, index) => {
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
                Contact Us
              </h3>
              <p
                className='text-sm sm:text-base text-gray-700 leading-relaxed mb-4'
                style={{
                  fontFamily: '"Segoe UI", system-ui, -apple-system, sans-serif',
                  lineHeight: "1.7",
                }}
              >
                If you have any questions about this Privacy Policy or our data practices, please contact us at:
              </p>
              <div className='space-y-2'>
                <p
                  className='text-sm sm:text-base text-[#0448FD] font-medium'
                  style={{
                    fontFamily: '"Segoe UI", system-ui, -apple-system, sans-serif',
                  }}
                >
                  Email: privacy@framex.com
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
          title='Have Questions About Privacy?'
          subtitle='Our team is here to help. Contact us if you have any concerns about your privacy or data protection.'
          buttonText='Contact Us'
          buttonHref='/contact-us'
          variant='gradient'
        />
      </section>
    </>
  );
}
