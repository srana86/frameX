import { NextResponse } from "next/server";

/**
 * Cloudinary Configuration API
 * Returns the cloud name for client-side image rendering
 * This allows merchant apps to display images without needing full Cloudinary credentials
 */

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Merchant-ID",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: corsHeaders });
}

export async function GET() {
  try {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    
    if (!cloudName) {
      return NextResponse.json(
        { error: "Cloudinary not configured" },
        { status: 500, headers: corsHeaders }
      );
    }

    return NextResponse.json(
      { 
        cloudName,
        // Base URL for image delivery
        baseUrl: `https://res.cloudinary.com/${cloudName}`,
      },
      { headers: corsHeaders }
    );
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Failed to get config" },
      { status: 500, headers: corsHeaders }
    );
  }
}

