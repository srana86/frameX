/* eslint-disable @typescript-eslint/no-explicit-any */
import { Notification } from "./notification.model";
import QueryBuilder from "../../builder/QueryBuilder";
import { emitNotificationToUser } from "../../socket/socket.emitter";

// Get notifications for user
const getUserNotificationsFromDB = async (
  userId: string,
  query: Record<string, unknown>
) => {
  const baseQuery: any = { userId };

  // Filter unread if specified
  if (query.unreadOnly === "true") {
    baseQuery.read = false;
  }

  const notificationQuery = new QueryBuilder(
    Notification.find(baseQuery),
    query
  )
    .sort()
    .paginate()
    .fields();

  const result = await notificationQuery.modelQuery;
  const meta = await notificationQuery.countTotal();

  // Count unread notifications
  const unreadCount = await Notification.countDocuments({
    userId,
    read: false,
  });

  return {
    notifications: result,
    unreadCount,
    meta,
  };
};

// Mark notification as read
const markNotificationAsReadFromDB = async (
  userId: string,
  notificationId?: string
) => {
  if (notificationId) {
    const notification = await Notification.findOneAndUpdate(
      { id: notificationId, userId },
      { read: true },
      { new: true }
    );

    // Emit real-time notification update
    if (notification) {
      try {
        emitNotificationToUser(userId, {
          id: notification.id,
          title: notification.title,
          message: notification.message,
          type: notification.type || "info",
          data: { ...notification.toObject(), read: true },
        });
      } catch (error) {
        console.error("Failed to emit notification update event:", error);
      }
    }
    return { success: true, message: "Notification marked as read" };
  } else {
    await Notification.updateMany({ userId }, { read: true });
    return { success: true, message: "All notifications marked as read" };
  }
};

export const NotificationServices = {
  getUserNotificationsFromDB,
  markNotificationAsReadFromDB,
};
