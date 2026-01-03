import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Middleware to detect merchant from domain/subdomain
 * Adds merchant context to request headers
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Skip middleware for API routes that don't need merchant context
  if (pathname.startsWith("/api/auth") || pathname.startsWith("/_next")) {
    return NextResponse.next();
  }

  // Get host/domain from request
  const host = request.headers.get("host") || "";
  const domain = host.split(":")[0]; // Remove port if present

  // Check for merchant ID in environment (for deployed instances)
  const merchantId = process.env.MERCHANT_ID;

  // Create response
  const response = NextResponse.next();

  // Add merchant ID to headers if found
  if (merchantId) {
    response.headers.set("x-merchant-id", merchantId);
  }

  // Add domain to headers for merchant detection
  if (domain) {
    response.headers.set("x-domain", domain);
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (authentication routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api/auth|_next/static|_next/image|favicon.ico).*)",
  ],
};

