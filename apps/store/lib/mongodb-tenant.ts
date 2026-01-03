// Multi-tenant database helpers
import { MongoClient, type Db, type Document } from "mongodb";
import { getMerchantDbName as getMerchantDbNameFromHelpers } from "./merchant-helpers";
import { getMerchantDbName as getMerchantDbNameFromEnv } from "./env-utils";

const uri = process.env.MONGODB_URI || "";

if (!uri) {
  console.warn("MONGODB_URI is not set. Multi-tenant features will not work.");
}

type GlobalWithMongo = typeof globalThis & {
  _mongoClientPromise?: Promise<MongoClient>;
};

let clientPromise: Promise<MongoClient>;

const g = global as GlobalWithMongo;

if (!g._mongoClientPromise) {
  const client = new MongoClient(uri);
  g._mongoClientPromise = client.connect();
}

clientPromise = g._mongoClientPromise as Promise<MongoClient>;

/**
 * Get database for specific merchant
 * Prioritizes MERCHANT_DB_NAME from .env file (lines 11-15)
 * If merchant uses shared database, returns shared DB with merchant context
 * If merchant uses separate database, returns their dedicated DB
 */
export async function getMerchantDb(merchantId?: string): Promise<Db> {
  const client = await clientPromise;

  // First, check MERCHANT_DB_NAME from .env file (lines 11-15)
  const merchantDbNameFromEnv = getMerchantDbNameFromEnv();
  if (merchantDbNameFromEnv) {
    return client.db(merchantDbNameFromEnv);
  }

  if (!merchantId) {
    // Fallback to default database
    const dbName = process.env.MONGODB_DB || "shoestore";
    return client.db(dbName);
  }

  // Get merchant-specific database name from database config
  const dbName = await getMerchantDbNameFromHelpers(merchantId);
  return client.db(dbName);
}

/**
 * Get collection with automatic merchantId filtering
 * Use this for shared database scenarios
 */
export async function getMerchantCollection<T extends Document = Document>(collectionName: string, merchantId: string) {
  const db = await getMerchantDb(merchantId);
  const collection = db.collection<T>(collectionName);

  // Return collection with merchantId automatically injected in queries
  return {
    find: (query: any = {}) => collection.find({ ...query, merchantId }),
    findOne: (query: any = {}) => collection.findOne({ ...query, merchantId }),
    findOneAndUpdate: (query: any, update: any, options?: any) => collection.findOneAndUpdate({ ...query, merchantId }, update, options),
    findOneAndDelete: (query: any) => collection.findOneAndDelete({ ...query, merchantId }),
    insertOne: (doc: any) => collection.insertOne({ ...doc, merchantId }),
    insertMany: (docs: any[]) => collection.insertMany(docs.map((doc) => ({ ...doc, merchantId }))),
    updateOne: (query: any, update: any, options?: any) => collection.updateOne({ ...query, merchantId }, update, options),
    updateMany: (query: any, update: any, options?: any) => collection.updateMany({ ...query, merchantId }, update, options),
    deleteOne: (query: any) => collection.deleteOne({ ...query, merchantId }),
    deleteMany: (query: any) => collection.deleteMany({ ...query, merchantId }),
    countDocuments: (query: any = {}) => collection.countDocuments({ ...query, merchantId }),
    aggregate: (pipeline: any[]) => collection.aggregate([{ $match: { merchantId } }, ...pipeline]),
    // Direct access to collection for advanced queries (use with caution)
    _collection: collection,
  };
}

/**
 * Get collection without merchant filtering (for admin/super admin)
 * Use this when you need to query across all merchants
 */
export async function getCollection<T extends Document = Document>(name: string, merchantId?: string) {
  if (merchantId) {
    // Use merchant-specific collection
    return (await getMerchantCollection<T>(name, merchantId))._collection;
  }

  // Use default collection (shared database, no merchant filtering)
  const db = await getMerchantDb();
  return db.collection<T>(name);
}
