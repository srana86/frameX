import { StatusCodes } from "http-status-codes";
import { Request, Response } from "express";
import catchAsync from "../../../utils/catchAsync";
import sendResponse from "../../../utils/sendResponse";
import { PromotionalBannerServices } from "./promotionalBanner.service";

// Get promotional banner
const getPromotionalBanner = catchAsync(async (req: Request, res: Response) => {
  const result = await PromotionalBannerServices.getPromotionalBannerFromDB();

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Promotional banner retrieved successfully",
    data: result,
  });
});

// Update promotional banner
const updatePromotionalBanner = catchAsync(
  async (req: Request, res: Response) => {
    const result =
      await PromotionalBannerServices.updatePromotionalBannerIntoDB(req.body);

    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Promotional banner updated successfully",
      data: result,
    });
  }
);

export const PromotionalBannerControllers = {
  getPromotionalBanner,
  updatePromotionalBanner,
};
