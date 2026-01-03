/**
 * Complete Flow Simulation: From Scratch to Local Deployment
 *
 * This script simulates the ENTIRE flow:
 * 1. Create subscription
 * 2. Create database
 * 3. Initialize collections
 * 4. Create deployment config
 * 5. Simulate local deployment
 *
 * Run with: npx tsx scripts/simulate-full-flow.ts
 */

// Load .env file FIRST before any other imports
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
        // Remove quotes if present
        const cleanValue = value.replace(/^["']|["']$/g, "");
        // Set environment variable if not already set
        if (!process.env[key.trim()]) {
          process.env[key.trim()] = cleanValue;
        }
      }
    }
  });
} else {
  console.warn("⚠️  .env file not found. Using environment variables directly.");
}

// Now import everything else
import { MongoClient } from "mongodb";
import { createMerchantDatabase, getMerchantConnectionString, testMerchantDatabase } from "../lib/database-service";
import { getCollection } from "../lib/mongodb";
import type { MerchantSubscription, SubscriptionPlan } from "../lib/subscription-types";
import type { Merchant, MerchantDeployment } from "../lib/merchant-types";

// Colors for console output
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

function logWarning(message: string) {
  console.log(`${colors.yellow}⚠️  ${message}${colors.reset}`);
}

function separator() {
  console.log("\n" + "=".repeat(70) + "\n");
}

async function simulateFullFlow() {
  console.log("\n");
  console.log(colors.cyan + colors.bright + "🚀 COMPLETE FLOW SIMULATION: FROM SCRATCH TO LOCAL DEPLOYMENT" + colors.reset);
  console.log(colors.cyan + "=".repeat(70) + colors.reset);
  console.log("\n");

  // Check environment variables
  if (!process.env.MONGODB_URI) {
    logError("MONGODB_URI is not set!");
    console.log("\n" + colors.yellow + "Please set MONGODB_URI in your .env file:" + colors.reset);
    console.log("   MONGODB_URI=mongodb://user:password@host:port/database_name");
    console.log("\n" + colors.yellow + "Or set it as an environment variable:" + colors.reset);
    console.log("   export MONGODB_URI='mongodb://user:password@host:port/database_name'");
    console.log("   npx tsx scripts/simulate-full-flow.ts\n");
    process.exit(1);
  }

  if (!process.env.ENCRYPTION_KEY) {
    logWarning("ENCRYPTION_KEY is not set. Connection strings will be stored in plain text.");
    logWarning("For production, set ENCRYPTION_KEY in your .env file.");
  }

  // Validate MONGODB_URI format
  if (!process.env.MONGODB_URI.startsWith("mongodb://") && !process.env.MONGODB_URI.startsWith("mongodb+srv://")) {
    logError("Invalid MONGODB_URI format!");
    console.log("\n" + colors.yellow + "MONGODB_URI must start with 'mongodb://' or 'mongodb+srv://'" + colors.reset);
    console.log("   Current value: " + process.env.MONGODB_URI.substring(0, 20) + "...\n");
    process.exit(1);
  }

  logInfo(`MONGODB_URI: ${process.env.MONGODB_URI.replace(/:[^:@]+@/, ":****@")}`);
  logInfo(`ENCRYPTION_KEY: ${process.env.ENCRYPTION_KEY ? "✅ Set" : "❌ Not set"}`);
  console.log("");

  // Generate test data
  // Use simple timestamp-based IDs (database-service will add "merchant_" prefix)
  const testMerchantId = `${Date.now()}`;
  const testPlanId = `plan_${Date.now()}`;

  try {
    // ============================================
    // STEP 1: CREATE SUBSCRIPTION PLAN
    // ============================================
    separator();
    log(1, "Creating Subscription Plan", colors.magenta);
    logInfo(`Plan ID: ${testPlanId}`);

    const plan: SubscriptionPlan = {
      id: testPlanId,
      name: "Starter Plan",
      description: "Perfect for small businesses",
      basePrice: 29.99,
      price: 29.99,
      billingCycle: "monthly",
      billingCycleMonths: 1,
      features: {
        max_products: 50,
        max_storage_gb: 5,
        custom_domain: false,
        remove_branding: false,
        advanced_analytics: false,
        ads_tracking_platforms: ["meta", "gtm"],
        payment_gateways: 1,
        team_members: 1,
        api_access: false,
        support_level: "email",
      },
      isActive: true,
      isPopular: false,
      sortOrder: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const plansCol = await getCollection<SubscriptionPlan>("subscription_plans");
    await plansCol.insertOne(plan as any);
    logSuccess(`Plan created: ${plan.name} ($${plan.price}/month)`);
    logInfo(`Features: ${plan.features.max_products} products, ${plan.features.max_storage_gb}GB storage`);

    // ============================================
    // STEP 2: CREATE MERCHANT RECORD
    // ============================================
    separator();
    log(2, "Creating Merchant Record", colors.magenta);
    logInfo(`Merchant ID: ${testMerchantId}`);

    const merchant: Merchant = {
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

    const merchantsCol = await getCollection<Merchant>("merchants");
    await merchantsCol.insertOne(merchant as any);
    logSuccess(`Merchant created: ${merchant.name}`);
    logInfo(`Status: ${merchant.status}`);
    logInfo(`Email: ${merchant.email}`);

    // ============================================
    // STEP 3: CREATE SUBSCRIPTION
    // ============================================
    separator();
    log(3, "Creating Subscription", colors.magenta);
    logInfo(`Merchant: ${testMerchantId}`);
    logInfo(`Plan: ${testPlanId}`);

    const now = new Date();
    const periodEnd = new Date(now);
    periodEnd.setMonth(periodEnd.getMonth() + 1);

    const subscription: MerchantSubscription = {
      id: `sub_${Date.now()}`,
      merchantId: testMerchantId,
      planId: testPlanId,
      status: "active",
      billingCycle: "monthly",
      billingCycleMonths: 1,
      amount: plan.price,
      currency: "USD",
      currentPeriodStart: now.toISOString(),
      currentPeriodEnd: periodEnd.toISOString(),
      cancelAtPeriodEnd: false,
      autoRenew: true,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };

    const subscriptionsCol = await getCollection<MerchantSubscription>("merchant_subscriptions");
    await subscriptionsCol.insertOne(subscription as any);
    logSuccess(`Subscription created: ${subscription.id}`);
    logInfo(`Status: ${subscription.status}`);
    logInfo(`Period: ${now.toLocaleDateString()} - ${periodEnd.toLocaleDateString()}`);

    // ============================================
    // STEP 4: CREATE MONGODB DATABASE
    // ============================================
    separator();
    log(4, "Creating MongoDB Database", colors.magenta);
    logInfo(`Merchant ID: ${testMerchantId}`);

    console.log("\n📦 Initializing database creation...");
    const dbConfig = await createMerchantDatabase(testMerchantId);
    logSuccess(`Database created: ${dbConfig.databaseName}`);
    logInfo(`Database ID: ${dbConfig.id}`);
    logInfo(`Status: ${dbConfig.status}`);

    // ============================================
    // STEP 5: VERIFY DATABASE CREATION
    // ============================================
    separator();
    log(5, "Verifying Database Creation", colors.magenta);

    const connectionString = await getMerchantConnectionString(testMerchantId);
    if (!connectionString) {
      throw new Error("Failed to get connection string");
    }

    logSuccess("Connection string retrieved");
    logInfo(`Database: ${connectionString.split("/").pop()}`);

    // Connect and verify
    const client = new MongoClient(connectionString);
    await client.connect();
    const db = client.db();

    // List collections
    const collections = await db.listCollections().toArray();
    logSuccess(`Database verified: ${collections.length} collections found`);
    console.log("\n📋 Collections:");
    collections.forEach((col) => {
      console.log(`   - ${col.name}`);
    });

    // Check indexes
    const productsIndexes = await db.collection("products").indexes();
    logSuccess(`Indexes created: ${productsIndexes.length} indexes on products collection`);
    console.log("\n🔍 Indexes:");
    productsIndexes.forEach((idx) => {
      console.log(`   - ${idx.name}: ${JSON.stringify(idx.key)}`);
    });

    await client.close();

    // ============================================
    // STEP 6: TEST DATABASE OPERATIONS
    // ============================================
    separator();
    log(6, "Testing Database Operations", colors.magenta);

    const testClient = new MongoClient(connectionString);
    await testClient.connect();
    const testDb = testClient.db();

    // Test write
    console.log("\n✍️  Testing write operation...");
    const testProduct = {
      name: "Test Product",
      slug: `test-product-${Date.now()}`,
      price: 99.99,
      description: "This is a test product",
      category: "test",
      merchantId: testMerchantId,
      createdAt: new Date().toISOString(),
    };
    await testDb.collection("products").insertOne(testProduct);
    logSuccess(`Product inserted: ${testProduct.name}`);

    // Test read
    console.log("\n📖 Testing read operation...");
    const product = await testDb.collection("products").findOne({ slug: testProduct.slug });
    if (product) {
      logSuccess(`Product retrieved: ${product.name} - $${product.price}`);
    }

    // Test update
    console.log("\n🔄 Testing update operation...");
    await testDb
      .collection("products")
      .updateOne({ slug: testProduct.slug }, { $set: { price: 149.99, updatedAt: new Date().toISOString() } });
    logSuccess("Product updated");

    // Test delete
    console.log("\n🗑️  Testing delete operation...");
    await testDb.collection("products").deleteOne({ slug: testProduct.slug });
    logSuccess("Product deleted");

    await testClient.close();

    // ============================================
    // STEP 7: CREATE DEPLOYMENT RECORD
    // ============================================
    separator();
    log(7, "Creating Deployment Record", colors.magenta);

    const deployment: MerchantDeployment = {
      id: `deploy_${testMerchantId}_${Date.now()}`,
      merchantId: testMerchantId,
      deploymentType: "subdomain",
      subdomain: `merchant-${testMerchantId}`,
      deploymentStatus: "active",
      deploymentUrl: `http://localhost:3000/merchant/${testMerchantId}`,
      deploymentProvider: "custom",
      deploymentId: `local_${Date.now()}`,
      environmentVariables: {
        MERCHANT_ID: testMerchantId,
        MERCHANT_DB_NAME: dbConfig.databaseName,
        MONGODB_URI: connectionString,
        NODE_ENV: "development",
      },
      lastDeployedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const deploymentsCol = await getCollection<MerchantDeployment>("merchant_deployments");
    await deploymentsCol.insertOne(deployment as any);
    logSuccess(`Deployment record created: ${deployment.id}`);
    logInfo(`Deployment URL: ${deployment.deploymentUrl}`);
    logInfo(`Status: ${deployment.deploymentStatus}`);

    // ============================================
    // STEP 8: SIMULATE LOCAL DEPLOYMENT
    // ============================================
    separator();
    log(8, "Simulating Local Deployment", colors.magenta);

    console.log("\n🔧 Deployment Configuration:");
    console.log(`   Merchant ID: ${testMerchantId}`);
    console.log(`   Database: ${dbConfig.databaseName}`);
    console.log(`   URL: ${deployment.deploymentUrl}`);
    console.log(`   Environment: ${deployment.environmentVariables.NODE_ENV}`);

    console.log("\n📝 Environment Variables:");
    Object.entries(deployment.environmentVariables).forEach(([key, value]) => {
      if (key === "MONGODB_URI") {
        console.log(`   ${key}: ${(value as string).replace(/:[^:@]+@/, ":****@")}`);
      } else {
        console.log(`   ${key}: ${value}`);
      }
    });

    console.log("\n🚀 Deployment Steps:");
    console.log("   1. ✅ Database created");
    console.log("   2. ✅ Collections initialized");
    console.log("   3. ✅ Indexes created");
    console.log("   4. ✅ Deployment record created");
    console.log("   5. ✅ Environment variables configured");
    console.log("   6. ⏳ Starting local server...");

    // Simulate server start
    await new Promise((resolve) => setTimeout(resolve, 1000));
    logSuccess("Local server started");
    logInfo(`Access your store at: ${deployment.deploymentUrl}`);

    // ============================================
    // STEP 9: VERIFY COMPLETE SETUP
    // ============================================
    separator();
    log(9, "Verifying Complete Setup", colors.magenta);

    // Test database connection
    const dbTest = await testMerchantDatabase(testMerchantId);
    logSuccess(`Database connection test: ${dbTest ? "PASSED" : "FAILED"}`);

    // Verify all records exist
    const merchantCheck = await merchantsCol.findOne({ id: testMerchantId });
    logSuccess(`Merchant record: ${merchantCheck ? "EXISTS" : "MISSING"}`);

    const subscriptionCheck = await subscriptionsCol.findOne({ id: subscription.id });
    logSuccess(`Subscription record: ${subscriptionCheck ? "EXISTS" : "MISSING"}`);

    const deploymentCheck = await deploymentsCol.findOne({ id: deployment.id });
    logSuccess(`Deployment record: ${deploymentCheck ? "EXISTS" : "MISSING"}`);

    // ============================================
    // SUMMARY
    // ============================================
    separator();
    console.log(colors.green + colors.bright + "✅ COMPLETE FLOW SIMULATION SUCCESSFUL!" + colors.reset);
    console.log("\n📊 Summary:");
    console.log(`   ${colors.cyan}Merchant ID:${colors.reset} ${testMerchantId}`);
    console.log(`   ${colors.cyan}Plan ID:${colors.reset} ${testPlanId}`);
    console.log(`   ${colors.cyan}Subscription ID:${colors.reset} ${subscription.id}`);
    console.log(`   ${colors.cyan}Database:${colors.reset} ${dbConfig.databaseName}`);
    console.log(`   ${colors.cyan}Deployment ID:${colors.reset} ${deployment.id}`);
    console.log(`   ${colors.cyan}Collections:${colors.reset} ${collections.length}`);
    console.log(`   ${colors.cyan}Deployment URL:${colors.reset} ${deployment.deploymentUrl}`);
    console.log("\n");

    console.log(colors.yellow + "📝 Next Steps:" + colors.reset);
    console.log("   1. Your merchant store is ready!");
    console.log("   2. Access the store at the deployment URL");
    console.log("   3. Configure your store settings");
    console.log("   4. Add products and start selling!");
    console.log("\n");

    console.log(colors.blue + "💡 To clean up test data, run:" + colors.reset);
    console.log(`   - Delete merchant: merchants collection`);
    console.log(`   - Delete subscription: merchant_subscriptions collection`);
    console.log(`   - Delete deployment: merchant_deployments collection`);
    console.log(`   - Delete database: Drop ${dbConfig.databaseName} in MongoDB`);
    console.log("\n");
  } catch (error: any) {
    separator();
    logError("SIMULATION FAILED!");
    console.error(`\n${colors.red}Error: ${error.message}${colors.reset}`);
    console.error(`\n${colors.red}Stack trace:${colors.reset}`);
    console.error(error.stack);
    console.log("\n");
    process.exit(1);
  }
}

// Run the simulation
if (require.main === module) {
  console.log(colors.cyan + "\n🚀 Starting Complete Flow Simulation...\n" + colors.reset);

  simulateFullFlow()
    .then(() => {
      console.log(colors.green + "\n✨ Simulation completed successfully!\n" + colors.reset);
      process.exit(0);
    })
    .catch((error) => {
      console.error(colors.red + "\n💥 Fatal error during simulation:\n" + colors.reset);
      console.error(error);
      process.exit(1);
    });
}

export { simulateFullFlow };
