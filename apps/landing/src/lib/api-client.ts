/**
 * API Client for FrameX Node.js Backend
 * Handles all API requests to the Node.js backend server
 */

/**
 * API Base URL
 * - Browser: Use relative /api/v1 (nginx proxies to server:8081)
 * - Server: Use full URL for SSR
 */
const getApiBaseUrl = () => {
  if (typeof window === "undefined") {
    return process.env.INTERNAL_API_URL || "http://localhost:8081/api/v1";
  }
  return "/api/v1";
};

const API_BASE_URL = getApiBaseUrl();

/**
 * Build a clean URL (no double slashes)
 */
function buildUrl(path: string): string {
  const baseUrl = API_BASE_URL.endsWith("/")
    ? API_BASE_URL.slice(0, -1)
    : API_BASE_URL;
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${baseUrl}${cleanPath}`;
}

/**
 * Standard API response format from Node.js backend
 */
interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
  meta?: {
    page: number;
    limit: number;
    total: number;
    totalPage?: number;
    totalPages?: number;
  };
}

/**
 * API Error class
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public data?: any
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/**
 * Make an API request and handle the response
 */
export async function apiRequest<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const url = buildUrl(path);

  const response = await fetch(url, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  const json = await response.json();

  if (!response.ok) {
    throw new ApiError(
      json.message || json.error || "Request failed",
      response.status,
      json
    );
  }

  if (json.success !== undefined) {
    if (!json.success) {
      throw new ApiError(
        json.message || "Request failed",
        response.status,
        json
      );
    }
    return json.data as T;
  }

  return json as T;
}

/**
 * Make an API request and return response with meta (for pagination)
 */
export async function apiRequestWithMeta<T>(
  path: string,
  options: RequestInit = {}
): Promise<{ data: T; meta?: ApiResponse<T>["meta"] }> {
  const url = buildUrl(path);

  const response = await fetch(url, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  const json = await response.json();

  if (!response.ok) {
    throw new ApiError(
      json.message || json.error || "Request failed",
      response.status,
      json
    );
  }

  if (json.success !== undefined) {
    if (!json.success) {
      throw new ApiError(
        json.message || "Request failed",
        response.status,
        json
      );
    }
    return {
      data: json.data as T,
      meta: json.meta,
    };
  }

  return { data: json as T };
}

/**
 * API client with common HTTP methods
 */
export const api = {
  get: <T>(path: string, options?: RequestInit): Promise<T> => {
    return apiRequest<T>(path, { ...options, method: "GET" });
  },

  post: <T>(path: string, body?: any, options?: RequestInit): Promise<T> => {
    return apiRequest<T>(path, {
      ...options,
      method: "POST",
      body: body ? JSON.stringify(body) : undefined,
    });
  },

  put: <T>(path: string, body?: any, options?: RequestInit): Promise<T> => {
    return apiRequest<T>(path, {
      ...options,
      method: "PUT",
      body: body ? JSON.stringify(body) : undefined,
    });
  },

  patch: <T>(path: string, body?: any, options?: RequestInit): Promise<T> => {
    return apiRequest<T>(path, {
      ...options,
      method: "PATCH",
      body: body ? JSON.stringify(body) : undefined,
    });
  },

  delete: <T>(path: string, options?: RequestInit): Promise<T> => {
    return apiRequest<T>(path, { ...options, method: "DELETE" });
  },
};

/**
 * Server-side API client factory
 * For use in Next.js server components and API routes
 * Mimics the interface of the store-front axios client but uses fetch
 */
export const serverSideApiClient = (
  token?: string,
  tenantId?: string,
  domain?: string,
  baseURL?: string,
  additionalHeaders?: Record<string, string>
) => {
  const getHeaders = () => {
    const headers: Record<string, string> = { ...additionalHeaders };
    if (token) headers["Authorization"] = `Bearer ${token}`;
    // Tenant ID is typically handled by domain, but can be added if needed
    if (tenantId) headers["X-Tenant-ID"] = tenantId;
    if (domain) headers["X-Domain"] = domain;
    return headers;
  };

  const getUrl = (path: string) => {
    if (!baseURL) return buildUrl(path);
    const base = baseURL.endsWith('/') ? baseURL.slice(0, -1) : baseURL;
    const p = path.startsWith('/') ? path : `/${path}`;
    return `${base}${p}`;
  };

  const request = async <T>(path: string, method: string, data?: any, params?: any, options?: RequestInit) => {
    let url = getUrl(path);

    if (params) {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value));
        }
      });
      const queryString = searchParams.toString();
      if (queryString) {
        url += (url.includes('?') ? '&' : '?') + queryString;
      }
    }

    const headers = { ...getHeaders(), ...options?.headers };

    const response = await fetch(url, {
      ...options,
      method,
      headers: {
        "Content-Type": "application/json",
        ...headers as any
      },
      body: data ? JSON.stringify(data) : undefined,
    });

    const json = await response.json();

    if (!response.ok) {
      throw new ApiError(json.message || json.error || "Request failed", response.status, json);
    }

    if (json.success !== undefined && !json.success) {
      throw new ApiError(json.message || "Request failed", response.status, json);
    }

    // Adapt to expected response format (mimicking axios response.data accessor in api-helpers)
    // api-helpers does: const res = await client.get(...); const json = res.data;
    // So we return an object with a data property containing the actual JSON response
    return { data: json.data !== undefined ? json.data : json };
  };

  return {
    get: <T>(path: string, config?: { params?: any, headers?: any } & RequestInit) =>
      request<T>(path, "GET", undefined, config?.params, config),

    post: <T>(path: string, data?: any, config?: { params?: any, headers?: any } & RequestInit) =>
      request<T>(path, "POST", data, config?.params, config),

    put: <T>(path: string, data?: any, config?: { params?: any, headers?: any } & RequestInit) =>
      request<T>(path, "PUT", data, config?.params, config),

    patch: <T>(path: string, data?: any, config?: { params?: any, headers?: any } & RequestInit) =>
      request<T>(path, "PATCH", data, config?.params, config),

    delete: <T>(path: string, config?: { params?: any, headers?: any } & RequestInit) =>
      request<T>(path, "DELETE", undefined, config?.params, config),
  };
};
