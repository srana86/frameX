/**
 * Store-Scoped API Client (Server-Side Only)
 * Use this in Server Components that need cookie access
 * 
 * For Client Components, use store-api-client.ts instead
 */

import { cookies } from "next/headers";
import { StoreApiError } from "./store-api-client";

/**
 * Get the API server URL (unified server)
 */
function getApiServerUrl(): string {
    // Server-side: use internal URL
    return process.env.INTERNAL_API_URL || "http://localhost:8081/api/v1";
}

/**
 * Server-side store API client with cookie access
 */
export class ServerStoreApiClient {
    private baseUrl: string;

    constructor(private storeId: string) {
        if (!storeId) {
            throw new Error("Store ID is required for ServerStoreApiClient");
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
 * Create a server-side store API client
 * Use this in Server Components only
 */
export function createServerStoreApiClient(storeId: string): ServerStoreApiClient {
    return new ServerStoreApiClient(storeId);
}
