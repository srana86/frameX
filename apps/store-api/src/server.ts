import { Server } from "http";
import mongoose from "mongoose";
import app from "./app";
import config from "./config";
import { initializeSocketIO, shutdownSocketIO } from "./app/socket/socket";

let server: Server;

async function main() {
  try {
    await mongoose.connect(config.database_url as string);
    console.log("✅ Database is connected");

    server = app.listen(config.port, () => {
      console.log(`app is listening on port ${config.port}`);
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
  } catch (err) {
    console.log(err);
  }
}

main();

process.on("unhandledRejection", (err) => {
  console.log(`😈 unhandledRejection is detected , shutting down ...`, err);
  if (server) {
    server.close(async () => {
      await shutdownSocketIO();
      process.exit(1);
    });
  }
  process.exit(1);
});

process.on("uncaughtException", async () => {
  console.log(`😈 uncaughtException is detected , shutting down ...`);
  await shutdownSocketIO();
  process.exit(1);
});

// Graceful shutdown
process.on("SIGTERM", async () => {
  console.log("SIGTERM received, shutting down gracefully");
  if (server) {
    server.close(async () => {
      await shutdownSocketIO();
      await mongoose.connection.close();
      process.exit(0);
    });
  }
});

process.on("SIGINT", async () => {
  console.log("SIGINT received, shutting down gracefully");
  if (server) {
    server.close(async () => {
      await shutdownSocketIO();
      await mongoose.connection.close();
      process.exit(0);
    });
  }
});
