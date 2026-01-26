"use client";

import { usePathname } from "next/navigation";
import Script from "next/script";
import { useEffect, useState, useRef, useCallback } from "react";
import { GoogleTagManager } from "@next/third-parties/google";
import * as pixel from "@/lib/fpixel";
import type { AdsConfig } from "@/lib/ads-config-types";
import { getAllMetaParams } from "@/lib/tracking/meta-param-builder";
import { apiRequest } from "@/lib/api-client";

interface TrackingScriptsProps {
  adsConfig: AdsConfig;
}

/**
 * TrackingScripts Component
 *
 * Manages all tracking scripts including:
 * - Meta (Facebook) Pixel with clientParamBuilder SDK integration
 * - Google Tag Manager
 *
 * The Meta Pixel now uses the official Parameter Builder Library for improved
 * event quality with proper fbc, fbp, and client_ip_address handling.
 */
export function TrackingScripts({ adsConfig }: TrackingScriptsProps) {
  const [pixelLoaded, setPixelLoaded] = useState(false);
  const [metaParamsReady, setMetaParamsReady] = useState(false);
  const pathname = usePathname();
  const pixelId = adsConfig.metaPixel.pixelId || pixel.FB_PIXEL_ID;
  const gtmId = adsConfig.googleTagManager.containerId || process.env.NEXT_PUBLIC_GOOGLE_TAG_MANAGER_ID;
  const serverSideEnabled = adsConfig.metaPixel.serverSideTracking?.enabled;
  const lastTrackedPath = useRef<string | null>(null);

  // Listen for meta params ready event from pixel.js
  useEffect(() => {
    const handleMetaParamsReady = (event: CustomEvent<{ fbc: string; fbp: string; clientIpAddress: string }>) => {
      console.log("[TrackingScripts] Meta params ready:", event.detail);
      setMetaParamsReady(true);
    };

    window.addEventListener("metaParamsReady", handleMetaParamsReady as EventListener);
    return () => {
      window.removeEventListener("metaParamsReady", handleMetaParamsReady as EventListener);
    };
  }, []);

  // Handle page view tracking
  useEffect(() => {
    if (!pixelLoaded) return;

    // Prevent duplicate tracking for same path
    if (lastTrackedPath.current === pathname) return;
    lastTrackedPath.current = pathname;

    // Generate single event_id for deduplication between browser and server
    const eventId = pixel.generateEventId();

    // Send browser pixel PageView with event_id
    pixel.pageview(eventId);

    // Send server-side PageView with same event_id for deduplication
    if (serverSideEnabled && adsConfig.metaPixel.enabled && pixelId) {
      // Get Meta params from clientParamBuilder if available
      const metaParams = getAllMetaParams();

      // Send to server API with collected params
      // Send to server API with collected params
      apiRequest("POST", "/tracking/meta-pixel", {
        eventName: "PageView",
        eventId,
        actionSource: "website",
        eventSourceUrl: typeof window !== "undefined" ? window.location.href : undefined,
        fbp: metaParams.fbp || undefined,
        fbc: metaParams.fbc || undefined,
        clientIpAddress: metaParams.clientIpAddress || undefined,
      }).catch(() => {
        // Silently fail to not impact user experience
      });
    }
  }, [pathname, pixelLoaded, serverSideEnabled]);

  return (
    <>
      {/* Facebook Pixel with clientParamBuilder SDK */}
      {adsConfig.metaPixel.enabled && pixelId && (
        <div>
          <Script
            id='fb-pixel'
            src='/scripts/pixel.js'
            strategy='afterInteractive'
            onLoad={() => {
              setPixelLoaded(true);
              console.log("[TrackingScripts] Meta Pixel loaded");
            }}
            data-pixel-id={pixelId}
          />
        </div>
      )}

      {/* Google Tag Manager */}
      {adsConfig.googleTagManager.enabled && gtmId && <GoogleTagManager gtmId={gtmId as string} />}
    </>
  );
}
