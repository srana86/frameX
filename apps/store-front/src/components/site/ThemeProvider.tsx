"use client";

import { useEffect } from "react";
import { hexToOklch } from "@/lib/utils";

interface ThemeProviderProps {
  primaryColor: string;
}

/**
 * ThemeProvider applies brand colors to CSS variables
 * This enables dynamic theming based on tenant brand configuration
 */
export function ThemeProvider({ primaryColor }: ThemeProviderProps) {
  useEffect(() => {
    // Convert hex to OKLCH for better color manipulation
    const oklchColor = hexToOklch(primaryColor);
    
    // Apply to CSS variables
    document.documentElement.style.setProperty("--primary", oklchColor);
    document.documentElement.style.setProperty("--sidebar-primary", oklchColor);
    
    // Update theme-color meta tag for mobile browsers
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute("content", primaryColor);
    }
  }, [primaryColor]);

  return null;
}
