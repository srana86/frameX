"use client";

import { useEffect, useCallback, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import apiClient, { checkAuth, logout as apiLogout } from "@/lib/api-client";

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
  /**
   * Enable proactive token refresh before expiry
   */
  enableProactiveRefresh?: boolean;
}

interface UseAuthReturn {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

// Refresh interval: 4 minutes (tokens typically expire in 15-30 min)
const REFRESH_INTERVAL = 4 * 60 * 1000;

/**
 * useAuth hook for managing authentication state on the client side
 *
 * Features:
 * - Fetches current user from backend
 * - Proactive token refresh before expiry
 * - Role-based access control
 * - Automatic redirect when not authenticated
 */
export function useAuth(options: UseAuthOptions = {}): UseAuthReturn {
  const {
    required = false,
    requiredRole,
    redirectTo = "/login",
    enableProactiveRefresh = true,
  } = options;

  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isMounted = useRef(true);

  /**
   * Fetch current user from backend
   */
  const fetchUser = useCallback(async () => {
    try {
      const response = await apiClient.get("/auth/me");

      if (!isMounted.current) return;

      if (response.data?.success && response.data?.data) {
        const userData = response.data.data;
        // Normalize role to lowercase (backend returns uppercase like "MERCHANT")
        const normalizedRole = (userData.role || "customer").toLowerCase() as
          | "customer"
          | "merchant"
          | "admin";
        setUser({
          id: userData.id || userData._id,
          fullName: userData.fullName,
          email: userData.email,
          phone: userData.phone,
          role: normalizedRole,
          tenantId: userData.tenantId,
        });
        setError(null);
        return true;
      }
      return false;
    } catch (err) {
      if (!isMounted.current) return false;
      setUser(null);
      return false;
    }
  }, []);

  /**
   * Proactively refresh the token
   */
  const refreshToken = useCallback(async () => {
    try {
      await apiClient.post("/auth/refresh-token");
      // Token is refreshed via httpOnly cookie
    } catch (err) {
      // Refresh failed - user will be logged out on next 401
      console.warn("Token refresh failed");
    }
  }, []);

  /**
   * Refresh authentication state
   */
  const refresh = useCallback(async () => {
    setIsLoading(true);
    await fetchUser();
    setIsLoading(false);
  }, [fetchUser]);

  /**
   * Logout user
   */
  const logout = useCallback(async () => {
    await apiLogout();
    setUser(null);
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
  }, []);

  // Initial auth check
  useEffect(() => {
    isMounted.current = true;

    const initAuth = async () => {
      const isAuth = await fetchUser();

      if (!isMounted.current) return;

      setIsLoading(false);

      // Handle required auth
      if (required && !isAuth) {
        router.push(redirectTo);
        return;
      }

      // Handle role requirements
      if (requiredRole && isAuth && user) {
        const roleHierarchy: Record<string, number> = {
          customer: 1,
          merchant: 2,
          admin: 3,
        };

        const userRoleLevel = roleHierarchy[user.role] || 0;
        const requiredRoleLevel = roleHierarchy[requiredRole] || 0;

        if (userRoleLevel < requiredRoleLevel) {
          // Redirect to appropriate page based on role
          const userRoleLower = user.role.toLowerCase();
          if (userRoleLower === "customer") {
            router.push("/account");
          } else if (userRoleLower === "merchant") {
            router.push("/merchant");
          } else {
            router.push("/");
          }
        }
      }
    };

    initAuth();

    return () => {
      isMounted.current = false;
    };
  }, [fetchUser, required, requiredRole, redirectTo, router, user]);

  // Proactive token refresh
  useEffect(() => {
    if (!enableProactiveRefresh || !user) {
      return;
    }

    // Set up periodic token refresh
    refreshIntervalRef.current = setInterval(() => {
      refreshToken();
    }, REFRESH_INTERVAL);

    // Also refresh on visibility change (user returns to tab)
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        refreshToken();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [enableProactiveRefresh, user, refreshToken]);

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
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
