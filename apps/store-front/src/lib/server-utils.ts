import { headers, cookies } from "next/headers";
import { serverSideApiClient } from "./api-client";

/**
 * Get the current domain from request headers
 * This is the primary method for tenant resolution in server components
 */
export async function getDomain(): Promise<string> {
  const headersList = await headers();

  // Try multiple header sources for the domain
  const host =
    headersList.get("x-forwarded-host") || headersList.get("host") || "";

  // Remove port if present (e.g., "demo.localhost:3000" -> "demo.localhost")
  const domain = host.split(":")[0];

  return domain;
}

/**
 * Get the auth token from cookies
 */
export async function getAuthToken(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get("auth_token")?.value;
}

/**
 * Get a configured server-side API client with proper tenant headers
 * This automatically resolves the domain from the current request
 *
 * Use this in all server components instead of calling serverSideApiClient() directly
 */
export async function getServerClient() {
  const domain = await getDomain();
  const token = await getAuthToken();

  return serverSideApiClient(token, undefined, domain);
}

/**
 * Get a configured server-side API client without auth token
 * Use for public endpoints that don't require authentication
 */
export async function getPublicServerClient() {
  const domain = await getDomain();

  return serverSideApiClient(undefined, undefined, domain);
}
