import { StatusCodes } from "http-status-codes";
import { Request, Response } from "express";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { StorefrontServices } from "./storefront.service";

// Get storefront delivery config
const getStorefrontDeliveryConfig = catchAsync(
  async (req: Request, res: Response) => {
    const result = await StorefrontServices.getStorefrontDeliveryConfigFromDB();

    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Storefront delivery config retrieved successfully",
      data: result,
    });
  }
);

// Calculate shipping
const calculateShipping = catchAsync(async (req: Request, res: Response) => {
  const result = await StorefrontServices.calculateShippingFromDB(req.body);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Shipping calculated successfully",
    data: result,
  });
});

export const StorefrontControllers = {
  getStorefrontDeliveryConfig,
  calculateShipping,
};
