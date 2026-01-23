import { Server } from "http";
import app from "./app";
import config from "./config";
import { prisma } from "@framex/database";
import { connectRedis, disconnectRedis } from "./lib/redis";

let server: Server;

async function main() {
  try {
    // Check if database URL is configured
    if (!process.env.DATABASE_URL) {
      console.error(
        "❌ [Database] DATABASE_URL is not configured in environment variables"
      );
      console.error("   Please set DATABASE_URL in your .env file");
      process.exit(1);
    }

    console.log("🔄 [Database] Connecting to PostgreSQL...");
    const startTime = Date.now();

    // Test database connection
    await prisma.$connect();
    const connectionTime = Date.now() - startTime;
    console.log(`✅ [Database] PostgreSQL connected in ${connectionTime}ms`);

    // Connect to Redis for BetterAuth sessions
    console.log("🔄 [Redis] Connecting for session storage...");
    await connectRedis();

    server = app.listen(config.port, () => {
      console.log(`🚀 [Server] App is listening on port ${config.port}`);
      console.log(
        `📡 [Server] API available at http://localhost:${config.port}/api/v1`
      );
    });
  } catch (err: any) {
    console.error("❌ [Server] Failed to start:");
    console.error(`   Error: ${err.message || err}`);
    process.exit(1);
  }
}

main();

process.on("unhandledRejection", async (err) => {
  console.log(`😈 unhandledRejection is detected, shutting down...`, err);
  await disconnectRedis();
  await prisma.$disconnect();
  if (server) {
    server.close(() => {
      process.exit(1);
    });
  }
  process.exit(1);
});

process.on("uncaughtException", async () => {
  console.log(`😈 uncaughtException is detected, shutting down...`);
  await disconnectRedis();
  await prisma.$disconnect();
  process.exit(1);
});

// Graceful shutdown
process.on("SIGTERM", async () => {
  console.log("SIGTERM received, shutting down gracefully");
  await disconnectRedis();
  await prisma.$disconnect();
  if (server) {
    server.close(() => {
      process.exit(0);
    });
  }
});

process.on("SIGINT", async () => {
  console.log("SIGINT received, shutting down gracefully");
  await disconnectRedis();
  await prisma.$disconnect();
  if (server) {
    server.close(() => {
      process.exit(0);
    });
  }
});
