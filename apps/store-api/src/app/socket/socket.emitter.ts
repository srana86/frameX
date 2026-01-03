import { getSocketIO } from "./socket";
import {
  emitOrderUpdate,
  emitUserOrderUpdate,
} from "./socketEvents/order.events";
import {
  emitUserNotification,
  emitRoleNotification,
} from "./socketEvents/user.events";

/**
 * Socket event emitter helpers
 * Use these functions from services/controllers to emit real-time updates
 *
 * Example usage in order.service.ts:
 * import { emitOrderCreated } from '../socket/socket.emitter';
 * emitOrderCreated(merchantId, order);
 */

/**
 * Emit order created event to merchant room
 */
export const emitOrderCreated = (merchantId: string, order: any) => {
  const io = getSocketIO();
  emitOrderUpdate(io, merchantId, order, "created");
};

/**
 * Emit order updated event to merchant room
 */
export const emitOrderUpdated = (merchantId: string, order: any) => {
  const io = getSocketIO();
  emitOrderUpdate(io, merchantId, order, "updated");
};

/**
 * Emit order deleted event to merchant room
 */
export const emitOrderDeleted = (merchantId: string, orderId: string) => {
  const io = getSocketIO();
  emitOrderUpdate(io, merchantId, { id: orderId }, "deleted");
};

/**
 * Emit user order created event
 */
export const emitUserOrderCreated = (userId: string, order: any) => {
  const io = getSocketIO();
  emitUserOrderUpdate(io, userId, order, "created");
};

/**
 * Emit user order updated event
 */
export const emitUserOrderUpdated = (userId: string, order: any) => {
  const io = getSocketIO();
  emitUserOrderUpdate(io, userId, order, "updated");
};

/**
 * Emit notification to user
 */
export const emitNotificationToUser = (
  userId: string,
  notification: {
    id: string;
    title: string;
    message: string;
    type?: string;
    data?: any;
  }
) => {
  const io = getSocketIO();
  emitUserNotification(io, userId, notification);
};

/**
 * Emit notification to all users with a role
 */
export const emitNotificationToRole = (
  role: string,
  notification: {
    id: string;
    title: string;
    message: string;
    type?: string;
    data?: any;
  }
) => {
  const io = getSocketIO();
  emitRoleNotification(io, role, notification);
};
