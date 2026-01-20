"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ArrowRight, Menu, X, CreditCard, Mail, Sparkles, Layers, HelpCircle, UserRound, LogIn, Info, BookOpen } from "lucide-react";
import { StartBuildingButton } from "../ui/button";

const navLinks = [
  { href: "#features", label: "Features", icon: Layers, description: "Explore features", sectionId: "features" },
  { href: "#pricing", label: "Pricing", icon: CreditCard, description: "Plans & pricing", sectionId: "pricing" },
  { href: "#faq", label: "FAQ", icon: HelpCircle, description: "Frequently asked", sectionId: "faq" },
  { href: "/about-us", label: "About Us", icon: Info, description: "Learn about us", sectionId: "about-us" },
  { href: "/blog", label: "Blog", icon: BookOpen, description: "Latest updates", sectionId: "blog" },
  { href: "/contact-us", label: "Contact Us", icon: Mail, description: "Get in touch", sectionId: "contact-us" },
];

// Important links for mobile (filtered subset)
const mobileNavLinks = navLinks.filter((link) => ["features", "pricing", "about-us", "blog", "contact-us"].includes(link.sectionId));

export default function Navbar() {
  const merchantLoginUrl = "/login";
  const merchantSignupUrl = "/register";
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [scrollActiveIndex, setScrollActiveIndex] = useState<number | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  // Calculate active index based on route or scroll state
  const activeIndex = pathname === "/" ? scrollActiveIndex : mobileNavLinks.findIndex((link) => link.href === pathname);

  // Handle navbar opening animation from top
  useEffect(() => {
    // Trigger animation after component mounts - use requestAnimationFrame for smoother animation
    const rafId = requestAnimationFrame(() => {
      setTimeout(() => {
        setIsMounted(true);
      }, 100);
    });
    return () => cancelAnimationFrame(rafId);
  }, []);

  // Handle scroll effect with smooth threshold
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    // Check initial scroll position
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflowX = "hidden";
      document.body.style.overflowY = "hidden";
    } else {
      document.body.style.overflowX = "hidden";
      document.body.style.overflowY = "auto";
    }
    return () => {
      document.body.style.overflowX = "hidden";
      document.body.style.overflowY = "auto";
    };
  }, [isOpen]);

  // Scroll Spy Logic (Home Page Only)
  useEffect(() => {
    if (pathname !== "/") {
      return;
    }

    const updateActive = () => {
      const marker = Math.round(window.innerHeight * 0.3);
      let nextIndex: number | null = null;

      mobileNavLinks.forEach((link, index) => {
        if (!link.sectionId || link.href.startsWith("/")) {
          return;
        }
        const element = document.getElementById(link.sectionId);
        if (!element) {
          return;
        }
        const rect = element.getBoundingClientRect();
        if (rect.top <= marker && rect.bottom > marker) {
          nextIndex = index;
        }
      });

      if (nextIndex === null) {
        // defaulting to first item if nothing active (optional)
        // nextIndex = 0;
      }

      setScrollActiveIndex((prev) => (prev === nextIndex ? prev : nextIndex));
    };

    updateActive();
    window.addEventListener("scroll", updateActive, { passive: true });
    window.addEventListener("resize", updateActive);
    return () => {
      window.removeEventListener("scroll", updateActive);
      window.removeEventListener("resize", updateActive);
    };
  }, [pathname, isOpen]);

  const toggleMenu = () => setIsOpen(!isOpen);
  const closeMenu = () => setIsOpen(false);

  // Smooth scroll to section
  const scrollToSection = (sectionId: string, e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();

    // Check if we're on the home page
    const isHomePage = pathname === "/";

    if (!isHomePage) {
      // If not on home page, navigate to home page with hash
      router.push(`/#${sectionId}`);
      closeMenu();

      // Wait for navigation and then scroll
      setTimeout(() => {
        const element = document.getElementById(sectionId);
        if (element) {
          const navbarHeight = 80;
          const elementPosition = element.getBoundingClientRect().top;
          const offsetPosition = elementPosition + window.pageYOffset - navbarHeight;

          window.scrollTo({
            top: offsetPosition,
            behavior: "smooth",
          });
        }
      }, 100);
      return;
    }

    // If on home page, scroll directly
    const element = document.getElementById(sectionId);
    if (element) {
      const navbarHeight = 80; // Approximate navbar height
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - navbarHeight;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      });
    }
    closeMenu();
  };

  // Animation timing constants (in ms)
  const ANIM = {
    duration: 250,
    open: {
      navbarOut: 0,
      backdrop: 0,
      logoIn: 100,
      closeBtn: 150,
      navStart: 180,
      navStep: 45,
      bottom: 400,
    },
    close: {
      bottom: 0,
      navStart: 0,
      navStep: 20,
      logoOut: 50,
      closeBtn: 0,
      backdrop: 100,
      navbarIn: 200,
    },
  };

  // Logo size constant for both navbars (mobile)
  const LOGO_HEIGHT = "20px";

  return (
    <>
      {/* Main Navbar - Hides on mobile when menu is open */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 w-full ${isMounted ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0"}`}
        style={{
          paddingTop: `calc(${isScrolled ? "0.5rem" : "0.75rem"} + env(safe-area-inset-top, 0px))`,
          paddingBottom: isScrolled ? "0.5rem" : "1.25rem",
          transform: isMounted ? "translateY(0)" : "translateY(-100%)",
          opacity: isMounted ? 1 : 0,
          transition:
            "transform 600ms cubic-bezier(0.4, 0, 0.2, 1), opacity 600ms cubic-bezier(0.4, 0, 0.2, 1), padding-top 400ms cubic-bezier(0.4, 0, 0.2, 1), padding-bottom 400ms cubic-bezier(0.4, 0, 0.2, 1)",
        }}
      >
        <div className='max-w-[1300px] mx-auto px-3'>
          <div
            className={`max-w-[1300px] mx-auto bg-[#AEC0FF3D] backdrop-blur-sm rounded-full flex items-center justify-between transition-all duration-400 ease-out px-4 md:px-[30px] ${
              isScrolled ? "py-3 md:py-3" : "py-4 md:py-5"
            }`}
            style={{
              boxShadow: isScrolled ? "0 10px 40px rgba(0, 0, 0, 0.1), 0 4px 12px rgba(4, 72, 253, 0.08)" : "none",
              backdropFilter: isScrolled ? "blur(12px)" : "blur(8px)",
              transition: "all 400ms cubic-bezier(0.4, 0, 0.2, 1)",
            }}
          >
            {/* Logo - Crossfade with mobile menu logo */}
            <Link
              href='/'
              className={`flex items-center z-50 relative lg:opacity-100 ${isOpen ? "opacity-0" : "opacity-100"}`}
              style={{
                transitionProperty: "opacity",
                transitionDuration: `${ANIM.duration}ms`,
                transitionDelay: isOpen ? `${ANIM.open.navbarOut}ms` : `${ANIM.close.navbarIn}ms`,
                transitionTimingFunction: "ease-out",
              }}
              onClick={closeMenu}
            >
              <Image
                src='/logo/framrx.png'
                alt='FrameX'
                width={140}
                height={60}
                className='w-auto md:h-[34px] transition-all duration-400 ease-out'
                style={{
                  height: isScrolled ? "19px" : LOGO_HEIGHT,
                  transition: "height 400ms cubic-bezier(0.4, 0, 0.2, 1)",
                }}
              />
            </Link>

            {/* Desktop Navigation Links */}
            <div className='hidden lg:flex items-center gap-8'>
              {navLinks.map((link) => {
                const isPageLink = link.href.startsWith("/");
                const isHomePage = pathname === "/";
                const linkClassName =
                  "text-gray-800 hover:text-[#0448FD] font-medium text-sm transition-all duration-200 hover:scale-105 relative group cursor-pointer";

                // Handle Page Links (e.g., /blog, /about-us, /contact-us)
                if (isPageLink) {
                  return (
                    <Link key={link.href} href={link.href} className={linkClassName}>
                      {link.label}
                      <span className='absolute bottom-0 left-0 w-0 h-0.5 bg-[#0448FD] transition-all duration-300 group-hover:w-full'></span>
                    </Link>
                  );
                }

                // Handle Hash Links (e.g., #features) - Standard anchor on homepage for scroll
                if (isHomePage) {
                  return (
                    <a key={link.href} href={link.href} onClick={(e) => scrollToSection(link.sectionId, e)} className={linkClassName}>
                      {link.label}
                      <span className='absolute bottom-0 left-0 w-0 h-0.5 bg-[#0448FD] transition-all duration-300 group-hover:w-full'></span>
                    </a>
                  );
                }

                // Handle Hash Links - Redirect to home then scroll
                return (
                  <Link
                    key={link.href}
                    href={`/#${link.sectionId}`}
                    onClick={() => {
                      // Navigate and then scroll after a brief delay
                      setTimeout(() => {
                        const element = document.getElementById(link.sectionId);
                        if (element) {
                          const navbarHeight = 80;
                          const elementPosition = element.getBoundingClientRect().top;
                          const offsetPosition = elementPosition + window.pageYOffset - navbarHeight;
                          window.scrollTo({
                            top: offsetPosition,
                            behavior: "smooth",
                          });
                        }
                      }, 300);
                    }}
                    className={linkClassName}
                  >
                    {link.label}
                    <span className='absolute bottom-0 left-0 w-0 h-0.5 bg-[#0448FD] transition-all duration-300 group-hover:w-full'></span>
                  </Link>
                );
              })}
            </div>

            {/* Desktop CTA Button */}
            <div className='hidden lg:flex items-center gap-3'>
              <Link
                href={merchantLoginUrl}
                className='flex items-center gap-2 rounded-full border border-[#0448FD]/30 px-4 py-2 text-sm font-semibold text-gray-800 transition-all duration-200 hover:border-[#0448FD] hover:text-[#0448FD]'
                style={{
                  boxShadow:
                    "0px 1px 1px 0px rgba(4, 72, 253, 0.05), 0px 5px 12.8px 0px rgba(4, 72, 253, 0.1), 0px 2px 4px 0px rgba(4, 72, 253, 0.05)",
                }}
              >
                Login
                <LogIn size={16} />
              </Link>
              <StartBuildingButton
                text='Sign Up'
                icon={UserRound}
                href={merchantSignupUrl}
                circleSize={26}
                iconSize={14}
                className='h-[40px] sm:h-[40px] md:h-[40px] lg:h-[40px] text-sm sm:text-sm font-semibold px-1.5'
              />
            </div>

            {/* Mobile Menu Button - Fades out when opening */}
            <button
              onClick={toggleMenu}
              className={`lg:hidden relative z-70 p-2 rounded-lg hover:bg-white/20 transition-all ease-out ${
                isOpen ? "opacity-0 pointer-events-none scale-75" : "opacity-100 pointer-events-auto scale-100"
              }`}
              style={{
                transitionDuration: `${ANIM.duration}ms`,
                transitionDelay: isOpen ? "0ms" : `${ANIM.close.navbarIn}ms`,
              }}
              aria-label='Toggle menu'
              aria-expanded={isOpen}
            >
              <Menu className='w-6 h-6 text-gray-800' />
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu - Premium Full Screen Experience */}
      <div className={`fixed inset-0 z-60 lg:hidden ${isOpen ? "pointer-events-auto" : "pointer-events-none"}`}>
        {/* Animated Gradient Backdrop */}
        <div
          className={`absolute inset-0 transition-opacity ease-out ${isOpen ? "opacity-100" : "opacity-0"}`}
          style={{
            background: "linear-gradient(135deg, #f8faff 0%, #ffffff 50%, #f0f4ff 100%)",
            transitionDuration: `${ANIM.duration}ms`,
            transitionDelay: isOpen ? `${ANIM.open.backdrop}ms` : `${ANIM.close.backdrop}ms`,
          }}
        />

        {/* Decorative Elements */}
        <div
          className={`absolute top-0 right-0 w-80 h-80 transition-all ease-out ${isOpen ? "opacity-60 scale-100" : "opacity-0 scale-90"}`}
          style={{
            transitionDuration: "350ms",
            transitionDelay: isOpen ? "80ms" : "0ms",
          }}
        >
          <div className='absolute top-10 right-10 w-64 h-64 bg-[#0448FD]/5 rounded-full blur-3xl' />
          <div className='absolute top-20 right-20 w-40 h-40 bg-[#0448FD]/8 rounded-full blur-2xl' />
        </div>
        <div
          className={`absolute bottom-0 left-0 w-60 h-60 transition-all ease-out ${isOpen ? "opacity-60 scale-100" : "opacity-0 scale-90"}`}
          style={{
            transitionDuration: "350ms",
            transitionDelay: isOpen ? "100ms" : "0ms",
          }}
        >
          <div className='absolute bottom-10 left-10 w-48 h-48 bg-[#0448FD]/5 rounded-full blur-3xl' />
        </div>

        {/* Content Container */}
        <div className='relative flex min-h-dvh flex-col'>
          {/* Header - Exact same structure as navbar for perfect alignment */}
          <div
            className='transition-all'
            style={{
              transitionDuration: `${ANIM.duration}ms`,
              paddingTop: `calc(0.75rem + env(safe-area-inset-top, 0px))`,
            }}
          >
            <div className='max-w-[1300px] mx-auto px-4'>
              <div className='flex items-center justify-between py-3'>
                {/* Mobile Menu Logo - Exact same size & position as navbar logo */}
                <Link
                  href='/'
                  onClick={closeMenu}
                  className={`flex items-center transition-all ease-out ${isOpen ? "opacity-100" : "opacity-0"}`}
                  style={{
                    transitionDuration: `${ANIM.duration}ms`,
                    transitionDelay: isOpen ? `${ANIM.open.logoIn}ms` : `${ANIM.close.logoOut}ms`,
                  }}
                >
                  <Image src='/logo/framrx.png' alt='FrameX' width={120} height={40} className='w-auto' style={{ height: LOGO_HEIGHT }} />
                </Link>

                {/* Close Button - Scales in with rotation */}
                <button
                  onClick={closeMenu}
                  className={`w-10 h-10 flex items-center justify-center rounded-full bg-white/80 backdrop-blur-sm border border-gray-100 shadow-sm 
                    hover:shadow-md hover:scale-105 active:scale-95 transition-all ease-out ${
                      isOpen ? "rotate-0 scale-100 opacity-100" : "rotate-180 scale-0 opacity-0"
                    }`}
                  style={{
                    transitionDuration: `${ANIM.duration}ms`,
                    transitionDelay: isOpen ? `${ANIM.open.closeBtn}ms` : `${ANIM.close.closeBtn}ms`,
                  }}
                  aria-label='Close menu'
                >
                  <X className='w-5 h-5 text-gray-700' />
                </button>
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className='flex-1 px-6 pt-6'>
            <div className='grid gap-3'>
              {mobileNavLinks.map((link, index) => {
                const IconComponent = link.icon;
                const isActive = activeIndex === index;
                const isContactUs = link.href === "/contact-us";
                const openDelay = ANIM.open.navStart + index * ANIM.open.navStep;
                const closeDelay = ANIM.close.navStart + index * ANIM.close.navStep;
                const linkClassName = `group relative flex items-center gap-4 rounded-2xl border border-white/70 bg-white/70 px-4 py-3 transition-all ease-out cursor-pointer ${
                  isOpen ? "opacity-100 translate-x-0" : "opacity-0 translate-x-[-12px]"
                } ${isActive ? "shadow-lg shadow-[#0448FD]/10" : "hover:bg-white/90"}`;
                const linkStyle = {
                  transitionDuration: `${ANIM.duration}ms`,
                  transitionDelay: isOpen ? `${openDelay}ms` : `${closeDelay}ms`,
                };

                const linkContent = (
                  <>
                    {/* Icon Container with Glow Effect */}
                    <div
                      className={`relative w-11 h-11 flex items-center justify-center rounded-2xl transition-all duration-300 ${
                        isActive
                          ? "bg-linear-to-br from-[#0448FD] to-[#0038d4] shadow-lg shadow-[#0448FD]/30"
                          : "bg-slate-100 group-hover:bg-[#0448FD]/10"
                      }`}
                    >
                      <IconComponent
                        className={`w-5 h-5 transition-all duration-300 ${
                          isActive ? "text-white scale-110" : "text-gray-600 group-hover:text-[#0448FD]"
                        }`}
                      />
                      {isActive && <div className='absolute inset-0 rounded-2xl bg-[#0448FD] opacity-20 blur-md animate-pulse' />}
                    </div>

                    {/* Text Content */}
                    <div className='flex-1'>
                      <span
                        className={`block text-base font-semibold transition-colors duration-300 ${
                          isActive ? "text-[#0448FD]" : "text-gray-900"
                        }`}
                      >
                        {link.label}
                      </span>
                      <span
                        className={`block text-xs transition-all duration-300 ${
                          isActive ? "text-gray-600 opacity-100" : "text-gray-400 opacity-80"
                        }`}
                      >
                        {link.description}
                      </span>
                    </div>

                    {/* Arrow Indicator */}
                    <ArrowRight
                      className={`w-5 h-5 transition-all duration-300 ${
                        isActive
                          ? "text-[#0448FD] translate-x-0 opacity-100"
                          : "text-gray-300 -translate-x-2 opacity-0 group-hover:translate-x-0 group-hover:opacity-100"
                      }`}
                    />
                  </>
                );

                const isHomePage = pathname === "/";

                if (isContactUs) {
                  return (
                    <Link key={link.href} href={link.href} onClick={closeMenu} className={linkClassName} style={linkStyle}>
                      {linkContent}
                    </Link>
                  );
                }

                // For anchor links, use Link if not on home page, otherwise use anchor with scroll
                if (isHomePage) {
                  return (
                    <a
                      key={link.href}
                      href={link.href}
                      onClick={(e) => scrollToSection(link.sectionId, e)}
                      className={linkClassName}
                      style={linkStyle}
                    >
                      {linkContent}
                    </a>
                  );
                }

                return (
                  <Link
                    key={link.href}
                    href={`/#${link.sectionId}`}
                    onClick={(e) => {
                      closeMenu();
                      // Navigate and then scroll after a brief delay
                      setTimeout(() => {
                        const element = document.getElementById(link.sectionId);
                        if (element) {
                          const navbarHeight = 80;
                          const elementPosition = element.getBoundingClientRect().top;
                          const offsetPosition = elementPosition + window.pageYOffset - navbarHeight;
                          window.scrollTo({
                            top: offsetPosition,
                            behavior: "smooth",
                          });
                        }
                      }, 300);
                    }}
                    className={linkClassName}
                    style={linkStyle}
                  >
                    {linkContent}
                  </Link>
                );
              })}
            </div>
          </nav>

          {/* Bottom Section with CTA */}
          <div
            className={`mt-6 px-6 pb-10 transition-all ease-out ${isOpen ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"}`}
            style={{
              transitionDuration: `${ANIM.duration}ms`,
              transitionDelay: isOpen ? `${ANIM.open.bottom}ms` : `${ANIM.close.bottom}ms`,
            }}
          >
            <div className='rounded-3xl border border-[#0448FD]/15 bg-linear-to-br from-white via-[#f3f6ff] to-white p-5 shadow-[0_18px_50px_-35px_rgba(4,72,253,0.6)]'>
              <div className='flex items-start gap-3'>
                <div className='mt-1 flex h-10 w-10 items-center justify-center rounded-2xl bg-linear-to-br from-[#0448FD] to-[#0038d4] shadow-md shadow-[#0448FD]/25'>
                  <Sparkles className='h-5 w-5 text-white' />
                </div>
                <div className='flex-1'>
                  <p className='text-sm font-semibold text-slate-900'>Start building today</p>
                  <p className='text-xs text-slate-500'>Launch multiple stores with one account.</p>
                </div>
              </div>
              <div className='mt-4 grid gap-3'>
                <Link
                  href={merchantLoginUrl}
                  onClick={closeMenu}
                  className='inline-flex h-14 w-full items-center justify-center rounded-2xl border border-[#0448FD]/30 bg-white px-4 text-base font-semibold text-gray-800 transition-all duration-200 hover:border-[#0448FD] hover:text-[#0448FD]'
                >
                  Login
                </Link>
                <Link
                  href={merchantSignupUrl}
                  onClick={closeMenu}
                  className='inline-flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-[#0448FD] px-4 text-base font-semibold text-white shadow-lg shadow-[#0448FD]/20 transition-all duration-200 hover:bg-[#0548FD] hover:shadow-xl hover:shadow-[#0448FD]/30'
                >
                  Sign Up
                  <ArrowRight className='h-4 w-4' />
                </Link>
              </div>
            </div>

            <p className='text-center text-xs text-gray-400 mt-4'>Join 10,000+ merchants growing with FrameX.</p>
          </div>
        </div>
      </div>
    </>
  );
}
