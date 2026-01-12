"use client";

import { useEffect, useCallback, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSession, signOut, getSession } from "@/lib/auth-client";

export interface AuthUser {
  id: string;
  fullName: string;
  email?: string;
  phone?: string;
  role: "customer" | "merchant" | "admin";
  tenantId?: string;
}

interface UseAuthOptions {
  /**
   * If true, redirects to login page when not authenticated
   */
  required?: boolean;
  /**
   * Required role to access the page (customer < merchant < admin)
   */
  requiredRole?: "customer" | "merchant" | "admin";
  /**
   * Redirect URL when not authenticated
   */
  redirectTo?: string;
}

interface UseAuthReturn {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

/**
 * useAuth hook for managing authentication state on the client side
 * Uses BetterAuth session management
 *
 * Features:
 * - Fetches current user via BetterAuth session
 * - Role-based access control
 * - Automatic redirect when not authenticated
 */
export function useAuth(options: UseAuthOptions = {}): UseAuthReturn {
  const {
    required = false,
    requiredRole,
    redirectTo = "/login",
  } = options;

  const router = useRouter();
  const session = useSession();
  const [error, setError] = useState<string | null>(null);
  const hasRedirected = useRef(false);

  // Transform BetterAuth session to AuthUser
  const user: AuthUser | null = session.data?.user
    ? {
      id: session.data.user.id,
      fullName: session.data.user.name || "",
      email: session.data.user.email,
      phone: session.data.user.phone,
      role: ((session.data.user.role || "CUSTOMER").toLowerCase() as "customer" | "merchant" | "admin"),
      tenantId: session.data.user.tenantId,
    }
    : null;

  const isLoading = session.isPending;
  const isAuthenticated = !!user;

  /**
   * Refresh authentication state
   */
  const refresh = useCallback(async () => {
    // BetterAuth handles session refresh automatically via cookies
    // Just refetch session
    await getSession();
  }, []);

  /**
   * Logout user
   */
  const logout = useCallback(async () => {
    await signOut();
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
  }, []);

  // Handle required auth and role checks
  useEffect(() => {
    if (isLoading || hasRedirected.current) return;

    // Handle required auth
    if (required && !isAuthenticated) {
      hasRedirected.current = true;
      router.push(redirectTo);
      return;
    }

    // Handle role requirements
    if (requiredRole && isAuthenticated && user) {
      const roleHierarchy: Record<string, number> = {
        customer: 1,
        merchant: 2,
        admin: 3,
      };

      const userRoleLevel = roleHierarchy[user.role] || 0;
      const requiredRoleLevel = roleHierarchy[requiredRole] || 0;

      if (userRoleLevel < requiredRoleLevel) {
        hasRedirected.current = true;
        // Redirect to appropriate page based on role
        if (user.role === "customer") {
          router.push("/account");
        } else if (user.role === "merchant") {
          router.push("/merchant");
        } else {
          router.push("/");
        }
      }
    }
  }, [isLoading, isAuthenticated, user, required, requiredRole, redirectTo, router]);

  return {
    user,
    isLoading,
    isAuthenticated,
    error,
    logout,
    refresh,
  };
}

/**
 * Simple auth check hook
 * Returns true if user is authenticated
 */
export function useIsAuthenticated(): boolean {
  const { isAuthenticated } = useAuth();
  return isAuthenticated;
}

export default useAuth;
