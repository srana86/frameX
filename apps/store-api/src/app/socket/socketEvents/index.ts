import { Server } from "socket.io";
import { AuthenticatedSocket } from "../../types";
import { registerOrderEvents } from "./order.events";
import { registerUserEvents } from "./user.events";

/**
 * Register all socket event handlers
 * Centralized event registration for better organization
 */
export const registerSocketEvents = (
  io: Server,
  socket: AuthenticatedSocket
) => {
  // Register user events
  registerUserEvents(io, socket);

  // Register order events
  registerOrderEvents(io, socket);

  // Handle disconnect
  socket.on("disconnect", (reason) => {
    console.log(`Socket ${socket.id} disconnected: ${reason}`);
    // Cleanup is handled automatically by Socket.IO
    // Remove from rate limiter
    // socketRateLimiter will be cleared on disconnect if needed
  });
};

/**
 * Export event emitters for use in services
 */
export { emitOrderUpdate, emitUserOrderUpdate } from "./order.events";
export { emitUserNotification, emitRoleNotification } from "./user.events";
