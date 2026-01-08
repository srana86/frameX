"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { captureSourceTracking } from "@/lib/source-tracking";

/**
 * SourceTracker Component
 *
 * Captures URL parameters (fbclid, UTM, etc.) on page load and stores them
 * in localStorage so they persist across page navigations.
 * Also ensures _fbc cookie is set for Meta Pixel server-side tracking.
 */
export function SourceTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Capture source tracking from URL parameters
    const trackingData = captureSourceTracking();

    // Also set _fbc cookie from fbclid if present (critical for server-side tracking)
    const fbclid = searchParams.get("fbclid");
    if (fbclid && typeof document !== "undefined") {
      try {
        // Check if _fbc cookie already exists
        const existingFbc = document.cookie.split("; ").find((row) => row.startsWith("_fbc="));
        if (!existingFbc) {
          // Format: fb.1.{timestamp}.{fbclid}
          const timestamp = Math.floor(Date.now() / 1000);
          const fbcValue = `fb.1.${timestamp}.${fbclid}`;

          // Set cookie with 90 days expiry
          const expiryDate = new Date();
          expiryDate.setDate(expiryDate.getDate() + 90);
          document.cookie = `_fbc=${fbcValue}; expires=${expiryDate.toUTCString()}; path=/; SameSite=Lax`;

          console.log("[Source Tracker] Set _fbc cookie:", fbcValue);
        }
      } catch (e) {
        console.error("[Source Tracker] Error setting _fbc cookie:", e);
      }
    }

    // Log for debugging (can be removed in production)
    if (trackingData && Object.keys(trackingData).length > 0) {
      console.log("[Source Tracker] Captured tracking data:", trackingData);
    }
  }, [pathname, searchParams]);

  // This component doesn't render anything
  return null;
}
