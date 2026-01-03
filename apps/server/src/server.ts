import { Server } from "http";
import mongoose from "mongoose";
import app from "./app";
import config from "./config";

let server: Server;

// Database connection event listeners
mongoose.connection.on("connecting", () => {
  console.log("🔄 [Database] Connecting to MongoDB...");
});

mongoose.connection.on("connected", () => {
  console.log("✅ [Database] MongoDB connected successfully");
  console.log(`   Database: ${mongoose.connection.db?.databaseName || "N/A"}`);
  console.log(`   Host: ${mongoose.connection.host || "N/A"}`);
  console.log(`   Port: ${mongoose.connection.port || "N/A"}`);
});

mongoose.connection.on("error", (err) => {
  console.error("❌ [Database] MongoDB connection error:", err.message);
});

mongoose.connection.on("disconnected", () => {
  console.log("⚠️  [Database] MongoDB disconnected");
});

mongoose.connection.on("reconnected", () => {
  console.log("🔄 [Database] MongoDB reconnected");
});

async function main() {
  try {
    // Check if database URL is configured
    if (!config.database_url) {
      console.error(
        "❌ [Database] MONGODB_URI is not configured in environment variables"
      );
      console.error("   Please set MONGODB_URI in your .env file");
      process.exit(1);
    }

    console.log("🔄 [Database] Attempting to connect to MongoDB...");
    // Mask credentials in connection string for logging
    const maskedUri = config.database_url.replace(
      /\/\/[^:]+:[^@]+@/,
      "//***:***@"
    );
    console.log(`   URI: ${maskedUri}`);

    const startTime = Date.now();
    await mongoose.connect(config.database_url as string, {
      dbName: config.mongodb_db,
    });
    const connectionTime = Date.now() - startTime;

    console.log(`✅ [Database] Connection established in ${connectionTime}ms`);

    // Seed super admin
    try {
      const seedSuperAdmin = (await import("./app/DB")).default;
      await seedSuperAdmin();
    } catch (error) {
      console.error("❌ [Database] Failed to seed Super Admin:", error);
    }

    server = app.listen(config.port, () => {
      console.log(`🚀 [Server] App is listening on port ${config.port}`);
      console.log(
        `📡 [Server] API available at http://localhost:${config.port}/api/v1`
      );
    });
  } catch (err: any) {
    console.error("❌ [Database] Failed to connect to MongoDB:");
    console.error(`   Error: ${err.message || err}`);
    if (err.name === "MongoServerSelectionError") {
      console.error("   This usually means:");
      console.error("   - MongoDB server is not running");
      console.error("   - Incorrect connection string");
      console.error("   - Network connectivity issues");
    }
    process.exit(1);
  }
}

main();

process.on("unhandledRejection", (err) => {
  console.log(`😈 unhandledRejection is detected , shutting down ...`, err);
  if (server) {
    server.close(() => {
      process.exit(1);
    });
  }
  process.exit(1);
});

process.on("uncaughtException", () => {
  console.log(`😈 uncaughtException is detected , shutting down ...`);
  process.exit(1);
});
