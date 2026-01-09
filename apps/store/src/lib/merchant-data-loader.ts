/**
 * Merchant Data Loader Utilities
 * Helper functions to load merchant-specific data
 */

import { getMerchantContext } from "./merchant-context";
import { getMerchantCollectionForAPI } from "./api-helpers";

// Generic type to replace MongoDB Document
type Document = Record<string, any>;
type WithId<T> = T & { _id: string };

/**
 * Load data from a collection for the current merchant
 */
export async function loadMerchantCollectionData<T extends Document = Document>(
  collectionName: string,
  query: any = {},
  options: { sort?: any; limit?: number; skip?: number; projection?: Record<string, any> } = {}
): Promise<WithId<T>[]> {
  const col = await getMerchantCollectionForAPI<T>(collectionName);

  // Use the shim's find().toArray()
  return await col.find(query, options).toArray() as WithId<T>[];
}


/**
 * Load a single document for the current merchant
 */
export async function loadMerchantDocument<T extends Document = Document>(
  collectionName: string,
  query: any = {}
): Promise<WithId<T> | null> {
  const col = await getMerchantCollectionForAPI<T>(collectionName);
  return await col.findOne(query) as WithId<T> | null;
}

/**
 * Count documents for the current merchant
 */
export async function countMerchantDocuments(collectionName: string, query: any = {}): Promise<number> {
  const col = await getMerchantCollectionForAPI(collectionName);
  return await col.countDocuments(query);
}

/**
 * Get merchant-specific collection
 */
export async function getMerchantCollection<T extends Document = Document>(collectionName: string) {
  return await getMerchantCollectionForAPI<T>(collectionName);
}
