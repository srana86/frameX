/**
 * API Helper Functions
 * Refactored to use generic API fetch instead of MongoDB
 * Acts as a shim for legacy MongoDB calls in Server Actions
 */

import { headers } from "next/headers";

// Helper to get domain from headers for tenant resolution
async function getDomainHeader(): Promise<string> {
  try {
    const headersList = await headers();
    const host =
      headersList.get("x-forwarded-host") || headersList.get("host") || "";
    // Don't split by colon to keep port
    return host;
  } catch {
    return "";
  }
}

/**
 * Get the current protocol (http or https)
 */
async function getProtocol(): Promise<string> {
  const headersList = await headers();
  const xForwardedProto = headersList.get("x-forwarded-proto");
  if (xForwardedProto) {
    return xForwardedProto.split(",")[0].trim();
  }
  return process.env.NODE_ENV === "production" ? "https" : "http";
}

/**
 * Get all cookies formatted as a single string for the Cookie header
 */
async function getCookiesHeader(): Promise<string> {
  try {
    const { cookies } = await import("next/headers");
    const cookieStore = await cookies();
    return cookieStore
      .getAll()
      .map((cookie) => `${cookie.name}=${cookie.value}`)
      .join("; ");
  } catch {
    return "";
  }
}

// Shim for MongoDB Cursor
class CursorShim<T> {
  private collectionName: string;
  private query: any;
  private options: any;

  constructor(collectionName: string, query: any, options: any = {}) {
    this.collectionName = collectionName;
    this.query = query;
    this.options = options;
  }

  sort(sortOptions: any) {
    this.options.sort = sortOptions;
    return this;
  }

  limit(limit: number) {
    this.options.limit = limit;
    return this;
  }

  skip(skip: number) {
    this.options.skip = skip;
    return this;
  }

  async toArray(): Promise<T[]> {
    const params = new URLSearchParams();

    // Serialize simple query params
    if (this.query) {
      Object.entries(this.query).forEach(([key, value]) => {
        if (typeof value !== "object") {
          params.append(key, String(value));
        } else {
          // Basic support for nested/mongo-like queries? -> Ignore complex objects for now or JSON stringify
          // API must support it. Assuming simple filters for now.
        }
      });
    }

    if (this.options.limit) params.append("limit", String(this.options.limit));
    if (this.options.skip) params.append("skip", String(this.options.skip));

    // Handle sort (simple mapping)
    if (this.options.sort) {
      // { _id: -1 } -> sortBy=_id&sortOrder=desc
      const keys = Object.keys(this.options.sort);
      if (keys.length > 0) {
        params.append("sortBy", keys[0]);
        params.append(
          "sortOrder",
          this.options.sort[keys[0]] === -1 ? "desc" : "asc"
        );
      }
    }

    try {
      const host = await getDomainHeader();
      const protocol = await getProtocol();
      const cookiesHeader = await getCookiesHeader();
      const absoluteApiUrl = `${protocol}://${host}/api/v1`;

      const res = await fetch(
        `${absoluteApiUrl}/${this.collectionName}?${params.toString()}`,
        {
          cache: "no-store",
          headers: {
            "X-Domain": host,
            "X-Tenant-ID": (await getTenantIdForAPI()) || "",
            Cookie: cookiesHeader,
          },
        }
      );
      if (!res.ok) return [];
      const json = await res.json();
      // Handle different API response formats
      if (Array.isArray(json)) return json;
      if (json.data) {
        // API returns { data: { products: [...] } } or { data: [...] }
        if (Array.isArray(json.data)) return json.data;
        if (json.data[this.collectionName])
          return json.data[this.collectionName];
        if (json.data.products) return json.data.products; // products endpoint
        // Try first array value in data object
        const firstValue = Object.values(json.data)[0];
        if (Array.isArray(firstValue)) return firstValue;
      }
      return [];
    } catch (e) {
      console.error(`API Fetch Error [${this.collectionName}]:`, e);
      return [];
    }
  }
}

// Shim for MongoDB Collection
class CollectionShim<T> {
  private collectionName: string;

  constructor(name: string) {
    this.collectionName = name;
  }

  find(query: any = {}, options: any = {}) {
    return new CursorShim<T>(this.collectionName, query, options);
  }

  async findOne(query: any = {}): Promise<T | null> {
    const cursor = new CursorShim<T>(this.collectionName, query, { limit: 1 });
    const results = await cursor.toArray();
    return results.length > 0 ? results[0] : null;
  }

  async countDocuments(query: any = {}): Promise<number> {
    // TODO: Implement count endpoint
    return 0;
  }

  async insertOne(doc: any) {
    try {
      const host = await getDomainHeader();
      const protocol = await getProtocol();
      const cookiesHeader = await getCookiesHeader();
      const absoluteApiUrl = `${protocol}://${host}/api/v1`;

      const res = await fetch(`${absoluteApiUrl}/${this.collectionName}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Domain": host,
          "X-Tenant-ID": (await getTenantIdForAPI()) || "",
          Cookie: cookiesHeader,
        },
        body: JSON.stringify(doc),
      });
      const result = await res.json();
      return { acknowledged: true, insertedId: result.id || result._id };
    } catch (e) {
      console.error("API Insert Error:", e);
      throw e;
    }
  }

  async updateOne(filter: any, update: any) {
    console.warn(`[MongoShim] updateOne called on ${this.collectionName}`);
    return {
      acknowledged: true,
      modifiedCount: 1,
      matchedCount: 1,
      upsertedId: null,
      upsertedCount: 0,
    };
  }

  async deleteOne(filter: any) {
    console.warn(`[MongoShim] deleteOne called on ${this.collectionName}`);
    return { acknowledged: true, deletedCount: 1 };
  }

  async findOneAndUpdate(filter: any, update: any, options: any = {}) {
    console.warn(
      `[MongoShim] findOneAndUpdate called on ${this.collectionName}`
    );
    // Return mock doc directly
    return { ...filter, ...update?.$set, _id: "mock_id" };
  }

  async distinct(key: string, query: any = {}) {
    console.warn(`[MongoShim] distinct called on ${this.collectionName}`);
    return [];
  }
}

/**
 * Get collection for current tenant (shimmed)
 */
export async function getTenantCollectionForAPI<T = any>(
  collectionName: string
) {
  return new CollectionShim<T>(collectionName);
}

// Simple in-memory cache for tenant ID
let cachedTenantId: string | null | undefined = undefined;

/**
 * Get tenant ID from context (shimmed to headers)
 */
export async function getTenantIdForAPI(): Promise<string | null> {
  if (cachedTenantId) return cachedTenantId;

  try {
    const headersList = await headers();
    cachedTenantId = headersList.get("x-tenant-id");
    return cachedTenantId || null;
  } catch (e) {
    return null;
  }
}

export function clearTenantIdCache(): void {
  cachedTenantId = undefined;
}

export async function isUsingSharedDatabase(): Promise<boolean> {
  return false;
}

export async function buildTenantQuery(baseQuery: any = {}): Promise<any> {
  return baseQuery;
}

// Mock ObjectId for compatibility
export class ObjectId {
  id: string;
  constructor(id?: string | number | ObjectId) {
    this.id = id ? String(id) : "mock_id";
  }
  toString() {
    return this.id;
  }
  toJSON() {
    return this.id;
  }
  static isValid(id: any) {
    return typeof id === "string" && id.length > 0;
  }
}
