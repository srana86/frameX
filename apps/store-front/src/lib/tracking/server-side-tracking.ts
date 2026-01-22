import { defaultBrandConfig } from "@/lib/brand-config";
import {
  getUserDataForTracking,
  getOrCreateExternalId,
} from "./user-data-store";
import { getAllMetaParams } from "./meta-param-builder";

// Helper to get the Store-API base URL (works on both client and server)
function getApiBaseUrl(): string {
  // Client-side: use relative URL (nginx proxies)
  if (typeof window !== "undefined") {
    return "/api/v1";
  }
  // Server-side: use internal URL
  return process.env.INTERNAL_API_URL || "http://localhost:8080/api/v1";
}

// Helper to get Tenant ID for tenant context
function getTenantId(): string {
  return process.env.NEXT_PUBLIC_TENANT_ID || "";
}

// Helper to build headers with tenant context
function getApiHeaders(
  contentType: string = "application/json"
): Record<string, string> {
  const headers: Record<string, string> = {
    "Content-Type": contentType,
  };
  // For server-side, use NEXT_PUBLIC_DOMAIN env var
  const domain = process.env.NEXT_PUBLIC_DOMAIN;
  if (domain) {
    headers["X-Domain"] = domain;
  }
  // Fallback to tenant ID
  const tenantId = getTenantId();
  if (tenantId) {
    headers["X-Tenant-ID"] = tenantId;
  }
  return headers;
}

export interface TrackingEventData {
  eventName: string;
  eventId?: string;
  value?: number;
  currency?: string;
  contentIds?: string[];
  contentName?: string;
  contentCategory?: string;
  numItems?: number;
  contentType?: string;
  orderId?: string;
  userData?: {
    email?: string;
    emails?: string[];
    phone?: string;
    phones?: string[];
    firstName?: string;
    lastName?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
    gender?: string;
    dateOfBirth?: string;
    externalId?: string;
  };
}

/**
 * Get currency from brand config (works in both client and server environments)
 * Uses API endpoint to avoid bundling MongoDB in client bundle
 */
async function getCurrencyFromBrandConfig(): Promise<string> {
  try {
    const apiUrl = getApiBaseUrl();
    const response = await fetch(`${apiUrl}/brand-config`, {
      cache: "no-store",
      headers: getApiHeaders(),
    });

    if (response.ok) {
      const json = await response.json();
      const brandConfig = json?.data || json;
      return brandConfig?.currency?.iso || defaultBrandConfig.currency.iso;
    }
  } catch (error) {
    console.error("Error fetching brand config for currency:", error);
  }
  return defaultBrandConfig.currency.iso;
}

/**
 * Generate a unique event ID for deduplication
 */
export function generateEventId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(7)}`;
}

/**
 * Get Meta tracking cookies from browser (fbc, fbp, client_ip_address)
 * Uses the clientParamBuilder SDK when available
 */
function getMetaCookies(): {
  fbp: string | null;
  fbc: string | null;
  clientIpAddress: string | null;
} {
  if (typeof document === "undefined") {
    return { fbp: null, fbc: null, clientIpAddress: null };
  }

  // Use clientParamBuilder if available
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

  const fbp = getCookie("_fbp");
  let fbc = getCookie("_fbc");
  const clientIpAddress = getCookie("_fbi"); // Set by clientParamBuilder

  // If _fbc cookie is missing, try to create it from fbclid in URL
  if (!fbc && typeof window !== "undefined") {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const fbclid = urlParams.get("fbclid");
      if (fbclid) {
        const timestamp = Math.floor(Date.now() / 1000);
        fbc = `fb.1.${timestamp}.${fbclid}`;
        // Also set the cookie for future use
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
 * Send server-side tracking event to all configured platforms
 * Now includes improved Meta parameter collection via clientParamBuilder
 */
export async function sendServerSideTracking(
  event: TrackingEventData
): Promise<void> {
  const eventId = event.eventId || generateEventId();
  // Get currency from brand config if not provided
  const currency = event.currency || (await getCurrencyFromBrandConfig());
  const promises: Promise<void>[] = [];

  // Meta Pixel
  promises.push(
    (async () => {
      try {
        // Get Meta cookies using clientParamBuilder
        const { fbp, fbc, clientIpAddress } = getMetaCookies();
        let externalId: string | undefined;

        // Get or create external_id for cross-session user matching
        if (typeof window !== "undefined") {
          try {
            externalId = getOrCreateExternalId();
          } catch (e) {
            // Silently fail
          }
        }

        // Merge stored user data with provided user data
        // Provided data takes precedence over stored data
        let mergedUserData = event.userData || {};
        if (typeof window !== "undefined") {
          try {
            const storedData = getUserDataForTracking();
            mergedUserData = {
              ...storedData,
              ...event.userData,
              // Always include external_id
              externalId:
                event.userData?.externalId ||
                storedData.externalId ||
                externalId,
            };
          } catch (e) {
            // Silently fail - use provided data
          }
        }

        const apiUrl = getApiBaseUrl();
        const response = await fetch(`${apiUrl}/tracking/meta-pixel`, {
          method: "POST",
          headers: getApiHeaders(),
          body: JSON.stringify({
            eventName: event.eventName,
            eventId,
            customData: {
              currency: currency,
              value: event.value,
              contentIds: event.contentIds,
              contentName: event.contentName,
              contentCategory: event.contentCategory,
              numItems: event.numItems,
              contentType: event.contentType || "product",
              orderId: event.orderId,
            },
            userData: mergedUserData,
            actionSource: "website",
            eventSourceUrl:
              typeof window !== "undefined" ? window.location.href : undefined,
            fbp, // Facebook Browser ID cookie
            fbc, // Facebook Click ID cookie
            clientIpAddress, // Client IP from clientParamBuilder (_fbi cookie)
            externalId: mergedUserData.externalId || externalId, // Also pass at top level
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error("[Server-Side Tracking] Meta Pixel failed:", {
            status: response.status,
            error: errorData,
          });
        } else {
          console.log("[Server-Side Tracking] Meta Pixel event sent:", {
            eventName: event.eventName,
            eventId,
            hasFbc: !!fbc,
            hasFbp: !!fbp,
            hasClientIp: !!clientIpAddress,
          });
        }
      } catch (error) {
        console.error("[Server-Side Tracking] Meta Pixel error:", error);
      }
    })()
  );

  // TikTok Pixel
  const apiUrl = getApiBaseUrl();
  promises.push(
    fetch(`${apiUrl}/tracking/tiktok-pixel`, {
      method: "POST",
      headers: getApiHeaders(),
      body: JSON.stringify({
        event: event.eventName,
        event_id: eventId,
        properties: {
          value: event.value,
          currency: currency,
          content_type: event.contentCategory || "product",
          quantity: event.numItems,
        },
        timestamp: Math.floor(Date.now() / 1000),
      }),
    })
      .then((res) => {
        if (!res.ok && process.env.NODE_ENV !== "production") {
          console.warn("TikTok Pixel server-side tracking failed");
        }
      })
      .catch(() => { })
  );

  // Google Analytics 4
  promises.push(
    fetch(`${apiUrl}/tracking/ga4`, {
      method: "POST",
      headers: getApiHeaders(),
      body: JSON.stringify({
        client_id: `client-${Date.now()}`,
        events: [
          {
            name: event.eventName
              .toLowerCase()
              .replace(/([A-Z])/g, "_$1")
              .toLowerCase(),
            params: {
              value: event.value,
              currency: currency,
              items: event.contentIds?.map((id, index) => ({
                item_id: id,
                item_name: event.contentName,
                item_category: event.contentCategory,
                quantity: event.numItems,
                price: event.value ? event.value / (event.numItems || 1) : 0,
              })),
            },
          },
        ],
      }),
    })
      .then((res) => {
        if (!res.ok && process.env.NODE_ENV !== "production") {
          console.warn("GA4 server-side tracking failed");
        }
      })
      .catch(() => { })
  );

  // Execute all promises in parallel (failures are silently caught)
  await Promise.allSettled(promises);
}

/**
 * Track AddToCart event
 */
export async function trackAddToCart(params: {
  productId: string;
  productName: string;
  price: number;
  quantity: number;
  currency?: string;
  eventId?: string;
  userData?: TrackingEventData["userData"];
}) {
  const eventId = params.eventId || generateEventId();
  const currency = params.currency || (await getCurrencyFromBrandConfig());
  return sendServerSideTracking({
    eventName: "AddToCart",
    eventId,
    value: params.price * params.quantity,
    currency: currency,
    contentIds: [params.productId],
    contentName: params.productName,
    numItems: params.quantity,
    contentType: "product",
    userData: params.userData,
  });
}

/**
 * Track InitiateCheckout event
 */
export async function trackInitiateCheckout(params: {
  value: number;
  currency?: string;
  contentIds?: string[];
  numItems?: number;
  userData?: TrackingEventData["userData"];
}) {
  const eventId = generateEventId();
  const currency = params.currency || (await getCurrencyFromBrandConfig());
  return sendServerSideTracking({
    eventName: "InitiateCheckout",
    eventId,
    value: params.value,
    currency: currency,
    contentIds: params.contentIds,
    numItems: params.numItems,
    userData: params.userData,
  });
}

/**
 * Track ViewContent event
 */
export async function trackViewContent(params: {
  productId: string;
  productName: string;
  price?: number;
  currency?: string;
  category?: string;
  eventId?: string;
  userData?: TrackingEventData["userData"];
}) {
  const eventId = params.eventId || generateEventId();
  const currency = params.currency || (await getCurrencyFromBrandConfig());
  return sendServerSideTracking({
    eventName: "ViewContent",
    eventId,
    value: params.price,
    currency: currency,
    contentIds: [params.productId],
    contentName: params.productName,
    contentCategory: params.category,
    numItems: 1,
    contentType: "product",
    userData: params.userData,
  });
}

/**
 * Track AddPaymentInfo event
 */
export async function trackAddPaymentInfo(params: {
  value: number;
  currency?: string;
  paymentMethod?: string;
  userData?: TrackingEventData["userData"];
}) {
  const eventId = generateEventId();
  const currency = params.currency || (await getCurrencyFromBrandConfig());
  return sendServerSideTracking({
    eventName: "AddPaymentInfo",
    eventId,
    value: params.value,
    currency: currency,
    userData: params.userData,
  });
}

/**
 * Track Purchase event
 */
export async function trackPurchase(params: {
  orderId: string;
  value: number;
  currency?: string;
  contentIds?: string[];
  contentName?: string;
  numItems?: number;
  userData?: TrackingEventData["userData"];
}) {
  // Use consistent eventID format: purchase-{orderId} for proper deduplication
  // This matches the format used in client-side tracking
  const eventId = `purchase-${params.orderId}`;
  const currency = params.currency || (await getCurrencyFromBrandConfig());
  return sendServerSideTracking({
    eventName: "Purchase",
    eventId: eventId,
    value: params.value,
    currency: currency,
    contentIds: params.contentIds,
    contentName: params.contentName,
    numItems: params.numItems,
    orderId: params.orderId,
    contentType: "product",
    userData: params.userData,
  });
}

/**
 * Track PageView event
 */
export async function trackPageView(params?: {
  pageName?: string;
  userData?: TrackingEventData["userData"];
}) {
  const eventId = generateEventId();
  return sendServerSideTracking({
    eventName: "PageView",
    eventId,
    contentName: params?.pageName,
    userData: params?.userData,
  });
}

/**
 * Track Lead event (for form submissions, inquiries, etc.)
 */
export async function trackLead(params?: {
  value?: number;
  currency?: string;
  contentName?: string;
  userData?: TrackingEventData["userData"];
}) {
  const eventId = generateEventId();
  const currency = params?.currency || (await getCurrencyFromBrandConfig());
  return sendServerSideTracking({
    eventName: "Lead",
    eventId,
    value: params?.value,
    currency: currency,
    contentName: params?.contentName,
    userData: params?.userData,
  });
}

/**
 * Track CompleteRegistration event
 */
export async function trackCompleteRegistration(params?: {
  value?: number;
  currency?: string;
  userData?: TrackingEventData["userData"];
}) {
  const eventId = generateEventId();
  const currency = params?.currency || (await getCurrencyFromBrandConfig());
  return sendServerSideTracking({
    eventName: "CompleteRegistration",
    eventId,
    value: params?.value,
    currency: currency,
    userData: params?.userData,
  });
}

/**
 * Track Search event
 */
export async function trackSearch(params: {
  searchString: string;
  userData?: TrackingEventData["userData"];
}) {
  const eventId = generateEventId();
  return sendServerSideTracking({
    eventName: "Search",
    eventId,
    contentName: params.searchString,
    userData: params.userData,
  });
}

/**
 * Track AddToWishlist event
 */
export async function trackAddToWishlist(params: {
  productId: string;
  productName: string;
  price?: number;
  currency?: string;
  userData?: TrackingEventData["userData"];
}) {
  const eventId = generateEventId();
  const currency = params.currency || (await getCurrencyFromBrandConfig());
  return sendServerSideTracking({
    eventName: "AddToWishlist",
    eventId,
    value: params.price,
    currency: currency,
    contentIds: [params.productId],
    contentName: params.productName,
    numItems: 1,
    contentType: "product",
    userData: params.userData,
  });
}

/**
 * Track Contact event (for contact form submissions)
 */
export async function trackContact(params?: {
  userData?: TrackingEventData["userData"];
}) {
  const eventId = generateEventId();
  return sendServerSideTracking({
    eventName: "Contact",
    eventId,
    userData: params?.userData,
  });
}

/**
 * Track Subscribe event (for newsletter, etc.)
 */
export async function trackSubscribe(params?: {
  value?: number;
  currency?: string;
  userData?: TrackingEventData["userData"];
}) {
  const eventId = generateEventId();
  const currency = params?.currency || (await getCurrencyFromBrandConfig());
  return sendServerSideTracking({
    eventName: "Subscribe",
    eventId,
    value: params?.value,
    currency: currency,
    userData: params?.userData,
  });
}
