import { getAdsConfig } from "@/lib/ads-config";
import { NextRequest, NextResponse } from "next/server";
import { processRequest, processUserData, extractClientIp } from "@/lib/tracking/meta-param-builder-server";

/**
 * Facebook Events API (Conversions API)
 *
 * This is a legacy endpoint maintained for backward compatibility.
 * New implementations should use /api/tracking/meta-pixel instead.
 *
 * Uses Meta's Parameter Builder Library patterns for proper PII handling.
 */
export async function POST(request: NextRequest) {
  try {
    // Get ads config to check if Meta Pixel is enabled
    const adsConfig = await getAdsConfig();

    // Check if Meta Pixel server-side tracking is enabled
    if (
      !adsConfig.metaPixel.enabled ||
      !adsConfig.metaPixel.pixelId ||
      !adsConfig.metaPixel.serverSideTracking?.enabled ||
      !adsConfig.metaPixel.serverSideTracking?.accessToken
    ) {
      return NextResponse.json({ error: "Meta Pixel server-side tracking is not configured" }, { status: 400 });
    }

    const body = await request.json();
    const {
      eventName,
      eventId,
      emails = [],
      phones = [],
      firstName,
      lastName,
      country,
      city,
      zipCode,
      products = [],
      value,
      currency = "USD",
      // Additional params from client
      fbp: clientFbp,
      fbc: clientFbc,
      clientIpAddress: clientProvidedIp,
    } = body;

    if (!eventName) {
      return NextResponse.json({ error: "eventName is required" }, { status: 400 });
    }

    const pixelId = adsConfig.metaPixel.pixelId;
    const accessToken = adsConfig.metaPixel.serverSideTracking.accessToken;
    const testEventCode = adsConfig.metaPixel.serverSideTracking.testEventCode;

    // Extract parameters using Parameter Builder patterns
    const requestParams = processRequest(request);

    // Merge client-provided values with server-extracted values
    const fbc = clientFbc || requestParams.fbc;
    const fbp = clientFbp || requestParams.fbp;
    const clientIp = clientProvidedIp || requestParams.clientIpAddress || extractClientIp(request);
    const userAgent = requestParams.userAgent || "";

    // Process user data with proper normalization and hashing
    const processedUserData = processUserData({
      emails: emails.length > 0 ? emails : undefined,
      phones: phones.length > 0 ? phones : undefined,
      firstName,
      lastName,
      country,
      city,
      zipCode,
    });

    // Build event data for Meta Conversions API
    const eventData: Record<string, unknown> = {
      event_name: eventName,
      event_time: Math.floor(Date.now() / 1000),
      event_id: eventId || `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      event_source_url: request.headers.get("referer") || "",
      action_source: "website",
      user_data: {
        client_ip_address: clientIp,
        client_user_agent: userAgent,
        ...(fbp && { fbp }),
        ...(fbc && { fbc }),
        ...processedUserData,
      },
      custom_data: {
        content_type: "product",
        ...(value !== undefined && { value }),
        ...(currency && { currency }),
      },
    };

    // Add product data
    if (products.length > 0) {
      (eventData.custom_data as Record<string, unknown>).contents = products.map((product: { sku: string; quantity?: number }) => ({
        id: product.sku,
        quantity: product.quantity || 1,
      }));
      (eventData.custom_data as Record<string, unknown>).content_ids = products.map((product: { sku: string }) => product.sku);
      (eventData.custom_data as Record<string, unknown>).num_items = products.reduce(
        (sum: number, p: { quantity?: number }) => sum + (p.quantity || 1),
        0
      );
    }

    // Clean up undefined/empty values
    const cleanObject = (obj: Record<string, unknown>): Record<string, unknown> => {
      const cleaned: Record<string, unknown> = {};
      for (const [key, val] of Object.entries(obj)) {
        if (val !== undefined && val !== null && val !== "") {
          if (typeof val === "object" && !Array.isArray(val)) {
            const cleanedNested = cleanObject(val as Record<string, unknown>);
            if (Object.keys(cleanedNested).length > 0) {
              cleaned[key] = cleanedNested;
            }
          } else {
            cleaned[key] = val;
          }
        }
      }
      return cleaned;
    };

    const cleanedEventData = cleanObject(eventData);

    // Send to Meta Conversions API
    const apiUrl = `https://graph.facebook.com/v21.0/${pixelId}/events`;
    const requestBody: Record<string, unknown> = {
      data: [cleanedEventData],
      access_token: accessToken,
    };

    if (testEventCode) {
      requestBody.test_event_code = testEventCode;
    }

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody),
    });

    const responseData = await response.json();

    if (!response.ok) {
      console.error("[FB Events API] Meta API error:", responseData);
      return NextResponse.json({ error: "Failed to send event to Meta", details: responseData }, { status: response.status });
    }

    return NextResponse.json({
      success: true,
      eventId: (cleanedEventData as { event_id: string }).event_id,
      response: responseData,
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("[FB Events API] Error:", error);
    return NextResponse.json({ error: errorMessage || "Failed to process Facebook event" }, { status: 500 });
  }
}

// Export GET handler for health checks
export async function GET() {
  return new Response(
    JSON.stringify({
      message: "Facebook Conversion API endpoint",
      status: "active",
      note: "Use /api/tracking/meta-pixel for new implementations",
    }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }
  );
}
