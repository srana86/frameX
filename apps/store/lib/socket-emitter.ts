// Helper functions to emit Socket.IO events
// This works with the custom server.ts setup

export function emitOrderUpdate(merchantId: string, order: any) {
  const io = (global as any).io;
  if (io) {
    try {
      io.to(`merchant:${merchantId}`).emit("new-order", order);
      console.log(`[Socket] Emitted new-order to merchant:${merchantId}`);
    } catch (error) {
      console.error(`[Socket] Error emitting new-order to merchant:${merchantId}`, error);
    }
  } else {
    console.warn("[Socket] IO instance not available");
  }
}

export function emitNotification(userId: string, notification: any) {
  const io = (global as any).io;
  if (io) {
    try {
      io.to(`user:${userId}`).emit("new-notification", notification);
      console.log(`[Socket] Emitted new-notification to user:${userId}`, { notificationId: notification.id });
    } catch (error) {
      console.error(`[Socket] Error emitting new-notification to user:${userId}`, error);
    }
  } else {
    console.warn("[Socket] IO instance not available");
  }
}
