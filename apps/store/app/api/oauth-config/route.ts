import { NextResponse } from "next/server";
import { getMerchantCollectionForAPI, buildMerchantQuery } from "@/lib/api-helpers";
import type { OAuthConfig } from "@/lib/oauth-config-types";
import { defaultOAuthConfig } from "@/lib/oauth-config-types";
import { requireAuth } from "@/lib/auth-helpers";

const OAUTH_CONFIG_ID = "oauth_config_v1";

export async function GET() {
  try {
    // Merchants and admins can view OAuth config
    await requireAuth("merchant");

    const col = await getMerchantCollectionForAPI("oauth_config");
    const query = await buildMerchantQuery({ id: OAUTH_CONFIG_ID });
    const doc = await col.findOne(query);

    if (doc) {
      // Remove MongoDB _id field
      const { _id, ...config } = doc;
      // Don't return client secret in GET request for security
      const safeConfig = {
        ...config,
        google: {
          ...(config as OAuthConfig).google,
          clientSecret: undefined, // Don't expose secret
        },
      };
      return NextResponse.json(safeConfig as Omit<OAuthConfig, "google.clientSecret"> & { google: { clientSecret?: undefined } });
    }

    // Return default config if no config exists in database
    return NextResponse.json(defaultOAuthConfig);
  } catch (error: any) {
    console.error("GET /api/oauth-config error:", error);
    if (error.message === "NEXT_REDIRECT") {
      throw error; // Re-throw redirect errors
    }
    return NextResponse.json({ error: error?.message || "Failed to get OAuth config" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    // Merchants and admins can update OAuth config
    await requireAuth("merchant");

    const body = await request.json();
    const col = await getMerchantCollectionForAPI("oauth_config");
    const baseQuery = await buildMerchantQuery();

    // Validate required fields
    if (!body.google || typeof body.google.enabled !== "boolean") {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const query = { ...baseQuery, id: OAUTH_CONFIG_ID };

    // Get existing config to preserve clientSecret if not provided
    const existing = await col.findOne(query);
    const existingConfig = existing as OAuthConfig | null;

    // Prepare update data
    const updateData: Partial<OAuthConfig> = {
      id: OAUTH_CONFIG_ID,
      google: {
        clientId: body.google.clientId || "",
        // Only update clientSecret if provided, otherwise keep existing
        clientSecret: body.google.clientSecret || existingConfig?.google.clientSecret || "",
        enabled: body.google.enabled,
      },
      updatedAt: new Date().toISOString(),
    };

    // Set createdAt if creating new
    if (!existingConfig) {
      updateData.createdAt = new Date().toISOString();
    }

    // Upsert the OAuth config
    await col.updateOne(
      query,
      {
        $set: updateData,
      },
      { upsert: true }
    );

    // Fetch and return the updated config (without secret)
    const updated = await col.findOne(query);
    const { _id, ...config } = updated as any;
    const safeConfig = {
      ...config,
      google: {
        ...config.google,
        clientSecret: undefined, // Don't expose secret
      },
    };

    return NextResponse.json(safeConfig);
  } catch (error: any) {
    console.error("PUT /api/oauth-config error:", error);
    if (error.message === "NEXT_REDIRECT") {
      throw error; // Re-throw redirect errors
    }
    return NextResponse.json({ error: error?.message || "Failed to update OAuth config" }, { status: 500 });
  }
}
