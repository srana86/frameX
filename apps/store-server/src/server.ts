// IMPORTANT: Load environment variables FIRST, before any imports that use them
import dotenv from "dotenv";
dotenv.config();

import { Server } from "http";
import app from "./app";
import config from "./config";
import { initializeSocketIO, shutdownSocketIO } from "./app/socket/socket";
import { prisma } from "@framex/database";
import { connectRedis, disconnectRedis } from "./lib/redis";
import { initCronJobs } from "./cron";


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

    // Connect Redis for BetterAuth sessions
    console.log("🔄 [Redis] Connecting for BetterAuth sessions...");
    await connectRedis();

    // Initialize distributed cron jobs
    initCronJobs();

    server = app.listen(config.port, () => {

      console.log(`🚀 [Server] Store API is listening on port ${config.port}`);
    });

    // Initialize Socket.IO server
    const corsOrigins =
      config.NODE_ENV === "production" && process.env.CORS_ORIGIN
        ? process.env.CORS_ORIGIN.split(",")
        : "*";

    await initializeSocketIO(server, {
      redisUrl: config.redis_url as string,
      redisHost: config.redis_host as string,
      redisPort: config.redis_port ? parseInt(config.redis_port) : undefined,
      redisPassword: config.redis_password as string,
      path: config.socket_path as string,
      pingTimeout: config.socket_ping_timeout as number,
      pingInterval: config.socket_ping_interval as number,
      corsOrigin: corsOrigins,
    });
  } catch (err: any) {
    console.error("❌ [Database] Failed to connect to PostgreSQL:");
    console.error(`   Error: ${err.message || err}`);
    process.exit(1);
  }
}

main();

process.on("unhandledRejection", async (err) => {
  console.log(`😈 unhandledRejection is detected, shutting down...`, err);
  await shutdownSocketIO();
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
  await shutdownSocketIO();
  await disconnectRedis();
  await prisma.$disconnect();
  process.exit(1);
});

// Graceful shutdown
process.on("SIGTERM", async () => {
  console.log("SIGTERM received, shutting down gracefully");
  await shutdownSocketIO();
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
  await shutdownSocketIO();
  await disconnectRedis();
  await prisma.$disconnect();
  if (server) {
    server.close(() => {
      process.exit(0);
    });
  }
});
