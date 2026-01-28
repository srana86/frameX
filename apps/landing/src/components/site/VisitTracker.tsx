"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { apiRequest } from "@/lib/api-client";

/**
 * VisitTracker Component
 *
 * Tracks page visits with IP address and sends to API
 * Runs once per page load
 */
export function VisitTracker() {
  const pathname = usePathname();

  useEffect(() => {
    // Track visit
    const trackVisit = async () => {
      try {
        await apiRequest("/visits", {
          method: "POST",
          body: JSON.stringify({
            path: pathname,
            referrer: typeof document !== "undefined" ? document.referrer : "",
            userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "",
          }),
        });
      } catch (error) {
        // Silently fail - don't impact user experience
        console.error("[VisitTracker] Failed to track visit:", error);
      }
    };

    // Small delay to ensure page is fully loaded
    const timeoutId = setTimeout(trackVisit, 500);

    return () => clearTimeout(timeoutId);
  }, [pathname]);

  // This component doesn't render anything
  return null;
}

