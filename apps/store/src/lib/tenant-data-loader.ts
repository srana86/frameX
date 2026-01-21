/**
 * Tenant Data Loader Utilities
 * Helper functions to load tenant-specific data
 */

import { getTenantContext } from "./tenant-context";
import { getTenantCollectionForAPI } from "./api-helpers";

// Generic type to replace MongoDB Document
type Document = Record<string, any>;
type WithId<T> = T & { _id: string };

/**
 * Load data from a collection for the current tenant
 */
export async function loadTenantCollectionData<T extends Document = Document>(
  collectionName: string,
  query: any = {},
  options: { sort?: any; limit?: number; skip?: number; projection?: Record<string, any> } = {}
): Promise<WithId<T>[]> {
  const col = await getTenantCollectionForAPI<T>(collectionName);

  // Use the shim's find().toArray()
  return await col.find(query, options).toArray() as WithId<T>[];
}


/**
 * Load a single document for the current tenant
 */
export async function loadTenantDocument<T extends Document = Document>(
  collectionName: string,
  query: any = {}
): Promise<WithId<T> | null> {
  const col = await getTenantCollectionForAPI<T>(collectionName);
  return await col.findOne(query) as WithId<T> | null;
}

/**
 * Count documents for the current tenant
 */
export async function countTenantDocuments(collectionName: string, query: any = {}): Promise<number> {
  const col = await getTenantCollectionForAPI(collectionName);
  return await col.countDocuments(query);
}

/**
 * Get tenant-specific collection
 */
export async function getTenantCollection<T extends Document = Document>(collectionName: string) {
  return await getTenantCollectionForAPI<T>(collectionName);
}
