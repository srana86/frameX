/* eslint-disable @typescript-eslint/no-explicit-any */
import { prisma, PrismaQueryBuilder } from "@framex/database";

// Get notifications for user
const getUserNotificationsFromDB = async (
  tenantId: string,
  userId: string,
  query: Record<string, unknown>
) => {
  const builder = new PrismaQueryBuilder({
    model: prisma.notification,
    query
  });

  const baseWhere: any = { userId, tenantId };
  if (query.unreadOnly === "true") {
    baseWhere.read = false;
  }

  const { data: notifications, meta } = await builder
    .addBaseWhere(baseWhere)
    .sort()
    .paginate()
    .execute();

  const unreadCount = await prisma.notification.count({
    where: { userId, tenantId, read: false }
  });

  return {
    notifications,
    unreadCount,
    meta,
  };
};

// Mark notification as read
const markNotificationAsReadFromDB = async (
  tenantId: string,
  userId: string,
  notificationId?: string
) => {
  if (notificationId) {
    await prisma.notification.updateMany({
      where: { id: notificationId, userId, tenantId },
      data: { read: true }
    });

    // Emit logic omitted, can be re-added if socket emitter is available
    return { success: true, message: "Notification marked as read" };
  } else {
    await prisma.notification.updateMany({
      where: { userId, tenantId },
      data: { read: true }
    });
    return { success: true, message: "All notifications marked as read" };
  }
};

// Get notification settings for a tenant
const getNotificationSettingsFromDB = async (tenantId: string) => {
  const settings = await prisma.settings.findUnique({
    where: {
      tenantId_key: {
        tenantId,
        key: "notification_settings",
      },
    },
  });

  // Return default settings if none exist
  if (!settings) {
    return {
      email: {
        newOrder: true,
        orderStatusChange: true,
        lowStock: true,
        newCustomer: false,
        review: false,
      },
      push: {
        newOrder: true,
        orderStatusChange: false,
        lowStock: true,
      },
    };
  }

  return settings.value;
};

// Update notification settings for a tenant
const updateNotificationSettingsIntoDB = async (
  tenantId: string,
  payload: any
) => {
  const result = await prisma.settings.upsert({
    where: {
      tenantId_key: {
        tenantId,
        key: "notification_settings",
      },
    },
    update: {
      value: payload,
    },
    create: {
      tenantId,
      key: "notification_settings",
      value: payload,
    },
  });

  return result.value;
};

export const NotificationServices = {
  getUserNotificationsFromDB,
  markNotificationAsReadFromDB,
  getNotificationSettingsFromDB,
  updateNotificationSettingsIntoDB,
};
