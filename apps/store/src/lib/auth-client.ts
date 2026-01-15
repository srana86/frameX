import { createAuthClient } from "better-auth/react";

/**
 * BetterAuth React Client
 *
 * This client handles all authentication operations on the frontend.
 * Sessions are managed via httpOnly cookies - no localStorage tokens needed.
 *
 * Uses relative URL so nginx proxies auth requests to the backend.
 */

// Empty string = relative URL, browser will use current origin
// e.g., demo.localhost/api/auth/* → nginx → store-api:8080
const AUTH_BASE_URL = "";

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
