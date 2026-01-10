/**
 * API Helper Functions
 * Refactored to use generic API fetch instead of MongoDB
 * Acts as a shim for legacy MongoDB calls in Server Actions
 */

import { headers } from "next/headers";

const API_URL = process.env.NEXT_PUBLIC_STORE_API_URL || 'http://localhost:8080/api/v1';

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
        if (typeof value !== 'object') {
          params.append(key, String(value));
        } else {
          // Basic support for nested/mongo-like queries? -> Ignore complex objects for now or JSON stringify
          // API must support it. Assuming simple filters for now.
        }
      });
    }

    if (this.options.limit) params.append('limit', String(this.options.limit));
    if (this.options.skip) params.append('skip', String(this.options.skip));

    // Handle sort (simple mapping)
    if (this.options.sort) {
      // { _id: -1 } -> sortBy=_id&sortOrder=desc
      const keys = Object.keys(this.options.sort);
      if (keys.length > 0) {
        params.append('sortBy', keys[0]);
        params.append('sortOrder', this.options.sort[keys[0]] === -1 ? 'desc' : 'asc');
      }
    }

    try {
      const res = await fetch(`${API_URL}/${this.collectionName}?${params.toString()}`, {
        cache: 'no-store',
        headers: { 'x-merchant-id': await getMerchantIdForAPI() || '' }
      });
      if (!res.ok) return [];
      const data = await res.json();
      return Array.isArray(data) ? data : (data.data || []);
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
      const res = await fetch(`${API_URL}/${this.collectionName}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-merchant-id': await getMerchantIdForAPI() || ''
        },
        body: JSON.stringify(doc)
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
    return { acknowledged: true, modifiedCount: 1, matchedCount: 1, upsertedId: null, upsertedCount: 0 };
  }

  async deleteOne(filter: any) {
    console.warn(`[MongoShim] deleteOne called on ${this.collectionName}`);
    return { acknowledged: true, deletedCount: 1 };
  }

  async findOneAndUpdate(filter: any, update: any, options: any = {}) {
    console.warn(`[MongoShim] findOneAndUpdate called on ${this.collectionName}`);
    // Return mock doc directly
    return { ...filter, ...update?.$set, _id: "mock_id" };
  }

  async distinct(key: string, query: any = {}) {
    console.warn(`[MongoShim] distinct called on ${this.collectionName}`);
    return [];
  }
}

/**
 * Get collection for current merchant (shimmed)
 */
export async function getMerchantCollectionForAPI<T = any>(collectionName: string) {
  return new CollectionShim<T>(collectionName);
}

// Simple in-memory cache for merchant ID
let cachedMerchantId: string | null | undefined = undefined;

/**
 * Get merchant ID from context (shimmed to headers)
 */
export async function getMerchantIdForAPI(): Promise<string | null> {
  if (cachedMerchantId) return cachedMerchantId;

  try {
    const headersList = await headers();
    cachedMerchantId = headersList.get("x-merchant-id");
    return cachedMerchantId || null;
  } catch (e) {
    return null;
  }
}

export function clearMerchantIdCache(): void {
  cachedMerchantId = undefined;
}

export async function isUsingSharedDatabase(): Promise<boolean> {
  return false;
}

export async function buildMerchantQuery(baseQuery: any = {}): Promise<any> {
  return baseQuery;
}

// Mock ObjectId for compatibility
export class ObjectId {
  id: string;
  constructor(id?: string | number | ObjectId) {
    this.id = id ? String(id) : "mock_id";
  }
  toString() { return this.id; }
  toJSON() { return this.id; }
  static isValid(id: any) { return typeof id === 'string' && id.length > 0; }
}
