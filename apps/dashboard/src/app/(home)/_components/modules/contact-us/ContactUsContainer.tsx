"use client";

import React, { useRef, useState } from "react";
import SectionHeader from "../../shared/SectionHeader";
import { Mail, Phone, MapPin, SendHorizonal } from "lucide-react";
import { cn } from "@/utils";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { StartBuildingButton } from "../../ui/button";
import PlatformBenefits from "../../shared/PlatformBenefits";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

interface ContactInfo {
  id: string;
  icon: React.ElementType;
  title: string;
  description: string;
  value: string;
}

const contactInfo: ContactInfo[] = [
  {
    id: "1",
    icon: Mail,
    title: "Email Us",
    description: "Send us an email anytime",
    value: "support@framex.com",
  },
  {
    id: "2",
    icon: Phone,
    title: "Call Us",
    description: "Mon to Fri from 9am to 6pm",
    value: "+8801797660947",
  },
  {
    id: "3",
    icon: MapPin,
    title: "Visit Us",
    description: "Come say hello at our office",
    value: "Sajahanpur, Bogura, Bangladesh",
  },
];

export default function ContactUsContainer() {
  const sectionRef = useRef<HTMLElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const cardsRef = useRef<(HTMLDivElement | null)[]>([]);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

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

      // Clean fade-up for contact info cards
      cardsRef.current.forEach((card, index) => {
        if (!card) return;
        gsap.fromTo(
          card,
          { opacity: 0, y: 25 },
          {
            opacity: 1,
            y: 0,
            duration: 0.5,
            ease: "power3.out",
            delay: index * 0.08,
            scrollTrigger: {
              trigger: card,
              start: "top 90%",
              toggleActions: "play none none none",
            },
          }
        );
      });

      // Clean fade-up for form
      if (formRef.current) {
        gsap.fromTo(
          formRef.current,
          { opacity: 0, y: 25 },
          {
            opacity: 1,
            y: 0,
            duration: 0.6,
            ease: "power3.out",
            scrollTrigger: {
              trigger: formRef.current,
              start: "top 90%",
              toggleActions: "play none none none",
            },
          }
        );
      }
    },
    { scope: sectionRef }
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate form submission
    setTimeout(() => {
      console.log("Form submitted:", formData);
      setIsSubmitting(false);
      setFormData({
        name: "",
        email: "",
        subject: "",
        message: "",
      });
      alert("Thank you for your message! We'll get back to you soon.");
    }, 1000);
  };

  return (
    <section ref={sectionRef} className='w-full pt-28 md:pt-32 lg:pt-48 space-y-8 md:space-y-16 mb-10 md:mb-16 bg-white'>
      <div className='max-w-7xl mx-auto px-3'>
        {/* Header */}
        <div ref={headerRef} className='mb-8 sm:mb-10 md:mb-12'>
          <SectionHeader
            title='Get in Touch'
            subtitle="Have a question or want to work together? We'd love to hear from you. Send us a message and we'll respond as soon as possible."
          />
        </div>

        {/* Contact Info Cards */}
        <div className='grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5 mb-8 sm:mb-10 md:mb-12'>
          {contactInfo.map((info, index) => {
            const Icon = info.icon;
            return (
              <div
                key={info.id}
                ref={(el) => {
                  cardsRef.current[index] = el;
                }}
                className='group relative p-4 sm:p-5 rounded-lg bg-white border border-gray-200 hover:border-[#0448FD]/40 hover:bg-gray-50/50 transition-all duration-200'
              >
                <div className='flex items-start gap-3 sm:gap-4'>
                  {/* Icon */}
                  <div className='w-10 h-10 sm:w-11 sm:h-11 rounded-lg bg-linear-to-br from-[#0448FD] to-[#0038d4] flex items-center justify-center shrink-0 shadow-sm group-hover:shadow-md transition-all duration-200 group-hover:scale-105'>
                    <Icon className='w-5 h-5 sm:w-6 sm:h-6 text-white' />
                  </div>

                  {/* Content */}
                  <div className='flex-1 min-w-0'>
                    <h3
                      className='text-sm sm:text-base font-semibold text-gray-900 mb-1 group-hover:text-[#0448FD] transition-colors duration-200'
                      style={{
                        fontFamily: "var(--font-urbanist), sans-serif",
                        fontWeight: 600,
                        lineHeight: "1.4",
                      }}
                    >
                      {info.title}
                    </h3>
                    <p
                      className='text-xs sm:text-sm text-gray-600 mb-1.5'
                      style={{
                        fontFamily: '"Segoe UI", system-ui, -apple-system, sans-serif',
                        lineHeight: "1.4",
                      }}
                    >
                      {info.description}
                    </p>
                    <p
                      className='text-xs sm:text-sm text-[#0448FD] font-medium wrap-break-word'
                      style={{
                        fontFamily: '"Segoe UI", system-ui, -apple-system, sans-serif',
                        fontWeight: 500,
                        lineHeight: "1.4",
                      }}
                    >
                      {info.value}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Contact Form */}
        <div className='max-w-3xl mx-auto'>
          <form ref={formRef} onSubmit={handleSubmit} className='space-y-4 sm:space-y-5'>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5'>
              {/* Name Input */}
              <div className='space-y-1.5'>
                <label
                  htmlFor='name'
                  className='text-xs sm:text-sm font-medium text-gray-700'
                  style={{
                    fontFamily: '"Segoe UI", system-ui, -apple-system, sans-serif',
                  }}
                >
                  Name *
                </label>
                <input
                  type='text'
                  id='name'
                  name='name'
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className='w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg border border-gray-200 bg-white focus:outline-none focus:border-[#0448FD] focus:ring-2 focus:ring-blue-100 transition-all duration-200 text-sm sm:text-base text-gray-900 placeholder:text-gray-400'
                  style={{
                    fontFamily: '"Segoe UI", system-ui, -apple-system, sans-serif',
                  }}
                  placeholder='Your name'
                />
              </div>

              {/* Email Input */}
              <div className='space-y-1.5'>
                <label
                  htmlFor='email'
                  className='text-xs sm:text-sm font-medium text-gray-700'
                  style={{
                    fontFamily: '"Segoe UI", system-ui, -apple-system, sans-serif',
                  }}
                >
                  Email *
                </label>
                <input
                  type='email'
                  id='email'
                  name='email'
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className='w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg border border-gray-200 bg-white focus:outline-none focus:border-[#0448FD] focus:ring-2 focus:ring-blue-100 transition-all duration-200 text-sm sm:text-base text-gray-900 placeholder:text-gray-400'
                  style={{
                    fontFamily: '"Segoe UI", system-ui, -apple-system, sans-serif',
                  }}
                  placeholder='your.email@example.com'
                />
              </div>
            </div>

            {/* Subject Input */}
            <div className='space-y-1.5'>
              <label
                htmlFor='subject'
                className='text-xs sm:text-sm font-medium text-gray-700'
                style={{
                  fontFamily: '"Segoe UI", system-ui, -apple-system, sans-serif',
                }}
              >
                Subject *
              </label>
              <input
                type='text'
                id='subject'
                name='subject'
                value={formData.subject}
                onChange={handleChange}
                required
                className='w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg border border-gray-200 bg-white focus:outline-none focus:border-[#0448FD] focus:ring-2 focus:ring-blue-100 transition-all duration-200 text-sm sm:text-base text-gray-900 placeholder:text-gray-400'
                style={{
                  fontFamily: '"Segoe UI", system-ui, -apple-system, sans-serif',
                }}
                placeholder='What is this regarding?'
              />
            </div>

            {/* Message Textarea */}
            <div className='space-y-1.5'>
              <label
                htmlFor='message'
                className='text-xs sm:text-sm font-medium text-gray-700'
                style={{
                  fontFamily: '"Segoe UI", system-ui, -apple-system, sans-serif',
                }}
              >
                Message *
              </label>
              <textarea
                id='message'
                name='message'
                value={formData.message}
                onChange={handleChange}
                required
                rows={5}
                className='w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg border border-gray-200 bg-white focus:outline-none focus:border-[#0448FD] focus:ring-2 focus:ring-blue-100 transition-all duration-200 text-sm sm:text-base text-gray-900 placeholder:text-gray-400 resize-none'
                style={{
                  fontFamily: '"Segoe UI", system-ui, -apple-system, sans-serif',
                }}
                placeholder='Tell us more about your inquiry...'
              />
            </div>

            {/* Submit Button */}
            <div className='flex items-center justify-center'>
              <StartBuildingButton type='submit' text='Send Message' icon={SendHorizonal} iconPosition='right' disabled={isSubmitting} />
            </div>
          </form>
        </div>
      </div>
      <PlatformBenefits />
    </section>
  );
}
