import express from "express";
import validateRequest from "../../middlewares/validateRequest";
import auth from "../../middlewares/auth";
import { tenantMiddleware } from "../../middlewares/tenant";
import { OrderControllers } from "./order.controller";
import { OrderValidation } from "./order.validation";

const router = express.Router();

// =====================
// Protected Routes (require authentication)
// tenantMiddleware MUST come before auth for proper tenant validation
// =====================

// Get all orders with pagination, filter, and search (admin/merchant only)
router.get(
  "/",
  tenantMiddleware,
  auth("admin", "merchant"),
  OrderControllers.getAllOrders
);

// Get user orders
router.get("/user", tenantMiddleware, auth(), OrderControllers.getUserOrders);

// Sync courier status for all orders (admin/merchant only)
router.post(
  "/sync-courier-status",
  tenantMiddleware,
  auth("admin", "merchant"),
  OrderControllers.syncCourierStatus
);

// Get single order by ID
router.get("/:id", tenantMiddleware, auth(), OrderControllers.getSingleOrder);

// Update order (admin/merchant only)
router.put(
  "/:id",
  tenantMiddleware,
  auth("admin", "merchant"),
  validateRequest(OrderValidation.updateOrderValidationSchema),
  OrderControllers.updateOrder
);

// Delete order (admin/merchant only)
router.delete(
  "/:id",
  tenantMiddleware,
  auth("admin", "merchant"),
  OrderControllers.deleteOrder
);

// Assign courier to order (admin/merchant only)
router.post(
  "/:id/courier",
  tenantMiddleware,
  auth("admin", "merchant"),
  validateRequest(OrderValidation.assignCourierValidationSchema),
  OrderControllers.assignCourier
);

// Remove courier from order (admin/merchant only)
router.delete(
  "/:id/courier",
  tenantMiddleware,
  auth("admin", "merchant"),
  OrderControllers.removeCourier
);

// Send order to courier service (admin/merchant only)
router.post(
  "/:id/courier/send",
  tenantMiddleware,
  auth("admin", "merchant"),
  validateRequest(OrderValidation.sendOrderToCourierValidationSchema),
  OrderControllers.sendOrderToCourier
);

// Check courier order status (admin/merchant only)
router.get(
  "/:id/courier/status",
  tenantMiddleware,
  auth("admin", "merchant"),
  OrderControllers.checkCourierStatus
);

// =====================
// Public Routes (tenant required but no auth)
// =====================

// Create order (public - for checkout)
router.post(
  "/",
  tenantMiddleware,
  validateRequest(OrderValidation.createOrderValidationSchema),
  OrderControllers.createOrder
);

// Place order using product slug (simplified API - public)
router.post(
  "/place",
  tenantMiddleware,
  validateRequest(OrderValidation.placeOrderValidationSchema),
  OrderControllers.placeOrder
);

// Get order receipt (public - for viewing receipt by ID)
router.get("/:id/receipt", tenantMiddleware, OrderControllers.getOrderReceipt);

export const OrderRoutes = router;
