import express from "express";
import validateRequest from "../../middlewares/validateRequest";
import auth from "../../middlewares/auth";
import { NotificationControllers } from "./notification.controller";
import { NotificationValidation } from "./notification.validation";

const router = express.Router();

// Get notification settings (protected)
router.get("/settings", auth(), NotificationControllers.getNotificationSettings);

// Update notification settings (protected)
router.put("/settings", auth(), NotificationControllers.updateNotificationSettings);

// Get notifications (protected)
router.get("/", auth(), NotificationControllers.getNotifications);

// Mark notification as read (protected)
router.patch(
  "/",
  auth(),
  validateRequest(
    NotificationValidation.markNotificationAsReadValidationSchema
  ),
  NotificationControllers.markNotificationAsRead
);

export const NotificationRoutes = router;
