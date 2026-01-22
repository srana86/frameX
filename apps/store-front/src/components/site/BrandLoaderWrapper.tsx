"use client";

import { useEffect } from "react";
import type { BrandConfig } from "@/lib/brand-config";

interface BrandLoaderWrapperProps {
  brandConfig: BrandConfig;
}

/**
 * BrandLoaderWrapper initializes brand configuration on client side
 * Sets up CSS variables and brand-specific styling
 */
export function BrandLoaderWrapper({ brandConfig }: BrandLoaderWrapperProps) {
  useEffect(() => {
    // Store brand config in a global variable for client-side access
    if (typeof window !== "undefined") {
      (window as any).__BRAND_CONFIG__ = brandConfig;
    }

    // Apply any additional brand styling
    const root = document.documentElement;
    
    // Set brand name as data attribute for CSS selectors
    root.setAttribute("data-brand", brandConfig.brandName || "default");
    
    // Apply theme mode if specified
    if (brandConfig.theme?.mode) {
      root.setAttribute("data-theme", brandConfig.theme.mode);
    }
  }, [brandConfig]);

  return null;
}
