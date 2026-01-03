import { Server as HTTPServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import { createAdapter } from "@socket.io/redis-adapter";
import config from "../../config";
import { AuthenticatedSocket, SocketConfig } from "../types";
import { socketAuthMiddleware } from "./socketAuth.middleware";
import { registerSocketEvents } from "./socketEvents";
import { socketMetrics, socketLogger } from "./socket.logger";
import { socketRateLimiter } from "./socket.rateLimiter";

// Dynamic import for redis to avoid errors if not installed
let redis: any;

let io: SocketIOServer | null = null;

/**
 * Initialize Socket.IO server with Redis adapter for horizontal scaling
 *
 * Architecture decisions:
 * - Redis adapter enables pub/sub across multiple server instances
 * - JWT authentication on handshake prevents unauthorized connections
 * - Rooms enable targeted messaging (merchant-specific, user-specific)
 * - Rate limiting prevents event spam and DDOS
 * - Stateless design (no in-memory state) for horizontal scaling
 */
export const initializeSocketIO = async (
  httpServer: HTTPServer,
  socketConfig?: SocketConfig
): Promise<SocketIOServer> => {
  if (io) {
    return io;
  }

  // Initialize Socket.IO server
  // Handle CORS origin - use string or array
  const corsOrigin: string | string[] = socketConfig?.corsOrigin || "*";

  io = new SocketIOServer(httpServer, {
    path: socketConfig?.path || "/socket.io",
    cors: {
      origin: corsOrigin,
      methods: ["GET", "POST"],
      credentials: true,
    },
    pingTimeout: socketConfig?.pingTimeout || 60000, // 60 seconds
    pingInterval: socketConfig?.pingInterval || 25000, // 25 seconds
    transports: ["websocket", "polling"], // Fallback to polling if websocket fails
    allowEIO3: true, // Allow Engine.IO v3 clients
    maxHttpBufferSize: 1e6, // 1MB max payload
  });

  // Setup Redis adapter for horizontal scaling
  // This enables pub/sub across multiple server instances
  // Only initialize if Redis URL is provided
  const redisUrl = socketConfig?.redisUrl || process.env.REDIS_URL;

  if (redisUrl) {
    try {
      // Try to load redis module dynamically
      if (!redis) {
        try {
          redis = await import("redis");
        } catch (err) {
          console.warn(
            "⚠️  Redis module not found, install with: npm install redis"
          );
          throw new Error("Redis module not installed");
        }
      }

      const pubClient = redis.createClient({ url: redisUrl });
      const subClient = pubClient.duplicate();

      await Promise.all([pubClient.connect(), subClient.connect()]);

      io.adapter(createAdapter(pubClient, subClient));

      console.log("✅ Socket.IO Redis adapter initialized");
    } catch (error: any) {
      console.warn(
        "⚠️  Redis adapter initialization failed, running in single-instance mode:",
        error.message
      );
      // Continue without Redis adapter (single instance only)
    }
  } else {
    console.log(
      "ℹ️  Redis adapter not configured, running in single-instance mode"
    );
    console.log(
      "   To enable horizontal scaling, set REDIS_URL environment variable"
    );
  }

  // Authentication middleware - runs on every connection
  io.use(socketAuthMiddleware);

  // Connection handler
  io.on("connection", (socket: AuthenticatedSocket) => {
    const startTime = Date.now();

    socketMetrics.incrementConnections();
    console.log(
      `Socket connected: ${socket.id} (User: ${socket.userId}, Role: ${socket.userRole})`
    );

    // Register all event handlers
    registerSocketEvents(io!, socket);

    // Handle disconnect
    socket.on("disconnect", (reason) => {
      const duration = Date.now() - startTime;
      socketMetrics.decrementConnections();
      socketRateLimiter.reset(socket.id);

      console.log(
        `Socket disconnected: ${socket.id} (Reason: ${reason}, Duration: ${duration}ms)`
      );
      socketLogger.logEvent("disconnect", socket, duration);
    });

    // Handle errors
    socket.on("error", (error) => {
      socketMetrics.incrementErrors();
      console.error(`Socket error (${socket.id}):`, error);
      socketLogger.logEvent("error", socket, 0, error.message || String(error));
    });

    // Send connection confirmation
    socket.emit("connected", {
      socketId: socket.id,
      userId: socket.userId,
      role: socket.userRole,
      timestamp: new Date().toISOString(),
    });
  });

  // Periodic metrics logging (every 5 minutes)
  setInterval(
    () => {
      const metrics = socketMetrics.getMetrics();
      const slowEvents = socketLogger.getSlowEvents();

      console.log("Socket Metrics:", JSON.stringify(metrics));
      if (slowEvents.length > 0) {
        console.warn(
          `Slow events detected (${slowEvents.length}):`,
          slowEvents.slice(-10)
        );
      }
    },
    5 * 60 * 1000
  );

  console.log("✅ Socket.IO server initialized");

  return io;
};

/**
 * Get Socket.IO server instance
 * Use this to emit events from services/controllers
 */
export const getSocketIO = (): SocketIOServer => {
  if (!io) {
    throw new Error(
      "Socket.IO server not initialized. Call initializeSocketIO first."
    );
  }
  return io;
};

/**
 * Gracefully shutdown Socket.IO server
 */
export const shutdownSocketIO = async (): Promise<void> => {
  if (io) {
    io.close();
    io = null;
    console.log("Socket.IO server shutdown");
  }
};
