import { NextResponse } from "next/server";
import crypto from "node:crypto";

/**
 * Central Cloudinary Delete API
 * This API handles image deletion for all merchant apps
 */

function requireEnv(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env ${name}`);
  return v;
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Merchant-ID",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: corsHeaders });
}

export async function POST(request: Request) {
  try {
    const merchantId = request.headers.get("X-Merchant-ID") || "unknown";
    const body = await request.json();
    const { public_id, resource_type = "image" } = body;

    if (!public_id) {
      return NextResponse.json(
        { error: "public_id is required" },
        { status: 400, headers: corsHeaders }
      );
    }

    const cloud_name = requireEnv("CLOUDINARY_CLOUD_NAME");
    const api_key = requireEnv("CLOUDINARY_API_KEY");
    const api_secret = requireEnv("CLOUDINARY_API_SECRET");

    const timestamp = Math.floor(Date.now() / 1000);
    const signatureBase = `public_id=${public_id}&timestamp=${timestamp}${api_secret}`;
    const signature = crypto.createHash("sha1").update(signatureBase).digest("hex");

    const formData = new FormData();
    formData.append("public_id", public_id);
    formData.append("api_key", api_key);
    formData.append("timestamp", String(timestamp));
    formData.append("signature", signature);

    const cloudUrl = `https://api.cloudinary.com/v1_1/${cloud_name}/${resource_type}/destroy`;
    const res = await fetch(cloudUrl, { method: "POST", body: formData });
    const json = await res.json();

    if (!res.ok || json.result !== "ok") {
      console.error(`[Cloudinary] Delete failed for merchant ${merchantId}:`, json);
      return NextResponse.json(
        { error: json?.error?.message || "Delete failed", result: json },
        { status: 500, headers: corsHeaders }
      );
    }

    console.log(`[Cloudinary] Delete successful for merchant ${merchantId}: ${public_id}`);
    
    return NextResponse.json({ success: true, result: json }, { headers: corsHeaders });
  } catch (e: any) {
    console.error("[Cloudinary] Delete error:", e?.message);
    return NextResponse.json(
      { error: e?.message || "Invalid request" },
      { status: 400, headers: corsHeaders }
    );
  }
}

// Also support DELETE method
export async function DELETE(request: Request) {
  return POST(request);
}

