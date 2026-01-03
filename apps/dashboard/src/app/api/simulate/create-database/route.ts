import { NextResponse } from "next/server";
import { getCollection } from "@/lib/mongodb";
import { MongoClient } from "mongodb";
import crypto from "crypto";

const MAIN_MONGODB_URI = process.env.MONGODB_URI || "";
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || "";

function encrypt(text: string): string {
  if (!ENCRYPTION_KEY) {
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

async function initializeCollections(db: any) {
  const collections = [
    "products",
    "orders",
    "categories",
    "inventory",
    "brand_config",
    "sslcommerz_config",
    "ads_config",
    "pages",
    "hero_slides",
    "users",
  ];

  const created: string[] = [];
  for (const collectionName of collections) {
    try {
      await db.createCollection(collectionName);
      created.push(collectionName);
    } catch (error: any) {
      if (error.code !== 48 && error.codeName !== "NamespaceExists") {
        throw error;
      }
    }
  }

  // Create indexes
  try {
    await db.collection("products").createIndex({ slug: 1 }, { unique: true });
    await db.collection("products").createIndex({ category: 1 });
    await db.collection("orders").createIndex({ createdAt: -1 });
    await db.collection("orders").createIndex({ status: 1 });
  } catch (error) {
    // Indexes might already exist
  }

  return created.length;
}

export async function POST(request: Request) {
  let client: MongoClient | null = null;

  try {
    const body = await request.json();
    const { merchantId } = body;

    if (!merchantId) {
      return NextResponse.json({ error: "Merchant ID is required" }, { status: 400 });
    }

    if (!MAIN_MONGODB_URI) {
      console.error("[Create Database] MONGODB_URI is not configured");
      return NextResponse.json(
        {
          error: "MONGODB_URI is not configured",
          details: "Please set MONGODB_URI environment variable",
        },
        { status: 500 }
      );
    }

    const databaseName = `merchant_${merchantId}_db`;
    console.log(`[Create Database] Creating database: ${databaseName}`);

    // Extract base URI from connection string
    const uriParts = MAIN_MONGODB_URI.split("/");
    if (uriParts.length < 3) {
      console.error(`[Create Database] Invalid MONGODB_URI format: ${MAIN_MONGODB_URI}`);
      return NextResponse.json(
        {
          error: "Invalid MONGODB_URI format",
          details: "MONGODB_URI should be in format: mongodb://user:pass@host:port/database",
        },
        { status: 500 }
      );
    }

    const baseUri = uriParts.slice(0, -1).join("/");
    const connectionString = `${baseUri}/${databaseName}`;
    console.log(`[Create Database] Base URI: ${baseUri}`);
    console.log(`[Create Database] Connection string: ${connectionString.replace(/:[^:@]+@/, ":****@")}`);

    // Connect and create database
    console.log(`[Create Database] Connecting to MongoDB...`);

    // MongoDB connection options with timeout
    const clientOptions = {
      serverSelectionTimeoutMS: 10000, // 10 seconds timeout
      connectTimeoutMS: 10000, // 10 seconds connection timeout
      socketTimeoutMS: 45000, // 45 seconds socket timeout
      retryWrites: true,
      retryReads: true,
    };

    client = new MongoClient(MAIN_MONGODB_URI, clientOptions);

    try {
      console.log(`[Create Database] Attempting connection with 10s timeout...`);
      await client.connect();
      console.log(`[Create Database] ✅ Connected to MongoDB`);

      // Test connection with timeout
      console.log(`[Create Database] Verifying connection...`);
      await Promise.race([
        client.db().admin().ping(),
        new Promise((_, reject) => setTimeout(() => reject(new Error("Connection verification timeout")), 5000)),
      ]);
      console.log(`[Create Database] ✅ Connection verified`);
    } catch (connectError: any) {
      console.error(`[Create Database] ❌ Failed to connect to MongoDB:`, connectError);

      // Provide specific error messages based on error type
      let errorMessage = "Failed to connect to MongoDB";
      let errorDetails = connectError.message || "Check your MONGODB_URI and network connection";

      if (connectError.code === "ETIMEOUT" || connectError.syscall === "querySrv") {
        errorMessage = "MongoDB connection timeout (DNS/Network)";
        errorDetails =
          `Unable to reach MongoDB server. Error: ${connectError.message}\n\n` +
          `This is typically caused by:\n` +
          `1. DNS resolution timeout (SRV record lookup failed)\n` +
          `2. Network connectivity issues\n` +
          `3. Firewall blocking MongoDB connections\n` +
          `4. MongoDB Atlas IP whitelist restrictions\n\n` +
          `Solutions:\n` +
          `- Check your internet connection\n` +
          `- Verify MongoDB Atlas IP whitelist (add 0.0.0.0/0 for testing)\n` +
          `- Check network firewall settings\n` +
          `- Try using direct connection string instead of mongodb+srv://\n` +
          `- Verify your MONGODB_URI is correct\n` +
          `- Check if MongoDB Atlas cluster is running`;
      } else if (connectError.message?.includes("authentication")) {
        errorMessage = "MongoDB authentication failed";
        errorDetails = "Invalid username or password in MONGODB_URI";
      } else if (connectError.message?.includes("ENOTFOUND") || connectError.message?.includes("getaddrinfo")) {
        errorMessage = "MongoDB host not found";
        errorDetails = "Cannot resolve MongoDB hostname. Check your MONGODB_URI";
      }

      return NextResponse.json(
        {
          error: errorMessage,
          details: errorDetails,
          code: connectError.code || "CONNECTION_ERROR",
        },
        { status: 500 }
      );
    }

    try {
      const db = client.db(databaseName);
      console.log(`[Create Database] Accessing database: ${databaseName}`);

      // Initialize collections (this actually creates the database)
      console.log(`[Create Database] Initializing collections...`);
      const collectionsCount = await initializeCollections(db);
      console.log(`[Create Database] ✅ Created ${collectionsCount} collections`);

      const collections = await db.listCollections().toArray();
      console.log(`[Create Database] ✅ Database has ${collections.length} collections`);

      // Initialize brand_config with merchantId
      console.log(`[Create Database] Initializing brand_config with merchantId: ${merchantId}`);
      try {
        const brandConfigCol = db.collection("brand_config");
        const existingBrandConfig = await brandConfigCol.findOne({ id: "brand_config_v1" });

        if (!existingBrandConfig) {
          // Get merchant data from super-admin to populate brand config
          const merchantsCol = await getCollection("merchants");
          const merchant = await merchantsCol.findOne({ id: merchantId });

          const defaultBrandConfig = {
            id: "brand_config_v1",
            merchantId: merchantId, // Store merchant ID
            brandName: merchant?.name || merchant?.settings?.brandName || "My Store",
            brandTagline: "Modern E-commerce Store",
            logo: {
              type: "text" as const,
              text: {
                primary: merchant?.name?.split(" ")[0] || "Store",
                secondary: merchant?.name?.split(" ").slice(1).join(" ") || "",
              },
              altText: `${merchant?.name || "Store"} Logo`,
            },
            favicon: {
              path: "/favicon.ico",
              appleTouchIcon: "/favicon.ico",
              manifestIcon: "/favicon.ico",
            },
            meta: {
              title: {
                default: `${merchant?.name || "Store"} – Modern E-commerce`,
                template: "%s – " + (merchant?.name || "Store"),
              },
              description: `Shop at ${merchant?.name || "our store"} - Discover quality products with fast checkout and delivery.`,
              keywords: ["ecommerce", "online store", "shopping"],
              metadataBase: merchant?.deploymentUrl || "https://localhost:3000",
              socialShareImage: "",
              openGraph: {
                title: `${merchant?.name || "Store"} – Modern E-commerce`,
                description: `Shop at ${merchant?.name || "our store"} - Discover quality products.`,
                type: "website",
                locale: "en_US",
                siteName: merchant?.name || "Store",
                image: "",
              },
              twitter: {
                card: "summary_large_image",
                title: `${merchant?.name || "Store"} – Modern E-commerce`,
                description: `Shop at ${merchant?.name || "our store"} - Discover quality products.`,
                image: "",
              },
            },
            contact: {
              email: merchant?.email || "support@example.com",
              phone: merchant?.phone || "+1 (555) 000-0000",
              address: "123 Store St, City, State 12345",
            },
            social: {
              facebook: "#",
              twitter: "#",
              instagram: "#",
              youtube: "#",
            },
            footer: {
              description: `Welcome to ${merchant?.name || "our store"}. Discover quality products with fast checkout and delivery.`,
              copyrightText: `© ${new Date().getFullYear()} ${merchant?.name || "Store"}. All rights reserved.`,
            },
            theme: {
              primaryColor: merchant?.settings?.theme?.primaryColor || "#000000",
            },
            currency: {
              iso: merchant?.settings?.currency || "USD",
            },
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };

          await brandConfigCol.insertOne(defaultBrandConfig);
          console.log(`[Create Database] ✅ Brand config initialized with merchantId: ${merchantId}`);
          console.log(
            `[Create Database] 📝 Brand config details:`,
            JSON.stringify(
              {
                id: defaultBrandConfig.id,
                merchantId: defaultBrandConfig.merchantId,
                brandName: defaultBrandConfig.brandName,
                email: defaultBrandConfig.contact.email,
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
            console.log(`[Create Database] ✅ Updated existing brand config with merchantId: ${merchantId}`);
          } else {
            console.log(`[Create Database] ℹ️  Brand config already has merchantId: ${existingBrandConfig.merchantId}`);
          }
        }
      } catch (brandConfigError: any) {
        console.error(`[Create Database] ⚠️  Error initializing brand_config:`, brandConfigError);
        // Don't fail database creation if brand config initialization fails
      }

      // Check if database config already exists
      const col = await getCollection("merchant_databases");
      const existingConfig = await col.findOne({ merchantId, status: "active" });

      if (existingConfig) {
        console.log(`[Create Database] ⚠️  Database config already exists for merchant ${merchantId}`);
        // Update existing config instead of creating new one
        await col.updateOne(
          { merchantId, status: "active" },
          {
            $set: {
              databaseName,
              connectionString: encrypt(connectionString),
              updatedAt: new Date().toISOString(),
            },
          }
        );
        console.log(`[Create Database] ✅ Updated existing database config`);
      } else {
        // Store database configuration
        const dbConfig = {
          id: `db_${merchantId}_${Date.now()}`,
          merchantId,
          databaseName,
          connectionString: encrypt(connectionString),
          useSharedDatabase: false,
          status: "active",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        await col.insertOne(dbConfig);
        console.log(`[Create Database] ✅ Database configuration stored`);
      }

      await client.close();
      client = null;

      return NextResponse.json({
        success: true,
        databaseName,
        collections: collections.length,
        collectionsCount,
      });
    } catch (dbError: any) {
      console.error(`[Create Database] ❌ Error creating database:`, dbError);
      throw dbError;
    }
  } catch (error: any) {
    console.error("[Create Database] ❌ Error:", error);

    // Ensure client is closed
    if (client) {
      try {
        await client.close();
      } catch (closeError) {
        console.error("[Create Database] Error closing connection:", closeError);
      }
    }

    // Provide detailed error message
    const errorMessage = error.message || "Failed to create database";
    const errorDetails = {
      error: errorMessage,
      details: error.stack || "Unknown error occurred",
      code: error.code || error.codeName || "UNKNOWN",
    };

    console.error("[Create Database] Error details:", errorDetails);

    return NextResponse.json(errorDetails, { status: 500 });
  }
}
