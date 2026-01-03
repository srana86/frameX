/* eslint-disable @typescript-eslint/no-explicit-any */

import { Notification } from "../module/Notification/notification.model";
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
  }
) => {
  try {
    // Create notification in database
    const notificationId = `NOTIF${Date.now()}${Math.random().toString(36).substr(2, 9)}`;
    const notification = await Notification.create({
      id: notificationId,
      userId,
      title: notificationData.title,
      message: notificationData.message,
      type: notificationData.type || "info",
      read: false,
      link: notificationData.link,
      data: notificationData.data,
    });

    // Emit real-time notification via Socket.IO
    try {
      emitNotificationToUser(userId, {
        id: notification.id,
        title: notification.title,
        message: notification.message,
        type: notification.type || "info",
        data: notification.toObject(),
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
