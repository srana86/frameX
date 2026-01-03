import { NextRequest, NextResponse } from "next/server";
import { getAdsConfig } from "@/lib/ads-config";
import { processRequest, buildUserData, type MetaRequestParams } from "@/lib/tracking/meta-param-builder-server";

/**
 * Meta Pixel Server-Side Tracking API (Conversions API)
 *
 * This endpoint sends events to Meta's Conversions API for improved tracking accuracy
 * and privacy compliance. Events are deduplicated using event_id to prevent double-counting.
 *
 * Uses Meta's Parameter Builder Library patterns for proper PII normalization and hashing.
 *
 * POST /api/tracking/meta-pixel
 * Body: {
 *   eventName: string (e.g., "PageView", "Purchase", "AddToCart", etc.)
 *   eventId?: string (optional, for deduplication)
 *   userData?: {
 *     email?: string
 *     emails?: string[] (multiple emails)
 *     phone?: string
 *     phones?: string[] (multiple phones)
 *     firstName?: string
 *     lastName?: string
 *     city?: string
 *     state?: string
 *     zipCode?: string
 *     country?: string
 *     gender?: string
 *     dateOfBirth?: string
 *     externalId?: string
 *   }
 *   customData?: {
 *     currency?: string
 *     value?: number
 *     contentIds?: string[]
 *     contentName?: string
 *     contentCategory?: string
 *     numItems?: number
 *     contentType?: string
 *     orderId?: string
 *   }
 *   eventSourceUrl?: string
 *   actionSource?: "website" | "email" | "app" | "phone_call" | "chat" | "physical_store" | "system_generated" | "other"
 *   fbp?: string (Facebook Browser ID - passed from client if SDK provided it)
 *   fbc?: string (Facebook Click ID - passed from client if SDK provided it)
 *   clientIpAddress?: string (passed from client if SDK provided it via _fbi cookie)
 *   dataProcessingOptions?: string[] (for GDPR/CCPA: [] for no restrictions, ["LDU"] for Limited Data Use)
 *   dataProcessingOptionsCountry?: number (0 for auto-detect, 1 for US)
 *   dataProcessingOptionsState?: number (0 for auto-detect, 1000 for California)
 *   optOut?: boolean (true if user opted out of data sale under CCPA)
 * }
 *
 * @see https://developers.facebook.com/docs/marketing-api/conversions-api/parameters/parameter-builder-library
 * @see https://developers.facebook.com/docs/marketing-apis/data-processing-options
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  console.log("[Meta Pixel API] Received request at", new Date().toISOString());

  try {
    const adsConfig = await getAdsConfig();

    // Check if Meta Pixel server-side tracking is enabled
    if (
      !adsConfig.metaPixel.enabled ||
      !adsConfig.metaPixel.pixelId ||
      !adsConfig.metaPixel.serverSideTracking?.enabled ||
      !adsConfig.metaPixel.serverSideTracking?.accessToken
    ) {
      console.log("[Meta Pixel API] Server-side tracking not configured:", {
        enabled: adsConfig.metaPixel.enabled,
        pixelId: !!adsConfig.metaPixel.pixelId,
        serverSideEnabled: adsConfig.metaPixel.serverSideTracking?.enabled,
        accessToken: !!adsConfig.metaPixel.serverSideTracking?.accessToken,
      });
      return NextResponse.json({ error: "Meta Pixel server-side tracking is not configured" }, { status: 400 });
    }

    const body = await request.json();
    const {
      eventName,
      eventId,
      userData = {},
      customData = {},
      eventSourceUrl,
      actionSource = "website",
      // Client-provided values (from clientParamBuilder SDK)
      fbp: clientFbp,
      fbc: clientFbc,
      clientIpAddress: clientProvidedIp,
      externalId: providedExternalId,
      // Data processing options for GDPR/CCPA compliance
      dataProcessingOptions,
      dataProcessingOptionsCountry,
      dataProcessingOptionsState,
      // Opt-out flag
      optOut,
    } = body;

    // Process request to extract params using Parameter Builder patterns
    const requestParams = processRequest(request);

    // Merge client-provided values with server-extracted values
    // Client values take precedence as they come from Meta's SDK
    const mergedParams: MetaRequestParams = {
      fbc: clientFbc || requestParams.fbc,
      fbp: clientFbp || requestParams.fbp,
      clientIpAddress: clientProvidedIp || requestParams.clientIpAddress,
      userAgent: requestParams.userAgent,
      eventSourceUrl: eventSourceUrl || requestParams.eventSourceUrl,
    };

    console.log("[Meta Pixel API] Processing event:", {
      eventName,
      eventId,
      hasUserData: !!Object.keys(userData).length,
      hasCustomData: !!Object.keys(customData).length,
      fbc: mergedParams.fbc ? "present" : "missing",
      fbp: mergedParams.fbp ? "present" : "missing",
      clientIpAddress: mergedParams.clientIpAddress ? "present" : "missing",
      externalId: providedExternalId ? "present" : "missing",
      eventSourceUrl: mergedParams.eventSourceUrl,
    });

    if (!eventName) {
      console.error("[Meta Pixel API] Missing eventName");
      return NextResponse.json({ error: "eventName is required" }, { status: 400 });
    }

    const pixelId = adsConfig.metaPixel.pixelId;
    const accessToken = adsConfig.metaPixel.serverSideTracking.accessToken;
    const testEventCode = adsConfig.metaPixel.serverSideTracking.testEventCode;

    // Generate event_id if not provided (for deduplication)
    const finalEventId = eventId || `${Date.now()}-${Math.random().toString(36).substring(7)}`;

    // Build user_data with proper normalization and hashing
    const userDataWithExternalId = {
      ...userData,
      externalId: userData.externalId || providedExternalId,
    };
    const processedUserData = buildUserData(mergedParams, userDataWithExternalId);

    // Build the event data for Meta Conversions API
    const eventData: Record<string, unknown> = {
      event_name: eventName,
      event_time: Math.floor(Date.now() / 1000),
      event_id: finalEventId,
      action_source: actionSource,
      event_source_url: mergedParams.eventSourceUrl,
      user_data: processedUserData,
      custom_data: {
        ...(customData.currency && { currency: customData.currency }),
        ...(customData.value !== undefined && { value: customData.value }),
        ...(customData.contentIds && { content_ids: customData.contentIds }),
        ...(customData.contentName && { content_name: customData.contentName }),
        ...(customData.contentCategory && { content_category: customData.contentCategory }),
        ...(customData.numItems !== undefined && { num_items: customData.numItems }),
        ...(customData.contentType && { content_type: customData.contentType }),
        ...(customData.orderId && { order_id: customData.orderId }),
        // Default content_type if not provided
        ...(!customData.contentType && { content_type: "product" }),
      },
      // Opt-out flag for users who have opted out of data sale (CCPA)
      ...(optOut !== undefined && { opt_out: optOut }),
    };

    // Handle data processing options for GDPR/CCPA compliance
    // Use LDU (Limited Data Use) for California users: ["LDU"], country: 1, state: 1000
    // Use empty array for no restrictions: [], country: 0, state: 0
    if (dataProcessingOptions !== undefined) {
      eventData.data_processing_options = dataProcessingOptions;
      eventData.data_processing_options_country = dataProcessingOptionsCountry ?? 0;
      eventData.data_processing_options_state = dataProcessingOptionsState ?? 0;
    }

    console.log("[Meta Pixel API] Event data prepared:", {
      event_name: eventData.event_name,
      event_id: eventData.event_id,
      has_fbc: !!(processedUserData as Record<string, unknown>).fbc,
      has_fbp: !!(processedUserData as Record<string, unknown>).fbp,
      has_client_ip: !!(processedUserData as Record<string, unknown>).client_ip_address,
      user_data_keys: Object.keys(processedUserData),
      custom_data_keys: Object.keys(eventData.custom_data as object),
    });

    // Clean up undefined/empty values
    const cleanObject = (obj: Record<string, unknown>): Record<string, unknown> => {
      const cleaned: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(obj)) {
        if (value !== undefined && value !== null && value !== "") {
          if (typeof value === "object" && !Array.isArray(value)) {
            const cleanedNested = cleanObject(value as Record<string, unknown>);
            if (Object.keys(cleanedNested).length > 0) {
              cleaned[key] = cleanedNested;
            }
          } else {
            cleaned[key] = value;
          }
        }
      }
      return cleaned;
    };

    const cleanedEventData = cleanObject(eventData);

    // Prepare the API request
    const apiUrl = `https://graph.facebook.com/v21.0/${pixelId}/events`;
    const requestBody: Record<string, unknown> = {
      data: [cleanedEventData],
      access_token: accessToken,
    };

    // Add test_event_code if provided (for testing in Events Manager)
    if (testEventCode) {
      requestBody.test_event_code = testEventCode;
      console.log("[Meta Pixel API] Using test_event_code:", testEventCode);
    }

    console.log("[Meta Pixel API] Sending to Meta Conversions API:", {
      url: apiUrl,
      pixelId,
      hasTestEventCode: !!testEventCode,
      eventCount: 1,
    });

    // Send event to Meta Conversions API
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    const responseData = await response.json();
    const duration = Date.now() - startTime;

    if (!response.ok) {
      console.error("[Meta Pixel API] Meta API error:", {
        status: response.status,
        statusText: response.statusText,
        response: responseData,
        duration: `${duration}ms`,
      });
      return NextResponse.json({ error: "Failed to send event to Meta", details: responseData }, { status: response.status });
    }

    console.log("[Meta Pixel API] Successfully sent event to Meta:", {
      eventId: finalEventId,
      eventName,
      response: responseData,
      duration: `${duration}ms`,
    });

    return NextResponse.json({
      success: true,
      eventId: finalEventId,
      response: responseData,
    });
  } catch (error: unknown) {
    const duration = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    const errorStack = error instanceof Error ? error.stack : undefined;

    console.error("[Meta Pixel API] Error processing request:", {
      error: errorMessage,
      stack: errorStack,
      duration: `${duration}ms`,
    });
    return NextResponse.json({ error: errorMessage || "Failed to process tracking event" }, { status: 500 });
  }
}
