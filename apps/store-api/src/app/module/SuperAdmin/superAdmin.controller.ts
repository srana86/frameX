import { StatusCodes } from "http-status-codes";
import { Request, Response } from "express";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { SuperAdminServices } from "./superAdmin.service";

// Get all merchants
const getAllMerchants = catchAsync(async (req: Request, res: Response) => {
  const result = await SuperAdminServices.getAllMerchantsFromDB();

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Merchants retrieved successfully",
    data: {
      merchants: result,
    },
  });
});

// Create new merchant
const createMerchant = catchAsync(async (req: Request, res: Response) => {
  const result = await SuperAdminServices.createMerchantFromDB(req.body);

  sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    success: true,
    message: "Merchant created successfully",
    data: result,
  });
});

// Update merchant
const updateMerchant = catchAsync(async (req: Request, res: Response) => {
  const result = await SuperAdminServices.updateMerchantFromDB(req.body);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Merchant updated successfully",
    data: result,
  });
});

// Get full merchant data
const getFullMerchantData = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await SuperAdminServices.getFullMerchantDataFromDB(id);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Full merchant data retrieved successfully",
    data: result,
  });
});

// Get merchant database
const getMerchantDatabase = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await SuperAdminServices.getMerchantDatabaseFromDB(id);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Merchant database information retrieved successfully",
    data: result,
  });
});

// Get merchant deployment
const getMerchantDeployment = catchAsync(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const result = await SuperAdminServices.getMerchantDeploymentFromDB(id);

    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Merchant deployment information retrieved successfully",
      data: result,
    });
  }
);

// Get merchant subscription
const getMerchantSubscription = catchAsync(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const result = await SuperAdminServices.getMerchantSubscriptionFromDB(id);

    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Merchant subscription information retrieved successfully",
      data: result,
    });
  }
);

export const SuperAdminControllers = {
  getAllMerchants,
  createMerchant,
  updateMerchant,
  getFullMerchantData,
  getMerchantDatabase,
  getMerchantDeployment,
  getMerchantSubscription,
};
