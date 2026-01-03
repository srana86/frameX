"use client";

import { useEffect, useState } from "react";
import { BrandLoader } from "./BrandLoader";
import type { BrandConfig } from "@/lib/brand-config";

interface BrandLoaderWrapperProps {
  brandConfig: BrandConfig;
}

export function BrandLoaderWrapper({ brandConfig }: BrandLoaderWrapperProps) {
  const [brandConfigLoaded, setBrandConfigLoaded] = useState(false);
  const [themeColorApplied, setThemeColorApplied] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Mark brand config as loaded (it's already loaded server-side)
    setBrandConfigLoaded(true);

    // Check if theme color is applied by checking if CSS variable exists and is not empty
    const checkThemeApplied = () => {
      if (typeof window === "undefined") return false;
      const root = getComputedStyle(document.documentElement);
      const primary = root.getPropertyValue("--primary").trim();
      // Check if primary color is set and is a valid oklch value
      if (primary && primary !== "" && primary.startsWith("oklch")) {
        setThemeColorApplied(true);
        return true;
      }
      return false;
    };

    // Wait for DOM to be ready
    if (document.readyState === "complete") {
      // Check immediately if DOM is already ready
      if (checkThemeApplied()) {
        return;
      }
    } else {
      // Wait for DOM to load
      window.addEventListener("load", () => {
        checkThemeApplied();
      });
    }

    // Check periodically (for hydration and style application)
    const interval = setInterval(() => {
      if (checkThemeApplied()) {
        clearInterval(interval);
      }
    }, 50);

    // Also check after a short delay to ensure styles are applied
    const timeout = setTimeout(() => {
      checkThemeApplied();
      clearInterval(interval);
    }, 300);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
      window.removeEventListener("load", checkThemeApplied);
    };
  }, [brandConfig]);

  // Don't render until mounted (prevents hydration mismatch)
  if (!mounted) {
    return null;
  }

  return <BrandLoader brandConfigLoaded={brandConfigLoaded} themeColorApplied={themeColorApplied} />;
}
