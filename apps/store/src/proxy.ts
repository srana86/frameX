import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Enhanced Proxy Middleware for Multi-Tenant System
 * - Extracts tenant from subdomain or custom domain
 * - Uses Redis cache for fast lookups
 * - Falls back to database if cache miss
 */

// In-memory cache for edge runtime (Redis not available in middleware)
const tenantCache = new Map<string, { tenantId: string; expiresAt: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Extract subdomain from host
 * Example: "acme.framextech.com" => "acme"
 */
function extractSubdomain(host: string): string | null {
  const domain = host.split(":")[0].toLowerCase();

  // Match pattern: {subdomain}.framextech.com
  const match = domain.match(/^([^.]+)\.framextech\.com$/);
  if (match) {
    return match[1];
  }

  // For local development
  if (domain === "localhost") {
    return null; // Will use MERCHANT_ID env var
  }

  return null;
}

/**
 * Check if path should skip tenant resolution
 */
function shouldSkipTenantCheck(pathname: string): boolean {
  const skipPaths = [
    "/_next",
    "/api/health",
    "/api/public",
    "/favicon.ico",
    "/robots.txt",
    "/sitemap.xml",
  ];

  return skipPaths.some((path) => pathname.startsWith(path));
}

/**
 * Get tenant from cache
 */
function getTenantFromCache(domain: string): string | null {
  const cached = tenantCache.get(domain);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.tenantId;
  }
  tenantCache.delete(domain);
  return null;
}

/**
 * Set tenant in cache
 */
function setTenantCache(domain: string, tenantId: string): void {
  tenantCache.set(domain, {
    tenantId,
    expiresAt: Date.now() + CACHE_TTL,
  });
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip static assets and health checks
  if (shouldSkipTenantCheck(pathname)) {
    return NextResponse.next();
  }

  const host = request.headers.get("host") || "";
  const domain = host.split(":")[0].toLowerCase();

  // Priority 1: Check environment variable (for local dev / single tenant)
  let tenantId = process.env.MERCHANT_ID;

  // Priority 2: Check in-memory cache
  if (!tenantId) {
    tenantId = getTenantFromCache(domain) || undefined;
  }

  // Priority 3: Extract from subdomain
  const subdomain = extractSubdomain(host);

  // Create response with tenant headers
  const response = NextResponse.next();

  if (tenantId) {
    response.headers.set("x-merchant-id", tenantId);
    response.headers.set("x-tenant-resolved", "cache");
  } else if (subdomain) {
    // For subdomain, we'll resolve via API call in server components
    // Middleware can't do DB calls, so we pass subdomain to API
    response.headers.set("x-subdomain", subdomain);
    response.headers.set("x-tenant-resolved", "subdomain");
  } else {
    // Custom domain - pass to API for resolution
    response.headers.set("x-domain", domain);
    response.headers.set("x-tenant-resolved", "domain");
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
