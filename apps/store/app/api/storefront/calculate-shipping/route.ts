import { NextResponse } from "next/server";
import { getDeliveryServiceConfig } from "@/lib/delivery-config";
import { CACHE_TAGS, CACHE_HEADERS } from "@/lib/cache-helpers";

export const revalidate = 300; // Cache for 5 minutes
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { city, area } = body;

    if (!city) {
      return NextResponse.json(
        { error: "City is required" },
        { status: 400 }
      );
    }

    const config = await getDeliveryServiceConfig();
    let shippingCost = config.defaultDeliveryCharge ?? 0;

    // Check for specific delivery charges based on location
    if (config.specificDeliveryCharges && config.specificDeliveryCharges.length > 0) {
      // Normalize location names for comparison (case-insensitive, trim whitespace)
      const normalize = (str: string) => str.toLowerCase().trim();

      // Try to match by area first (more specific)
      if (area) {
        const areaMatch = config.specificDeliveryCharges.find(
          (charge) => normalize(charge.location) === normalize(area)
        );
        if (areaMatch) {
          shippingCost = areaMatch.charge;
          return NextResponse.json(
            { shipping: shippingCost },
            {
              headers: {
                ...CACHE_HEADERS.STATIC,
                "X-Cache-Tags": CACHE_TAGS.DELIVERY_CONFIG,
              },
            }
          );
        }
      }

      // Try to match by city
      const cityMatch = config.specificDeliveryCharges.find(
        (charge) => normalize(charge.location) === normalize(city)
      );
      if (cityMatch) {
        shippingCost = cityMatch.charge;
        return NextResponse.json(
          { shipping: shippingCost },
          {
            headers: {
              ...CACHE_HEADERS.STATIC,
              "X-Cache-Tags": CACHE_TAGS.DELIVERY_CONFIG,
            },
          }
        );
      }

      // Try partial matching (in case location contains city name)
      const partialMatch = config.specificDeliveryCharges.find(
        (charge) => {
          const normalizedLocation = normalize(charge.location);
          const normalizedCity = normalize(city);
          return (
            normalizedLocation.includes(normalizedCity) ||
            normalizedCity.includes(normalizedLocation)
          );
        }
      );
      if (partialMatch) {
        shippingCost = partialMatch.charge;
        return NextResponse.json(
          { shipping: shippingCost },
          {
            headers: {
              ...CACHE_HEADERS.STATIC,
              "X-Cache-Tags": CACHE_TAGS.DELIVERY_CONFIG,
            },
          }
        );
      }
    }

    return NextResponse.json(
      { shipping: shippingCost },
      {
        headers: {
          ...CACHE_HEADERS.STATIC,
          "X-Cache-Tags": CACHE_TAGS.DELIVERY_CONFIG,
        },
      }
    );
  } catch (error: any) {
    console.error("GET /api/storefront/calculate-shipping error:", error);
    // Fail soft with default shipping
    const config = await getDeliveryServiceConfig().catch(() => null);
    return NextResponse.json(
      {
        shipping: config?.defaultDeliveryCharge ?? 0,
      },
      {
        status: 200,
        headers: {
          ...CACHE_HEADERS.STATIC,
          "X-Cache-Tags": CACHE_TAGS.DELIVERY_CONFIG,
        },
      }
    );
  }
}

