import { Server } from "socket.io";
import { AuthenticatedSocket } from "../../types";
import { socketLogger, socketMetrics } from "../socket.logger";
import { socketRateLimiter } from "../socket.rateLimiter";

/**
 * Order-related socket events
 * Emits order updates, status changes, and notifications
 * Uses rooms to target specific merchants/users
 */
export const registerOrderEvents = (
  io: Server,
  socket: AuthenticatedSocket
) => {
  // Join merchant room for order updates
  socket.on("order:join-merchant", async (merchantId: string) => {
    const startTime = Date.now();
    try {
      // Rate limiting
      if (socketRateLimiter.checkRateLimit(socket.id)) {
        socket.emit("error", { message: "Rate limit exceeded" });
        return;
      }

      // Verify user has access to this merchant
      if (socket.userRole !== "admin" && socket.merchantId !== merchantId) {
        socket.emit("error", { message: "Unauthorized" });
        return;
      }

      const room = `merchant:${merchantId}`;
      await socket.join(room);

      socket.emit("order:joined", { merchantId, room });

      const duration = Date.now() - startTime;
      socketLogger.logEvent("order:join-merchant", socket, duration);
      socketMetrics.incrementEventsReceived();
    } catch (error: any) {
      const duration = Date.now() - startTime;
      socketLogger.logEvent(
        "order:join-merchant",
        socket,
        duration,
        error.message
      );
      socketMetrics.incrementErrors();
      socket.emit("error", { message: error.message });
    }
  });

  // Join user room for personal order updates
  socket.on("order:join-user", async () => {
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

      socket.emit("order:joined", { userId: socket.userId, room });

      const duration = Date.now() - startTime;
      socketLogger.logEvent("order:join-user", socket, duration);
      socketMetrics.incrementEventsReceived();
    } catch (error: any) {
      const duration = Date.now() - startTime;
      socketLogger.logEvent("order:join-user", socket, duration, error.message);
      socketMetrics.incrementErrors();
      socket.emit("error", { message: error.message });
    }
  });

  // Leave merchant room
  socket.on("order:leave-merchant", async (merchantId: string) => {
    const room = `merchant:${merchantId}`;
    await socket.leave(room);
    socket.emit("order:left", { merchantId, room });
  });

  // Leave user room
  socket.on("order:leave-user", async () => {
    if (socket.userId) {
      const room = `user:${socket.userId}`;
      await socket.leave(room);
      socket.emit("order:left", { userId: socket.userId, room });
    }
  });
};

/**
 * Emit order update to merchant room
 * Called from order service when order status changes
 */
export const emitOrderUpdate = (
  io: Server,
  merchantId: string,
  order: any,
  updateType: "created" | "updated" | "deleted"
) => {
  const room = `merchant:${merchantId}`;
  io.to(room).emit("order:update", {
    type: updateType,
    order,
    timestamp: new Date().toISOString(),
  });
  socketMetrics.incrementEventsEmitted();
};

/**
 * Emit order update to user room
 * Called from order service when user's order changes
 */
export const emitUserOrderUpdate = (
  io: Server,
  userId: string,
  order: any,
  updateType: "created" | "updated" | "deleted"
) => {
  const room = `user:${userId}`;
  io.to(room).emit("order:update", {
    type: updateType,
    order,
    timestamp: new Date().toISOString(),
  });
  socketMetrics.incrementEventsEmitted();
};
