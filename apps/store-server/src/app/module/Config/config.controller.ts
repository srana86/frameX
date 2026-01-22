import { StatusCodes } from "http-status-codes";
import { Request, Response } from "express";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { ConfigServices } from "./config.service";

// Brand Config
const getBrandConfig = catchAsync(async (req: Request, res: Response) => {
  const tenantId = req.tenantId
  const result = await ConfigServices.getBrandConfigFromDB(tenantId);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Brand config retrieved successfully",
    data: result,
  });
});

const updateBrandConfig = catchAsync(async (req: Request, res: Response) => {
  const tenantId = req.tenantId;

  if (!tenantId) {
    return sendResponse(res, {
      statusCode: StatusCodes.BAD_REQUEST,
      success: false,
      message: "Tenant identification required",
      data: null,
    });
  }

  const result = await ConfigServices.updateBrandConfigIntoDB(
    tenantId,
    req.body
  );

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Brand config updated successfully",
    data: result,
  });
});


// Delivery Config
const getDeliveryConfig = catchAsync(async (req: Request, res: Response) => {
  const type = req.query.type as string;
  const tenantId = req.tenantId;
  const result = await ConfigServices.getDeliveryConfigFromDB(tenantId, type);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Delivery config retrieved successfully",
    data: result,
  });
});

const updateDeliveryConfig = catchAsync(async (req: Request, res: Response) => {
  const type = req.query.type as string;
  const result = await ConfigServices.updateDeliveryConfigIntoDB(
    req.tenantId as string,
    req.body,
    type
  );

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Delivery config updated successfully",
    data: result,
  });
});

// SSLCommerz Config
const getSSLCommerzConfig = catchAsync(async (req: Request, res: Response) => {
  const result = await ConfigServices.getSSLCommerzConfigFromDB(
    req.tenantId as string
  );

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "SSLCommerz config retrieved successfully",
    data: result,
  });
});

const updateSSLCommerzConfig = catchAsync(
  async (req: Request, res: Response) => {
    const result = await ConfigServices.updateSSLCommerzConfigIntoDB(
      req.tenantId as string,
      req.body
    );

    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "SSLCommerz config updated successfully",
      data: result,
    });
  }
);

// OAuth Config
const getOAuthConfig = catchAsync(async (req: Request, res: Response) => {
  const tenantId = req.tenantId;
  const result = await ConfigServices.getOAuthConfigFromDB(tenantId);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "OAuth config retrieved successfully",
    data: result,
  });
});

const updateOAuthConfig = catchAsync(async (req: Request, res: Response) => {
  const result = await ConfigServices.updateOAuthConfigIntoDB(
    req.tenantId as string,
    req.body
  );

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "OAuth config updated successfully",
    data: result,
  });
});

// Ads Config
const getAdsConfig = catchAsync(async (req: Request, res: Response) => {
  const tenantId = req.tenantId;
  const result = await ConfigServices.getAdsConfigFromDB(tenantId);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Ads config retrieved successfully",
    data: result,
  });
});

const updateAdsConfig = catchAsync(async (req: Request, res: Response) => {
  const result = await ConfigServices.updateAdsConfigIntoDB(
    req.tenantId as string,
    req.body
  );

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Ads config updated successfully",
    data: result,
  });
});

export const ConfigControllers = {
  getBrandConfig,
  updateBrandConfig,
  getDeliveryConfig,
  updateDeliveryConfig,
  getSSLCommerzConfig,
  updateSSLCommerzConfig,
  getOAuthConfig,
  updateOAuthConfig,
  getAdsConfig,
  updateAdsConfig,
};
