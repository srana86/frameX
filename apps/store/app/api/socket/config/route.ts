import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * GET /api/socket/config
 * Returns Socket.IO configuration for the current domain
 * This makes it dynamic for multi-tenant/white-label setup
 */
export async function GET(request: NextRequest) {
  try {
    // Get origin from request headers
    const origin = request.headers.get("origin") || request.headers.get("referer") || "";
    const host = request.headers.get("host") || "";

    // Determine the base URL
    let baseUrl = "";

    if (origin) {
      // Use origin if available
      try {
        const url = new URL(origin);
        baseUrl = `${url.protocol}//${url.host}`;
      } catch {
        // Fallback to host header
        const protocol = request.headers.get("x-forwarded-proto") || "https";
        baseUrl = `${protocol}://${host}`;
      }
    } else if (host) {
      // Use host header with protocol detection
      const protocol = request.headers.get("x-forwarded-proto") || (host.includes("localhost") ? "http" : "https");
      baseUrl = `${protocol}://${host}`;
    } else {
      // Final fallback
      baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3000";
    }

    // Return Socket.IO configuration
    return NextResponse.json({
      socketUrl: baseUrl,
      path: "/api/socket",
      transports: ["websocket", "polling"],
    });
  } catch (error: any) {
    console.error("Error getting socket config:", error);
    // Return fallback config
    return NextResponse.json({
      socketUrl:
        process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SOCKET_URL || typeof window !== "undefined"
          ? window.location.origin
          : "http://localhost:3000",
      path: "/api/socket",
      transports: ["websocket", "polling"],
    });
  }
}
