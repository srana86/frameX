import { NextRequest, NextResponse } from "next/server";

/**
 * Helper to build super-admin API URLs
 */
function buildSuperAdminUrl(path: string): string {
  const baseUrl = process.env.SUPER_ADMIN_URL || process.env.NEXT_PUBLIC_SUPER_ADMIN_URL || "http://localhost:3001";
  const cleanBase = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${cleanBase}${cleanPath}`;
}

// GET /api/merchant/fraud-check - Get usage stats (proxies to super-admin)
export async function GET(request: NextRequest) {
  try {
    const superAdminUrl = buildSuperAdminUrl("/api/fraud-check");

    console.log(`[Fraud Check API] Proxying GET request to super-admin: ${superAdminUrl}`);

    // Get origin from request to pass to super-admin for domain whitelisting
    const origin = request.headers.get("origin") || request.headers.get("referer") || "";

    const response = await fetch(superAdminUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...(origin && { "X-Origin": origin }),
      },
      cache: "no-store",
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("[Fraud Check API] Error proxying request to super-admin:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Server error",
        message: error instanceof Error ? error.message : "Failed to connect to super-admin fraud check service",
      },
      { status: 500 }
    );
  }
}

// POST /api/merchant/fraud-check - Check customer fraud data (proxies to super-admin)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const superAdminUrl = buildSuperAdminUrl("/api/fraud-check");

    console.log(`[Fraud Check API] Proxying POST request to super-admin: ${superAdminUrl}`);

    // Get origin from request to pass to super-admin for domain whitelisting
    const origin = request.headers.get("origin") || request.headers.get("referer") || "";

    const response = await fetch(superAdminUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(origin && { "X-Origin": origin }),
      },
      body: JSON.stringify(body),
      cache: "no-store",
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("[Fraud Check API] Error proxying request to super-admin:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Server error",
        message: error instanceof Error ? error.message : "Failed to connect to super-admin fraud check service",
      },
      { status: 500 }
    );
  }
}
