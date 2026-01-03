import { NextResponse } from "next/server";
import { getDeliveryServiceConfig } from "@/lib/delivery-config";
import { CACHE_TAGS, CACHE_HEADERS } from "@/lib/cache-helpers";

export const revalidate = 300; // Cache for 5 minutes
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const config = await getDeliveryServiceConfig();

    return NextResponse.json(
      {
        defaultDeliveryCharge: config.defaultDeliveryCharge ?? 0,
        freeShippingThreshold: config.freeShippingThreshold,
      },
      {
        headers: {
          ...CACHE_HEADERS.STATIC,
          "X-Cache-Tags": CACHE_TAGS.DELIVERY_CONFIG,
        },
      }
    );
  } catch (error: any) {
    console.error("GET /api/storefront/delivery-config error:", error);
    // Fail soft with sensible defaults so checkout still works
    return NextResponse.json(
      {
        defaultDeliveryCharge: 0,
        freeShippingThreshold: undefined,
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
