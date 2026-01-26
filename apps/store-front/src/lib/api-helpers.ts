import { headers } from "next/headers";
import { getPublicServerClient, getServerClient, getDomain, getProtocol, getCookiesHeader } from "./server-utils";

/**
 * API Helper Functions
 * Refactored to use generic API fetch instead of MongoDB
 * Acts as a shim for legacy MongoDB calls in Server Actions
 */

// Helper to get domain from headers for tenant resolution
async function getDomainHeader(): Promise<string> {
  try {
    return await getDomain();
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
    const queryParams: Record<string, any> = {};

    // Serialize simple query params
    if (this.query) {
      Object.entries(this.query).forEach(([key, value]) => {
        if (typeof value !== "object") {
          queryParams[key] = value;
        }
      });
    }

    if (this.options.limit) queryParams.limit = this.options.limit;
    if (this.options.skip) queryParams.skip = this.options.skip;

    // Handle sort (simple mapping)
    if (this.options.sort) {
      const keys = Object.keys(this.options.sort);
      if (keys.length > 0) {
        queryParams.sortBy = keys[0];
        queryParams.sortOrder = this.options.sort[keys[0]] === -1 ? "desc" : "asc";
      }
    }

    try {
      const client = await getPublicServerClient();
      // Standardize legacy collection names (underscored) to API endpoints (hyphenated)
      const endpoint = this.collectionName.replace(/_/g, "-");
      const res = await client.get(endpoint, {
        params: queryParams,
      });

      const json = res.data;
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
      // Use getServerClient to ensure authentication is forwarded if available
      const client = await getServerClient();
      // Standardize legacy collection names (underscored) to API endpoints (hyphenated)
      const endpoint = this.collectionName.replace(/_/g, "-");
      const res = await client.post(endpoint, doc);
      const result = res.data;
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

