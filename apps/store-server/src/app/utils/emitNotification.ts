/* eslint-disable @typescript-eslint/no-explicit-any */
import { prisma } from "@framex/database";
import { emitNotificationToUser } from "../socket/socket.emitter";

/**
 * Helper function to create and emit notifications in real-time
 * Use this from services to create notifications that are immediately sent via Socket.IO
 */
export const createAndEmitNotification = async (
  userId: string,
  notificationData: {
    title: string;
    message: string;
    type?: string;
    link?: string;
    data?: any;
    tenantId: string;
  }
) => {
  try {
    // Create notification in database
    const notification = await prisma.notification.create({
      data: {
        tenantId: notificationData.tenantId, // Assuming tenantId is required
        userId,
        title: notificationData.title,
        message: notificationData.message,
        type: notificationData.type || "INFO", // Enum?
        isRead: false,
        link: notificationData.link,
        // data: notificationData.data, // Prisma Notification might not have data/json field or different name
      } as any
    });

    // Emit real-time notification via Socket.IO
    try {
      emitNotificationToUser(userId, {
        id: notification.id,
        title: notification.title,
        message: notification.message,
        type: notification.type || "info",
        data: notification,
      });
    } catch (socketError) {
      console.error("Failed to emit notification via socket:", socketError);
      // Continue even if socket emit fails
    }

    return notification;
  } catch (error: any) {
    console.error("Failed to create notification:", error);
    throw error;
  }
};
