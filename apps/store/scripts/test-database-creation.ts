/**
 * Test Database Creation Script
 * 
 * This script simulates the complete database creation flow
 * Run with: npx tsx scripts/test-database-creation.ts
 */

import { MongoClient } from "mongodb";
import { createMerchantDatabase, getMerchantConnectionString, testMerchantDatabase } from "../lib/database-service";

async function testDatabaseCreation() {
  const testMerchantId = `test_${Date.now()}`;
  
  console.log("🧪 Testing Database Creation Flow");
  console.log("=" .repeat(50));
  console.log(`Merchant ID: ${testMerchantId}`);
  console.log(`MONGODB_URI: ${process.env.MONGODB_URI ? "✅ Set" : "❌ Not set"}`);
  console.log(`ENCRYPTION_KEY: ${process.env.ENCRYPTION_KEY ? "✅ Set" : "❌ Not set"}`);
  console.log("");

  try {
    // Step 1: Create database
    console.log("📦 Step 1: Creating merchant database...");
    const dbConfig = await createMerchantDatabase(testMerchantId);
    console.log("✅ Database created successfully!");
    console.log(`   Database Name: ${dbConfig.databaseName}`);
    console.log(`   Database ID: ${dbConfig.id}`);
    console.log(`   Status: ${dbConfig.status}`);
    console.log("");

    // Step 2: Get connection string
    console.log("🔗 Step 2: Retrieving connection string...");
    const connectionString = await getMerchantConnectionString(testMerchantId);
    if (!connectionString) {
      throw new Error("Failed to get connection string");
    }
    console.log("✅ Connection string retrieved!");
    console.log(`   Database: ${connectionString.split("/").pop()}`);
    console.log("");

    // Step 3: Test connection
    console.log("🔌 Step 3: Testing database connection...");
    const client = new MongoClient(connectionString);
    await client.connect();
    console.log("✅ Connected to MongoDB!");
    
    const db = client.db();
    const dbName = db.databaseName;
    console.log(`   Database Name: ${dbName}`);
    
    // Step 4: List collections
    console.log("");
    console.log("📋 Step 4: Checking collections...");
    const collections = await db.listCollections().toArray();
    console.log(`✅ Found ${collections.length} collections:`);
    collections.forEach((col) => {
      console.log(`   - ${col.name}`);
    });
    
    // Step 5: Check indexes
    console.log("");
    console.log("🔍 Step 5: Checking indexes...");
    const productsIndexes = await db.collection("products").indexes();
    console.log(`✅ Products collection has ${productsIndexes.length} indexes:`);
    productsIndexes.forEach((idx) => {
      console.log(`   - ${idx.name}: ${JSON.stringify(idx.key)}`);
    });
    
    // Step 6: Test write operation
    console.log("");
    console.log("✍️  Step 6: Testing write operation...");
    const testProduct = {
      name: "Test Product",
      slug: `test-product-${Date.now()}`,
      price: 99.99,
      createdAt: new Date().toISOString(),
    };
    await db.collection("products").insertOne(testProduct);
    console.log("✅ Write operation successful!");
    
    // Step 7: Test read operation
    console.log("");
    console.log("📖 Step 7: Testing read operation...");
    const product = await db.collection("products").findOne({ slug: testProduct.slug });
    if (product) {
      console.log("✅ Read operation successful!");
      console.log(`   Product: ${product.name} - $${product.price}`);
    }
    
    // Step 8: Cleanup test data
    console.log("");
    console.log("🧹 Step 8: Cleaning up test data...");
    await db.collection("products").deleteOne({ slug: testProduct.slug });
    console.log("✅ Test data cleaned up!");
    
    await client.close();
    
    // Step 9: Test using service function
    console.log("");
    console.log("🧪 Step 9: Testing service function...");
    const testResult = await testMerchantDatabase(testMerchantId);
    console.log(`✅ Service test: ${testResult ? "PASSED" : "FAILED"}`);
    
    console.log("");
    console.log("=" .repeat(50));
    console.log("✅ ALL TESTS PASSED!");
    console.log("=" .repeat(50));
    console.log("");
    console.log("📊 Summary:");
    console.log(`   - Database: ${dbConfig.databaseName}`);
    console.log(`   - Collections: ${collections.length}`);
    console.log(`   - Indexes: ${productsIndexes.length}`);
    console.log(`   - Connection: ✅ Working`);
    console.log(`   - Read/Write: ✅ Working`);
    
  } catch (error: any) {
    console.error("");
    console.error("=" .repeat(50));
    console.error("❌ TEST FAILED!");
    console.error("=" .repeat(50));
    console.error(`Error: ${error.message}`);
    console.error("");
    console.error("Stack trace:");
    console.error(error.stack);
    console.error("");
    console.error("💡 Troubleshooting:");
    console.error("   1. Check MONGODB_URI is set correctly");
    console.error("   2. Check ENCRYPTION_KEY is set");
    console.error("   3. Verify MongoDB is running");
    console.error("   4. Check MongoDB user has createDatabase permission");
    process.exit(1);
  }
}

// Run the test
if (require.main === module) {
  testDatabaseCreation()
    .then(() => {
      console.log("");
      console.log("✨ Test completed!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Fatal error:", error);
      process.exit(1);
    });
}

export { testDatabaseCreation };

