import { StatusCodes } from "http-status-codes";
import { Request, Response } from "express";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { DeliveryServices } from "./delivery.service";

// Get storefront delivery config (public)
const getStorefrontDeliveryConfig = catchAsync(
  async (req: Request, res: Response) => {
    const result = await DeliveryServices.getStorefrontDeliveryConfigFromDB();

    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Delivery config retrieved successfully",
      data: result,
    });
  }
);

// Calculate shipping cost (public)
const calculateShipping = catchAsync(async (req: Request, res: Response) => {
  const result = await DeliveryServices.calculateShippingFromDB(req.body);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Shipping calculated successfully",
    data: result,
  });
});

// Get courier services config (admin/merchant)
const getCourierServicesConfig = catchAsync(
  async (req: Request, res: Response) => {
    const result = await DeliveryServices.getCourierServicesConfigFromDB();

    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Courier services config retrieved successfully",
      data: result,
    });
  }
);

export const DeliveryControllers = {
  getStorefrontDeliveryConfig,
  calculateShipping,
  getCourierServicesConfig,
};
