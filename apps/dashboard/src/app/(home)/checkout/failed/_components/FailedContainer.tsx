"use client";

import React, { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { XCircle, ArrowRight, RefreshCw, HelpCircle, Loader2 } from "lucide-react";

function FailedContainerInner() {
  const searchParams = useSearchParams();
  const reason = searchParams.get("reason") || "Payment was unsuccessful";

  return (
    <section className='min-h-screen py-24 sm:py-28 md:py-32 bg-gradient-to-b from-white via-red-50/20 to-white'>
      <div className='max-w-lg mx-auto px-4 sm:px-6 text-center'>
        {/* Error Icon */}
        <div className='relative inline-flex mb-8'>
          <div className='absolute inset-0 rounded-full bg-red-500 blur-2xl opacity-30' />
          <div className='relative w-20 h-20 rounded-full bg-gradient-to-br from-red-400 to-red-600 flex items-center justify-center shadow-lg shadow-red-500/30'>
            <XCircle className='w-10 h-10 text-white' />
          </div>
        </div>

        {/* Title */}
        <h1
          className='text-3xl sm:text-4xl font-bold text-gray-900 mb-4'
          style={{ fontFamily: "var(--font-nunito-sans), sans-serif" }}
        >
          Payment Failed
        </h1>

        {/* Reason */}
        <p
          className='text-lg text-gray-600 mb-8'
          style={{ fontFamily: "var(--font-urbanist), sans-serif" }}
        >
          {decodeURIComponent(reason)}
        </p>

        {/* Info Box */}
        <div className='bg-white rounded-2xl p-6 shadow-lg border border-gray-100 mb-8 text-left'>
          <div className='flex items-start gap-3'>
            <div className='w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0'>
              <HelpCircle className='w-4 h-4 text-amber-600' />
            </div>
            <div>
              <h3
                className='font-semibold text-gray-900 mb-2'
                style={{ fontFamily: "var(--font-nunito-sans), sans-serif" }}
              >
                What can you do?
              </h3>
              <ul
                className='text-sm text-gray-600 space-y-2'
                style={{ fontFamily: "var(--font-urbanist), sans-serif" }}
              >
                <li className='flex items-start gap-2'>
                  <span className='w-1.5 h-1.5 rounded-full bg-gray-400 mt-1.5 flex-shrink-0' />
                  Check if your card has sufficient balance
                </li>
                <li className='flex items-start gap-2'>
                  <span className='w-1.5 h-1.5 rounded-full bg-gray-400 mt-1.5 flex-shrink-0' />
                  Ensure your card supports online transactions
                </li>
                <li className='flex items-start gap-2'>
                  <span className='w-1.5 h-1.5 rounded-full bg-gray-400 mt-1.5 flex-shrink-0' />
                  Try a different payment method
                </li>
                <li className='flex items-start gap-2'>
                  <span className='w-1.5 h-1.5 rounded-full bg-gray-400 mt-1.5 flex-shrink-0' />
                  Contact your bank if the issue persists
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className='flex flex-col sm:flex-row items-center justify-center gap-4'>
          <Link
            href='/#pricing'
            className='inline-flex items-center gap-2 px-6 py-3 bg-[#0448FD] text-white rounded-xl font-semibold hover:scale-[1.02] active:scale-[0.98] transition-all'
            style={{
              fontFamily: "var(--font-urbanist), sans-serif",
              boxShadow: `
                0px 1px 1px 0px rgba(4, 72, 253, 0.18),
                0px 2px 2.8px 0px rgba(4, 72, 253, 0.44),
                0px 5px 12.8px 0px rgba(4, 72, 253, 0.49),
                0px -5px 11.1px 0px rgba(255, 255, 255, 0.52) inset
              `,
            }}
          >
            <RefreshCw className='w-4 h-4' />
            Try Again
          </Link>
          <Link
            href='/contact-us'
            className='inline-flex items-center gap-2 px-6 py-3 bg-white text-gray-700 rounded-xl font-semibold border border-gray-200 hover:bg-gray-50 transition-colors'
            style={{ fontFamily: "var(--font-urbanist), sans-serif" }}
          >
            Contact Support
            <ArrowRight className='w-4 h-4' />
          </Link>
        </div>
      </div>
    </section>
  );
}

export default function FailedContainer() {
  return (
    <Suspense fallback={
      <section className='min-h-screen flex items-center justify-center'>
        <Loader2 className='w-10 h-10 animate-spin text-gray-400' />
      </section>
    }>
      <FailedContainerInner />
    </Suspense>
  );
}

