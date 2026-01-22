/**
 * Store-Scoped API Client
 * Calls the unified server for store data (products, orders, etc.)
 * All requests automatically include the store/tenant ID
 * 
 * NOTE: After server merge, store data is on the same server as platform data.
 * This client adds the x-tenant-id header for tenant-scoped endpoints.
 */

import { cookies } from "next/headers";

/**
 * API Error class
 */
export class StoreApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public data?: any
  ) {
    super(message);
    this.name = "StoreApiError";
  }
}

/**
 * Get the API server URL (unified server)
 */
function getApiServerUrl(): string {
  if (typeof window === "undefined") {
    // Server-side: use internal URL
    return process.env.INTERNAL_API_URL || "http://localhost:8081/api/v1";
  }
  // Client-side: use relative URL (nginx proxies)
  return "/api/v1";
}

/**
 * Store-scoped API client
 * Calls unified server with tenant context
 */
export class StoreApiClient {
  private baseUrl: string;

  constructor(private storeId: string) {
    if (!storeId) {
      throw new Error("Store ID is required for StoreApiClient");
    }
    this.baseUrl = getApiServerUrl();
  }

  /**
   * Build a clean URL
   */
  private buildUrl(path: string): string {
    const cleanPath = path.startsWith("/") ? path.slice(1) : path;
    return `${this.baseUrl}/${cleanPath}`;
  }

  /**
   * Get auth headers with cookies and tenant ID
   */
  private async getHeaders(): Promise<HeadersInit> {
    const cookieStore = await cookies();
    return {
      "Content-Type": "application/json",
      Cookie: cookieStore.toString(),
      "x-tenant-id": this.storeId,
    };
  }

  /**
   * Make an API request
   */
  private async request<T>(
    path: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = this.buildUrl(path);
    const headers = await this.getHeaders();

    const response = await fetch(url, {
      ...options,
      headers: {
        ...headers,
        ...options.headers,
      },
      cache: "no-store",
    });

    const json = await response.json();

    if (!response.ok) {
      throw new StoreApiError(
        json.message || json.error || "Request failed",
        response.status,
        json
      );
    }

    if (json.success !== undefined) {
      if (!json.success) {
        throw new StoreApiError(
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
   * GET request
   */
  async get<T>(path: string, options?: RequestInit): Promise<T> {
    return this.request<T>(path, { ...options, method: "GET" });
  }

  /**
   * POST request
   */
  async post<T>(path: string, body?: any, options?: RequestInit): Promise<T> {
    return this.request<T>(path, {
      ...options,
      method: "POST",
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  /**
   * PUT request
   */
  async put<T>(path: string, body?: any, options?: RequestInit): Promise<T> {
    return this.request<T>(path, {
      ...options,
      method: "PUT",
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  /**
   * PATCH request
   */
  async patch<T>(path: string, body?: any, options?: RequestInit): Promise<T> {
    return this.request<T>(path, {
      ...options,
      method: "PATCH",
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  /**
   * DELETE request
   */
  async delete<T>(path: string, options?: RequestInit): Promise<T> {
    return this.request<T>(path, { ...options, method: "DELETE" });
  }

  /**
   * GET request with pagination metadata
   */
  async getWithMeta<T>(
    path: string,
    options?: RequestInit
  ): Promise<{ data: T; meta?: any }> {
    const url = this.buildUrl(path);
    const headers = await this.getHeaders();

    const response = await fetch(url, {
      ...options,
      method: "GET",
      headers: {
        ...headers,
        ...options?.headers,
      },
      cache: "no-store",
    });

    const json = await response.json();

    if (!response.ok) {
      throw new StoreApiError(
        json.message || json.error || "Request failed",
        response.status,
        json
      );
    }

    if (json.success !== undefined) {
      if (!json.success) {
        throw new StoreApiError(
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
}

/**
 * Create a store-scoped API client
 */
export function createStoreApiClient(storeId: string): StoreApiClient {
  return new StoreApiClient(storeId);
}

/**
 * Convenience functions for common store operations
 */
export const storeApi = {
  /**
   * Get store products
   */
  getProducts: (storeId: string, params?: { page?: number; limit?: number }) => {
    const client = createStoreApiClient(storeId);
    const query = params
      ? `?page=${params.page || 1}&limit=${params.limit || 20}`
      : "";
    return client.getWithMeta(`products${query}`);
  },

  /**
   * Get store orders
   */
  getOrders: (storeId: string, params?: { page?: number; limit?: number; status?: string }) => {
    const client = createStoreApiClient(storeId);
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.set("page", params.page.toString());
    if (params?.limit) queryParams.set("limit", params.limit.toString());
    if (params?.status) queryParams.set("status", params.status);
    const query = queryParams.toString() ? `?${queryParams.toString()}` : "";
    return client.getWithMeta(`orders${query}`);
  },

  /**
   * Get store dashboard stats
   */
  getDashboardStats: (storeId: string) => {
    const client = createStoreApiClient(storeId);
    return client.get("statistics");
  },

  /**
   * Get store customers
   */
  getCustomers: (storeId: string, params?: { page?: number; limit?: number }) => {
    const client = createStoreApiClient(storeId);
    const query = params
      ? `?page=${params.page || 1}&limit=${params.limit || 20}`
      : "";
    return client.getWithMeta(`customers${query}`);
  },
};
