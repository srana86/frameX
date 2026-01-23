import { StatusCodes } from "http-status-codes";
import { Request, Response } from "express";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { InventoryServices } from "./inventory.service";

// Get all inventory transactions
const getAllInventoryTransactions = catchAsync(
  async (req: Request, res: Response) => {
    const user = (req as any).user;
    const result = await InventoryServices.getAllInventoryTransactionsFromDB(
      user.tenantId,
      req.query
    );

    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Inventory transactions retrieved successfully",
      meta: result.meta,
      data: {
        transactions: result.data,
      },
    });
  }
);

// Create inventory transaction
const createInventoryTransaction = catchAsync(
  async (req: Request, res: Response) => {
    const user = (req as any).user;
    const result = await InventoryServices.createInventoryTransactionIntoDB(
      user.tenantId,
      req.body
    );

    sendResponse(res, {
      statusCode: StatusCodes.CREATED,
      success: true,
      message: "Inventory transaction created successfully",
      data: result,
    });
  }
);

// Get inventory overview
const getInventoryOverview = catchAsync(async (req: Request, res: Response) => {
  const user = (req as any).user;
  const result = await InventoryServices.getInventoryOverviewFromDB(
    user.tenantId
  );

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Inventory overview retrieved successfully",
    data: result,
  });
});

// Get all inventory (products with stock)
const getAllInventory = catchAsync(async (req: Request, res: Response) => {
  const user = (req as any).user;
  const result = await InventoryServices.getAllInventory(user.tenantId, req.query);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Inventory retrieved successfully",
    meta: result.meta,
    data: {
      products: result.data,
    },
  });
});

// Update inventory
const updateInventory = catchAsync(async (req: Request, res: Response) => {
  const user = (req as any).user;
  const { id } = req.params;
  const { stock, lowStockThreshold } = req.body;

  const result = await InventoryServices.updateInventory(user.tenantId, id, {
    quantity: stock,
    lowStock: lowStockThreshold,
  });

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Inventory updated successfully",
    data: result,
  });
});

export const InventoryControllers = {
  getAllInventoryTransactions,
  createInventoryTransaction,
  getInventoryOverview,
  getAllInventory,
  updateInventory,
};
