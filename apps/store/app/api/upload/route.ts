import { NextResponse } from "next/server";

// Route segment config for file uploads
// This increases the body size limit from 1MB (default) to 10MB
// Required for image uploads in production (Vercel)
export const runtime = "nodejs";
export const maxDuration = 60; // 60 seconds timeout for uploads

function getEnv(name: string, fallback?: string) {
  return process.env[name] || fallback;
}

// Default to localhost for development, production URL as fallback
const DEFAULT_SUPER_ADMIN_URL = process.env.NODE_ENV === "development" ? "http://localhost:3001" : "https://framextech.com";

/**
 * Upload to Cloudinary via Central API
 *
 * All uploads go through the super-admin's central Cloudinary API.
 * In development: uses localhost:3001
 * In production: uses framextech.com or SUPER_ADMIN_URL env var
 * The API returns secure_url which should be saved directly to the database.
 * No local Cloudinary credentials needed.
 */
export async function POST(request: Request) {
  try {
    // Log request details for debugging
    const contentType = request.headers.get("content-type") || "";
    console.log(`[Upload] Received request with content-type: ${contentType}`);

    let form: FormData;
    try {
      form = await request.formData();
    } catch (parseError: any) {
      console.error("[Upload] Failed to parse FormData:", parseError?.message);
      return NextResponse.json(
        {
          error: "Failed to parse upload data. The file may be too large or the request format is invalid.",
          details: parseError?.message,
        },
        { status: 400 }
      );
    }

    const file = form.get("file");
    const url = form.get("url");
    const folder = (form.get("folder") as string) || undefined;
    const public_id = (form.get("public_id") as string) || undefined;
    const resource_type = ((form.get("resource_type") as string) || "auto").toLowerCase();

    if (!file && !url) {
      return NextResponse.json({ error: "Provide 'file' (Blob) or 'url'" }, { status: 400 });
    }

    // Log file details for debugging
    if (file instanceof Blob) {
      console.log(`[Upload] File size: ${(file.size / 1024 / 1024).toFixed(2)}MB, type: ${file.type}`);
    }

    // Get merchant ID for tracking
    const merchantId = getEnv("MERCHANT_ID") || getEnv("NEXT_PUBLIC_MERCHANT_ID");

    // Get super admin URL - use env var if set, otherwise use default (localhost:3001 for dev)
    const superAdminUrl = getEnv("SUPER_ADMIN_URL") || getEnv("NEXT_PUBLIC_SUPER_ADMIN_URL") || DEFAULT_SUPER_ADMIN_URL;
    const centralApiUrl = `${superAdminUrl}/api/cloudinary/upload`;

    // Build form data for central API
    const body = new FormData();
    if (file instanceof Blob) {
      body.append("file", file);
    } else if (typeof url === "string") {
      body.append("url", url);
    }
    if (folder) body.append("folder", folder);
    if (public_id) body.append("public_id", public_id);
    body.append("resource_type", resource_type);

    console.log(`[Upload] Uploading to central API: ${centralApiUrl}`);

    const res = await fetch(centralApiUrl, {
      method: "POST",
      body,
      headers: {
        "X-Merchant-ID": merchantId || "unknown",
      },
    });

    let json;
    try {
      json = await res.json();
    } catch (jsonError) {
      console.error("[Upload] Failed to parse response from central API:", jsonError);
      return NextResponse.json({ error: "Invalid response from upload service" }, { status: 502 });
    }

    if (!res.ok) {
      // Only log non-connection errors
      const isConnectionError = res.status === 503 || json?.error?.includes("Connection refused");
      if (!isConnectionError) {
        console.error("[Upload] Central API error:", json?.error, "Status:", res.status);
      }
      return NextResponse.json({ error: json?.error || "Upload failed" }, { status: res.status });
    }

    // Returns { secure_url, public_id, ... } - save secure_url to database
    console.log(`[Upload] Success: ${json?.public_id}`);
    return NextResponse.json(json);
  } catch (e: any) {
    // Silently handle connection errors - don't spam console
    const isConnectionError = e?.cause?.code === "ECONNREFUSED" || e?.code === "ECONNREFUSED";
    if (!isConnectionError) {
      console.error("[Upload] Error:", e?.message, e?.stack);
    }
    return NextResponse.json(
      {
        error: isConnectionError
          ? "Unable to connect to upload service. Please check if super-admin is running."
          : e?.message || "Upload failed",
      },
      { status: 500 }
    );
  }
}
