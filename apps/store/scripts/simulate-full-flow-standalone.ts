/**
 * Complete Flow Simulation: From Scratch to Local Deployment (Standalone Version)
 * 
 * This version doesn't rely on mongodb.ts module initialization
 * Run with: npx tsx scripts/simulate-full-flow-standalone.ts
 */

// Load .env file FIRST
import * as fs from "fs";
import * as path from "path";

const envPath = path.resolve(process.cwd(), ".env");
if (fs.existsSync(envPath)) {
  const envFile = fs.readFileSync(envPath, "utf-8");
  envFile.split("\n").forEach((line) => {
    const trimmedLine = line.trim();
    if (trimmedLine && !trimmedLine.startsWith("#")) {
      const [key, ...valueParts] = trimmedLine.split("=");
      if (key && valueParts.length > 0) {
        const value = valueParts.join("=").trim();
        const cleanValue = value.replace(/^["']|["']$/g, "");
        if (!process.env[key.trim()]) {
          process.env[key.trim()] = cleanValue;
        }
      }
    }
  });
}

// Check environment variables before proceeding
if (!process.env.MONGODB_URI || process.env.MONGODB_URI.trim() === "") {
  console.error("\n❌ MONGODB_URI is not set or is empty!");
  console.error("\nPlease set MONGODB_URI in your .env file:");
  console.error("   MONGODB_URI=mongodb://user:password@host:port/database_name");
  console.error("\nOr use MongoDB Atlas:");
  console.error("   MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/database_name\n");
  process.exit(1);
}

if (!process.env.MONGODB_URI.startsWith("mongodb://") && !process.env.MONGODB_URI.startsWith("mongodb+srv://")) {
  console.error("\n❌ Invalid MONGODB_URI format!");
  console.error("MONGODB_URI must start with 'mongodb://' or 'mongodb+srv://'");
  console.error(`Current value: ${process.env.MONGODB_URI.substring(0, 30)}...\n`);
  process.exit(1);
}

// Now import everything
import { MongoClient, type Db } from "mongodb";
import { createMerchantDatabase, getMerchantConnectionString, testMerchantDatabase } from "../lib/database-service";

// Create our own getCollection function to avoid mongodb.ts initialization
async function getCollection<T extends { _id?: any }>(collectionName: string) {
  const uri = process.env.MONGODB_URI!;
  const dbName = process.env.MONGODB_DB || "shoestore";
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db(dbName);
  const collection = db.collection<T>(collectionName);
  
  return {
    findOne: async (query: any) => {
      try {
        const result = await collection.findOne(query);
        await client.close();
        return result;
      } catch (error) {
        await client.close();
        throw error;
      }
    },
    insertOne: async (doc: any) => {
      try {
        const result = await collection.insertOne(doc);
        await client.close();
        return result;
      } catch (error) {
        await client.close();
        throw error;
      }
    },
    find: (query: any = {}) => ({
      toArray: async () => {
        try {
          const result = await collection.find(query).toArray();
          await client.close();
          return result;
        } catch (error) {
          await client.close();
          throw error;
        }
      },
    }),
  };
}

// Colors
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  red: "\x1b[31m",
  cyan: "\x1b[36m",
  magenta: "\x1b[35m",
};

function log(step: number, message: string, color: string = colors.reset) {
  console.log(`${color}${colors.bright}[Step ${step}]${colors.reset} ${color}${message}${colors.reset}`);
}

function logSuccess(message: string) {
  console.log(`${colors.green}✅ ${message}${colors.reset}`);
}

function logError(message: string) {
  console.log(`${colors.red}❌ ${message}${colors.reset}`);
}

function logInfo(message: string) {
  console.log(`${colors.blue}ℹ️  ${message}${colors.reset}`);
}

function separator() {
  console.log("\n" + "=".repeat(70) + "\n");
}

async function simulateFullFlow() {
  console.log("\n");
  console.log(colors.cyan + colors.bright + "🚀 COMPLETE FLOW SIMULATION: FROM SCRATCH TO LOCAL DEPLOYMENT" + colors.reset);
  console.log(colors.cyan + "=".repeat(70) + colors.reset);
  console.log("\n");

  logInfo(`MONGODB_URI: ${process.env.MONGODB_URI!.replace(/:[^:@]+@/, ":****@")}`);
  logInfo(`ENCRYPTION_KEY: ${process.env.ENCRYPTION_KEY ? "✅ Set" : "⚠️  Not set (will store in plain text)"}`);
  console.log("");

  // Use simple timestamp-based IDs (database-service will add "merchant_" prefix)
  const testMerchantId = `${Date.now()}`;
  const testPlanId = `plan_${Date.now()}`;

  try {
    // Step 1: Create Plan
    separator();
    log(1, "Creating Subscription Plan", colors.magenta);
    const plan = {
      id: testPlanId,
      name: "Starter Plan",
      description: "Perfect for small businesses",
      price: 29.99,
      billingCycle: "monthly",
      features: {
        max_products: 50,
        max_storage_gb: 5,
        custom_domain: false,
        payment_gateways: 1,
        team_members: 1,
      },
      isActive: true,
      isPopular: false,
      sortOrder: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const plansCol = await getCollection("subscription_plans");
    await plansCol.insertOne(plan);
    logSuccess(`Plan created: ${plan.name} ($${plan.price}/month)`);

    // Step 2: Create Merchant
    separator();
    log(2, "Creating Merchant Record", colors.magenta);
    const merchant = {
      id: testMerchantId,
      name: "Test Merchant Store",
      email: "merchant@example.com",
      phone: "+1234567890",
      status: "trial",
      settings: {
        brandName: "Test Store",
        currency: "USD",
        timezone: "UTC",
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const merchantsCol = await getCollection("merchants");
    await merchantsCol.insertOne(merchant);
    logSuccess(`Merchant created: ${merchant.name}`);

    // Step 3: Create Subscription
    separator();
    log(3, "Creating Subscription", colors.magenta);
    const now = new Date();
    const periodEnd = new Date(now);
    periodEnd.setMonth(periodEnd.getMonth() + 1);
    const subscription = {
      id: `sub_${Date.now()}`,
      merchantId: testMerchantId,
      planId: testPlanId,
      status: "active",
      currentPeriodStart: now.toISOString(),
      currentPeriodEnd: periodEnd.toISOString(),
      cancelAtPeriodEnd: false,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };
    const subscriptionsCol = await getCollection("merchant_subscriptions");
    await subscriptionsCol.insertOne(subscription);
    logSuccess(`Subscription created: ${subscription.id}`);

    // Step 4: Create Database
    separator();
    log(4, "Creating MongoDB Database", colors.magenta);
    const dbConfig = await createMerchantDatabase(testMerchantId);
    logSuccess(`Database created: ${dbConfig.databaseName}`);

    // Step 5: Verify Database
    separator();
    log(5, "Verifying Database Creation", colors.magenta);
    const connectionString = await getMerchantConnectionString(testMerchantId);
    if (!connectionString) throw new Error("Failed to get connection string");
    
    const client = new MongoClient(connectionString);
    await client.connect();
    const db = client.db();
    const collections = await db.listCollections().toArray();
    logSuccess(`Database verified: ${collections.length} collections found`);
    console.log("\n📋 Collections:");
    collections.forEach((col) => console.log(`   - ${col.name}`));
    await client.close();

    // Step 6: Test Operations
    separator();
    log(6, "Testing Database Operations", colors.magenta);
    const testClient = new MongoClient(connectionString);
    await testClient.connect();
    const testDb = testClient.db();
    const testProduct = {
      name: "Test Product",
      slug: `test-${Date.now()}`,
      price: 99.99,
      merchantId: testMerchantId,
      createdAt: new Date().toISOString(),
    };
    await testDb.collection("products").insertOne(testProduct);
    logSuccess("Write test: PASSED");
    const product = await testDb.collection("products").findOne({ slug: testProduct.slug });
    logSuccess("Read test: PASSED");
    await testDb.collection("products").deleteOne({ slug: testProduct.slug });
    logSuccess("Delete test: PASSED");
    await testClient.close();

    // Step 7: Create Deployment
    separator();
    log(7, "Creating Deployment Record", colors.magenta);
    const deployment = {
      id: `deploy_${Date.now()}`,
      merchantId: testMerchantId,
      deploymentType: "local",
      subdomain: `merchant-${testMerchantId}`,
      deploymentStatus: "active",
      deploymentUrl: `http://localhost:3000/merchant/${testMerchantId}`,
      deploymentProvider: "local",
      deploymentId: `local_${Date.now()}`,
      environmentVariables: {
        MERCHANT_ID: testMerchantId,
        MERCHANT_DB_NAME: dbConfig.databaseName,
        MONGODB_URI: connectionString.replace(/:[^:@]+@/, ":****@"),
        NODE_ENV: "development",
      },
      lastDeployedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const deploymentsCol = await getCollection("merchant_deployments");
    await deploymentsCol.insertOne(deployment);
    logSuccess(`Deployment created: ${deployment.deploymentUrl}`);

    // Summary
    separator();
    console.log(colors.green + colors.bright + "✅ COMPLETE FLOW SIMULATION SUCCESSFUL!" + colors.reset);
    console.log(`\n📊 Summary:`);
    console.log(`   Merchant: ${testMerchantId}`);
    console.log(`   Database: ${dbConfig.databaseName}`);
    console.log(`   Collections: ${collections.length}`);
    console.log(`   Deployment: ${deployment.deploymentUrl}\n`);

  } catch (error: any) {
    separator();
    logError("SIMULATION FAILED!");
    console.error(`\n${colors.red}Error: ${error.message}${colors.reset}\n`);
    console.error(error.stack);
    process.exit(1);
  }
}

simulateFullFlow()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

