import { NextResponse } from "next/server";
import crypto from "node:crypto";

// Route segment config for file uploads
// This increases the body size limit and timeout for image uploads in production (Vercel)
export const runtime = "nodejs";
export const maxDuration = 60; // 60 seconds timeout for uploads

function requireEnv(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env ${name}`);
  return v;
}

// CORS headers for cross-origin requests from merchant apps
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Merchant-ID",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: corsHeaders });
}

export async function POST(request: Request) {
  try {
    // Get merchant ID from header for logging/tracking
    const merchantId = request.headers.get("X-Merchant-ID") || "unknown";

    // Log request details for debugging production issues
    const contentType = (request.headers.get("content-type") || "").toLowerCase();
    const contentLength = request.headers.get("content-length");
    console.log(
      `[Cloudinary] Received upload request from merchant ${merchantId}, content-type: ${contentType}, size: ${
        contentLength ? `${(parseInt(contentLength) / 1024 / 1024).toFixed(2)}MB` : "unknown"
      }`
    );

    const prefersForm = contentType.includes("multipart/form-data");

    let file: FormDataEntryValue | null = null;
    let url: string | null = null;
    let folder = `merchants/${merchantId}`;
    let public_id: string | undefined;
    let resource_type = "auto";

    // Helper to pull values from an object (JSON body)
    const hydrateFromObject = (data: any) => {
      if (typeof data?.file === "string") file = data.file;
      if (typeof data?.url === "string") url = data.url;
      if (typeof data?.folder === "string" && data.folder.trim()) folder = data.folder;
      if (typeof data?.public_id === "string" && data.public_id.trim()) public_id = data.public_id;
      if (typeof data?.resource_type === "string" && data.resource_type.trim()) {
        resource_type = data.resource_type.toLowerCase();
      }
    };

    const tryParseForm = async (req: Request) => {
      try {
        const form = await req.formData();
        const formFile = form.get("file");
        file = (formFile as FormDataEntryValue) ?? null;
        const formUrl = form.get("url");
        url = typeof formUrl === "string" ? formUrl : null;
        const folderEntry = form.get("folder");
        if (typeof folderEntry === "string" && folderEntry.trim()) folder = folderEntry;
        const publicIdEntry = form.get("public_id");
        if (typeof publicIdEntry === "string" && publicIdEntry.trim()) public_id = publicIdEntry;
        const resourceEntry = form.get("resource_type");
        if (typeof resourceEntry === "string" && resourceEntry.trim()) {
          resource_type = resourceEntry.toLowerCase();
        }
        return true;
      } catch (err: any) {
        console.error("[Cloudinary] FormData parse failed:", err?.message);
        return false;
      }
    };

    const tryHydrateFromJsonText = (text: string) => {
      try {
        const json = JSON.parse(text);
        hydrateFromObject(json);
        return true;
      } catch (err: any) {
        console.warn("[Cloudinary] JSON parse failed:", err?.message);
        return false;
      }
    };

    const tryHydrateFromUrlText = (text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return false;

      if (trimmed.startsWith("http://") || trimmed.startsWith("https://") || trimmed.startsWith("data:")) {
        url = trimmed;
        return true;
      }
      return false;
    };

    let parsed = false;

    // Parse based on content-type with safe, single-pass reads (avoid "body unusable" errors)
    if (prefersForm) {
      parsed = await tryParseForm(request);

      // If the request claimed to be multipart but could not be parsed,
      // return a clear error instead of attempting to re-read the body (which is unusable after formData()).
      if (!parsed) {
        return NextResponse.json(
          {
            error: "Invalid multipart/form-data body. Ensure the request includes a file or url field.",
            receivedContentType: contentType || "none",
          },
          { status: 400, headers: corsHeaders }
        );
      }
    } else {
      // For JSON / text payloads, read the body once and try JSON first, then URL string fallback
      const rawText = (
        await request.text().catch((err: any) => {
          console.error("[Cloudinary] Text parse failed:", err?.message);
          return "";
        })
      ).trim();

      if (rawText) {
        parsed = tryHydrateFromJsonText(rawText) || tryHydrateFromUrlText(rawText);
      }
    }

    // If still not parsed, reject early with a helpful message
    if (!parsed) {
      return NextResponse.json(
        {
          error: "Invalid body format. Send multipart/form-data with 'file' or 'url', or a JSON/url string.",
          receivedContentType: contentType || "none",
        },
        { status: 400, headers: corsHeaders }
      );
    }

    if (!file && !url) {
      return NextResponse.json({ error: "Provide 'file' (Blob) or 'url'" }, { status: 400, headers: corsHeaders });
    }

    const cloud_name = requireEnv("CLOUDINARY_CLOUD_NAME");
    const api_key = requireEnv("CLOUDINARY_API_KEY");
    const api_secret = requireEnv("CLOUDINARY_API_SECRET");

    const timestamp = Math.floor(Date.now() / 1000);
    const paramsToSign: Record<string, string | number> = { timestamp };
    if (folder) paramsToSign.folder = folder;
    if (public_id) paramsToSign.public_id = public_id;

    const signatureBase =
      Object.keys(paramsToSign)
        .sort()
        .map((k) => `${k}=${paramsToSign[k]}`)
        .join("&") + api_secret;

    const signature = crypto.createHash("sha1").update(signatureBase).digest("hex");

    const body = new FormData();
    body.append("api_key", api_key);
    body.append("timestamp", String(timestamp));
    body.append("signature", signature);
    if (folder) body.append("folder", folder);
    if (public_id) body.append("public_id", public_id);
    if (file && typeof file === "object" && "arrayBuffer" in file) {
      body.append("file", file as Blob);
    } else if (typeof file === "string") {
      body.append("file", file);
    } else if (typeof url === "string") {
      body.append("file", url);
    }

    const cloudUrl = `https://api.cloudinary.com/v1_1/${cloud_name}/${resource_type}/upload`;
    const res = await fetch(cloudUrl, { method: "POST", body });
    const json = await res.json();

    if (!res.ok) {
      console.error(`[Cloudinary] Upload failed for merchant ${merchantId}:`, json?.error?.message);
      return NextResponse.json({ error: json?.error?.message || "Upload failed" }, { status: 500, headers: corsHeaders });
    }

    console.log(`[Cloudinary] Upload successful for merchant ${merchantId}: ${json.public_id}`);

    return NextResponse.json(json, { headers: corsHeaders });
  } catch (e: any) {
    console.error("[Cloudinary] Error:", e?.message, e?.stack);

    // Check for body size limit errors
    const isSizeError = e?.message?.includes("body") || e?.message?.includes("size") || e?.message?.includes("limit");

    return NextResponse.json(
      {
        error: isSizeError
          ? "File too large. Please compress the image before uploading (max 4.5MB for production)."
          : e?.message || "Invalid request",
        details: process.env.NODE_ENV !== "production" ? e?.stack : undefined,
      },
      { status: isSizeError ? 413 : 400, headers: corsHeaders }
    );
  }
}
