"use client";

/**
 * Component to handle affiliate promo code from URL parameter
 * Sets cookie when ?ref=CODE is present in URL
 */

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { getAffiliateCookieName, parseAffiliateCookie } from "@/lib/affiliate-helpers";

export function AffiliatePromoHandler() {
  const searchParams = useSearchParams();
  const [processed, setProcessed] = useState(false);

  useEffect(() => {
    if (processed) return;

    const refCode = searchParams.get("ref");
    if (!refCode) {
      setProcessed(true);
      return;
    }

    // Check if cookie already exists and is valid
    const cookieName = getAffiliateCookieName();
    const cookies = document.cookie.split(";");
    const existingCookie = cookies.find((c) => c.trim().startsWith(`${cookieName}=`));

    if (existingCookie) {
      const cookieValue = existingCookie.split("=")[1]?.trim();
      if (cookieValue) {
        try {
          const cookieData = parseAffiliateCookie(decodeURIComponent(cookieValue));
          if (cookieData && cookieData.promoCode === refCode.toUpperCase()) {
            // Same code already set, no need to update
            setProcessed(true);
            return;
          }
        } catch {
          // Invalid cookie, will be replaced
        }
      }
    }

    // Set affiliate cookie via API
    const setCookie = async () => {
      try {
        const response = await fetch("/api/affiliate/set-cookie", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ promoCode: refCode }),
        });

        if (response.ok) {
          // Cookie set successfully
          const data = await response.json();
          console.log("Affiliate promo code set:", data.promoCode);
        }
      } catch (error) {
        console.error("Error setting affiliate cookie:", error);
      } finally {
        setProcessed(true);
      }
    };

    setCookie();
  }, [searchParams, processed]);

  return null; // This component doesn't render anything
}

