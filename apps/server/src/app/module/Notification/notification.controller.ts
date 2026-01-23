import { StatusCodes } from "http-status-codes";
import { Request, Response } from "express";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { NotificationServices } from "./notification.service";

// Get notifications
const getNotifications = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.userId;
  if (!userId) {
    return sendResponse(res, {
      statusCode: StatusCodes.UNAUTHORIZED,
      success: false,
      message: "Unauthorized",
      data: null,
    });
  }

  const result = await NotificationServices.getUserNotificationsFromDB(
    req.tenantId,
    userId,
    req.query
  );

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Notifications retrieved successfully",
    meta: result.meta,
    data: {
      notifications: result.notifications,
      unreadCount: result.unreadCount,
    },
  });
});

// Mark notification as read
const markNotificationAsRead = catchAsync(
  async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) {
      return sendResponse(res, {
        statusCode: StatusCodes.UNAUTHORIZED,
        success: false,
        message: "Unauthorized",
        data: null,
      });
    }

    const { notificationId, markAllAsRead } = req.body;
    const result = await NotificationServices.markNotificationAsReadFromDB(
      req.tenantId,
      userId,
      markAllAsRead ? undefined : notificationId
    );

    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: result.message,
      data: null,
    });
  }
);

// Get notification settings
const getNotificationSettings = catchAsync(
  async (req: Request, res: Response) => {
    const tenantId = req.tenantId || (req.user as any)?.tenantId || req.headers['x-tenant-id'] as string;

    if (!tenantId) {
      return sendResponse(res, {
        statusCode: StatusCodes.BAD_REQUEST,
        success: false,
        message: "Tenant ID is required",
        data: null,
      });
    }

    const result = await NotificationServices.getNotificationSettingsFromDB(
      tenantId
    );

    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Notification settings retrieved successfully",
      data: result,
    });
  }
);

// Update notification settings
const updateNotificationSettings = catchAsync(
  async (req: Request, res: Response) => {
    const tenantId = req.tenantId || (req.user as any)?.tenantId || req.headers['x-tenant-id'] as string;

    if (!tenantId) {
      return sendResponse(res, {
        statusCode: StatusCodes.BAD_REQUEST,
        success: false,
        message: "Tenant ID is required",
        data: null,
      });
    }

    const result = await NotificationServices.updateNotificationSettingsIntoDB(
      tenantId,
      req.body
    );

    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Notification settings updated successfully",
      data: result,
    });
  }
);

export const NotificationControllers = {
  getNotifications,
  markNotificationAsRead,
  getNotificationSettings,
  updateNotificationSettings,
};
