"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import CloudImage from "@/components/site/CloudImage";

interface MobilePromoBannerProps {
  title?: string;
  subtitle?: string;
  description?: string;
  buttonText?: string;
  buttonLink?: string;
  image: string;
  backgroundColor?: string;
  textColor?: string;
  overlay?: boolean;
  overlayOpacity?: number;
}

export function MobilePromoBanner({
  title,
  subtitle,
  description,
  buttonText,
  buttonLink,
  image,
  backgroundColor,
  textColor = "#000000",
  overlay,
  overlayOpacity,
}: MobilePromoBannerProps) {
  // Only render if there's at least a title or image
  if (!title && !image) {
    return null;
  }

  return (
    <div className='relative w-full rounded-lg overflow-hidden mb-6'>
      {/* Background Image */}
      <div className='relative w-full h-full min-h-[120px] sm:min-h-[140px]'>
        <CloudImage
          src={image}
          alt={title || "Promotional banner"}
          fill
          sizes='100vw'
          priority
          fetchPriority='high'
          className='object-cover rounded-lg'
        />

        {/* Overlay */}
        {overlay && (
          <div
            className='absolute inset-0 rounded-lg'
            style={{
              backgroundColor: `rgba(0, 0, 0, ${overlayOpacity !== undefined ? overlayOpacity : 0.4})`,
            }}
          />
        )}

        {/* Content */}
        <div className='relative flex flex-row items-center p-4 sm:p-6 h-full'>
          {/* Left side - Text content */}
          <div className='flex-1 pr-4' style={{ color: textColor }}>
            {title && <h2 className='text-lg sm:text-xl font-bold leading-tight mb-1 drop-shadow-lg'>{title}</h2>}
            {subtitle && <h3 className='text-base sm:text-lg font-semibold mb-2 drop-shadow-md'>{subtitle}</h3>}
            {description && <p className='text-xs sm:text-sm opacity-90 mb-3 drop-shadow-md'>{description}</p>}
            {buttonText && buttonLink && (
              <Button
                asChild
                className='rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground text-xs sm:text-sm px-4 py-2 h-auto font-medium shadow-lg'
              >
                <Link href={buttonLink}>{buttonText}</Link>
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
