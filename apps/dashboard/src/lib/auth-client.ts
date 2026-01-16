import { createAuthClient } from "better-auth/react";

/**
 * Better Auth Client for Dashboard
 * - Browser: Use relative URL (nginx proxies to server:8081)
 * - Server: Use full URL for SSR
 *
 * Better Auth adds /api/auth/ to the baseURL automatically
 */
const getAuthBaseUrl = () => {
  if (typeof window === "undefined") {
    // Server-side: use internal URL
    return (
      process.env.INTERNAL_API_URL?.replace(/\/api\/v1\/?$/, "") ||
      "http://localhost:8081"
    );
  }
  // Client-side: use relative URL (nginx will proxy)
  return "";
};

export const authClient = createAuthClient({
  baseURL: getAuthBaseUrl(),
});

export const { signIn, signOut, useSession, getSession } = authClient;
