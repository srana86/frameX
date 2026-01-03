import { Server as SocketIOServer } from "socket.io";
import type { Server as HTTPServer } from "http";

let io: SocketIOServer | null = null;

export function initializeSocketIO(server: HTTPServer) {
  if (io) {
    return io;
  }

  io = new SocketIOServer(server, {
    path: "/api/socket",
    addTrailingSlash: false,
    cors: {
      // Dynamic CORS for multi-tenant support
      origin: (origin, callback) => {
        // Allow all origins for white-label/multi-tenant setup
        // Each merchant can have their own domain
        callback(null, true);
      },
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    console.log("Socket connected:", socket.id);

    // Join merchant room
    socket.on("join-merchant", (merchantId: string) => {
      socket.join(`merchant:${merchantId}`);
      console.log(`Socket ${socket.id} joined merchant:${merchantId}`);
    });

    // Join user room for notifications
    socket.on("join-user", (userId: string) => {
      socket.join(`user:${userId}`);
      console.log(`Socket ${socket.id} joined user:${userId}`);
    });

    socket.on("disconnect", () => {
      console.log("Socket disconnected:", socket.id);
    });
  });

  return io;
}

export function getSocketIO() {
  if (!io) {
    throw new Error("Socket.IO not initialized. Call initializeSocketIO first.");
  }
  return io;
}

// Helper function to emit order update
export function emitOrderUpdate(merchantId: string, order: any) {
  if (io) {
    io.to(`merchant:${merchantId}`).emit("new-order", order);
    console.log(`Emitted new-order to merchant:${merchantId}`);
  }
}

// Helper function to emit notification
export function emitNotification(userId: string, notification: any) {
  if (io) {
    io.to(`user:${userId}`).emit("new-notification", notification);
    console.log(`Emitted new-notification to user:${userId}`);
  }
}
