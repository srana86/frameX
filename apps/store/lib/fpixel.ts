import { getAllMetaParams } from "./tracking/meta-param-builder";

export const FB_PIXEL_ID = process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID;

declare global {
  interface Window {
    fbq: (...args: unknown[]) => void;
  }
}

/**
 * Generate a unique event ID for deduplication between browser and server events
 */
export function generateEventId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}

/**
 * Get Facebook cookies for better tracking
 * Uses clientParamBuilder SDK when available, falls back to manual cookie reading
 */
export function getFacebookCookies(): {
  fbp: string | null;
  fbc: string | null;
  clientIpAddress: string | null;
} {
  if (typeof document === "undefined") {
    return { fbp: null, fbc: null, clientIpAddress: null };
  }

  // Try to use clientParamBuilder first
  const metaParams = getAllMetaParams();
  if (metaParams.fbp || metaParams.fbc) {
    return {
      fbp: metaParams.fbp || null,
      fbc: metaParams.fbc || null,
      clientIpAddress: metaParams.clientIpAddress || null,
    };
  }

  // Fallback to manual cookie reading
  const getCookie = (name: string): string | null => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop()?.split(";").shift() || null;
    return null;
  };

  let fbp = getCookie("_fbp");
  let fbc = getCookie("_fbc");
  const clientIpAddress = getCookie("_fbi"); // Set by clientParamBuilder

  // If _fbc is missing, try to create it from fbclid in URL
  if (!fbc && typeof window !== "undefined") {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const fbclid = urlParams.get("fbclid");
      if (fbclid) {
        const timestamp = Math.floor(Date.now() / 1000);
        fbc = `fb.1.${timestamp}.${fbclid}`;
        // Set the cookie for future use
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + 90);
        document.cookie = `_fbc=${fbc}; expires=${expiryDate.toUTCString()}; path=/; SameSite=Lax`;
      }
    } catch (e) {
      // Silently fail
    }
  }

  return { fbp, fbc, clientIpAddress };
}

/**
 * Track PageView with both browser pixel and server-side API (with deduplication)
 */
export const pageview = (eventId?: string) => {
  const finalEventId = eventId || generateEventId();

  // Browser pixel with eventID for deduplication
  if (typeof window !== "undefined" && window.fbq) {
    window.fbq("track", "PageView", {}, { eventID: finalEventId });
  }

  return finalEventId;
};

/**
 * Send server-side PageView event via Conversions API
 * Now includes clientParamBuilder parameters for improved matching
 */
export async function sendServerPageView(
  eventId: string,
  userData?: {
    email?: string;
    phone?: string;
    firstName?: string;
    lastName?: string;
  }
): Promise<void> {
  try {
    const { fbp, fbc, clientIpAddress } = getFacebookCookies();

    await fetch("/api/tracking/meta-pixel", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        eventName: "PageView",
        eventId,
        userData,
        fbp,
        fbc,
        clientIpAddress,
        actionSource: "website",
        eventSourceUrl: typeof window !== "undefined" ? window.location.href : undefined,
      }),
    });
  } catch (error) {
    // Silently fail to not impact user experience
    console.error("[Meta Pixel] Server PageView failed:", error);
  }
}

/**
 * Track a custom event with the Facebook Pixel
 * @see https://developers.facebook.com/docs/facebook-pixel/advanced/
 */
export const event = (name: string, options: Record<string, unknown> = {}, eventId?: string) => {
  const finalEventId = eventId || generateEventId();

  if (typeof window !== "undefined" && window.fbq) {
    window.fbq("track", name, options, { eventID: finalEventId });
  }

  return finalEventId;
};

/**
 * Track a custom event with server-side deduplication
 * Sends both browser and server events with the same event_id
 */
export async function trackEventWithServerSide(
  eventName: string,
  customData: Record<string, unknown> = {},
  userData?: {
    email?: string;
    phone?: string;
    firstName?: string;
    lastName?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
    externalId?: string;
  }
): Promise<string> {
  const eventId = generateEventId();

  // Send browser pixel event
  if (typeof window !== "undefined" && window.fbq) {
    window.fbq("track", eventName, customData, { eventID: eventId });
  }

  // Send server-side event
  try {
    const { fbp, fbc, clientIpAddress } = getFacebookCookies();

    await fetch("/api/tracking/meta-pixel", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        eventName,
        eventId,
        customData,
        userData,
        fbp,
        fbc,
        clientIpAddress,
        actionSource: "website",
        eventSourceUrl: typeof window !== "undefined" ? window.location.href : undefined,
      }),
    });
  } catch (error) {
    console.error(`[Meta Pixel] Server ${eventName} failed:`, error);
  }

  return eventId;
}

/**
 * Track standard e-commerce events with server-side deduplication
 */
export const ecommerce = {
  /**
   * Track ViewContent event (product page views)
   */
  viewContent: (params: { contentId: string; contentName: string; value?: number; currency?: string; contentCategory?: string }) => {
    return trackEventWithServerSide("ViewContent", {
      content_ids: [params.contentId],
      content_name: params.contentName,
      content_type: "product",
      value: params.value,
      currency: params.currency || "USD",
      content_category: params.contentCategory,
    });
  },

  /**
   * Track AddToCart event
   */
  addToCart: (params: { contentId: string; contentName: string; value: number; currency?: string; quantity?: number }) => {
    return trackEventWithServerSide("AddToCart", {
      content_ids: [params.contentId],
      content_name: params.contentName,
      content_type: "product",
      value: params.value,
      currency: params.currency || "USD",
      num_items: params.quantity || 1,
    });
  },

  /**
   * Track InitiateCheckout event
   */
  initiateCheckout: (params: { contentIds?: string[]; value: number; currency?: string; numItems?: number }) => {
    return trackEventWithServerSide("InitiateCheckout", {
      content_ids: params.contentIds,
      content_type: "product",
      value: params.value,
      currency: params.currency || "USD",
      num_items: params.numItems,
    });
  },

  /**
   * Track AddPaymentInfo event
   */
  addPaymentInfo: (params: { value: number; currency?: string }) => {
    return trackEventWithServerSide("AddPaymentInfo", {
      content_type: "product",
      value: params.value,
      currency: params.currency || "USD",
    });
  },

  /**
   * Track Purchase event
   */
  purchase: (params: {
    contentIds?: string[];
    contentName?: string;
    value: number;
    currency?: string;
    numItems?: number;
    orderId?: string;
  }) => {
    const eventId = params.orderId ? `${params.orderId}-${generateEventId()}` : generateEventId();

    // Browser pixel
    if (typeof window !== "undefined" && window.fbq) {
      window.fbq(
        "track",
        "Purchase",
        {
          content_ids: params.contentIds,
          content_name: params.contentName,
          content_type: "product",
          value: params.value,
          currency: params.currency || "USD",
          num_items: params.numItems,
        },
        { eventID: eventId }
      );
    }

    // Server-side
    const { fbp, fbc, clientIpAddress } = getFacebookCookies();
    fetch("/api/tracking/meta-pixel", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        eventName: "Purchase",
        eventId,
        customData: {
          contentIds: params.contentIds,
          contentName: params.contentName,
          contentType: "product",
          value: params.value,
          currency: params.currency || "USD",
          numItems: params.numItems,
          orderId: params.orderId,
        },
        fbp,
        fbc,
        clientIpAddress,
        actionSource: "website",
        eventSourceUrl: typeof window !== "undefined" ? window.location.href : undefined,
      }),
    }).catch(() => {});

    return eventId;
  },
};
