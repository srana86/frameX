import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-helpers";
import { configureDomainViaSuperAdmin, getDomainConfigFromSuperAdmin } from "@/lib/super-admin-client";

/**
 * Configure custom domain for merchant
 * Uses super-admin proxy API for domain management
 */
export async function POST(request: Request) {
  try {
    const user = await requireAuth("merchant");
    const body = await request.json();

    const { domain, redirect, redirectStatusCode } = body;

    if (!domain) {
      return NextResponse.json({ error: "Domain is required" }, { status: 400 });
    }

    // Validate domain format
    const domainRegex = /^([a-z0-9]+(-[a-z0-9]+)*\.)+[a-z]{2,}$/i;
    if (!domainRegex.test(domain)) {
      return NextResponse.json({ error: "Invalid domain format" }, { status: 400 });
    }

    // Validate redirect URL if provided
    if (redirect) {
      try {
        new URL(redirect);
      } catch {
        return NextResponse.json({ error: "Invalid redirect URL format" }, { status: 400 });
      }
    }

    // Use merchantId if available (links to deployment), otherwise fall back to user.id
    const merchantId = user.merchantId || user.id;

    // Configure domain via super-admin proxy
    const result = await configureDomainViaSuperAdmin(merchantId, domain, redirect, redirectStatusCode || 301);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Error configuring domain:", error);
    if (error.message === "NEXT_REDIRECT") {
      throw error;
    }
    return NextResponse.json({ error: error?.message || "Failed to configure domain" }, { status: 500 });
  }
}

/**
 * Get current domain configuration with real-time Vercel status
 * Uses super-admin proxy API
 */
export async function GET() {
  try {
    const user = await requireAuth("merchant");
    // Use merchantId if available, otherwise fall back to user.id
    const merchantId = user.merchantId || user.id;

    // Get domain config from super-admin (includes real-time Vercel status)
    const result = await getDomainConfigFromSuperAdmin(merchantId);

    return NextResponse.json({
      domain: result?.domain || null,
      vercelDomains: result?.vercelDomains || [],
      vercelStatus: (result as any)?.vercelStatus || null,
    });
  } catch (error: any) {
    console.error("Error getting domain configuration:", error);
    if (error.message === "NEXT_REDIRECT") {
      throw error;
    }
    return NextResponse.json({ error: error?.message || "Failed to get domain configuration" }, { status: 500 });
  }
}
