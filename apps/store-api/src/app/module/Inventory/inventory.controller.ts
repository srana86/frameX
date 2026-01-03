import { StatusCodes } from "http-status-codes";
import { Request, Response } from "express";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { InventoryServices } from "./inventory.service";

// Get all inventory transactions
const getAllInventoryTransactions = catchAsync(
  async (req: Request, res: Response) => {
    const result = await InventoryServices.getAllInventoryTransactionsFromDB(
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
    const result = await InventoryServices.createInventoryTransactionIntoDB(
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
  const result = await InventoryServices.getInventoryOverviewFromDB();

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Inventory overview retrieved successfully",
    data: result,
  });
});

export const InventoryControllers = {
  getAllInventoryTransactions,
  createInventoryTransaction,
  getInventoryOverview,
};
