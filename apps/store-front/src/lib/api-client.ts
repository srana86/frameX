import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";

/**
 * API Base URL
 * - Browser: Use relative /api/v1 (nginx proxies to backend)
 * - Server: Use full URL for SSR
 */
const getApiBaseUrl = () => {
  // Server-side: use internal URL
  if (typeof window === "undefined") {
    return process.env.INTERNAL_API_URL || "http://localhost:8080/api/v1";
  }
  // Client-side: use relative URL (nginx proxies to store-api)
  return "/api/v1";
};

const API_BASE_URL = getApiBaseUrl();

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
  tenantId?: string,
  domain?: string,
  baseURL?: string,
  additionalHeaders?: Record<string, string>
) => {
  const serverBaseUrl = baseURL;

  return axios.create({
    baseURL: serverBaseUrl,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(tenantId ? { "X-Tenant-ID": tenantId } : {}),
      ...(domain ? { "X-Domain": domain } : {}),
      ...additionalHeaders,
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
 * @param options - Optional: token, tenantId, domain, data, params
 */
export const serverApiRequest = async <T>(
  method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH",
  url: string,
  options?: {
    token?: string;
    tenantId?: string;
    domain?: string;
    data?: unknown;
    params?: Record<string, unknown>;
  }
): Promise<T> => {
  const client = serverSideApiClient(
    options?.token,
    options?.tenantId,
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
// NOTE: With BetterAuth, this refresh logic is less critical as cookies are handled automatically
// but we keep the structure for compatibility with existing code

/**
 * Request interceptor
 * Adds domain header for tenant resolution
 */
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Send current domain for tenant resolution
    if (typeof window !== "undefined") {
      config.headers["X-Domain"] = window.location.hostname;
    }

    // Fallback to tenant ID from env
    const tenantId = process.env.NEXT_PUBLIC_TENANT_ID;
    if (tenantId) {
      config.headers["X-Tenant-ID"] = tenantId;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

/**
 * Response interceptor
 * Simple error handling - no complex token refresh needed with BetterAuth
 */
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
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
 * Check if currently authenticated (by attempting to call BetterAuth session)
 * @returns true if authenticated, false otherwise
 */
export const checkAuth = async (): Promise<boolean> => {
  try {
    // BetterAuth returns session info at /api/auth/session
    // or we can just check /api/auth/ok for basic health, but session is better
    const response = await apiClient.get("/auth/session");
    return !!response.data; // logic may vary depending on BetterAuth session endpoint return
  } catch {
    return false;
  }
};

/**
 * Logout - calls BetterAuth logout
 * Note: Does NOT redirect - let calling code handle navigation
 */
export const logout = async (): Promise<void> => {
  try {
    await apiClient.post("/auth/sign-out");
  } catch (error) {
    // Ignore errors - we're logging out anyway
  }
};

export default apiClient;
