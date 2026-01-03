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

export const NotificationControllers = {
  getNotifications,
  markNotificationAsRead,
};
