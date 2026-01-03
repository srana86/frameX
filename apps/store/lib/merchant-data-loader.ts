/**
 * Merchant Data Loader Utilities
 * Helper functions to load merchant-specific data
 */

import { getMerchantContext, getCurrentMerchant } from "./merchant-context";
import { getMerchantDb } from "./mongodb-tenant";
import type { Document, WithId } from "mongodb";

/**
 * Load data from a collection for the current merchant
 */
export async function loadMerchantCollectionData<T extends Document = Document>(
  collectionName: string,
  query: any = {},
  options: { sort?: any; limit?: number; skip?: number; projection?: Record<string, any> } = {}
): Promise<WithId<T>[]> {
  const merchantContext = await getMerchantContext();
  const merchantId = merchantContext?.merchant.id;

  if (!merchantId) {
    // Fallback to default collection
    const { getCollection } = await import("./mongodb");
    const col = await getCollection<T>(collectionName);
    const cursorOptions = options.projection ? { projection: options.projection } : undefined;

    return await col
      .find(query, cursorOptions)
      .sort(options.sort || {})
      .limit(options.limit ?? 0)
      .skip(options.skip ?? 0)
      .toArray();
  }

  // Use merchant-specific database
  const db = await getMerchantDb(merchantId);
  const collection = db.collection<T>(collectionName);
  const cursorOptions = options.projection ? { projection: options.projection } : undefined;

  // Add merchantId filter if using shared database
  const merchantQuery = merchantContext?.database?.useSharedDatabase ? { ...query, merchantId } : query;

  let cursor = collection.find(merchantQuery, cursorOptions);

  if (options.sort) {
    cursor = cursor.sort(options.sort);
  }

  if (options.limit !== undefined) {
    cursor = cursor.limit(options.limit);
  }

  if (options.skip !== undefined) {
    cursor = cursor.skip(options.skip);
  }

  return await cursor.toArray();
}


/**
 * Load a single document for the current merchant
 */
export async function loadMerchantDocument<T extends Document = Document>(
  collectionName: string,
  query: any = {}
): Promise<WithId<T> | null> {
  const merchantContext = await getMerchantContext();
  const merchantId = merchantContext?.merchant.id;

  if (!merchantId) {
    // Fallback to default collection
    const { getCollection } = await import("./mongodb");
    const col = await getCollection<T>(collectionName);
    return await col.findOne(query);
  }

  // Use merchant-specific database
  const db = await getMerchantDb(merchantId);
  const collection = db.collection<T>(collectionName);

  // Add merchantId filter if using shared database
  const merchantQuery = merchantContext?.database?.useSharedDatabase ? { ...query, merchantId } : query;

  return await collection.findOne(merchantQuery);
}

/**
 * Count documents for the current merchant
 */
export async function countMerchantDocuments(collectionName: string, query: any = {}): Promise<number> {
  const merchantContext = await getMerchantContext();
  const merchantId = merchantContext?.merchant.id;

  if (!merchantId) {
    // Fallback to default collection
    const { getCollection } = await import("./mongodb");
    const col = await getCollection(collectionName);
    return await col.countDocuments(query);
  }

  // Use merchant-specific database
  const db = await getMerchantDb(merchantId);
  const collection = db.collection(collectionName);

  // Add merchantId filter if using shared database
  const merchantQuery = merchantContext?.database?.useSharedDatabase ? { ...query, merchantId } : query;

  return await collection.countDocuments(merchantQuery);
}

/**
 * Get merchant-specific collection
 */
export async function getMerchantCollection<T extends Document = Document>(collectionName: string) {
  const merchantContext = await getMerchantContext();
  const merchantId = merchantContext?.merchant.id;

  if (!merchantId) {
    // Fallback to default collection
    const { getCollection } = await import("./mongodb");
    return await getCollection<T>(collectionName);
  }

  // Use merchant-specific database
  const db = await getMerchantDb(merchantId);
  return db.collection<T>(collectionName);
}
