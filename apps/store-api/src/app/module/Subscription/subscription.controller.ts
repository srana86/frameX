import { StatusCodes } from "http-status-codes";
import { Request, Response } from "express";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { SubscriptionServices } from "./subscription.service";

// Get active subscription plans
const getActivePlans = catchAsync(async (req: Request, res: Response) => {
  const result = await SubscriptionServices.getActiveSubscriptionPlansFromDB();

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Subscription plans retrieved successfully",
    data: result,
  });
});

// Get current subscription
const getCurrentSubscription = catchAsync(
  async (req: Request, res: Response) => {
    const tenantId = req.user?.userId;
    if (!tenantId) {
      return sendResponse(res, {
        statusCode: StatusCodes.BAD_REQUEST,
        success: false,
        message: "Tenant ID is required",
        data: null,
      });
    }

    const result =
      await SubscriptionServices.getCurrentMerchantSubscriptionFromDB(
        tenantId as string
      );

    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Subscription retrieved successfully",
      data: result,
    });
  }
);

// Get subscription status
const getSubscriptionStatus = catchAsync(
  async (req: Request, res: Response) => {
    const tenantId = req.user?.userId;
    if (!tenantId) {
      return sendResponse(res, {
        statusCode: StatusCodes.BAD_REQUEST,
        success: false,
        message: "Tenant ID is required",
        data: null,
      });
    }

    const result = await SubscriptionServices.getSubscriptionStatusFromDB(
      tenantId as string
    );

    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Subscription status retrieved successfully",
      data: result,
    });
  }
);

// Create subscription
const createSubscription = catchAsync(async (req: Request, res: Response) => {
  const tenantId = req.user?.userId;

  if (!tenantId) {
    return sendResponse(res, {
      statusCode: StatusCodes.BAD_REQUEST,
      success: false,
      message: "Merchant ID is required",
      data: null,
    });
  }

  const result = await SubscriptionServices.createSubscriptionIntoDB(
    tenantId,
    req.body
  );

  sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    success: true,
    message: "Subscription created successfully",
    data: result,
  });
});

export const SubscriptionControllers = {
  getActivePlans,
  getCurrentSubscription,
  getSubscriptionStatus,
  createSubscription,
};
