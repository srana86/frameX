"use client";

import Link from "next/link";
import type { BrandConfig } from "@/lib/brand-config";
import CloudImage from "@/components/site/CloudImage";
import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  href?: string;
  showSecondary?: boolean;
  showTagline?: boolean;
  brandConfig: BrandConfig;
}

export function Logo({ className = "", href = "/", showSecondary = true, showTagline = true, brandConfig: config }: LogoProps) {
  const logo = config.logo;
  const style = logo.style || "default";

  // If logo type is image
  if (logo.type === "image" && logo.imagePath) {
    return (
      <Link href={href} className={cn("flex items-center gap-2.5", className)}>
        <div className='relative h-10 w-[120px]'>
          <CloudImage src={logo.imagePath} alt={logo.altText || `${config.brandName} Logo`} fill className='object-contain' />
        </div>
      </Link>
    );
  }

  // If logo type is text - render based on style
  if (logo.type === "text" && logo.text) {
    const primary = logo.text.primary || "";
    const secondary = logo.text.secondary || "";

    // Icon-Text Style (XPIPS style)
    if (style === "icon-text") {
      const iconBg = logo.icon?.backgroundColor || "#1e3a8a"; // Dark blue default
      const iconColor = logo.icon?.iconColor || "#ffffff"; // White default
      const symbol = logo.icon?.symbol || primary.charAt(0) || "X";
      const iconImagePath = logo.icon?.imagePath;
      const iconSize = logo.icon?.size || "md";
      const borderRadius = logo.icon?.borderRadius || "md";

      const sizeClasses = {
        sm: "h-8 w-8",
        md: "h-10 w-10",
        lg: "h-12 w-12",
      };

      const radiusClasses = {
        none: "rounded-none",
        xs: "rounded-[2px]",
        sm: "rounded-sm",
        md: "rounded-md",
        lg: "rounded-lg",
        xl: "rounded-xl",
        full: "rounded-full",
      };

      return (
        <Link href={href} className={cn("flex items-center gap-2 sm:gap-3", className)}>
          <div
            className={cn(
              "flex items-center justify-center overflow-hidden shrink-0",
              "h-8 w-8 sm:h-10 sm:w-10",
              sizeClasses[iconSize],
              radiusClasses[borderRadius]
            )}
            style={{ backgroundColor: iconBg }}
          >
            {iconImagePath ? (
              <div className='relative h-full w-full'>
                <CloudImage
                  src={iconImagePath}
                  alt={`${config.brandName} Icon`}
                  fill
                  className={cn("object-cover", radiusClasses[borderRadius])}
                />
              </div>
            ) : (
              <span className='font-bold text-sm sm:text-base' style={{ color: iconColor }}>
                {symbol}
              </span>
            )}
          </div>
          <div className='flex flex-col min-w-0'>
            <span className='text-base sm:text-xl font-bold leading-tight text-foreground truncate'>
              {primary}
              {secondary && ` ${secondary}`}
            </span>
            {showTagline && config.brandTagline && (
              <span className='hidden sm:block text-xs font-medium leading-tight text-muted-foreground uppercase tracking-wide'>
                {config.brandTagline}
              </span>
            )}
          </div>
        </Link>
      );
    }

    // Gradient Style
    if (style === "gradient") {
      const gradientFrom = logo.colors?.gradientFrom || "#3b82f6";
      const gradientTo = logo.colors?.gradientTo || "#8b5cf6";

      return (
        <Link href={href} className={cn("flex items-center gap-2.5 text-xl font-bold group", className)}>
          <span
            className='bg-clip-text text-transparent font-bold tracking-tight'
            style={{
              backgroundImage: `linear-gradient(to right, ${gradientFrom}, ${gradientTo})`,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            {primary} {secondary && <span className='opacity-90'>{secondary}</span>}
          </span>
        </Link>
      );
    }

    // Minimal Style
    if (style === "minimal") {
      return (
        <Link href={href} className={cn("flex items-center gap-2.5", className)}>
          <span className='text-lg font-light tracking-wider text-foreground'>
            {primary}
            {secondary && <span className='ml-1 text-muted-foreground'>{secondary}</span>}
          </span>
        </Link>
      );
    }

    // Badge Style
    if (style === "badge") {
      const primaryColor = logo.colors?.primary || "hsl(var(--primary))";

      return (
        <Link href={href} className={cn("flex items-center gap-2.5", className)}>
          <div className='rounded-lg px-3 py-1.5 font-bold text-white' style={{ backgroundColor: primaryColor }}>
            <span className='text-sm tracking-wide uppercase'>
              {primary}
              {secondary && <span className='ml-1 opacity-90'>{secondary}</span>}
            </span>
          </div>
        </Link>
      );
    }

    // Monogram Style
    if (style === "monogram") {
      const monogram = (primary.charAt(0) + (secondary?.charAt(0) || "")).toUpperCase();
      const primaryColor = logo.colors?.primary || "hsl(var(--primary))";

      return (
        <Link href={href} className={cn("flex items-center gap-3", className)}>
          <div
            className='flex h-10 w-10 items-center justify-center rounded-full font-bold text-white'
            style={{ backgroundColor: primaryColor }}
          >
            {monogram}
          </div>
          {showSecondary && (primary || secondary) && (
            <div className='flex flex-col'>
              <span className='text-lg font-semibold leading-tight'>
                {primary} {secondary}
              </span>
            </div>
          )}
        </Link>
      );
    }

    // Default Style (original)
    return (
      <Link href={href} className={cn("flex items-center gap-2.5 text-xl font-bold group", className)}>
        <span className='bg-gradient-to-r from-foreground via-foreground/90 to-foreground bg-clip-text text-transparent font-semibold tracking-tight'>
          {primary} {secondary}
        </span>
      </Link>
    );
  }

  // Fallback to brand name
  return (
    <Link href={href} className={cn("flex items-center gap-2.5 text-xl font-bold", className)}>
      <span>{config.brandName}</span>
    </Link>
  );
}
