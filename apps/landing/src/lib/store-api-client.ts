/**
 * Store-Scoped API Client
 * Provides tenant-scoped API calls for store management
 * All requests automatically include the store/tenant ID
 */

import { api } from "./api-client";

/**
 * Store-scoped API client
 * Automatically prefixes all requests with store ID
 */
export class StoreApiClient {
  constructor(private storeId: string) {
    if (!storeId) {
      throw new Error("Store ID is required for StoreApiClient");
    }
  }

  /**
   * Build a store-scoped API path
   */
  private buildPath(path: string): string {
    const cleanPath = path.startsWith("/") ? path.slice(1) : path;
    return `/owner/stores/${this.storeId}/${cleanPath}`;
  }

  /**
   * GET request
   */
  async get<T>(path: string, options?: RequestInit): Promise<T> {
    return api.get<T>(this.buildPath(path), options);
  }

  /**
   * POST request
   */
  async post<T>(path: string, body?: any, options?: RequestInit): Promise<T> {
    return api.post<T>(this.buildPath(path), body, options);
  }

  /**
   * PUT request
   */
  async put<T>(path: string, body?: any, options?: RequestInit): Promise<T> {
    return api.put<T>(this.buildPath(path), body, options);
  }

  /**
   * PATCH request
   */
  async patch<T>(path: string, body?: any, options?: RequestInit): Promise<T> {
    return api.patch<T>(this.buildPath(path), body, options);
  }

  /**
   * DELETE request
   */
  async delete<T>(path: string, options?: RequestInit): Promise<T> {
    return api.delete<T>(this.buildPath(path), options);
  }

  /**
   * GET request with pagination metadata
   */
  async getWithMeta<T>(
    path: string,
    options?: RequestInit
  ): Promise<{ data: T; meta?: any }> {
    const { apiRequestWithMeta } = await import("./api-client");
    return apiRequestWithMeta<T>(this.buildPath(path), options);
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
    return client.get("dashboard/stats");
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
