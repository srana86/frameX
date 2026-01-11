import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api/v1";

/**
 * Client-side API client
 * Uses httpOnly cookies for authentication (set by backend)
 * withCredentials: true ensures cookies are sent with requests
 */
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, // Critical: sends httpOnly cookies with requests
});

/**
 * Server-side API client factory
 * For use in Next.js server components and API routes
 */
export const serverSideApiClient = (
  token?: string,
  merchantId?: string,
  domain?: string
) => {
  return axios.create({
    baseURL: API_BASE_URL,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      "X-Merchant-ID": merchantId || process.env.NEXT_PUBLIC_MERCHANT_ID || "",
      "X-Domain": domain || process.env.NEXT_PUBLIC_DOMAIN || "",
    },
    withCredentials: true,
  });
};

/**
 * Server-side API request helper
 * Use this in Next.js server components, API routes, and server actions
 *
 * @param method - HTTP method
 * @param url - API endpoint URL
 * @param options - Optional: token, merchantId, domain, data, params
 */
export const serverApiRequest = async <T>(
  method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH",
  url: string,
  options?: {
    token?: string;
    merchantId?: string;
    domain?: string;
    data?: unknown;
    params?: Record<string, unknown>;
  }
): Promise<T> => {
  const client = serverSideApiClient(
    options?.token,
    options?.merchantId,
    options?.domain
  );

  const response = await client({
    method,
    url,
    data: options?.data,
    params: options?.params,
  });

  return response.data;
};

// Track if a token refresh is in progress to prevent multiple simultaneous refreshes
let isRefreshing = false;
let refreshSubscribers: ((success: boolean) => void)[] = [];

/**
 * Subscribe to refresh completion
 */
const subscribeToRefresh = (callback: (success: boolean) => void) => {
  refreshSubscribers.push(callback);
};

/**
 * Notify all subscribers of refresh result
 */
const notifyRefreshSubscribers = (success: boolean) => {
  refreshSubscribers.forEach((callback) => callback(success));
  refreshSubscribers = [];
};

/**
 * Request interceptor
 * Adds domain header for tenant resolution
 * Also adds Authorization header from localStorage as fallback for cross-origin cookie issues
 */
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Send current domain for tenant resolution
    if (typeof window !== "undefined") {
      config.headers["X-Domain"] = window.location.hostname;

      // Fallback: Get token from localStorage for cross-origin scenarios
      // where cookies might not be sent due to sameSite restrictions
      const token = localStorage.getItem("auth_token");
      if (token && !config.headers.Authorization) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }

    // Fallback to merchant ID from env
    const merchantId = process.env.NEXT_PUBLIC_MERCHANT_ID;
    if (merchantId) {
      config.headers["X-Merchant-ID"] = merchantId;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

/**
 * List of endpoints that should NOT trigger token refresh or redirect on 401
 * These are either public endpoints or auth-checking endpoints
 */
const publicEndpoints = [
  "/auth/refresh-token",
  "/auth/login",
  "/auth/register",
  "/auth/me", // Used for checking auth status - should not redirect
  "/auth/forgot-password",
  "/auth/reset-password",
  "/auth/google",
  "/brand-config",
  "/oauth-config",
  "/delivery-config",
  "/ads-config",
  "/products",
  "/pages",
  "/hero-slides",
  "/storefront",
  "/geolocation",
  "/reviews",
  "/promotional-banner",
];

/**
 * Check if a URL is a public endpoint that shouldn't trigger auth redirects
 */
const isPublicEndpoint = (url: string | undefined): boolean => {
  if (!url) return false;
  return publicEndpoints.some((endpoint) => url.includes(endpoint));
};

/**
 * Response interceptor
 * Handles automatic token refresh on 401 errors for protected endpoints only
 * Public endpoints will NOT trigger redirects
 */
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    // Don't retry if:
    // 1. No config (shouldn't happen)
    // 2. Already retried
    // 3. Request was for a public endpoint
    if (
      !originalRequest ||
      originalRequest._retry ||
      isPublicEndpoint(originalRequest.url)
    ) {
      return Promise.reject(error);
    }

    // Handle 401 Unauthorized errors for protected endpoints
    if (error.response?.status === 401) {
      // If refresh is already in progress, wait for it
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          subscribeToRefresh((success: boolean) => {
            if (success) {
              // Retry original request after successful refresh
              resolve(apiClient(originalRequest));
            } else {
              reject(error);
            }
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Call refresh endpoint - it will use the httpOnly refresh_token cookie
        const response = await apiClient.post("/auth/refresh-token");

        if (response.data?.success) {
          // Token refreshed successfully
          // The new auth_token cookie is automatically set by the backend
          isRefreshing = false;
          notifyRefreshSubscribers(true);

          // Retry original request with new token (cookie will be sent automatically)
          return apiClient(originalRequest);
        }
      } catch (refreshError) {
        isRefreshing = false;
        notifyRefreshSubscribers(false);

        // Refresh failed - just reject, don't redirect
        // Let the calling code decide what to do (e.g., protected pages can redirect)
        return Promise.reject(error);
      }

      isRefreshing = false;
    }

    return Promise.reject(error);
  }
);

/**
 * Type-safe API request helper
 * @param method - HTTP method
 * @param url - API endpoint URL
 * @param data - Request body data
 * @param params - Query parameters
 * @param headers - Additional headers
 */
export const apiRequest = async <T>(
  method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH",
  url: string,
  data?: unknown,
  params?: Record<string, unknown>,
  headers?: Record<string, string>
): Promise<T> => {
  const response = await apiClient({
    method,
    url,
    data,
    params,
    headers: {
      ...headers,
    },
  });
  return response.data;
};

/**
 * Check if currently authenticated (by attempting to call /auth/me)
 * @returns true if authenticated, false otherwise
 */
export const checkAuth = async (): Promise<boolean> => {
  try {
    const response = await apiClient.get("/auth/me");
    return response.data?.success === true;
  } catch {
    return false;
  }
};

/**
 * Logout - clears auth cookies and localStorage token
 * Note: Does NOT redirect - let calling code handle navigation
 */
export const logout = async (): Promise<void> => {
  try {
    await apiClient.post("/auth/logout");
  } catch (error) {
    // Ignore errors - we're logging out anyway
  }

  // Clear localStorage token as well
  if (typeof window !== "undefined") {
    localStorage.removeItem("auth_token");
  }
};

export default apiClient;
