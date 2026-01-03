import { NextResponse } from "next/server";
import { z } from "zod";
import { getMerchantCollectionForAPI, buildMerchantQuery } from "@/lib/api-helpers";
import type { DeliveryServiceConfig, CourierServicesConfig } from "@/types/delivery-config-types";
import { defaultDeliveryServiceConfig, defaultCourierServicesConfig } from "@/types/delivery-config-types";
import { requireAuth } from "@/lib/auth-helpers";

const DELIVERY_SERVICE_CONFIG_ID = "delivery_service_config_v1";
const COURIER_SERVICES_CONFIG_ID = "courier_services_config_v1";

// Zod schemas for validation
const weightBasedChargeSchema = z.object({
  weight: z.number().min(0, "Weight must be 0 or greater"),
  extraCharge: z.number().min(0, "Extra charge must be 0 or greater"),
});

const specificDeliveryChargeSchema = z.object({
  location: z.string().min(1, "Location is required"),
  charge: z.number().min(0, "Charge must be 0 or greater"),
});

const deliveryServiceConfigSchema = z.object({
  defaultDeliveryCharge: z.number().min(0, "Default delivery charge must be 0 or greater"),
  enableCODForDefault: z.boolean(),
  deliveryChargeNotRefundable: z.boolean(),
  weightBasedCharges: z.array(weightBasedChargeSchema),
  deliveryOption: z.enum(["zones", "districts", "upazila"]),
  specificDeliveryCharges: z.array(specificDeliveryChargeSchema),
});

const courierServiceSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Name is required"),
  enabled: z.boolean(),
  logo: z.string().optional(),
  credentials: z.record(z.string(), z.any()).optional(),
});

const courierServicesConfigSchema = z.object({
  services: z.array(courierServiceSchema),
});

// GET delivery service config
export async function GET(request: Request) {
  try {
    await requireAuth("merchant");

    const url = new URL(request.url);
    const type = url.searchParams.get("type");

    if (type === "courier") {
      const col = await getMerchantCollectionForAPI("courier_services_config");
      const baseQuery = await buildMerchantQuery();
      const query = { ...baseQuery, id: COURIER_SERVICES_CONFIG_ID };
      const doc = await col.findOne(query);

      if (doc) {
        const { _id, ...config } = doc;
        return NextResponse.json(config as CourierServicesConfig);
      }

      return NextResponse.json(defaultCourierServicesConfig);
    } else {
      const col = await getMerchantCollectionForAPI("delivery_service_config");
      const baseQuery = await buildMerchantQuery();
      const query = { ...baseQuery, id: DELIVERY_SERVICE_CONFIG_ID };
      const doc = await col.findOne(query);

      if (doc) {
        const { _id, ...config } = doc;
        return NextResponse.json(config as DeliveryServiceConfig);
      }

      return NextResponse.json(defaultDeliveryServiceConfig);
    }
  } catch (error: any) {
    console.error("GET /api/delivery-config error:", error);
    if (error.message === "NEXT_REDIRECT") {
      throw error;
    }
    return NextResponse.json({ error: error?.message || "Failed to get delivery config" }, { status: 500 });
  }
}

// PUT delivery service config
export async function PUT(request: Request) {
  try {
    await requireAuth("merchant");

    const body = await request.json();
    const url = new URL(request.url);
    const type = url.searchParams.get("type");

    if (type === "courier") {
      // Validate courier services config
      const validated = courierServicesConfigSchema.parse(body);

      const col = await getMerchantCollectionForAPI("courier_services_config");
      const baseQuery = await buildMerchantQuery();
      const query = { ...baseQuery, id: COURIER_SERVICES_CONFIG_ID };

      const existing = await col.findOne(query);
      const now = new Date().toISOString();

      const updateData: CourierServicesConfig = {
        id: COURIER_SERVICES_CONFIG_ID,
        services: validated.services,
        updatedAt: now,
        ...(existing ? {} : { createdAt: now }),
      };

      await col.updateOne(query, { $set: updateData }, { upsert: true });

      const updated = await col.findOne(query);
      const { _id, ...config } = updated as any;
      return NextResponse.json(config);
    } else {
      // Validate delivery service config
      const validated = deliveryServiceConfigSchema.parse(body);

      const col = await getMerchantCollectionForAPI("delivery_service_config");
      const baseQuery = await buildMerchantQuery();
      const query = { ...baseQuery, id: DELIVERY_SERVICE_CONFIG_ID };

      const existing = await col.findOne(query);
      const now = new Date().toISOString();

      const updateData: DeliveryServiceConfig = {
        id: DELIVERY_SERVICE_CONFIG_ID,
        defaultDeliveryCharge: validated.defaultDeliveryCharge,
        enableCODForDefault: validated.enableCODForDefault,
        deliveryChargeNotRefundable: validated.deliveryChargeNotRefundable,
        weightBasedCharges: validated.weightBasedCharges,
        deliveryOption: validated.deliveryOption,
        specificDeliveryCharges: validated.specificDeliveryCharges,
        updatedAt: now,
        ...(existing ? {} : { createdAt: now }),
      };

      await col.updateOne(query, { $set: updateData }, { upsert: true });

      const updated = await col.findOne(query);
      const { _id, ...config } = updated as any;
      return NextResponse.json(config);
    }
  } catch (error: any) {
    console.error("PUT /api/delivery-config error:", error);
    if (error.message === "NEXT_REDIRECT") {
      throw error;
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation failed", details: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: error?.message || "Failed to update delivery config" }, { status: 500 });
  }
}
