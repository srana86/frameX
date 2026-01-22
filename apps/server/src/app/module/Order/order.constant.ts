export const ORDER_STATUS = {
  pending: "pending",
  processing: "processing",
  shipped: "shipped",
  delivered: "delivered",
  cancelled: "cancelled",
} as const;

export const PAYMENT_METHOD = {
  cod: "cod",
  online: "online",
} as const;

export const PAYMENT_STATUS = {
  pending: "pending",
  completed: "completed",
  failed: "failed",
  cancelled: "cancelled",
  refunded: "refunded",
} as const;

export const ORDER_TYPE = {
  online: "online",
  offline: "offline",
} as const;
