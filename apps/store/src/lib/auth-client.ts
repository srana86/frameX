import { createAuthClient } from "better-auth/react";

/**
 * BetterAuth React Client
 *
 * This client handles all authentication operations on the frontend.
 * Sessions are managed via httpOnly cookies - no localStorage tokens needed.
 *
 * Uses environment variable for API base URL.
 * - Client-side: Uses relative URL (browser resolves based on current origin)
 * - Server-side: Uses NEXT_PUBLIC_STORE_API_URL for absolute URL
 */

// For client-side, empty string works (browser resolves relative URLs)
// For server-side SSR, we need an absolute URL
const getBaseURL = () => {
  // In browser, use empty string for relative URL
  if (typeof window !== "undefined") {
    return "";
  }
  // Server-side: use the store API base URL (WITHOUT /api/v1 for BetterAuth)
  // BetterAuth endpoints are at /api/auth/*, not /api/v1/api/auth/*
  const apiUrl = process.env.NEXT_PUBLIC_STORE_API_URL || "http://localhost:8080/api/v1";
  // Remove /api/v1 suffix if present to get base URL
  return apiUrl.replace(/\/api\/v1\/?$/, "") || "http://localhost:8080";
};

const AUTH_BASE_URL = getBaseURL();

// Define custom user fields to match backend schema
interface CustomUser {
  id: string;
  email: string;
  name: string | null;
  image?: string | null;
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
  // Custom fields for multi-tenant e-commerce
  tenantId?: string;
  role?: string; // customer, merchant, admin
  phone?: string;
  fullName?: string;
}

interface CustomSession {
  user: CustomUser;
  session: {
    id: string;
    token: string;
    userId: string;
    expiresAt: Date;
  };
}

export const authClient = createAuthClient({
  baseURL: AUTH_BASE_URL,
});

// Create typed signUp function that accepts phone
type SignUpEmailParams = {
  email: string;
  password: string;
  name: string;
  phone?: string;
  image?: string;
  callbackURL?: string;
};

const originalSignUp = authClient.signUp;

// Wrap signUp.email to properly type the phone field
export const signUp = {
  ...originalSignUp,
  email: (params: SignUpEmailParams) => {
    // BetterAuth's type inference doesn't include custom fields,
    // but the server accepts them. Cast to any for the call.
    return originalSignUp.email(params as any);
  },
};

// Export typed authentication functions
const {
  signIn,
  signOut,
  useSession: useAuthSession,
  getSession: getAuthSession,
} = authClient;

export { signIn, signOut };

export const useSession = () => {
  const session = useAuthSession();
  return {
    ...session,
    data: session.data as unknown as CustomSession | null,
  };
};

export const getSession = async () => {
  const session = await getAuthSession();
  return {
    ...session,
    data: session.data as unknown as CustomSession | null,
  };
};

// Helper to get typed session data
export const getTypedSession = async (): Promise<CustomSession | null> => {
  const { data, error } = await getSession();
  if (error || !data) return null;
  return data as unknown as CustomSession;
};

// Re-export the client for advanced use cases
export default authClient;
