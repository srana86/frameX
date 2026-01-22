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
async function apiRequest<T>(
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
