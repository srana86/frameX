"use client";

import React from "react";
import { cn } from "@/utils/cn";

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  className?: string;
  titleClassName?: string;
  subtitleClassName?: string;
}

export default function SectionHeader({ title, subtitle, className, titleClassName, subtitleClassName }: SectionHeaderProps) {
  return (
    <div className={cn("w-full max-w-4xl mx-auto text-center space-y-3 sm:space-y-4 md:space-y-6", className)}>
      <h2
        className={cn(
          "text-gray-900 font-semibold",
          "text-2xl sm:text-3xl md:text-4xl lg:text-5xl",
          "leading-tight tracking-tight",
          titleClassName
        )}
        style={{
          fontFamily: "var(--font-nunito-sans)",
          fontWeight: 600,
          lineHeight: "120%",
          letterSpacing: "-0.03em",
        }}
      >
        {title}
      </h2>
      {subtitle && (
        <p
          className={cn(
            "text-gray-600 max-w-2xl mx-auto",
            "text-sm sm:text-base md:text-lg lg:text-xl",
            "leading-relaxed",
            subtitleClassName
          )}
          style={{
            fontFamily: "var(--font-urbanist)",
            fontWeight: 400,
            lineHeight: "1.5",
          }}
        >
          {subtitle}
        </p>
      )}
    </div>
  );
}
