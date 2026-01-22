import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { StoreAccessServices } from "./storeAccess.service";

/**
 * Verify store access for current user
 */
const verifyStoreAccess = catchAsync(async (req: Request, res: Response) => {
  const userId = (req as any).user?.id;
  const { storeId } = req.params;

  if (!userId) {
    return sendResponse(res, {
      statusCode: StatusCodes.UNAUTHORIZED,
      success: false,
      message: "User not authenticated",
      data: null,
    });
  }

  const result = await StoreAccessServices.verifyStoreAccess(userId, storeId);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Store access verified",
    data: result,
  });
});

/**
 * Get all stores current user has access to
 */
const getUserStores = catchAsync(async (req: Request, res: Response) => {
  const userId = (req as any).user?.id;

  if (!userId) {
    return sendResponse(res, {
      statusCode: StatusCodes.UNAUTHORIZED,
      success: false,
      message: "User not authenticated",
      data: null,
    });
  }

  const result = await StoreAccessServices.getUserStores(userId);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "User stores retrieved successfully",
    data: result,
  });
});

export const StoreAccessControllers = {
  verifyStoreAccess,
  getUserStores,
};
