"use client";

import type { ReactNode } from "react";
import { useEffect, useRef } from "react";
import Link from "next/link";
import { CheckCircle2, ShieldCheck } from "lucide-react";

interface AuthShellProps {
  title: string;
  description: string;
  benefits: string[];
  formTitle: string;
  formDescription: string;
  children: ReactNode;
  footer?: ReactNode;
  autoScrollToFormOnMobile?: boolean;
}

export default function AuthShell({
  title,
  description,
  benefits,
  formTitle,
  formDescription,
  children,
  footer,
  autoScrollToFormOnMobile = false,
}: AuthShellProps) {
  const formRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!autoScrollToFormOnMobile || typeof window === "undefined") {
      return;
    }
    if (window.innerWidth >= 768) {
      return;
    }
    const timer = window.setTimeout(() => {
      if (!formRef.current) {
        return;
      }
      const navbar = document.querySelector("nav");
      const navbarOffset = (navbar?.getBoundingClientRect().height || 80) + 8;
      formRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
      window.setTimeout(() => {
        window.scrollBy({ top: -navbarOffset, behavior: "smooth" });
      }, 50);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [autoScrollToFormOnMobile]);

  return (
    <section className='relative overflow-hidden bg-white'>
      <div
        className='absolute inset-0'
        style={{
          backgroundImage:
            "radial-gradient(circle at 15% 20%, rgba(32, 120, 255, 0.16), transparent 48%), radial-gradient(circle at 85% 15%, rgba(52, 211, 153, 0.12), transparent 45%), radial-gradient(circle at 50% 85%, rgba(14, 116, 144, 0.12), transparent 40%)",
        }}
      />
      <div
        className='absolute inset-0 opacity-40'
        style={{
          backgroundImage:
            "linear-gradient(120deg, rgba(17, 24, 39, 0.04) 1px, transparent 1px), linear-gradient(60deg, rgba(17, 24, 39, 0.04) 1px, transparent 1px)",
          backgroundSize: "44px 44px",
        }}
      />
      <div className='relative mx-auto w-full max-w-6xl px-4 pb-20 pt-28 sm:px-6 sm:pt-32 lg:px-8 lg:pt-36'>
        <div className='grid items-center gap-10 lg:grid-cols-[1.05fr_0.95fr]'>
          <div className='space-y-8'>
            <div className='inline-flex items-center gap-2 rounded-full border border-blue-200/70 bg-white/70 px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm'>
              <ShieldCheck className='h-4 w-4 text-blue-600' />
              Secure Super Admin Access
            </div>
            <div className='space-y-4'>
              <h1
                className='text-slate-900'
                style={{
                  fontFamily: "var(--font-nunito-sans), sans-serif",
                  fontWeight: 700,
                  fontSize: "clamp(30px, 5vw, 48px)",
                  lineHeight: "1.1",
                  letterSpacing: "-0.02em",
                }}
              >
                {title}
              </h1>
              <p
                className='text-slate-600'
                style={{
                  fontFamily: "var(--font-urbanist), sans-serif",
                  fontSize: "clamp(15px, 2.5vw, 20px)",
                  lineHeight: "1.6",
                }}
              >
                {description}
              </p>
            </div>
            <div className='grid gap-3 sm:grid-cols-2'>
              {benefits.map((benefit) => (
                <div key={benefit} className='flex items-start gap-2 rounded-2xl border border-slate-200/70 bg-white/80 p-4 shadow-sm'>
                  <CheckCircle2 className='mt-0.5 h-5 w-5 text-blue-600' />
                  <span
                    className='text-sm text-slate-700'
                    style={{
                      fontFamily: "var(--font-urbanist), sans-serif",
                      lineHeight: "1.4",
                    }}
                  >
                    {benefit}
                  </span>
                </div>
              ))}
            </div>
            <Link
              href='/'
              className='inline-flex items-center text-sm font-semibold text-blue-600 transition-colors hover:text-blue-700'
              style={{ fontFamily: "var(--font-urbanist), sans-serif" }}
            >
              Back to FrameX Tech
            </Link>
          </div>

          <div className='relative'>
            <div
              className='absolute -inset-2 rounded-[32px] opacity-60 blur-2xl'
              style={{
                background:
                  "linear-gradient(135deg, rgba(32, 120, 255, 0.45), rgba(99, 102, 241, 0.15), rgba(16, 185, 129, 0.25))",
              }}
            />
            <div
              className='relative rounded-[28px] border border-white/80 bg-white/90 p-8 shadow-[0_20px_60px_-30px_rgba(15,23,42,0.55)] backdrop-blur'
              style={{
                boxShadow:
                  "0px 10px 30px rgba(15, 23, 42, 0.12), 0px 30px 80px rgba(15, 23, 42, 0.16)",
              }}
            >
              <div className='space-y-2'>
                <p className='text-xs font-semibold uppercase tracking-[0.2em] text-blue-600'>FrameX Control</p>
                <h2
                  className='text-slate-900'
                  style={{
                    fontFamily: "var(--font-nunito-sans), sans-serif",
                    fontWeight: 600,
                    fontSize: "clamp(22px, 3vw, 30px)",
                  }}
                >
                  {formTitle}
                </h2>
                <p
                  className='text-sm text-slate-500'
                  style={{
                    fontFamily: "var(--font-urbanist), sans-serif",
                    lineHeight: "1.6",
                  }}
                >
                  {formDescription}
                </p>
              </div>
              <div ref={formRef} className='mt-6 space-y-6 scroll-mt-40'>
                {children}
              </div>
              {footer && <div className='mt-6 text-sm text-slate-500'>{footer}</div>}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
