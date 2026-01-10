/**
 * Server-side Meta Pixel tracking utilities
 *
 * Use these functions to send server-side events to Meta Conversions API
 * Events are automatically deduplicated using event_id
 */

export interface MetaPixelServerEvent {
  eventName: string;
  eventId?: string;
  userData?: {
    email?: string;
    phone?: string;
    firstName?: string;
    lastName?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };
  customData?: {
    currency?: string;
    value?: number;
    contentIds?: string[];
    contentName?: string;
    contentCategory?: string;
    numItems?: number;
  };
  eventSourceUrl?: string;
  actionSource?: "website" | "email" | "app" | "phone_call" | "chat" | "physical_store" | "system_generated" | "other";
}

import { apiRequest } from "@/lib/api-client";

/**
 * Send a server-side Meta Pixel event
 *
 * @param event - Event data
 * @returns Promise that resolves when event is sent
 */
export async function sendMetaPixelServerEvent(event: MetaPixelServerEvent): Promise<void> {
  try {
    await apiRequest<any>("POST", "/tracking/meta-pixel", event);
  } catch (error) {
    console.error("Error sending Meta Pixel server event:", error);
  }
}

/**
 * Generate a unique event ID for deduplication
 */
export function generateEventId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(7)}`;
}

/**
 * Helper function to send Purchase event
 */
export async function trackPurchase(params: {
  value: number;
  currency: string;
  contentIds?: string[];
  contentName?: string;
  eventId?: string;
  userData?: MetaPixelServerEvent["userData"];
}) {
  return sendMetaPixelServerEvent({
    eventName: "Purchase",
    eventId: params.eventId || generateEventId(),
    customData: {
      value: params.value,
      currency: params.currency,
      contentIds: params.contentIds,
      contentName: params.contentName,
    },
    userData: params.userData,
    actionSource: "website",
  });
}

/**
 * Helper function to send AddToCart event
 */
export async function trackAddToCart(params: {
  value: number;
  currency: string;
  contentIds?: string[];
  contentName?: string;
  eventId?: string;
  userData?: MetaPixelServerEvent["userData"];
}) {
  return sendMetaPixelServerEvent({
    eventName: "AddToCart",
    eventId: params.eventId || generateEventId(),
    customData: {
      value: params.value,
      currency: params.currency,
      contentIds: params.contentIds,
      contentName: params.contentName,
    },
    userData: params.userData,
    actionSource: "website",
  });
}

/**
 * Helper function to send InitiateCheckout event
 */
export async function trackInitiateCheckout(params: {
  value: number;
  currency: string;
  contentIds?: string[];
  eventId?: string;
  userData?: MetaPixelServerEvent["userData"];
}) {
  return sendMetaPixelServerEvent({
    eventName: "InitiateCheckout",
    eventId: params.eventId || generateEventId(),
    customData: {
      value: params.value,
      currency: params.currency,
      contentIds: params.contentIds,
    },
    userData: params.userData,
    actionSource: "website",
  });
}

/**
 * Helper function to send ViewContent event
 */
export async function trackViewContent(params: {
  contentIds?: string[];
  contentName?: string;
  contentCategory?: string;
  value?: number;
  currency?: string;
  eventId?: string;
  userData?: MetaPixelServerEvent["userData"];
}) {
  return sendMetaPixelServerEvent({
    eventName: "ViewContent",
    eventId: params.eventId || generateEventId(),
    customData: {
      contentIds: params.contentIds,
      contentName: params.contentName,
      contentCategory: params.contentCategory,
      value: params.value,
      currency: params.currency,
    },
    userData: params.userData,
    actionSource: "website",
  });
}
