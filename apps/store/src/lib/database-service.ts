// MongoDB Database Management Service
// Creates and manages separate databases for each merchant

import { MongoClient, type Db } from "mongodb";
import { getCollection } from "./mongodb";
import type { MerchantDatabase } from "./merchant-types";
import crypto from "crypto";

// Load environment variables from .env file (lines 12-16)
import { getEncryptionKey, getMongoDbName } from "./env-utils";

const MAIN_MONGODB_URI = process.env.MONGODB_URI || "";
const ENCRYPTION_KEY = getEncryptionKey() || process.env.MONGODB_URI || ""; // Use MongoDB URI as fallback

/**
 * Encrypt sensitive text for secure storage (AES-256-CBC)
 */
export function encryptSecret(text: string): string {
  if (!ENCRYPTION_KEY) {
    console.warn("ENCRYPTION_KEY not set, storing connection string in plain text (not recommended)");
    return text;
  }

  const algorithm = "aes-256-cbc";
  const key = crypto.createHash("sha256").update(ENCRYPTION_KEY).digest();
  const iv = crypto.randomBytes(16);

  const cipher = crypto.createCipheriv(algorithm, key, iv);
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");

  return iv.toString("hex") + ":" + encrypted;
}

/**
 * Decrypt sensitive text encrypted with encryptSecret
 */
export function decryptSecret(encryptedText: string): string {
  if (!ENCRYPTION_KEY) {
    return encryptedText; // Assume plain text if no key
  }

  // Check if the value looks encrypted (format: iv:encrypted)
  // If it doesn't have the ":" separator, assume it's already plain text
  if (!encryptedText.includes(":")) {
    return encryptedText; // Already plain text
  }

  try {
    const algorithm = "aes-256-cbc";
    const key = crypto.createHash("sha256").update(ENCRYPTION_KEY).digest();
    const parts = encryptedText.split(":");
    
    // Validate format: should have exactly 2 parts (iv and encrypted data)
    if (parts.length !== 2) {
      console.warn("Invalid encrypted format, assuming plain text");
      return encryptedText;
    }

    const [ivHex, encrypted] = parts;
    
    // Validate IV is valid hex
    if (!/^[0-9a-f]+$/i.test(ivHex) || ivHex.length !== 32) {
      console.warn("Invalid IV format, assuming plain text");
      return encryptedText;
    }

    const iv = Buffer.from(ivHex, "hex");
    const decipher = crypto.createDecipheriv(algorithm, key, iv);
    let decrypted = decipher.update(encrypted, "hex", "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
  } catch (error: any) {
    // If decryption fails, assume the value is already plain text
    // This handles cases where:
    // - Value was stored as plain text before encryption was enabled
    // - Value was encrypted with a different key
    // - Value has invalid format
    console.warn("Decryption failed, assuming plain text:", error?.message || String(error));
    return encryptedText;
  }
}

/**
 * Create a new MongoDB database for a merchant
 */
export async function createMerchantDatabase(merchantId: string): Promise<MerchantDatabase> {
  if (!MAIN_MONGODB_URI) {
    throw new Error("MONGODB_URI is not configured");
  }

  if (!merchantId || merchantId.trim() === "") {
    throw new Error("Merchant ID is required");
  }

  // Generate database name
  const databaseName = `merchant_${merchantId}_db`;
  console.log(`[Database Service] Creating database: ${databaseName}`);

  // Extract base connection string (without database name)
  // Example: mongodb://user:pass@host:port/main_db -> mongodb://user:pass@host:port
  const uriParts = MAIN_MONGODB_URI.split("/");
  if (uriParts.length < 3) {
    throw new Error(`Invalid MONGODB_URI format: ${MAIN_MONGODB_URI}`);
  }
  const baseUri = uriParts.slice(0, -1).join("/");
  const connectionString = `${baseUri}/${databaseName}`;
  console.log(`[Database Service] Base URI: ${baseUri}`);
  console.log(`[Database Service] Connection string: ${connectionString.replace(/:[^:@]+@/, ":****@")}`); // Hide password

  // Connect and create database by creating a collection
  const client = new MongoClient(MAIN_MONGODB_URI);

  try {
    console.log(`[Database Service] Connecting to MongoDB...`);
    await client.connect();

    // Test connection
    await client.db().admin().ping();
    console.log(`[Database Service] ✅ Connected to MongoDB`);

    // Access the new database (MongoDB creates it lazily when first used)
    const db = client.db(databaseName);
    console.log(`[Database Service] Accessing database: ${databaseName}`);

    // Initialize collections (this actually creates the database)
    console.log(`[Database Service] Initializing collections...`);
    await initializeMerchantCollections(db);
    console.log(`[Database Service] ✅ Collections initialized`);

    // Verify database was created by listing collections
    const collections = await db.listCollections().toArray();
    console.log(`[Database Service] ✅ Database created with ${collections.length} collections`);

    // Initialize brand_config with merchantId
    console.log(`[Database Service] Initializing brand_config with merchantId: ${merchantId}`);
    try {
      const brandConfigCol = db.collection("brand_config");
      const existingBrandConfig = await brandConfigCol.findOne({ id: "brand_config_v1" });

      if (!existingBrandConfig) {
        // Get merchant data to populate brand config
        const { getMerchant } = await import("./merchant-helpers");
        const merchant = await getMerchant(merchantId);

        const { defaultBrandConfig } = await import("./brand-config");

        const initialBrandConfig = {
          ...defaultBrandConfig,
          id: "brand_config_v1",
          merchantId: merchantId, // Store merchant ID
          brandName: merchant?.name || merchant?.settings?.brandName || defaultBrandConfig.brandName,
          contact: {
            ...defaultBrandConfig.contact,
            email: merchant?.email || defaultBrandConfig.contact.email,
            phone: merchant?.phone || defaultBrandConfig.contact.phone,
          },
          meta: {
            ...defaultBrandConfig.meta,
            title: {
              default: `${merchant?.name || defaultBrandConfig.brandName} – Modern E-commerce`,
              template: `%s – ${merchant?.name || defaultBrandConfig.brandName}`,
            },
            description: `Shop at ${merchant?.name || defaultBrandConfig.brandName} - Discover quality products.`,
            metadataBase: merchant?.deploymentUrl || defaultBrandConfig.meta.metadataBase,
            openGraph: {
              ...defaultBrandConfig.meta.openGraph,
              title: `${merchant?.name || defaultBrandConfig.brandName} – Modern E-commerce`,
              description: `Shop at ${merchant?.name || defaultBrandConfig.brandName} - Discover quality products.`,
              siteName: merchant?.name || defaultBrandConfig.brandName,
            },
            twitter: {
              ...defaultBrandConfig.meta.twitter,
              title: `${merchant?.name || defaultBrandConfig.brandName} – Modern E-commerce`,
              description: `Shop at ${merchant?.name || defaultBrandConfig.brandName} - Discover quality products.`,
            },
          },
          footer: {
            ...defaultBrandConfig.footer,
            description: `Welcome to ${merchant?.name || defaultBrandConfig.brandName}. Discover quality products.`,
            copyrightText: `© ${new Date().getFullYear()} ${merchant?.name || defaultBrandConfig.brandName}. All rights reserved.`,
          },
          theme: {
            primaryColor: merchant?.settings?.theme?.primaryColor || defaultBrandConfig.theme.primaryColor,
          },
          currency: {
            iso: merchant?.settings?.currency || defaultBrandConfig.currency.iso,
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        await brandConfigCol.insertOne(initialBrandConfig);
        console.log(`[Database Service] ✅ Brand config initialized with merchantId: ${merchantId}`);
        console.log(
          `[Database Service] 📝 Brand config details:`,
          JSON.stringify(
            {
              id: initialBrandConfig.id,
              merchantId: initialBrandConfig.merchantId,
              brandName: initialBrandConfig.brandName,
              email: initialBrandConfig.contact.email,
            },
            null,
            2
          )
        );
      } else {
        // Update existing brand config with merchantId if not set
        if (!existingBrandConfig.merchantId) {
          await brandConfigCol.updateOne(
            { id: "brand_config_v1" },
            {
              $set: {
                merchantId: merchantId,
                updatedAt: new Date().toISOString(),
              },
            }
          );
          console.log(`[Database Service] ✅ Updated existing brand config with merchantId: ${merchantId}`);
        } else {
          console.log(`[Database Service] ℹ️  Brand config already has merchantId: ${existingBrandConfig.merchantId}`);
        }
      }
    } catch (brandConfigError: any) {
      console.error(`[Database Service] ⚠️  Error initializing brand_config:`, brandConfigError);
      // Don't fail database creation if brand config initialization fails
    }

    // Encrypt connection string
    if (!ENCRYPTION_KEY) {
      console.warn(`[Database Service] ⚠️  ENCRYPTION_KEY not set, storing connection string in plain text`);
    }
    const encryptedConnectionString = encryptSecret(connectionString);

    // Store database configuration
    const dbConfig: MerchantDatabase = {
      id: `db_${merchantId}_${Date.now()}`,
      merchantId,
      databaseName,
      connectionString: encryptedConnectionString,
      useSharedDatabase: false,
      status: "active",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    console.log(`[Database Service] Storing database configuration...`);
    const col = await getCollection<MerchantDatabase>("merchant_databases");
    await col.insertOne(dbConfig as any);
    console.log(`[Database Service] ✅ Database configuration stored`);

    await client.close();
    console.log(`[Database Service] ✅ Database creation completed successfully`);

    return dbConfig;
  } catch (error: any) {
    console.error(`[Database Service] ❌ Error creating merchant database:`, error);
    await client.close().catch(() => {}); // Ensure client is closed
    throw new Error(`Failed to create merchant database: ${error.message}`);
  }
}

/**
 * Initialize collections in merchant database
 */
async function initializeMerchantCollections(db: Db): Promise<void> {
  // Create collections with validation (optional)
  const collections = [
    "products",
    "orders",
    "categories",
    "inventory",
    "brand_config",
    "email_templates",
    "email_providers",
    "sslcommerz_config",
    "ads_config",
    "pages",
    "hero_slides",
    "users",
  ];

  const createdCollections: string[] = [];
  const existingCollections: string[] = [];

  for (const collectionName of collections) {
    try {
      await db.createCollection(collectionName);
      createdCollections.push(collectionName);
      console.log(`[Database Service] ✅ Created collection: ${collectionName}`);
    } catch (error: any) {
      // Collection might already exist, that's okay
      if (error.code === 48 || error.codeName === "NamespaceExists") {
        // Error code 48 = collection already exists
        existingCollections.push(collectionName);
        console.log(`[Database Service] ℹ️  Collection already exists: ${collectionName}`);
      } else {
        console.error(`[Database Service] ❌ Error creating collection ${collectionName}:`, error);
        throw error; // Re-throw if it's not a "already exists" error
      }
    }
  }

  console.log(`[Database Service] Collections: ${createdCollections.length} created, ${existingCollections.length} existing`);

  // Initialize brand_config with merchantId if merchantId is available
  // Note: merchantId should be passed to this function or retrieved from context
  // For now, we'll initialize it when the collection is first accessed via API
  console.log(`[Database Service] Brand config will be initialized with merchantId when first accessed`);

  // Create indexes for better performance
  try {
    console.log(`[Database Service] Creating indexes...`);

    // Products indexes
    await db.collection("products").createIndex({ slug: 1 }, { unique: true });
    console.log(`[Database Service] ✅ Created index: products.slug (unique)`);

    await db.collection("products").createIndex({ category: 1 });
    console.log(`[Database Service] ✅ Created index: products.category`);

    // Orders indexes
    await db.collection("orders").createIndex({ createdAt: -1 });
    console.log(`[Database Service] ✅ Created index: orders.createdAt`);

    await db.collection("orders").createIndex({ status: 1 });
    console.log(`[Database Service] ✅ Created index: orders.status`);

    // Email configuration indexes
    await db.collection("email_templates").createIndex({ event: 1 }, { name: "email_templates_event" });
    await db
      .collection("email_templates")
      .createIndex({ merchantId: 1, event: 1 }, { unique: true, name: "email_templates_merchant_event_unique" });
    await db.collection("email_providers").createIndex({ merchantId: 1 }, { name: "email_providers_merchant" });

    console.log(`[Database Service] ✅ All indexes created`);
  } catch (error: any) {
    // Index might already exist, that's okay
    if (error.code === 85 || error.codeName === "IndexOptionsConflict") {
      console.log(`[Database Service] ℹ️  Index already exists (this is okay)`);
    } else {
      console.error(`[Database Service] ❌ Error creating indexes:`, error);
      // Don't throw - indexes are optional
    }
  }
}

/**
 * Get merchant database configuration
 */
export async function getMerchantDatabaseConfig(merchantId: string): Promise<MerchantDatabase | null> {
  try {
    const col = await getCollection<MerchantDatabase>("merchant_databases");
    const config = await col.findOne({ merchantId, status: "active" });

    if (config) {
      const { _id, ...configData } = config as any;
      return configData as MerchantDatabase;
    }

    return null;
  } catch (error) {
    console.error("Error fetching merchant database config:", error);
    return null;
  }
}

/**
 * Get decrypted connection string for merchant
 */
export async function getMerchantConnectionString(merchantId: string): Promise<string | null> {
  const config = await getMerchantDatabaseConfig(merchantId);
  if (!config || !config.connectionString) {
    return null;
  }

  try {
    return decryptSecret(config.connectionString);
  } catch (error) {
    console.error("Error decrypting connection string:", error);
    return null;
  }
}

/**
 * Delete merchant database (on cancellation)
 */
export async function deleteMerchantDatabase(merchantId: string): Promise<boolean> {
  try {
    const config = await getMerchantDatabaseConfig(merchantId);
    if (!config) {
      return false;
    }

    // Mark as inactive instead of actually deleting (for data retention)
    const col = await getCollection<MerchantDatabase>("merchant_databases");
    await col.updateOne(
      { merchantId },
      {
        $set: {
          status: "inactive",
          updatedAt: new Date().toISOString(),
        },
      }
    );

    // Optionally: Actually drop the database
    // const connectionString = decryptSecret(config.connectionString);
    // const client = new MongoClient(connectionString);
    // await client.connect();
    // await client.db(config.databaseName).dropDatabase();
    // await client.close();

    return true;
  } catch (error) {
    console.error("Error deleting merchant database:", error);
    return false;
  }
}

/**
 * Test database connection
 */
export async function testMerchantDatabase(merchantId: string): Promise<boolean> {
  try {
    const connectionString = await getMerchantConnectionString(merchantId);
    if (!connectionString) {
      return false;
    }

    const client = new MongoClient(connectionString);
    await client.connect();
    await client.db().admin().ping();
    await client.close();

    return true;
  } catch (error) {
    console.error("Error testing merchant database:", error);
    return false;
  }
}
