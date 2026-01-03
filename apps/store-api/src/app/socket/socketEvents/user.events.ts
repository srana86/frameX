import { Server } from "socket.io";
import { socketLogger, socketMetrics } from "../socket.logger";
import { socketRateLimiter } from "../socket.rateLimiter";
import { AuthenticatedSocket } from "../../types";

/**
 * User-related socket events
 * Handles user presence, notifications, and personal updates
 */
export const registerUserEvents = (io: Server, socket: AuthenticatedSocket) => {
  // Join user's personal room
  socket.on("user:join", async () => {
    const startTime = Date.now();
    try {
      if (!socket.userId) {
        socket.emit("error", { message: "User ID not found" });
        return;
      }

      if (socketRateLimiter.checkRateLimit(socket.id)) {
        socket.emit("error", { message: "Rate limit exceeded" });
        return;
      }

      const room = `user:${socket.userId}`;
      await socket.join(room);

      // Join role-based room
      if (socket.userRole) {
        const roleRoom = `role:${socket.userRole}`;
        await socket.join(roleRoom);
      }

      socket.emit("user:joined", {
        userId: socket.userId,
        role: socket.userRole,
      });

      const duration = Date.now() - startTime;
      socketLogger.logEvent("user:join", socket, duration);
      socketMetrics.incrementEventsReceived();
    } catch (error: any) {
      const duration = Date.now() - startTime;
      socketLogger.logEvent("user:join", socket, duration, error.message);
      socketMetrics.incrementErrors();
      socket.emit("error", { message: error.message });
    }
  });

  // Heartbeat/ping to keep connection alive
  socket.on("user:ping", () => {
    socket.emit("user:pong", { timestamp: Date.now() });
    socketMetrics.incrementEventsReceived();
  });

  // Join merchant room
  socket.on("user:join-merchant", async (merchantId: string) => {
    const startTime = Date.now();
    try {
      if (!merchantId) {
        socket.emit("error", { message: "Merchant ID required" });
        return;
      }

      const room = `merchant:${merchantId}`;
      await socket.join(room);
      console.log(`Socket ${socket.id} joined merchant:${merchantId}`);

      const duration = Date.now() - startTime;
      socketLogger.logEvent("user:join-merchant", socket, duration);
      socketMetrics.incrementEventsReceived();
    } catch (error: any) {
      const duration = Date.now() - startTime;
      socketLogger.logEvent("user:join-merchant", socket, duration, error.message);
      socketMetrics.incrementErrors();
      socket.emit("error", { message: error.message });
    }
  });
};

/**
 * Emit notification to user
 * Called from notification service
 */
export const emitUserNotification = (
  io: Server,
  userId: string,
  notification: {
    id: string;
    title: string;
    message: string;
    type?: string;
    data?: any;
  }
) => {
  const room = `user:${userId}`;
  io.to(room).emit("notification:new", {
    ...notification,
    timestamp: new Date().toISOString(),
  });
  socketMetrics.incrementEventsEmitted();
};

/**
 * Emit notification to all users with a role
 */
export const emitRoleNotification = (
  io: Server,
  role: string,
  notification: {
    id: string;
    title: string;
    message: string;
    type?: string;
    data?: any;
  }
) => {
  const room = `role:${role}`;
  io.to(room).emit("notification:new", {
    ...notification,
    timestamp: new Date().toISOString(),
  });
  socketMetrics.incrementEventsEmitted();
};
