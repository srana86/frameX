"use client";

import React from "react";
import { Star } from "lucide-react";
import Image from "next/image";

export interface Testimonial {
  id: string;
  quote: string;
  name: string;
  title: string;
  avatar?: string;
  rating?: number;
}

interface TestimonialCardProps {
  testimonial: Testimonial;
  index: number;
  isVisible: boolean;
}

export default function TestimonialCard({ testimonial, index, isVisible }: TestimonialCardProps) {
  const rating = testimonial.rating || 5;

  return (
    <div
      className='bg-white rounded-lg p-4 xs:p-5 sm:p-6 md:p-7 lg:p-8 shadow-sm hover:shadow-md h-fit transition-all duration-300 border border-gray-100'
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? "translateY(0)" : "translateY(20px)",
        transition: `opacity 0.6s ease-out ${index * 0.1}s, transform 0.6s ease-out ${index * 0.1}s`,
        boxShadow: `
          0 1px 2px 0 rgba(0, 0, 0, 0.05),
          0 -2px 8px 0 rgba(255, 255, 255, 0.8),
          0 2px 8px 0 rgba(255, 255, 255, 0.8)
        `,
      }}
    >
      {/* Rating Stars */}
      <div className='flex items-center gap-0.5 xs:gap-1 mb-3 xs:mb-3.5 sm:mb-4'>
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            className={`w-3 h-3 xs:w-3.5 xs:h-3.5 sm:w-4 sm:h-4 md:w-4.5 md:h-4.5 ${
              i < rating ? "fill-yellow-400 text-yellow-400" : "fill-gray-200 text-gray-200"
            }`}
          />
        ))}
      </div>

      {/* Quote */}
      <p
        className='text-gray-700 leading-relaxed mb-4 xs:mb-5 sm:mb-6'
        style={{
          fontFamily: "var(--font-urbanist), sans-serif",
          fontWeight: 400,
          fontSize: "clamp(13px, 2.5vw, 16px)",
          lineHeight: "1.6",
        }}
      >
        "{testimonial.quote}"
      </p>

      {/* User Info */}
      <div className='flex items-center gap-2 xs:gap-2.5 sm:gap-3'>
        {/* Avatar */}
        <div
          className='rounded-full bg-linear-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-semibold shrink-0'
          style={{
            width: "clamp(36px, 8vw, 48px)",
            height: "clamp(36px, 8vw, 48px)",
            fontSize: "clamp(12px, 2.5vw, 16px)",
          }}
        >
          {testimonial.avatar ? (
            <Image
              src={testimonial.avatar}
              alt={testimonial.name}
              width={48}
              height={48}
              className='w-full h-full rounded-full object-cover'
            />
          ) : (
            testimonial.name
              .split(" ")
              .map((n) => n[0])
              .join("")
              .toUpperCase()
          )}
        </div>

        {/* Name and Title */}
        <div className='min-w-0 flex-1'>
          <h4
            className='text-gray-900 font-semibold truncate'
            style={{
              fontFamily: "var(--font-nunito-sans), sans-serif",
              fontWeight: 600,
              fontSize: "clamp(13px, 2.8vw, 16px)",
              lineHeight: "1.4",
            }}
          >
            {testimonial.name}
          </h4>
          <p
            className='text-gray-600 truncate'
            style={{
              fontFamily: "var(--font-urbanist), sans-serif",
              fontWeight: 400,
              fontSize: "clamp(11px, 2.2vw, 14px)",
              lineHeight: "1.4",
            }}
          >
            {testimonial.title}
          </p>
        </div>
      </div>
    </div>
  );
}
