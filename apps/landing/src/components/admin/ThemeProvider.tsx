"use client";

import { useEffect } from "react";
import { hexToOklch } from "@/lib/utils";

interface ThemeProviderProps {
  primaryColor: string;
}

export function ThemeProvider({ primaryColor }: ThemeProviderProps) {
  // Apply theme color immediately on mount and when it changes
  useEffect(() => {
    if (primaryColor && typeof document !== "undefined") {
      try {
        const oklchColor = hexToOklch(primaryColor);
        const root = document.documentElement;
        // Apply to :root - this will cascade to both light and dark modes
        root.style.setProperty("--primary", oklchColor);
        root.style.setProperty("--sidebar-primary", oklchColor);
      } catch (error) {
        console.error("Failed to apply theme color:", error);
      }
    }
  }, [primaryColor]);

  return null;
}
