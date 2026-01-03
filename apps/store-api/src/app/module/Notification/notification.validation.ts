import { z } from "zod";

// Mark notification as read validation schema
const markNotificationAsReadValidationSchema = z.object({
  body: z.object({
    notificationId: z.string().optional(),
    markAllAsRead: z.boolean().optional(),
  }),
});

export const NotificationValidation = {
  markNotificationAsReadValidationSchema,
};
