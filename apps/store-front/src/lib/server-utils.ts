import { headers, cookies } from "next/headers";
import { serverSideApiClient } from "./api-client";

/**
 * Get the current host (domain + port) from request headers
 * This is the primary method for tenant resolution in server components
 */
export async function getDomain(): Promise<string> {
  const headersList = await headers();

  // Try multiple header sources for the host
  const host =
    headersList.get("x-forwarded-host") || headersList.get("host") || "";

  return host;
}

/**
 * Get the auth token from cookies
 */
export async function getAuthToken(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get("auth_token")?.value;
}

/**
 * Get the current protocol (http or https)
 */
export async function getProtocol(): Promise<string> {
  const headersList = await headers();
  const xForwardedProto = headersList.get("x-forwarded-proto");
  if (xForwardedProto) {
    return xForwardedProto.split(",")[0].trim();
  }
  return process.env.NODE_ENV === "production" ? "https" : "http";
}

/**
 * Get all cookies formatted as a single string for the Cookie header
 */
export async function getCookiesHeader(): Promise<string> {
  const cookieStore = await cookies();
  return cookieStore
    .getAll()
    .map((cookie) => `${cookie.name}=${cookie.value}`)
    .join("; ");
}

/**
 * Get a configured server-side API client with proper tenant headers
 * This automatically resolves the domain from the current request
 * and constructs an absolute URL to call the API via the proxy.
 *
 * Use this in all server components instead of calling serverSideApiClient() directly
 */
export async function getServerClient() {
  const domain = await getDomain();
  const protocol = await getProtocol();
  const cookieHeader = await getCookiesHeader();
  const token = await getAuthToken();

  // Create an absolute URL for the API call
  // This ensures that the request goes through the same proxy (Nginx) as browser requests
  const absoluteApiUrl = `${protocol}://${domain}/api/v1/`;

  return serverSideApiClient(token, undefined, domain, absoluteApiUrl, {
    Cookie: cookieHeader,
  });
}

/**
 * Get a configured server-side API client without auth token
 * Use for public endpoints that don't require authentication
 * Still forwards cookies for tenant detection if needed
 */
export async function getPublicServerClient() {
  const domain = await getDomain();
  const protocol = await getProtocol();
  const cookieHeader = await getCookiesHeader();

  const absoluteApiUrl = `${protocol}://${domain}/api/v1/`;

  return serverSideApiClient(undefined, undefined, domain, absoluteApiUrl, {
    Cookie: cookieHeader,
  });
}
