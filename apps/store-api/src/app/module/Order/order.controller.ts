import { StatusCodes } from "http-status-codes";
import { Request, Response } from "express";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { OrderServices } from "./order.service";
import { UserServices } from "../User/user.service";

// Get all orders
const getAllOrders = catchAsync(async (req: Request, res: Response) => {
  const result = await OrderServices.getAllOrdersFromDB(req.tenantId, req.query);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Orders retrieved successfully",
    meta: result.meta,
    data: {
      orders: result.data,
    },
  });
});

// Get single order
const getSingleOrder = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const user = req.user;

  const result = await OrderServices.getSingleOrderFromDB(req.tenantId, id);

  // If not admin/merchant, check if the order belongs to the user (by email/phone)
  if (user?.role !== "admin" && user?.role !== "merchant") {
    const userDoc = await UserServices.getSingleUserFromDB(req.tenantId, user?.userId);

    const emailMatch = userDoc?.email && result.customer?.email === userDoc.email;
    const phoneMatch = userDoc?.phone && result.customer?.phone === userDoc.phone;

    if (!emailMatch && !phoneMatch) {
      return sendResponse(res, {
        statusCode: StatusCodes.FORBIDDEN,
        success: false,
        message: "You do not have permission to view this order",
        data: null,
      });
    }
  }

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Order retrieved successfully",
    data: result,
  });
});

// Create order
const createOrder = catchAsync(async (req: Request, res: Response) => {
  const result = await OrderServices.createOrderIntoDB({ ...req.body, tenantId: req.tenantId });

  sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    success: true,
    message: "Order created successfully",
    data: result,
  });
});

// Update order
const updateOrder = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await OrderServices.updateOrderIntoDB(req.tenantId, id, req.body);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Order updated successfully",
    data: result,
  });
});

// Delete order
const deleteOrder = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await OrderServices.deleteOrderFromDB(req.tenantId, id);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Order deleted successfully",
    data: result,
  });
});

// Get user orders
const getUserOrders = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.userId;
  if (!userId) {
    return sendResponse(res, {
      statusCode: StatusCodes.UNAUTHORIZED,
      success: false,
      message: "Unauthorized",
      data: null,
    });
  }

  const result = await OrderServices.getUserOrdersFromDB(req.tenantId, userId, req.query);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Orders retrieved successfully",
    meta: result.meta,
    data: {
      orders: result.data,
    },
  });
});

// Assign courier
const assignCourier = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await OrderServices.assignCourierToOrder(id, req.body);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Courier assigned successfully",
    data: result,
  });
});

// Remove courier
const removeCourier = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await OrderServices.removeCourierFromOrder(id);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Courier removed successfully",
    data: result,
  });
});

// Send order to courier service
const sendOrderToCourier = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await OrderServices.sendOrderToCourierService(
    id,
    req.body.serviceId,
    req.body.deliveryDetails
  );

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Order sent to courier successfully",
    data: result,
  });
});

// Check courier order status (GET request - serviceId and consignmentId retrieved from order)
const checkCourierStatus = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;

  const result = await OrderServices.checkCourierOrderStatus(id);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Courier status checked successfully",
    data: result,
  });
});

// Sync courier status
const syncCourierStatus = catchAsync(async (req: Request, res: Response) => {
  const result = await OrderServices.syncCourierStatusFromDB();

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: result.message,
    data: result,
  });
});

// Place order using product slug (simplified API)
const placeOrder = catchAsync(async (req: Request, res: Response) => {
  const result = await OrderServices.placeOrderFromDB(req.body);

  sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    success: true,
    message: "Order placed successfully",
    data: result,
  });
});

// Get order receipt
const getOrderReceipt = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await OrderServices.generateOrderReceiptFromDB(req.tenantId, id);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Order receipt generated successfully",
    data: result,
  });
});

export const OrderControllers = {
  getAllOrders,
  getSingleOrder,
  createOrder,
  updateOrder,
  deleteOrder,
  getUserOrders,
  assignCourier,
  removeCourier,
  sendOrderToCourier,
  checkCourierStatus,
  syncCourierStatus,
  placeOrder,
  getOrderReceipt,
};
