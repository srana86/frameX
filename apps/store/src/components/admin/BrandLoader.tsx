"use client";

import { useEffect, useState } from "react";

interface BrandLoaderProps {
  brandConfigLoaded: boolean;
  themeColorApplied: boolean;
}

export function BrandLoader({ brandConfigLoaded, themeColorApplied }: BrandLoaderProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Hide loader once both brand config and theme are ready
    if (brandConfigLoaded && themeColorApplied) {
      // Small delay to ensure smooth transition
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [brandConfigLoaded, themeColorApplied]);

  if (!isVisible) return null;

  return (
    <div className={`brand-loader-overlay ${!isVisible ? "hidden" : ""}`}>
      <div className='brand-loader'></div>
    </div>
  );
}
