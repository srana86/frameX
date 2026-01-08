// MongoDB connection for merchant-specific databases
// Each merchant deployment uses this to connect to their own database

import { MongoClient, type Db, type Document } from "mongodb";
import { getMerchantDbName, getMerchantId } from "./env-utils";

const MONGODB_URI = process.env.MONGODB_URI || "";

if (!MONGODB_URI) {
  console.warn("MONGODB_URI is not set. Database operations will fail.");
}

type GlobalWithMongo = typeof globalThis & {
  _mongoClientPromise?: Promise<MongoClient>;
};

let clientPromise: Promise<MongoClient>;

const g = global as GlobalWithMongo;

if (!g._mongoClientPromise) {
  const client = new MongoClient(MONGODB_URI);
  g._mongoClientPromise = client.connect();
}

clientPromise = g._mongoClientPromise as Promise<MongoClient>;

/**
 * Get database for current merchant
 * Uses MERCHANT_DB_NAME from .env file (lines 11-15) or environment variables
 */
export async function getMerchantDb(): Promise<Db> {
  const client = await clientPromise;

  // First, try to get from .env file (lines 11-15)
  const merchantDbNameFromEnv = getMerchantDbName();
  
  // Use merchant-specific database if configured
  const dbName = merchantDbNameFromEnv || process.env.MERCHANT_DB_NAME || process.env.MONGODB_DB || "shoestore";

  return client.db(dbName);
}

/**
 * Get collection for current merchant
 * Automatically uses merchant's database
 */
export async function getCollection<T extends Document = Document>(name: string) {
  const db = await getMerchantDb();
  return db.collection<T>(name);
}

/**
 * Get current merchant ID from environment
 * Prioritizes MERCHANT_ID from .env file (lines 11-15)
 */
export function getCurrentMerchantId(): string | null {
  const merchantIdFromEnv = getMerchantId();
  return merchantIdFromEnv || process.env.MERCHANT_ID || null;
}

/**
 * Verify merchant database is configured
 */
export async function verifyMerchantDatabase(): Promise<boolean> {
  try {
    const merchantId = getCurrentMerchantId();
    const merchantDbName = getMerchantDbName() || process.env.MERCHANT_DB_NAME;
    
    if (!merchantId || !merchantDbName) {
      console.warn("Merchant database not configured. Using default database.");
      return false;
    }

    const db = await getMerchantDb();
    await db.admin().ping();
    return true;
  } catch (error) {
    console.error("Error verifying merchant database:", error);
    return false;
  }
}

