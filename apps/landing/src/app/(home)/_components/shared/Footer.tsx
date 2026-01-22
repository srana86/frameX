"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Twitter, Facebook, Linkedin, Youtube } from "lucide-react";

export default function Footer() {
  const [email, setEmail] = useState("");

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle subscription logic here
    console.log("Subscribed:", email);
    setEmail("");
  };

  return (
    <footer
      className='relative w-full text-white overflow-x-hidden'
      style={{
        display: "block",
        visibility: "visible",
        opacity: 1,
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
        minHeight: "auto",
      }}
    >
      {/* Background - CSS Gradient for better mobile support */}
      <div
        className='absolute inset-0 w-full h-full pointer-events-none'
        style={{
          background:
            "radial-gradient(ellipse at center 100%, #2078FF 0%, rgba(32, 120, 255, 0.95) 30%, rgba(32, 120, 255, 0.85) 50%, rgba(32, 120, 255, 0.7) 70%, rgba(32, 120, 255, 0.5) 85%, transparent 100%)",
          minHeight: "100%",
        }}
      >
        {/* SVG Background - Progressive enhancement for desktop */}
        <svg
          width='100%'
          height='100%'
          viewBox='0 0 1440 620'
          fill='none'
          xmlns='http://www.w3.org/2000/svg'
          preserveAspectRatio='xMidYMid slice'
          className='w-full h-full hidden md:block'
          style={{ minHeight: "100%" }}
        >
          <g filter='url(#filter0_f_9134_3706)'>
            <ellipse cx={720} cy={788.5} rx={1358} ry={739.5} fill='#2078FF' />
          </g>
          <defs>
            <filter
              id='filter0_f_9134_3706'
              x={-938}
              y={-251}
              width={3316}
              height={2079}
              filterUnits='userSpaceOnUse'
              colorInterpolationFilters='sRGB'
            >
              <feFlood floodOpacity={0} result='BackgroundImageFix' />
              <feBlend mode='normal' in='SourceGraphic' in2='BackgroundImageFix' result='shape' />
              <feGaussianBlur stdDeviation={150} result='effect1_foregroundBlur_9134_3706' />
            </filter>
          </defs>
        </svg>
      </div>

      <div className='relative z-10 max-w-7xl mx-auto px-4 sm:px-3 pt-8 sm:pt-12 md:pt-16 lg:pt-20'>
        {/* Top Section - First Column: Logo, Social, Email */}
        <div className='grid grid-cols-1 lg:grid-cols-5 gap-6 sm:gap-8 md:gap-10 lg:gap-12 xl:gap-16 2xl:gap-20'>
          {/* First Column - Logo, Social, and Email (2 columns width on large devices) */}
          <div className='lg:col-span-2 space-y-4 sm:space-y-5 md:space-y-6 w-full'>
            <div className='flex flex-col xs:flex-row items-start xs:items-center justify-between gap-3 xs:gap-4 sm:gap-5 md:gap-6'>
              {/* Logo */}
              <div className='flex items-center shrink-0'>
                <Image
                  src='/logo/framex-white.avif'
                  alt='FrameX Logo'
                  width={150}
                  height={40}
                  className='w-auto h-6 sm:h-7 md:h-8 lg:h-9 object-contain transition-transform duration-300 hover:scale-105'
                  priority
                />
              </div>

              {/* Social Media Icons - Horizontal Row */}
              <div className='flex flex-row gap-2 sm:gap-3 md:gap-4 w-fit flex-wrap'>
                {[
                  { icon: Twitter, href: "https://x.com", label: "X (Twitter)" },
                  { icon: Facebook, href: "https://facebook.com", label: "Facebook" },
                  { icon: Linkedin, href: "https://linkedin.com", label: "LinkedIn" },
                  { icon: Youtube, href: "https://youtube.com", label: "YouTube" },
                ].map((social) => {
                  const Icon = social.icon;
                  return (
                    <a
                      key={social.label}
                      href={social.href}
                      target='_blank'
                      rel='noopener noreferrer'
                      className='size-7 sm:size-8 md:size-9 lg:size-10 rounded-full bg-white/15 hover:bg-white/25 backdrop-blur-md border border-white/50 hover:border-white/70 flex items-center justify-center transition-all duration-300 hover:scale-110 hover:shadow-lg hover:shadow-blue-500/30 cursor-pointer group shrink-0'
                      aria-label={social.label}
                    >
                      <Icon className='size-3.5 sm:size-4 md:size-5 text-white transition-transform duration-300 group-hover:scale-110' />
                    </a>
                  );
                })}
              </div>
            </div>

            {/* Subscribe Section */}
            <div className='space-y-3 sm:space-y-4 md:space-y-5 w-full'>
              <h3
                className='text-base sm:text-lg md:text-xl font-semibold text-white'
                style={{
                  fontFamily: "var(--font-urbanist), sans-serif",
                  fontWeight: 600,
                }}
              >
                Subscribe to FrameX
              </h3>

              {/* Email Input with Button on Right - Absolute Positioned */}
              <form onSubmit={handleSubscribe} className='relative w-full' suppressHydrationWarning>
                <input
                  type='email'
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder='Enter your Email'
                  required
                  className='w-full px-4 sm:px-5 md:px-6 py-2.5 sm:py-3 md:py-3.5 pr-[100px] sm:pr-24 md:pr-28 rounded-full border border-white/40 bg-white/15 backdrop-blur-md text-white placeholder:text-white/80 focus:outline-none focus:border-white/70 focus:bg-white/20 focus:ring-2 focus:ring-blue-400/50 transition-all duration-300 text-xs sm:text-sm md:text-base shadow-lg'
                  style={{
                    fontFamily: '"Segoe UI", system-ui, -apple-system, sans-serif',
                  }}
                  suppressHydrationWarning
                />
                <button
                  type='submit'
                  className='absolute cursor-pointer right-1 sm:right-1.5 md:right-2 top-1/2 -translate-y-1/2 h-[36px] sm:h-[38px] md:h-[42px] px-5 sm:px-4 md:px-6 bg-[#0348FD]/80 hover:bg-[#0348FD] rounded-full font-semibold text-white transition-all duration-300 hover:scale-105 active:scale-95 hover:shadow-lg hover:shadow-blue-500/50 text-xs sm:text-xs md:text-sm whitespace-nowrap flex items-center justify-center'
                  style={{
                    fontFamily: "var(--font-urbanist), sans-serif",
                    fontWeight: 600,
                  }}
                  suppressHydrationWarning
                >
                  Sign up
                </button>
              </form>
            </div>
          </div>

          {/* Three Columns - Navigation Links */}
          <div className='lg:col-span-3 grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8 md:gap-10 lg:gap-12 w-full'>
            {/* Explore Column */}
            <div className='space-y-3 sm:space-y-4 min-w-0'>
              <h4
                className='text-base sm:text-lg md:text-xl font-semibold mb-3 sm:mb-4 text-white break-words'
                style={{
                  fontFamily: "var(--font-urbanist), sans-serif",
                  fontWeight: 600,
                }}
              >
                Explore
              </h4>
              <ul className='space-y-2 sm:space-y-3'>
                {[
                  { label: "About Us", href: "/about-us" },
                  { label: "Contact Us", href: "/contact-us" },
                  { label: "Solutions", href: "/#features" },
                  { label: "Blog", href: "#" },
                ].map((link) => (
                  <li key={link.label} className='break-words'>
                    <Link
                      href={link.href}
                      onClick={(e) => {
                        if (link.href.includes("#")) {
                          e.preventDefault();
                          const sectionId = link.href.split("#")[1];
                          const element = document.getElementById(sectionId);
                          if (element) {
                            const navbarHeight = 80;
                            const elementPosition = element.getBoundingClientRect().top;
                            const offsetPosition = elementPosition + window.pageYOffset - navbarHeight;
                            window.scrollTo({
                              top: offsetPosition,
                              behavior: "smooth",
                            });
                          } else {
                            window.location.href = link.href;
                          }
                        }
                      }}
                      className='text-white/95 hover:text-white transition-all duration-300 text-xs sm:text-sm md:text-base cursor-pointer inline-block hover:translate-x-1 hover:underline underline-offset-4 break-words'
                      style={{
                        fontFamily: '"Segoe UI", system-ui, -apple-system, sans-serif',
                      }}
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Solutions Column */}
            <div className='space-y-3 sm:space-y-4 min-w-0'>
              <h4
                className='text-base sm:text-lg md:text-xl font-semibold mb-3 sm:mb-4 text-white break-words'
                style={{
                  fontFamily: "var(--font-urbanist), sans-serif",
                  fontWeight: 600,
                }}
              >
                Solutions
              </h4>
              <ul className='space-y-2 sm:space-y-3'>
                {[
                  { label: "Features", href: "/#features" },
                  { label: "Pricing", href: "/#pricing" },
                  { label: "How It Works", href: "/#steps" },
                  { label: "Demo", href: "/#demo" },
                ].map((link) => (
                  <li key={link.label} className='break-words'>
                    <Link
                      href={link.href}
                      onClick={(e) => {
                        if (link.href.includes("#")) {
                          e.preventDefault();
                          const sectionId = link.href.split("#")[1];
                          const element = document.getElementById(sectionId);
                          if (element) {
                            const navbarHeight = 80;
                            const elementPosition = element.getBoundingClientRect().top;
                            const offsetPosition = elementPosition + window.pageYOffset - navbarHeight;
                            window.scrollTo({
                              top: offsetPosition,
                              behavior: "smooth",
                            });
                          } else {
                            window.location.href = link.href;
                          }
                        }
                      }}
                      className='text-white/95 hover:text-white transition-all duration-300 text-xs sm:text-sm md:text-base cursor-pointer inline-block hover:translate-x-1 hover:underline underline-offset-4 break-words'
                      style={{
                        fontFamily: '"Segoe UI", system-ui, -apple-system, sans-serif',
                      }}
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Resources Column */}
            <div className='space-y-3 sm:space-y-4 min-w-0'>
              <h4
                className='text-base sm:text-lg md:text-xl font-semibold mb-3 sm:mb-4 text-white break-words'
                style={{
                  fontFamily: "var(--font-urbanist), sans-serif",
                  fontWeight: 600,
                }}
              >
                Resources
              </h4>
              <ul className='space-y-2 sm:space-y-3'>
                {[
                  { label: "Help Center", href: "/#faq" },
                  { label: "FAQs", href: "/#faq" },
                  { label: "Terms of Service", href: "/terms-of-service" },
                  { label: "Privacy Policy", href: "/privacy-policy" },
                ].map((link) => (
                  <li key={link.label} className='break-words'>
                    <Link
                      href={link.href}
                      onClick={(e) => {
                        if (link.href.includes("#")) {
                          e.preventDefault();
                          const sectionId = link.href.split("#")[1];
                          const element = document.getElementById(sectionId);
                          if (element) {
                            const navbarHeight = 80;
                            const elementPosition = element.getBoundingClientRect().top;
                            const offsetPosition = elementPosition + window.pageYOffset - navbarHeight;
                            window.scrollTo({
                              top: offsetPosition,
                              behavior: "smooth",
                            });
                          } else {
                            window.location.href = link.href;
                          }
                        }
                      }}
                      className='text-white/95 hover:text-white transition-all duration-300 text-xs sm:text-sm md:text-base cursor-pointer inline-block hover:translate-x-1 hover:underline underline-offset-4 break-words'
                      style={{
                        fontFamily: '"Segoe UI", system-ui, -apple-system, sans-serif',
                      }}
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom Section - Border, Terms, Copyright, and Logo */}
        <div className='relative pt-6 sm:pt-8 md:pt-10 lg:pt-12 border-t-[1px] mt-10 border-white/40'>
          {/* Terms and Copyright - Flex Justify Between */}
          <div className='flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-4 md:gap-6 mb-4 sm:mb-6 md:mb-8'>
            <Link
              href='/terms-of-service'
              className='text-white/90 hover:text-white text-xs sm:text-sm md:text-base cursor-pointer transition-all duration-300 hover:underline underline-offset-4 text-center sm:text-left break-words'
              style={{
                fontFamily: '"Segoe UI", system-ui, -apple-system, sans-serif',
              }}
            >
              Terms & Condition
            </Link>
            <p
              className='text-white/90 text-xs sm:text-sm md:text-base text-center sm:text-right break-words px-2'
              style={{
                fontFamily: '"Segoe UI", system-ui, -apple-system, sans-serif',
              }}
            >
              ©2026 FrameX Tech. All Rights Reserved
            </p>
          </div>

          {/* FrameX Shade Logo at Bottom */}
          <div className='relative flex items-center justify-center z-20 w-full overflow-hidden px-2'>
            <Image
              src='/logo/FrameX-Shade-Logo.avif'
              alt='FrameX Logo'
              width={1152}
              height={200}
              className='w-full max-w-full sm:max-w-2xl md:max-w-4xl lg:max-w-6xl h-auto object-contain opacity-90 transition-opacity duration-300 hover:opacity-100'
              priority={false}
            />
          </div>
        </div>
      </div>
    </footer>
  );
}
