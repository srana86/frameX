import express from "express";
import validateRequest from "../../middlewares/validateRequest";
import auth from "../../middlewares/auth";
import { OrderControllers } from "./order.controller";
import { OrderValidation } from "./order.validation";

const router = express.Router();

// Get all orders with pagination, filter, and search
router.get("/", auth("admin", "merchant"), OrderControllers.getAllOrders);

// Get user orders (protected)
router.get("/user", auth(), OrderControllers.getUserOrders);

// Get single order by ID
router.get("/:id", auth(), OrderControllers.getSingleOrder);

// Create order
router.post(
  "/",
  validateRequest(OrderValidation.createOrderValidationSchema),
  OrderControllers.createOrder
);

// Update order
router.put(
  "/:id",
  auth("admin", "merchant"),
  validateRequest(OrderValidation.updateOrderValidationSchema),
  OrderControllers.updateOrder
);

// Delete order
router.delete("/:id", auth("admin", "merchant"), OrderControllers.deleteOrder);

// Assign courier to order
router.post(
  "/:id/courier",
  auth("admin", "merchant"),
  validateRequest(OrderValidation.assignCourierValidationSchema),
  OrderControllers.assignCourier
);

// Remove courier from order
router.delete(
  "/:id/courier",
  auth("admin", "merchant"),
  OrderControllers.removeCourier
);

// Send order to courier service
router.post(
  "/:id/courier/send",
  auth("admin", "merchant"),
  validateRequest(OrderValidation.sendOrderToCourierValidationSchema),
  OrderControllers.sendOrderToCourier
);

// Check courier order status (serviceId and consignmentId optional - can be retrieved from order)
router.get(
  "/:id/courier/status",
  auth("admin", "merchant"),
  OrderControllers.checkCourierStatus
);

// Sync courier status for all orders
router.post(
  "/sync-courier-status",
  auth("admin", "merchant"),
  OrderControllers.syncCourierStatus
);

// Place order using product slug (simplified API - public)
router.post(
  "/place",
  validateRequest(OrderValidation.placeOrderValidationSchema),
  OrderControllers.placeOrder
);

// Get order receipt
router.get("/:id/receipt", OrderControllers.getOrderReceipt);

export const OrderRoutes = router;
